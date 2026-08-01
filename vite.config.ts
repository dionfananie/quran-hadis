import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { type Plugin, defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// React Router's build-time prerendering imports the Cloudflare worker entry in
// plain Node. The worker bundle references `globalThis.Cloudflare` (injected by
// the workerd nodejs_compat shim) which only exists inside the Workers runtime.
// Provide a minimal polyfill so the prerender can run in Node; it is irrelevant
// in real workerd where the real `Cloudflare` global exists.
function workerdPrerenderPolyfill(): Plugin {
	return {
		name: "workerd-prerender-polyfill",
		config() {
			const g = globalThis as unknown as Record<string, unknown>;
			if (!g.Cloudflare) {
				g.Cloudflare = {
					compatibilityFlags: { enable_nodejs_process_v2: false },
				};
			}
		},
	};
}

export default defineConfig({
	plugins: [
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		tailwindcss(),
		reactRouter(),
		tsconfigPaths(),
		workerdPrerenderPolyfill(),
	],
});
