<script lang="ts">
  import type { Recipe, Step, Variation, Ingredient } from "../recipes/types";
  import { split } from "../lib/utils";
  export let recipe: Recipe;
  let variation = recipe.default;
  let variant: Variation = recipe.variations[variation];
  $: variant = recipe.variations[variation];
  // The Algorithm
  const toInstructionsForOneWorker = (
    variant: Variation
  ): Array<Step & { id: string }> => {
    let workeQueue: Array<Step & { id: string }> = [
      { id: "done", ...variant.done },
    ];
    const recur = (s: Step) => {
      const [passive, active] = split(
        s?.depends_on || [],
        (id) => variant[id]?.duration?.passive === true
      );
      const addPreviousSteps = (dep: string) => {
        const step = variant[dep];
        if (workeQueue.map((step) => step.id).includes(dep)) return;
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
  const toInstrs = (steps: Variation, nCooks: number) => {
    const workers = Array(nCooks)
      .fill(0)
      .map(() => []);
    workers[0].push(steps.done);
    const done = new Set("done");
    let candidates = steps.done.depends_on
      .map((id) => ({ id, ...steps[id] }))
      .filter(Boolean)
      .sort((a, b) => a?.duration?.passive);
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
  // TODO: add a measurement step for each ingredient
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
</div>
