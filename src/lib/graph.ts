import type { Ingredient, Recipe, IVariation } from "../recipes/types";
export const asD3Dag = (variant?: IVariation) => {
  if (!variant) return [];
  const steps = variant.steps;
  return Object.entries(steps).map(([id, instr]) => ({
    id,
    parentIds:
      instr.depends_on?.map((dep) => {
        if (!steps[dep])
          throw new Error(
            `missing '${dep}' from ${Object.keys(steps)
              .map((id) => `'${id}'`)
              .join()}`
          );
        return dep;
      }) || [],
  }));
};

const getIngredients = (v: IVariation) => {
  return Object.entries(v)
    .filter(([id, i]) => Boolean(i.ingredients?.length))
    .map(([id, i]) => i.ingredients)
    .reduce((a: Array<Ingredient>, r: Ingredient[]) => [...a, ...r], []);
};
