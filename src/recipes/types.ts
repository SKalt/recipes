export interface Ingredient {
  measurement: number;
  unit: string;
  ingredient: string;
}
export interface Duration {
  measurement: number;
  // min?: number;
  // max?: number;
  unit: "days" | "hours" | "minutes" | "seconds";
  passive?: number; // if missing, it's 0
}
// the default duration should be ~2 minutes, e.g. for chopping garlic.

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

enum TimeUnit {
  "second" = 1e3,
  "minute" = 1e3 * 60,
  "hour" = 1e3 * 60 * 60,
  "day" = 1e3 * 60 * 60 * 24,
}
class _Duration {
  measurement: number;
  unit: "days" | "hours" | "minutes" | "seconds";
  _time: Date;
  passive: number;
  _passiveTime: Date;
  _unit: TimeUnit;
  _getTimeUnit(): TimeUnit {
    if (this._unit) return this._unit;
    switch (this.unit) {
      case "seconds":
        return (this._unit = TimeUnit.second);
      case "minutes":
        return (this._unit = TimeUnit.minute);
      case "hours":
        return (this._unit = TimeUnit.hour);
      case "days":
        return (this._unit = TimeUnit.day);
    }
  }
  _asTime(n: number): Date {
    return new Date(this._getTimeUnit() * n);
  }
  constructor({ measurement, unit, passive = 0 }: Duration) {
    this.measurement = measurement;
    this.unit = unit;
    this.passive = passive;
    const tu = this._getTimeUnit();
    this._time = this._asTime(measurement);
    this._passiveTime = this._asTime(passive);
  }
}

const validateVariant = (v: Variation) => {
  // all steps must be reachable;
  // all steps should have a duration or a default
};
export class RecipeVariant {
  constructor(r: Variation, defaultDuration: Duration) {
    Object;
    // TODO: validate step ids are consistent
  }
  getIngredients() {} // :Ingredient[]
  getKitchenware() {} //
}
