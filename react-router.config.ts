import type { Config } from "@react-router/dev/config";

export default {
	ssr: true,
	async prerender() {
		return ["/"];
	},
	future: {
		unstable_viteEnvironmentApi: true,
	},
} satisfies Config;
