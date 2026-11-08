<script>
  import { router, viewingWorkoutStore } from '../store.js';
  import { ChevronLeft, Check } from 'lucide-svelte';
  import TimelineItem from './TimelineItem.svelte';

  $: workout = $viewingWorkoutStore;
</script>

<!-- Mobile Viewport Container -->
<div class="w-full max-w-none sm:max-w-[440px] bg-canvas min-h-screen sm:min-h-0 sm:h-[860px] sm:rounded-[44px] sm:shadow-2xl flex flex-col justify-between p-6 sm:p-7 relative overflow-hidden">

  <!-- Header -->
  <header class="flex justify-between items-center pt-2">
    <button 
      on:click={router.back}
      class="w-11 h-11 rounded-full bg-white text-ink-primary flex items-center justify-center active:scale-95 transition"
      title="Back to Dashboard"
    >
      <ChevronLeft class="w-5 h-5 stroke-[2.5]" />
    </button>

    <div class="text-center">
      <p class="text-xs font-bold uppercase tracking-wider text-ink-muted">Past Session</p>
      <h1 class="text-base font-extrabold text-ink-primary tracking-tight">{workout?.date || 'Workout'}</h1>
    </div>

    <!-- Empty spacer for balanced header -->
    <div class="w-11 h-11"></div>
  </header>

  <!-- Scrollable Completed Exercises -->
  <main class="flex-1 overflow-y-auto no-scrollbar space-y-8 py-6 my-auto">
    {#if workout?.exercises && workout.exercises.length > 0}
      {#each workout.exercises as exercise}
        <section class="space-y-4">
          
          <h2 class="text-xl font-bold text-ink-primary tracking-tight px-1">{exercise.name}</h2>

          <!-- Set Timeline in Read-Only Mode -->
          <div class="relative pl-8 space-y-4">
            {#each exercise.sets as set, setIdx}
              <TimelineItem 
                completed={true}
                nextCompleted={setIdx < exercise.sets.length - 1}
                isLast={setIdx === exercise.sets.length - 1}
                gap="16px"
              >
                <!-- Set Number -->
                <div class="flex items-baseline gap-3">
                  <span class="text-xs font-bold text-ink-muted w-3">{setIdx + 1}</span>
                  <span class="text-xs text-ink-muted font-medium">Set</span>
                </div>

                <!-- Read-Only Weight & Rep Pills -->
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-ink-primary bg-white px-3.5 py-2 rounded-2xl">{set.weight} kg</span>
                  <span class="text-sm font-bold text-ink-primary bg-white px-3.5 py-2 rounded-2xl">{set.reps} reps</span>
                  <div class="w-8 h-8 rounded-full bg-pastel-mintSoft text-pastel-mintText flex items-center justify-center">
                    <Check class="w-4 h-4 stroke-[3]" />
                  </div>
                </div>
              </TimelineItem>
            {/each}
          </div>

        </section>
      {/each}
    {:else}
      <div class="text-center py-16 text-ink-muted text-sm">
        No exercise details recorded for this session.
      </div>
    {/if}
  </main>

</div>
