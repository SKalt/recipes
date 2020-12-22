export interface IIngredient {
  measurement: number;
  unit: string;
  ingredient: string;
}
export interface IDuration {
  measurement: number;
  // min?: number;
  // max?: number;
  unit: "days" | "hours" | "minutes" | "seconds";
  passive?: number; // if missing, it's 0
}
// the default duration should be ~2 minutes, e.g. for chopping garlic.

export interface IStep {
  details: string;
  depends_on: Array<string>;
  ingredients: Array<IIngredient>;
  kitchenware: Array<string>;
  duration: IDuration;
}
export interface IVariation {
  [instruction: string]: Partial<IStep>;
  done: IStep & { depends_on: string[] };
}
export interface IRecipe {
  title: string;
  default: string;
  variations: {
    [version: string]: IVariation;
  };
}
export class Recipe {
  title: string;
  default: string;
  variations: { [id: string]: Variation; done: Variation };
  constructor(r: Partial<IRecipe>, defaultDuration: IDuration) {
    const errors: string[] = [];
    if (!r.title) errors.push(`missing title`);
    const variations = Object.entries(r.variations || {});
    if (variations.length === 0) errors.push("no variations");
    else {
      if (variations.length === 1) this.default = variations[0][0];
      variations.forEach(([id, variation]) => {
        try {
          this.variations[id] = new Variation(id, variation, defaultDuration);
        } catch (e) {
          if (e instanceof ValidationError) {
            errors.push(e.toString());
          }
        }
      });
    }
    if (errors.length)
      throw new ValidationError(errors, r.title || "untitled recipe");
  }
}

enum TimeUnit {
  "second" = 1e3,
  "minute" = 1e3 * 60,
  "hour" = 1e3 * 60 * 60,
  "day" = 1e3 * 60 * 60 * 24,
}
const _plural = (n: number, repr: string) => `${n} ${repr}${n != 1 ? "s" : ""}`;
// const repr = (d: Date): string => {
//   const n = Number(d);
//   const _ = (u: TimeUnit, r: string) => _plural(n / u, r);
//   if (n >= 0.5 * TimeUnit.day) return _(TimeUnit.day, "day");
//   if (n >= 0.5 * TimeUnit.hour) return _(TimeUnit.hour, "hour");
//   if (n >= 0.5 * TimeUnit.minute) return _(TimeUnit.minute, "minute");
//   if (n >= 0.5 * TimeUnit.second) return _(TimeUnit.second, "second");
//   throw new Error(`unexpected time interval: ${n}ms`);
// };
const _getTimeUnitMs = (unit: "days" | "hours" | "minutes" | "seconds") => {
  const _unit = {
    seconds: TimeUnit.second,
    minutes: TimeUnit.minute,
    hours: TimeUnit.hour,
    days: TimeUnit.day,
  }[unit];
  if (!_unit) throw new Error(`unexpected time unit: ${unit}`);
  return _unit;
};
export class Duration implements IDuration {
  measurement: number;
  unit: "days" | "hours" | "minutes" | "seconds";
  passive: number;
  _ms: number;
  _passiveMs: number;
  _unit: TimeUnit;
  toString(): string {
    let n = +this._ms;
    let u = this._getTimeUnit();
    let r = this.unit.replace(/s$/, "");
    let passive = this._passiveMs / u;
    return _plural(n / u, r) + this._passiveMs ? ` (${passive} passive)` : "";
  }
  compare(other: Duration): -1 | 0 | 1 {
    if (this._ms == other._ms) return 0;
    if (this._ms > other._ms) return 1;
    else return -1;
  }
  _getTimeUnit(): TimeUnit {
    if (this._unit) return this._unit;
    return (this._unit = _getTimeUnitMs(this.unit));
  }
  private _inMs(n: number): number {
    return this._getTimeUnit() * n;
  }
  constructor({ measurement, unit, passive = 0 }: IDuration) {
    this.measurement = measurement;
    this.unit = unit;
    this.passive = passive;
    this._ms = this._inMs(measurement);
    this._passiveMs = this._inMs(passive);
  }
}

