import { createRequestHandler } from "react-router";
import { odojApp } from "./api/odoj";

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: Env;
			ctx: ExecutionContext;
		};
	}
}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

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
			await fetch(env.HERMES_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Webhook-Signature-V2": env.HERMES_SIGNATURE,
					"X-Webhook-Timestamp": String(message.timestamp),
				},
				body: JSON.stringify(message.body),
			});
			message.ack();
		}
	}
} satisfies ExportedHandler<Env>;
