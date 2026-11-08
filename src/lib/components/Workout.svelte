<script>
  import { onMount, onDestroy } from 'svelte';
  import { 
    activeWorkoutStore, 
    workoutsStore, 
    cycleStore, 
    router,
    finishCurrentWorkout
  } from '../store.js';
  import { ChevronLeft, Check, Plus, Trophy } from 'lucide-svelte';
  import BottomSheet from './BottomSheet.svelte';
  import TimelineItem from './TimelineItem.svelte'

  // Ensure an active workout exists
  if (!$activeWorkoutStore) {
    activeWorkoutStore.set({
      startTime: Date.now(),
      cycle: $cycleStore.current,
      exercises: [
        {
          id: 1,
          name: 'Bench Press',
          lastWeight: 80,
          lastReps: 8,
          sets: [
            { weight: 82.5, reps: 8, completed: true },
            { weight: 82.5, reps: 8, completed: true },
            { weight: 82.5, reps: 8, completed: false }
          ]
        }
      ]
    });
  }

  // --- 1. Live Timer ---
  let elapsedFormatted = '00:00';
  let timerInterval;

  function updateTimer() {
    if (!$activeWorkoutStore?.startTime) return;
    const diffSecs = Math.floor((Date.now() - $activeWorkoutStore.startTime) / 1000);
    const mins = Math.floor(diffSecs / 60).toString().padStart(2, '0');
    const secs = (diffSecs % 60).toString().padStart(2, '0');
    elapsedFormatted = `${mins}:${secs}`;
  }

  onMount(() => {
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
  });

  onDestroy(() => {
    clearInterval(timerInterval);
  });

  // --- 2. PR Toast Notification ---
  let toastVisible = false;
  let toastTitle = '';
  let toastDetails = '';
  let toastTimeout;

  function showToast(title, details) {
    toastTitle = title;
    toastDetails = details;
    toastVisible = true;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastVisible = false;
    }, 3200);
  }

  // --- 3. Set Management & Steppers ---
  function applyDelta(exerciseIndex, delta) {
    activeWorkoutStore.update(w => {
      w.exercises[exerciseIndex].sets.forEach(set => {
        if (!set.completed) {
          set.weight = Math.max(0, Number((set.weight + delta).toFixed(1)));
        }
      });
      return w;
    });
  }

  function toggleSet(exerciseIndex, setIndex) {
    activeWorkoutStore.update(w => {
      const ex = w.exercises[exerciseIndex];
      const set = ex.sets[setIndex];
      set.completed = !set.completed;

      if (set.completed && set.weight > ex.lastWeight) {
        const est1RM = Math.round(set.weight * (1 + set.reps / 30));
        showToast(`New PR! ${ex.name}`, `${set.weight} kg × ${set.reps} • Est. 1RM ${est1RM} kg`);
      }
      return w;
    });
  }

  function addSet(exerciseIndex) {
    activeWorkoutStore.update(w => {
      const ex = w.exercises[exerciseIndex];
      const prevSet = ex.sets[ex.sets.length - 1] || { weight: ex.lastWeight, reps: ex.lastReps };
      ex.sets.push({
        weight: prevSet.weight,
        reps: prevSet.reps,
        completed: false
      });
      return w;
    });
  }

  // --- 4. Long-Press Set Deletion with Visual Charge ---
  let showDeleteSetModal = false;
  let setToDelete = null;
  let holdingKey = null;
  let holdTimer = null;

  function startSetHold(exerciseIndex, setIndex, exerciseName) {
    const key = `${exerciseIndex}-${setIndex}`;
    holdingKey = key;

    holdTimer = setTimeout(() => {
      setToDelete = {
        exerciseIndex,
        setIndex,
        exerciseName,
        setNumber: setIndex + 1
      };
      showDeleteSetModal = true;
      holdingKey = null;
    }, 250); // hold threshold
  }

  function cancelSetHold() {
    clearTimeout(holdTimer);
    holdingKey = null;
  }

  function confirmDeleteSet() {
    if (setToDelete) {
      activeWorkoutStore.update(w => {
        const ex = w.exercises[setToDelete.exerciseIndex];
        ex.sets.splice(setToDelete.setIndex, 1);
        return w;
      });
      showDeleteSetModal = false;
      setToDelete = null;
    }
  }

  // --- 5. Finish Workout Modal ---
  let showFinishModal = false;

  // Finish Workout now writes to real progress charts & dashboard timeline:
  function confirmFinish() {
    finishCurrentWorkout();
    showFinishModal = false;
    router.navigate('dashboard');
  }

  // --- Long-Press Entire Exercise Deletion ---
  let showDeleteExerciseModal = false;
  let exerciseToDelete = null;
  let holdingExerciseIndex = null;
  let exerciseHoldTimer = null;

  function startExerciseHold(index, name) {
    holdingExerciseIndex = index;
    exerciseHoldTimer = setTimeout(() => {
      exerciseToDelete = { index, name };
      showDeleteExerciseModal = true;
      holdingExerciseIndex = null;
    }, 350); // Same 350ms hold
  }

  function cancelExerciseHold() {
    clearTimeout(exerciseHoldTimer);
    holdingExerciseIndex = null;
  }

  function confirmDeleteExercise() {
    if (exerciseToDelete) {
      activeWorkoutStore.update(w => {
        w.exercises.splice(exerciseToDelete.index, 1);
        return w;
      });
      showDeleteExerciseModal = false;
      exerciseToDelete = null;
    }
  }