export class ValidationError extends Error {
  name = "ValidationError";
  errors: string[];
  constructor(errors: string[], context = "") {
    super(
      `found ${errors.length} errors${context ? `in ${context}` : ""}\n` +
        errors.map((err) => `  ${err}`).join("\n")
    );
  }
}
export class Ingredient implements IIngredient {
  ingredient: string;
  unit: string;
  measurement: number;
  constructor({ ingredient, unit, measurement }: Partial<IIngredient>) {
    const errors: string[] = [];
    if (!ingredient) errors.push(`missing ingredient`);
    if (!unit) errors.push(`missing a unit`); // TODO check that the unit is known
    if (!measurement) errors.push(`no measurement provided`);
    if (errors.length)
      throw new ValidationError(errors, "ingredient: " + ingredient);
    this.ingredient = ingredient;
    this.unit = unit;
    this.measurement = measurement;
  }
}
export class Step implements IStep {
  id: string;
  details: string;
  kitchenware: string[];
  ingredients: Ingredient[];
  depends_on: string[];
  duration: Duration;
  // for the ITimelineStep // TODO: should ITimelineStep be separated?
  start?: number;
  end?: number;
  constructor(
    id: string,
    {
      details = id,
      kitchenware = [],
      ingredients = [],
      depends_on = [],
      duration,
    }: Partial<IStep> = {},
    fallbackDuration: Duration
  ) {
    Object.assign(this, {
      id,
      details,
      kitchenware,
      depends_on,
      ingredients: ingredients.map((i) => new Ingredient(i)),
    });
    this.duration = duration ? new Duration(duration) : fallbackDuration;
  }
  clone(): Step {
    return new Step(this.id, this, this.duration);
  }
}

export class Variation implements IVariation {
  // FIXME: ugly cloning, maybe split validation into separate fn
  done: Step;
  [id: string]: Step;
  constructor(id: string, r: IVariation, defaultDuration: IDuration) {
    const _defaultDuration = new Duration(defaultDuration);
    const errors: string[] = [];
    const allSteps = new Set(Object.keys(r));
    const reached = new Set();
    Object.entries(r).forEach(([id, step]: [string, IStep]) => {
      step.depends_on?.forEach((dep) => {
        if (allSteps.has(id)) reached.add(id);
        else {
          errors.push(`unexpected step id '${dep}' in step ${id}`);
        }
      });
      try {
        this[id] = new Step(id, step, _defaultDuration);
      } catch (e) {
        errors.push(e.toString());
      }
    });
    allSteps.forEach((step) => {
      if (!reached.has(step)) errors.push(`failed to reach step ${step}`);
    });
    if (!allSteps.has("done"))
      errors.push(`variant ${id} missing a 'done' step`);
    if (errors.length != 0)
      throw new ValidationError(errors, `recipe variant ${id}`);
  }
}

const cloneVariation = (v: Variation): Variation => {
  return new Variation("cloned", v, { measurement: 1, unit: "minutes" });
};

export const toInstrs = (steps: Variation, nCooks: number) => {
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
        accepted.depends_on.filter((id) => !done.has(id)).map((id) => steps[id])
      );
    });
  }
  return workers;
};

interface ITimelineStep {
  id: string; // references the step Variation[id]
  start: number; // milliseconds since start
  end: number; // milliseconds since start
}
interface ITimeline {
  // for multiple workers
  steps: ITimelineStep[];
  // total: IDuration
  // something for each work-queue
  /*
  <g>
  // rects for each Step
  // visible-on-hover: dependencies between steps.
  </g>
  */
}

class Timeline implements ITimeline {
  workers: Step[];
  steps: { start: number; end: number; id: string }[];
  // validate() {
  //   // assert all steps have been assigned a start and an end
  //   const errors: string[] = [];
  //   workers.forEach((queue) => {
  //     queue.forEach((step) => {
  //       if (step.start === undefined)
  //         errors.push(
  //           `step ${step.id} in variation ${variation.id} is missing a start time`
  //         );
  //       if (step.end === undefined)
  //         errors.push(
  //           `step ${step.id} in variation ${variation.id} is missing a end time`
  //         );
  //     });
  //   });
  //   if (errors.length)
  //     throw new ValidationError(errors, `timeline for ${variation.id}`);
  // }
  constructor(
    steps: Variation,
    workers: Step[][],
    pause: number = 5 * TimeUnit.second
  ) {
    // assert pause > 1000, i.e at least 1 second
    const done = new Set<Step>();
    const remaining = new Set(Object.keys(steps));
    // clone the Array<Array> for mutation and consumption by this function
    workers = [...workers.map((queue) => [...queue])];
    const time = new Map(workers.map((queue) => [queue, 0]));
    // ensure all considered queues contain steps
    workers = workers.filter((queue) => queue.length > 0);
    while (workers.length > 0) {
      workers.forEach((queue) => {
        const step = queue.shift();
        step.start = Math.max(
          time.get(queue),
          ...step.depends_on.map((id) => (steps[id].end || 0) + pause)
        );
        step.end = step.end = step.start + step.duration._ms;
        time.set(queue, step.end + pause);
      });
    }
    workers = workers.filter((queue) => queue.length > 0);
  }
}

const instrsToTimeline = () => {};
