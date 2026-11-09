<script>
  import { onMount } from 'svelte';
  import { router } from './lib/store.js';
  import Dashboard from './lib/components/Dashboard.svelte';
  import Workout from './lib/components/Workout.svelte';
  import AddExercise from './lib/components/AddExercise.svelte';
  import Progress from './lib/components/Progress.svelte';
  import SessionSummary from './lib/components/SessionSummary.svelte';
  import BottomSheet from './lib/components/BottomSheet.svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  let showUpdateModal = false;
  let updateRegistration = null;

  onMount(() => {
    // Catch the background update event from index.html
    window.addEventListener('sw-update-ready', (e) => {
      updateRegistration = e.detail;
      showUpdateModal = true;
    });
  });

  function applyUpdate() {
    if (updateRegistration?.waiting) {
      updateRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }
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

  <!-- App Update Confirmation BottomSheet -->
  <div class="w-full max-w-none sm:max-w-[440px] absolute inset-y-0 pointer-events-none z-50 overflow-hidden sm:rounded-[44px]">
    <div class="pointer-events-auto h-full">
      <BottomSheet
        open={showUpdateModal}
        subtitle="New Version"
        title="Update Ready"
        description="A new update has been downloaded in the background. Restart the app now to apply changes?"
        confirmText="Restart & Update"
        confirmColor="bg-pastel-mintSoft text-pastel-mintText"
        on:close={() => showUpdateModal = false}
        on:confirm={applyUpdate}
      />
    </div>
  </div>

</div>
