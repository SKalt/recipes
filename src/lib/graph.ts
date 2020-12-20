import type { Ingredient, Recipe, Variation } from "../recipes/types";
export const asD3Dag = (v: Variation) => {
  if (!v) return [];
  return Object.entries(v).map(([id, instr]) => ({
    id,
    parentIds:
      instr.depends_on?.map((d) => {
        if (!v[d])
          throw new Error(
            `missing '${d}' from ${Object.keys(v)
              .map((id) => `'${id}'`)
              .join()}`
          );
        return d;
      }) || [],
  }));
};

const getIngredients = (v: Variation) => {
  return Object.entries(v)
    .filter(([id, i]) => Boolean(i.ingredients?.length))
    .map(([id, i]) => i.ingredients)
    .reduce((a: Array<Ingredient>, r: Ingredient[]) => [...a, ...r], []);
};