</script>

<!-- Mobile Viewport Container -->
<div class="w-full max-w-sm bg-canvas min-h-screen sm:min-h-[844px] sm:h-[844px] sm:rounded-[44px] sm:shadow-2xl flex flex-col justify-between p-7 relative overflow-hidden select-none">

  <!-- PR Toast Notification -->
  <div 
    class="absolute top-5 left-7 right-7 bg-white p-3.5 rounded-3xl shadow-lg border border-pastel-mintSoft flex items-center gap-3 transition-all duration-300 z-50 select-none {toastVisible ? 'translate-y-0 opacity-100' : '-translate-y-28 opacity-0 pointer-events-none'}"
  >
    <div class="w-9 h-9 rounded-full bg-pastel-mintSoft text-pastel-mintText flex items-center justify-center flex-shrink-0">
      <Trophy class="w-4 h-4" />
    </div>
    <div>
      <p class="text-xs font-bold text-ink-primary leading-tight">{toastTitle}</p>
      <p class="text-[11px] text-ink-muted font-medium mt-0.5">{toastDetails}</p>
    </div>
  </div>

  <!-- Header: Back button, Raw Timer, Finish Button -->
  <header class="flex justify-between items-center pt-2">
    <button 
      on:click={() => router.navigate('dashboard')}
      class="w-11 h-11 rounded-full bg-white text-ink-primary flex items-center justify-center active:scale-95 transition"
      title="Minimize to Dashboard"
    >
      <ChevronLeft class="w-5 h-5 stroke-[2.5]" />
    </button>

    <div class="flex items-center gap-2">
      <span class="text-sm font-bold text-ink-primary tracking-wider">{elapsedFormatted}</span>
    </div>

    <button 
      on:click={() => showFinishModal = true}
      class="w-11 h-11 rounded-full bg-pastel-mintSoft text-pastel-mintText flex items-center justify-center active:scale-95 transition"
      title="Finish Workout"
    >
      <Check class="w-5 h-5 stroke-[2.5]" />
    </button>
  </header>

  <!-- Scrollable Exercise List -->
  <main class="flex-1 overflow-y-auto no-scrollbar space-y-9 py-6 my-auto">
    {#if $activeWorkoutStore}
      {#each $activeWorkoutStore.exercises as exercise, exIdx}
        <section class="space-y-4">
          
          <!-- Exercise Header & Delta Steppers -->
          <div class="flex justify-between items-center px-1">
            
            <!-- Holdable Exercise Title (Charges Rose on Hold) -->
            <div 
              on:pointerdown={() => startExerciseHold(exIdx, exercise.name)}
              on:pointerup={cancelExerciseHold}
              on:pointerleave={cancelExerciseHold}
              on:pointercancel={cancelExerciseHold}
              class="cursor-pointer select-none py-1 pr-3 rounded-2xl transition-all duration-200 {holdingExerciseIndex === exIdx ? 'scale-105 text-rose-600' : 'text-ink-primary'}"
              role="button"
              tabindex="0"
            >
              <h2 class="text-xl font-bold tracking-tight transition-colors">{exercise.name}</h2>
            </div>

            <!-- Delta Steppers (Untouched by hold) -->
            <div class="flex items-center gap-1.5">
              <button 
                on:click={() => applyDelta(exIdx, -2.5)}
                class="px-3.5 py-1.5 rounded-full bg-white text-xs font-bold text-ink-muted hover:text-ink-primary active:scale-90 transition"
              >-2.5</button>
              <button 
                on:click={() => applyDelta(exIdx, 2.5)}
                class="px-3.5 py-1.5 rounded-full bg-pastel-lavenderSoft text-xs font-bold text-pastel-lavenderText active:scale-90 transition"
              >+2.5</button>
              <button 
                on:click={() => applyDelta(exIdx, 5)}
                class="px-3.5 py-1.5 rounded-full bg-pastel-lavenderSoft text-xs font-bold text-pastel-lavenderText active:scale-90 transition"
              >+5</button>
            </div>
          </div>

          <!-- The Set Timeline -->
          <div class="relative pl-8 space-y-4">
            {#each exercise.sets as set, setIdx}
              <TimelineItem 
                completed={set.completed}
                nextCompleted={exercise.sets[setIdx + 1]?.completed}
                isLast={setIdx === exercise.sets.length - 1}
                isHolding={holdingKey === `${exIdx}-${setIdx}`}
                gap="16px"
              >
                <!-- Left Touch Area -->
                <div 
                  class="flex items-baseline gap-3 cursor-pointer py-1.5 pr-4 rounded-xl transition-all duration-200 {holdingKey === `${exIdx}-${setIdx}` ? 'scale-105 text-rose-600' : ''}"
                  on:pointerdown={() => startSetHold(exIdx, setIdx, exercise.name)}
                  on:pointerup={cancelSetHold}
                  on:pointerleave={cancelSetHold}
                  on:pointercancel={cancelSetHold}
                >
                  <span class="text-xs font-bold w-3 text-ink-muted">{setIdx + 1}</span>
                  <span class="text-xs font-medium text-ink-muted">{exercise.lastWeight} × {exercise.lastReps}</span>
                </div>

                <!-- Inputs & Checkmark -->
                <div class="flex items-center gap-2">
                  <input type="number" step="0.5" bind:value={set.weight} on:focus={(e) => e.currentTarget.select()} class="w-16 text-center text-sm font-bold bg-white py-2 rounded-2xl outline-none focus:ring-2 focus:ring-pastel-mint" />
                  <input type="number" bind:value={set.reps} on:focus={(e) => e.currentTarget.select()} class="w-12 text-center text-sm font-bold bg-white py-2 rounded-2xl outline-none focus:ring-2 focus:ring-pastel-mint" />
                  <button on:click={() => toggleSet(exIdx, setIdx)} class="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 {set.completed ? 'bg-pastel-mintSoft text-pastel-mintText' : 'bg-white border border-slate-200 text-ink-muted'}">
                    <Check class="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </TimelineItem>
            {/each}
          </div>

          <!-- Add Set Button (Shifted to match new pl-8 indentation) -->
          <button 
            on:click={() => addSet(exIdx)}
            class="text-xs font-bold text-ink-muted hover:text-ink-primary transition pl-8 pt-1 flex items-center gap-1 active:scale-95"
          >
            <Plus class="w-3.5 h-3.5 stroke-[2.5]" /> Add Set
          </button>

        </section>
      {/each}
    {/if}
  </main>

  <!-- Bottom Action: Add Exercise -->
  <footer class="pt-2">
    <button 
      on:click={() => router.navigate('add-exercise')}
      class="w-full bg-white text-ink-primary py-5 rounded-3xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition"
    >
      <Plus class="w-4 h-4 stroke-[2.5]" />
      <span>Add Exercise</span>
    </button>
  </footer>

  <!-- Delete Set BottomSheet -->
  <BottomSheet 
    open={showDeleteSetModal}
    title="Delete Set {setToDelete?.setNumber}?"
    subtitle={setToDelete?.exerciseName}
    description="This will remove this set from your current workout session."
    confirmText="Delete Set"
    confirmColor="bg-pastel-coralSoft text-pastel-coralText"
    on:close={() => showDeleteSetModal = false}
    on:confirm={confirmDeleteSet}
  />
  <!-- Delete Entire Exercise BottomSheet -->
  <BottomSheet 
    open={showDeleteExerciseModal}
    title="Remove {exerciseToDelete?.name}?"
    subtitle="Remove Exercise"
    description="This will remove this exercise and all its logged sets from this workout."
    confirmText="Remove Exercise"
    confirmColor="bg-pastel-coralSoft text-pastel-coralText"
    on:close={() => showDeleteExerciseModal = false}
    on:confirm={confirmDeleteExercise}
  />

  <!-- Finish Workout BottomSheet -->
  <BottomSheet 
    open={showFinishModal}
    subtitle="End Workout"
    title="Finish this workout?"
    description="This will save your logged sets to Cycle {$cycleStore.current} history."
    confirmText="Finish & Save"
    confirmColor="bg-pastel-mintSoft text-pastel-mintText"
    on:close={() => showFinishModal = false}
    on:confirm={confirmFinish}
  />

</div>
