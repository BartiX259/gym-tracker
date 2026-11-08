<script>
  import { onMount } from 'svelte';
  import { router, adjustPullups, pullupStore } from './lib/store.js';
  import Dashboard from './lib/components/Dashboard.svelte';
  import Workout from './lib/components/Workout.svelte';
  import AddExercise from './lib/components/AddExercise.svelte';
  import Progress from './lib/components/Progress.svelte';
  import SessionSummary from './lib/components/SessionSummary.svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { Zap } from 'lucide-svelte';

  let quickPullupToast = false;
  let loggedReps = 3;

  onMount(() => {
    // Check if launched via App Icon Shortcut
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'quick_pullups') {
      loggedReps = $pullupStore.increment || 3;
      adjustPullups(loggedReps);
      quickPullupToast = true;

      // Clean URL without reloading so refreshing won't re-add
      window.history.replaceState({}, '', window.location.pathname);

      setTimeout(() => {
        quickPullupToast = false;
      }, 2500);
    }
  });
</script>

<div class="min-h-screen bg-canvas sm:bg-neutral-300 flex justify-center items-center sm:p-6 antialiased select-none font-sans overflow-x-hidden relative">

  <!-- Quick Shortcut Toast Notification -->
  {#if quickPullupToast}
    <div 
      transition:fly={{ y: -50, duration: 250 }}
      class="absolute top-6 z-50 bg-white px-5 py-3.5 rounded-full shadow-xl flex items-center gap-3 border border-pastel-mintSoft"
    >
      <div class="w-7 h-7 rounded-full bg-pastel-mintSoft text-pastel-mintText flex items-center justify-center">
        <Zap class="w-4 h-4 fill-current" />
      </div>
      <span class="text-sm font-bold text-ink-primary">+{loggedReps} Pull-Ups Logged!</span>
    </div>
  {/if}
  
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
