<script>
  import { router } from './lib/store.js';
  import Dashboard from './lib/components/Dashboard.svelte';
  import Workout from './lib/components/Workout.svelte';
  import AddExercise from './lib/components/AddExercise.svelte';
  import Progress from './lib/components/Progress.svelte';
  import SessionSummary from './lib/components/SessionSummary.svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
</script>

<div class="min-h-screen bg-canvas sm:bg-neutral-300 flex justify-center items-center sm:p-6 antialiased select-none font-sans overflow-x-hidden relative">

  {#if $router === 'dashboard'}
    <div in:fly={{ x: -40, duration: 200, easing: cubicOut }} class="w-full flex justify-center">
      <Dashboard />
    </div>
  {:else if $router === 'workout'}
    <div in:fly={{ x: 40, duration: 200, easing: cubicOut }} class="w-full flex justify-center">
      <Workout />
    </div>
  {:else if $router === 'workout-summary'}
    <div in:fly={{ x: 40, duration: 200, easing: cubicOut }} class="w-full flex justify-center">
      <SessionSummary />
    </div>
  {:else if $router === 'add-exercise'}
    <div in:fly={{ x: 40, duration: 200, easing: cubicOut }} class="w-full flex justify-center">
      <AddExercise />
    </div>
  {:else if $router === 'progress'}
    <div in:fly={{ x: 40, duration: 200, easing: cubicOut }} class="w-full flex justify-center">
      <Progress />
    </div>
  {/if}

</div>
