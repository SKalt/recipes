# recipes

This is my recipe app. There are many like it, but this one is mine.

One distinguishing factor is how the recipes are written.
I use a yaml document to describe a directed acyclic graph of steps, each of which contains a list of dependencies on previous steps, ingredients, and kitchenware.
This lets my scheduler implementation decide the order of operations.
Of course, my scheduler is currently borked, so the order isn't always optimal.
One Day™️ I'll get around to implementing [this scheduler architecture][flow-shop scheduler] and unveil the workflow-visualizer!

## Contributing

I use `sveltekit` to keep the site lightweight on the client and `pnpm` to keep the `node_modules` lightweight on my workstation.

To set up your development environment, ensure you have `node = 14.x` and `pnpm >= 6` installed, then run

```sh
pnpm install
pnpm dev
```

[flow-shop scheduler]: https://www.aosabook.org/en/500L/a-flow-shop-scheduler.html
