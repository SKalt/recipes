import { sveltekit } from "@sveltejs/kit/vite";
import yaml from "@rollup/plugin-yaml";

/** @type {import('vite').UserConfig} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  plugins: [yaml(), sveltekit()],
};

export default config;
