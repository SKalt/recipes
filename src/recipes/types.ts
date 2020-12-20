export interface Ingredient {
  measurement: number;
  unit: string;
  ingredient: string;
}
export interface Duration {
  measurement: number;
  min?: number;
  max?: number;
  unit: "days" | "hours" | "minutes" | "seconds";
  passive?: boolean; // if missing, it's active
} // the default duration should be ~2 minutes, e.g. for chopping garlic.

export interface Step {
  details?: string;
  depends_on?: Array<string>;
  ingredients?: Array<Ingredient>;
  kitchenware?: Array<string>;
  duration?: Duration;
}
export interface Variation {
  [instruction: string]: Step;
  done: Step & { depends_on: string[] };
}
export interface Recipe {
  title: string;
  default: string;
  variations: {
    [version: string]: Variation;
  };
}
