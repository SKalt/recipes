<script lang="ts">
  import type { Recipe, Step, Variation, Ingredient } from "../recipes/types";
  import { split } from "../lib/utils";
  import {
    yogurt_bread,
    split_pea_soup,
    pesto,
    mixed_bean_soup,
    home_fries,
  } from "../recipes";
  import { asD3Dag } from "../lib/graph";
  const recipe: Recipe = home_fries;
  let variation = recipe.default;
  console.log({ variations: Object.keys(recipe.variations) });
  let variant: Variation = recipe.variations[variation];
  $: variant = recipe.variations[variation];
  console.log({ variant, variation });
  // The Algorithm
  const toInstructionsForOneWorker = (
    variant: Variation
  ): Array<Step & { id: string }> => {
    let workeQueue: Array<Step & { id: string }> = [
      { id: "done", ...variant.done },
    ];
    const recur = (s: Step) => {
      if (!s) console.log("undef");
      const [passive, active] = split(
        s?.depends_on || [],
        (id) => variant[id]?.duration?.passive === true
      );
      const addPreviousSteps = (dep: string) => {
        const step = variant[dep];
        if (!step) {
          throw new Error(
            `missing '${dep}' from ${Object.keys(variant)
              .map((id) => `'${id}'`)
              .join()}`
          );
        }
        workeQueue.unshift({ ...step, id: dep });
        recur(step);
      };
      active.forEach(addPreviousSteps);
      passive.forEach(addPreviousSteps);
    };
    recur(variant.done);
    console.log(workeQueue);
    Object.keys(variant).forEach((id) => {
      if (!workeQueue.find((step) => step.id === id)) {
        throw new Error(
          `step '${id}' not found in ${workeQueue
            .map((s) => `'${s.id}'`)
            .join(",\n")}`
        );
      }
    });
    return workeQueue;
  };
  let workeQueue: Array<Step & { id: string }> = [
    { ...variant.done, id: "done" },
  ];
  $: workeQueue = toInstructionsForOneWorker(variant);
  let ingredients: Array<Ingredient> = [];
  $: ingredients = workeQueue.reduce((a, step) => {
    return [...a, ...(step.ingredients || [])];
  }, []);
  let kitchenware: Array<string>;
  $: kitchenware = workeQueue.reduce(
    (a, r) => [
      ...a,
      ...(r.kitchenware?.filter((item) => !a.includes(item)) || []),
    ],
    []
  );
  // assert
  //
  // let yoink = ;
  // let yoink = dagStratify()(asD3Dag(variant));
  // console.log({ yoink });
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
    <ol>
      {#each workeQueue as step}
        <li>
          {(step.details || step.id)
            .replace(/\s*\.?$/, '.')
            .replace(/[.]{2}$/, '.')}
        </li>
      {/each}
    </ol>
  </div>
  <!-- instructions -->
</div>
