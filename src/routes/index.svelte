<script lang="ts">
  const recipes = [
    "home_fries",
    "split_pea_soup",
    "mixed_bean_soup",
    "pesto",
    "yogurt_bread",
    "lentil_stew",
    "mushroom_risotto",
  ].map((slug) => ({
    slug,
    title: slug[0].toUpperCase() + slug.slice(1).replace("_", " "),
  }));
</script>

<svelte:head>
  <title>Index</title>
</svelte:head>
<ul>
  {#each recipes as recipe}
    <li><a href="./recipe/{recipe.slug}">{recipe.title}</a></li>
  {/each}
</ul>
<!-- TODO: description -->
<!-- TODO: link github page -->
