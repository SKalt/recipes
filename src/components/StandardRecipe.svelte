<script lang="ts">
  import { Duration, IRecipe } from "../recipes/types";
  import { Recipe, Step, Variation, Ingredient } from "../recipes/types";
  import { split } from "../lib/utils";
  import { worker } from "cluster";
  export let recipe: IRecipe;
  let _recipe: Recipe;
  $: _recipe = new Recipe(
    recipe,
    new Duration({ measurement: 1, unit: "minutes" })
  );
  let variation = _recipe.default;
  let variant: Variation = _recipe.variations[variation];
  $: variant = _recipe.variations[variation];
  export let nCooks = 1;
  export let player = nCooks - 1;
  // const toInstructionsForOneWorker = (
  //   variant: Variation
  // ): Array<Step & { id: string }> => {
  //   let workeQueue: Array<Step & { id: string }> = [
  //     { id: "done", ...variant.done },
  //   ];
  //   const recur = (s: Step) => {
  //     const [passive, active] = split(
  //       s?.depends_on || [],
  //       (id) => variant[id]?.duration?.passive != 0
  //     );
  //     const addPreviousSteps = (dep: string) => {
  //       const step = variant[dep];
  //       if (workeQueue.map((step) => step.id).includes(dep)) return;
  //       if (!step) {
  //         throw new Error(
  //           `missing '${dep}' from ${Object.keys(variant)
  //             .map((id) => `'${id}'`)
  //             .join()}`
  //         );
  //       }
  //       workeQueue.unshift({ ...step, id: dep });
  //       recur(step);
  //     };
  //     active.forEach(addPreviousSteps);
  //     passive.forEach(addPreviousSteps);
  //   };
  //   recur(variant.done);
  //   Object.keys(variant).forEach((id) => {
  //     if (!workeQueue.find((step) => step.id === id)) {
  //       throw new Error(
  //         `step '${id}' not found in ${workeQueue
  //           .map((s) => `'${s.id}'`)
  //           .join(",\n")}`
  //       );
  //     }
  //   });
  //   return workeQueue;
  // };

  // The Algorithm
  const toInstrs = (steps: Variation, nCooks: number) => {
    const workers: Array<Array<Step>> = Array(nCooks)
      .fill(0)
      .map(() => []);
    // initialize
    workers[0] = [steps.done];
    const remaining = new Set(Object.keys(steps));
    remaining.delete("done");
    const done = new Set("done");
    // candidate next steps, sorted from least downtime to most

    const sort = (steps: Step[]) =>
      steps.sort((a, b) => {
        const aWaitTime = a.duration.passive;
        const bWaitTime = b.duration.passive;
        return aWaitTime < bWaitTime ? 1 : aWaitTime == bWaitTime ? 0 : -1;
      });
    let candidates = sort(steps.done.depends_on.map((id) => steps[id]));
    // the Variant parser guarantees that this will terminate
    while (candidates.length) {
      workers.forEach((worker) => {
        candidates = sort(candidates);
        const accepted = candidates.shift();
        done.add(accepted.id);
        remaining.delete(accepted.id);
        worker.push(accepted);
        candidates = candidates.concat(
          accepted.depends_on
            .filter((id) => !done.has(id))
            .map((id) => steps[id])
        );
      });
    }
    return workers;
  };
  let workers = toInstrs(variant, nCooks);
  let ingredients: Array<Ingredient> = [];
  let workeQueue = workers[player];
  let kitchenware: Array<string>;
  // TODO: timeline
  $: workers = toInstrs(variant, nCooks);
  $: ingredients = workers
    .reduce((a, r) => a.concat(r), [])
    .map((step) => step.ingredients)
    .reduce((a, r) => a.concat(r), []);
  $: workeQueue = workers[player];
  $: ingredients = workeQueue.reduce((a, step) => {
    return [...a, ...(step.ingredients || [])];
  }, []);
  $: kitchenware = workeQueue.reduce(
    (a, r) => [
      ...a,
      ...(r.kitchenware?.filter((item) => !a.includes(item)) || []),
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
