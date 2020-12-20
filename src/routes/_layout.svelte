<script lang="ts">
  import Nav from "../components/Nav.svelte";

  export let segment: string;
</script>

<style>
  /* TODO: dark mode via a css variable + @media(prefers-color-scheme: dark) {} */
  main {
    position: relative;
    max-width: 56em;
    background-color: white;
    padding: 2em;
    margin: 0 auto;
    box-sizing: border-box;
  }
  @media (prefers-color-scheme: dark) {
    main {
      color: white;
      background-color: black;
    }
  }
</style>

<Nav {segment} />

<main>
  <slot />
</main>
