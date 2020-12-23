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
export interface ISteps {
  [instruction: string]: Partial<IStep>;
  done: IStep & { depends_on: string[] };
}
export interface IVariation {
  steps: ISteps;
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
  variations: { [id: string]: Variation };
  // TODO: deep clone?
  validate(r: IRecipe) {
    if (!r) throw new ValidationError([`entire recipe is undefined`]);
    const errors: string[] = [];
    if (!r.title) errors.push(`missing title`);
    const result: { [key: string]: Variation } = {};
    const variations = Object.entries(r.variations || {});
    if (variations.length === 0) errors.push("no variations");
    else {
      if (variations.length === 1) this.default = variations[0][0];
      variations.forEach(([id, variation]) => {
        try {
          result[id] = new Variation(id, variation, _defaultDuration);
        } catch (e) {
          errors.push(e.toString());
        }
      });
    }
    if (errors.length)
      throw new ValidationError(errors, `recipe '${r?.title}'`);
    return result;
  }
  constructor(
    { title = "", default: dflt = "", variations = {} }: Partial<IRecipe> = {},
    defaultDuration: IDuration = _defaultDuration,
    validate: boolean = true
  ) {
    this.title = title;
    this.default = dflt;
    this.variations = {};
    if (validate) {
      this.variations = this.validate({ title, default: dflt, variations });
    } else {
      Object.entries(variations).forEach(([id, variant]) => {
        this.variations[id] = new Variation(
          id,
          variant,
          defaultDuration,
          false
        );
      });
    }
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
      `found ${errors.length} errors${context ? ` in ${context}` : ""}\n` +
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
    this.ingredient = ingredient || "";
    this.unit = unit || "";
    this.measurement = measurement || 0;
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

class Steps implements ISteps {
  [key: string]: Step;
  done: Step;
  constructor(steps: ISteps, defaultDuration: Duration) {
    Object.entries(steps).forEach(([id, step]: [string, IStep]) => {
      this[id] = new Step(id, step, defaultDuration);
    });
  }
}
const _defaultDuration = new Duration({ measurement: 1, unit: "minutes" });
const _defaultVariation: IVariation = {
  steps: {
    done: {
      details: "",
      kitchenware: [],
      ingredients: [],
      depends_on: [],
      duration: _defaultDuration,
    },
  },
};
const walk = (steps: ISteps, cb: (id: string, s?: Partial<IStep>) => void) => {
  const reached = new Set<string>();
  let dependencies = ["done"];

  while (dependencies.length > 0) {
    const id = dependencies.pop();
    if (!id) throw new Error(`unexpectedly lacking any dependencies`);
    reached.add(id);
    const step: Partial<IStep> | undefined = steps[id];
    cb(id, step);
    dependencies = dependencies.concat(
      step.depends_on?.filter((id) => !reached.has(id)) || []
    );
  }
};
export class Variation implements IVariation {
  id: string;
  steps: Steps;
  private readonly _defaultDuration: Duration;
  validate(steps: ISteps) {
    const errors: string[] = [];
    const allSteps = new Set(Object.keys(steps));
    const reached = new Set();
    if (!allSteps.has("done"))
      errors.push(`variant ${this.id} missing a 'done' step`);
    walk(steps, (id, step) => {
      if (!step) errors.push(`no step with id '${id}' in variant ${this.id}`);
      else reached.add(id);
      step?.depends_on?.forEach((dep) => {
        if (!allSteps.has(dep)) {
          errors.push(`unexpected step id '${dep}' in step '${id}'`);
        }
      });
      try {
        new Step(id, step, this._defaultDuration);
      } catch (e) {
        errors.push(e.toString());
      }
    });

    [...allSteps]
      .filter((id) => !reached.has(id))
      .forEach((step) => errors.push(`failed to reach step '${step}'`));
    if (errors.length != 0) {
      throw new ValidationError(errors, `recipe variant '${this.id}'`);
    }
  }
  clone(): Variation {
    return new Variation(
      this.id,
      this, // providing {steps: this.steps}
      this._defaultDuration,
      false // don't re-validate
    );
  }
  constructor(
    id: string,
    variation: IVariation = _defaultVariation,
    defaultDuration: IDuration = _defaultDuration,
    validate: boolean = true
  ) {
    this.id = id;
    this._defaultDuration = new Duration(defaultDuration);
    if (validate) this.validate(variation?.steps);
    this.steps = new Steps(variation?.steps, this._defaultDuration);
  }
}
export const sfx = <T>(t: T, cb: (t: T) => void = console.log) => {
  cb(t);
  return t;
};
export const toInstrs = (variation: Variation, nCooks: number) => {
  const steps =
    variation?.steps || new Steps(_defaultVariation.steps, _defaultDuration);
  const workers: Array<Array<Step>> = Array(nCooks)
    .fill(0)
    .map(() => []);
  // initialize
  workers[0] = [steps?.done];
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
  let candidates = sort(steps.done?.depends_on?.map((id) => steps[id]) || []);
  // the Variation parser guarantees that this will terminate
  while (candidates.length) {
    workers.forEach((worker) => {
      candidates = sort(candidates);
      const accepted = candidates.shift();
      if (!accepted) return; // the other worker may have consumed the last task
      done.add(accepted.id);
      remaining.delete(accepted.id);
      worker.unshift(accepted);
      candidates = candidates.concat(
        accepted.depends_on.filter((id) => !done.has(id)).map((id) => steps[id])
      );
    });
  }
  return workers;
};

interface ITimelineStep {
  id: string; // references the step Varation.Steps[id]
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
        if (!step) throw new Error(`unexpectedly lacking a step`);
        step.start = Math.max(
          time.get(queue) || 0,
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
