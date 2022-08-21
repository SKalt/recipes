import sveltePreprocess from "svelte-preprocess";
// const mode = process.env.NODE_ENV ?? "development";
// console.log({ mode });
import adapter from "@sveltejs/adapter-static";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // an array of file extensions that should be treated as Svelte components
  extensions: [".svelte"],

  kit: {
    adapter: adapter(),
    // appDir: "_app",
    files: {
      assets: "static",
      // hooks: 'src/hooks',
      lib: "src/lib",
      routes: "src/routes",
      serviceWorker: "src/service-worker",
      template: "src/app.html",
    },
    browser: {
      hydrate: true,
    },
    // host: null,
    // hostHeader: null,

    // paths: {
    // 	assets: '',
    // 	base: ''
    // },

    // ssr: true,
    // target: null,
    trailingSlash: "never",
  },
  // options passed to svelte.preprocess (https://svelte.dev/docs#svelte_preprocess)
  preprocess: sveltePreprocess(),
};

export default config;
