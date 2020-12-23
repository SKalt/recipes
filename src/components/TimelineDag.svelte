<script lang="ts">
  import { Step, repr } from "../recipes/types";
  export let workers: Step[][] = [];
  let maxTime: number;
  // let id: string
  let current: Step;
  $: maxTime = Math.max(
    ...workers.map((queue) => queue[queue.length - 1]?.end || 0)
  );
</script>

<style>
  .foo {
    fill: red;
  }
</style>

{workers.length}
<!-- TODO: bbox -->
<svg
  style="border: 1px solid white"
  width={workers.length * 200 + 400}
  height={maxTime / 5000}>
  {#each workers as queue, index}
    <g class="player-{index}">
      <!-- <line
        stroke="red"
        stroke-width="1"
        x1={100 * (index + 1)}
        y1="0"
        x2={100 * (index + 1)}
        y2={maxTime / 5000} /> -->
      {#each queue as step}
        <rect
          on:mouseover={() => (current = step)}
          data-title={step.id}
          data-start={step.start}
          data-end={step.end}
          fill="red"
          x={100 * index}
          width="100"
          y={(step.start || 0) / 5000}
          height={((step.end || 0) - (step.start || 0)) / 15000} />
      {/each}
    </g>
  {/each}
</svg>
<span>{current?.id}: starts @
  {repr(current?.start || 0)}, lasts
  {current?.duration}
</span>
