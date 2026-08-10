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
	fetch(request, env, ctx) {
		// Route /api/* ke Hono app (ODOJ + Auth); sisanya requestHandler React Router.
		const url = new URL(request.url);
		if (url.pathname.startsWith("/api")) {
			return odojApp.fetch(request, env);
		}
		return requestHandler(request, {
			cloudflare: { env, ctx },
		});
	},
} satisfies ExportedHandler<Env>;
