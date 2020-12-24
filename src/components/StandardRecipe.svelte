<script lang="ts">
  import TimelineDag from "./TimelineDag.svelte";
  import type { IRecipe } from "../recipes/types";
  import {
    Recipe,
    Step,
    Duration,
    Variation,
    Ingredient,
    passiveFirst,
    longestShortestPath,
    Timeline,
    sfx,
  } from "../recipes/types";
  export let recipe: IRecipe;
  let _recipe: Recipe;
  let variation: string;
  let variant: Variation;
  export let nCooks = 1;
  export let player = nCooks - 1;
  let workers: Step[][] = [];
  let ingredients: Array<Ingredient> = [];
  let workeQueue: Step[];
  let kitchenware: Array<string>;
  let timeline: Timeline;
  $: {
    _recipe = new Recipe(
      recipe,
      new Duration({ measurement: 1, unit: "minute" })
    );
    if (!variation) variation = _recipe.default;
  }
  $: variant = _recipe.variations[variation];

  $: workers = longestShortestPath(variant, nCooks);
  $: {
    timeline = new Timeline(variant, workers);
    console.log(timeline, workers);
  }
  $: ingredients = workers
    .reduce((a, r) => a.concat(r), [])
    .map((step) => step?.ingredients)
    .reduce((a, r) => a.concat(r), []);
  $: {
    workeQueue = workers[player] || [];
  }
  $: ingredients = workeQueue.reduce((a, step) => {
    return [...a, ...(step.ingredients || [])];
  }, []);
  $: kitchenware = workeQueue
    .filter(Boolean)
    .reduce(
      (acc: string[], red) => [
        ...acc,
        ...(red.kitchenware?.filter((item) => !acc.includes(item)) || []),
      ],
      []
    );
  // TODO: add a measurement step for each ingredient
  // TODO: add a cleanup step for each ingredient and item of kitchenware
  // TODO: ensure no item of kitchenware is being used by more than one worker at a time
</script>

<style>
  ul {
    list-style-type: none;
    padding-left: 1em;
  }
</style>

<svelte:head>
  <title>{recipe.title}</title>
</svelte:head>

<!-- temp -->
<input type="number" bind:value={nCooks} />
<div class="h-recipe">
  <!-- TODO: configure number of workers -->
  <h1 class="p-name">{recipe.title}</h1>
  <div>
    {#if Object.keys(recipe.variations).length > 1}
      <label for="varation">Variation:</label>
      <select name="variation" bind:value={variation}>
        {#each Object.keys(recipe.variations) as variant}
          <option value={variant}>{variant}</option>
        {/each}
      </select>
    {/if}
  </div>

  <div>
    <h2>Ingredients</h2>
    <ul>
      {#each ingredients as ingredient}
        <li class="p-ingredient">
          <input type="checkbox" />
          <span>
            {ingredient.measurement}
            {ingredient.unit}
            {ingredient.ingredient}
          </span>
        </li>
      {/each}
    </ul>
  </div>
  <div>
    <h2>Required kitchenware</h2>
    <ul>
      {#each kitchenware as item}
        <li><input type="checkbox" /> <span>{item}</span></li>
      {/each}
    </ul>
  </div>
  <div>
    <h2>Instructions</h2>
    <TimelineDag {workers} />
    <ol>
      {#each workeQueue.filter(Boolean) as step}
        <li>
          {(step?.details || step?.id || '')
            .replace(/\s*\.?$/, '.')
            .replace(/[.]{2}$/, '.')}
        </li>
      {/each}
    </ol>
  </div>
</div>
