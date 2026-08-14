import { createRequestHandler } from "react-router";
import { odojApp } from "./api/odoj";
import "./api/hafalan"; // side-effect: daftarkan route hafalan/murojaah ke odojApp

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: Env;
			ctx: ExecutionContext;
		};
	}
}

// HERMES_SIGNATURE is a Cloudflare SECRET (set via `wrangler secret put`), so it is
// NOT declared in wrangler.json and not generated into worker-configuration.d.ts.
// It exists at runtime on env — declare it into the global Env for the typechecker.
declare global {
	interface Env {
		HERMES_SIGNATURE: string;
	}
}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

// Sign a webhook body with Hermes' generic HMAC-SHA256 V2 contract:
//   signed_content = "<X-Webhook-Timestamp>.<raw_body>"   (timestamp = unix SECONDS)
//   X-Webhook-Signature-V2 = lowercase hex HMAC-SHA256(signed_content, secret)
// Never send the raw secret as the signature header.
async function hmacHexV2(body: string, timestampSeconds: string, secret: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(`${timestampSeconds}.${body}`),
	);
	return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default {
	async fetch(request, env, ctx) {
		await env.DEPLOY_QUEUE.send({
			event: "deploy",
			url: request.url,
			timestamp: Date.now()
		});
		// Route /api/* ke Hono app (ODOJ + Auth); sisanya requestHandler React Router.
		const url = new URL(request.url);
		if (url.pathname.startsWith("/api")) {
			return odojApp.fetch(request, env);
		}
		return requestHandler(request, {
			cloudflare: { env, ctx },
		});
	},
	async queue(batch, env) {
		// Consumer: proses pesan dari queue
		for (const message of batch.messages) {
			console.log("Memproses pesan:", JSON.stringify(message.body));
			// Sign & send the EXACT same body bytes (no re-serialization between
			// computing the HMAC and sending, or whitespace/key-order drift breaks it).
			const body = JSON.stringify(message.body);
			// message.timestamp is already unix SECONDS (Cloudflare queue).
			const timestampSeconds = String(message.timestamp);
			const signature = await hmacHexV2(body, timestampSeconds, env.HERMES_SIGNATURE);
			await fetch(env.HERMES_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Webhook-Signature-V2": signature,
					"X-Webhook-Timestamp": timestampSeconds,
				},
				body,
			});
			message.ack();
		}
	}
} satisfies ExportedHandler<Env>;
