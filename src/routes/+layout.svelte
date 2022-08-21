<script lang="ts">
  throw new Error("@migration task: Add data prop (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292707)");

  import Nav from "../components/Nav.svelte";

  export let segment: string;
</script>

<style>
  /* TODO: dark mode via a css variable + @media(prefers-color-scheme: dark) {} */
  :global(body) {
    background-color: white;
    color: black;
  }
  main {
    position: relative;
    max-width: 56em;
    padding: 2em;
    margin: 0 auto;
    box-sizing: border-box;
  }
  @media (prefers-color-scheme: dark) {
    :global(body) {
      color: white;
      background-color: black;
    }
  }
</style>

<Nav {segment} />

<main>
  <slot />
</main>
