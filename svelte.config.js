import sveltePreprocess from "svelte-preprocess";
import yaml from "@rollup/plugin-yaml";
// const mode = process.env.NODE_ENV ?? "development";
// console.log({ mode });
import adapter from "@sveltejs/adapter-static";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // options passed to svelte.compile (https://svelte.dev/docs#svelte_compile)
  compilerOptions: null,

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

    // disable dystopian google trackers
    amp: false,
    floc: false,

    // host: null,
    // hostHeader: null,
    hydrate: true,
    package: {
      dir: "package",
      emitTypes: true,
      exports: {
        include: ["**"],
        exclude: ["_*", "**/_*"],
      },
      files: {
        include: ["**"],
        exclude: [],
      },
    },
    // paths: {
    // 	assets: '',
    // 	base: ''
    // },
    // prerender: {
    // 	crawl: true,
    // 	enabled: true,
    // 	force: false,
    // 	pages: ['*']
    // },
    router: true,
    serviceWorker: {
      exclude: [],
    },
    // ssr: true,
    // target: null,
    trailingSlash: "never",
    vite: () => ({
      plugins: [yaml()],
    }),
  },

  // options passed to svelte.preprocess (https://svelte.dev/docs#svelte_preprocess)
  preprocess: sveltePreprocess(),
};

export default config;
