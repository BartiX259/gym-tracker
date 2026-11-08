<script>
  import { 
    cycleStore, 
    pullupStore, 
    workoutsStore, 
    activeWorkoutStore,
    router,
    adjustPullups,
    advanceCycleAction,
    deleteWorkoutSession,
    discardActiveWorkout,
    viewingWorkoutStore
  } from '../store.js';
  import { ChevronsRight, Settings, ChevronRight, Play, ArrowUpRight } from 'lucide-svelte';
  import BottomSheet from './BottomSheet.svelte';
  import TimelineItem from './TimelineItem.svelte'

  let showAdvanceModal = false;
  let showSettingsModal = false;

  // Local draft states for settings editing
  let editIncrement = $pullupStore.increment;
  let editDailyTarget = $pullupStore.dailyTarget;
  let editCycleTarget = $pullupStore.cycleTarget;

  // Open settings & initialize local drafts
  function openSettings() {
    editIncrement = $pullupStore.increment;
    editDailyTarget = $pullupStore.dailyTarget;
    editCycleTarget = $pullupStore.cycleTarget;
    showSettingsModal = true;
  }

  // Save Settings directly into store (persists to localStorage)
  function saveSettings() {
    pullupStore.update(p => ({
      ...p,
      increment: Number(editIncrement) || 3,
      dailyTarget: Number(editDailyTarget) || 12,
      cycleTarget: Number(editCycleTarget) || 60
    }));
    showSettingsModal = false;
  }

  // Reactive calculations
  $: todayPercent = Math.min(100, Math.round(($pullupStore.today / $pullupStore.dailyTarget) * 100));
  $: cyclePercent = Math.min(100, Math.round(($pullupStore.cycle / $pullupStore.cycleTarget) * 100));
  $: currentCycleWorkouts = $workoutsStore.filter(w => w.cycle === $cycleStore.current);

  // Stepper handlers now use adjustPullups:
  function addPullups() {
    adjustPullups($pullupStore.increment);
  }

  function minusPullups() {
    adjustPullups(-$pullupStore.increment);
  }

  // Advance Cycle now uses advanceCycleAction:
  function confirmAdvance() {
    advanceCycleAction();
    showAdvanceModal = false;
  }

  // Delete session now cleans up the graphs too:
  function confirmDeleteSession() {
    if (sessionToDelete) {
      deleteWorkoutSession(sessionToDelete.id);
      showDeleteSessionModal = false;
      sessionToDelete = null;
    }
  }

function startWorkout() {
    if (!$activeWorkoutStore) {
      activeWorkoutStore.set({
        startTime: Date.now(),
        cycle: $cycleStore.current,
        exercises: []
      });
      window.history.pushState({ screen: 'workout' }, '', '#workout');
      router.navigate('add-exercise');
    } else {
      router.navigate('workout');
    }
  }
  // --- Long-Press Session Deletion ---
  let showDeleteSessionModal = false;
  let sessionToDelete = null;
  let holdingSessionId = null;
  let sessionHoldTimer = null;
  let didHoldDelete = false;

  function startSessionHold(workout) {
    didHoldDelete = false;
    holdingSessionId = workout.id;
    sessionHoldTimer = setTimeout(() => {
      didHoldDelete = true;
      sessionToDelete = workout;
      showDeleteSessionModal = true;
      holdingSessionId = null;
    }, 350);
  }

  function handleSessionClick(workout) {
    if (didHoldDelete || showDeleteSessionModal) return;
    viewingWorkoutStore.set(workout);
    router.navigate('workout-summary');
  }

  function cancelSessionHold() {
    clearTimeout(sessionHoldTimer);
    holdingSessionId = null;
  }

  let showDiscardModal = false;
  let isHoldingResume = false;
  let resumeHoldTimer = null;

  function startResumeHold() {
    // Only hold to discard if a workout is actually running
    if (!$activeWorkoutStore) return;
    isHoldingResume = true;
    resumeHoldTimer = setTimeout(() => {
      showDiscardModal = true;
      isHoldingResume = false;
    }, 350);
  }

  function cancelResumeHold() {
    clearTimeout(resumeHoldTimer);
    isHoldingResume = false;
  }

  function confirmDiscard() {
    discardActiveWorkout();
    showDiscardModal = false;
  }
</script>

<!-- Mobile Viewport Container -->
<div class="w-full max-w-sm bg-canvas min-h-screen sm:min-h-[844px] sm:h-[844px] sm:rounded-[44px] sm:shadow-2xl flex flex-col justify-between p-7 relative overflow-hidden">

  <!-- Top Hero Header -->
  <header class="flex justify-between items-center pt-2">
    <div>
      <p class="text-xs font-bold uppercase tracking-wider text-ink-muted">Training Log</p>
      <h1 class="text-3xl font-extrabold text-ink-primary tracking-tight">Cycle {$cycleStore.current}</h1>
    </div>
    <button 
      on:click={() => showAdvanceModal = true}
      class="w-12 h-12 rounded-full bg-pastel-lavenderSoft text-pastel-lavenderText flex items-center justify-center active:scale-95 transition"
    >
      <ChevronsRight class="w-6 h-6 stroke-[2.5]" />
    </button>
  </header>

  <!-- Main Content -->
  <main class="space-y-8 my-auto py-2">

    <!-- PULL-UP SECTION -->
    <section class="space-y-6">
      <h3 class="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">Pull-Ups</h3>

      <!-- Today's Progress -->
      <div class="space-y-2.5">
        <div class="flex justify-between items-baseline px-0.5">
          <span class="text-base font-semibold text-ink-primary">Today</span>
          <span class="text-base font-bold text-ink-primary">
            {$pullupStore.today} <span class="text-ink-muted font-normal text-sm">/ {$pullupStore.dailyTarget}</span>
          </span>
        </div>
        <div class="h-5 w-full bg-white rounded-full overflow-hidden p-0.5">
          <div 
            class="h-full bg-pastel-mint rounded-full transition-all duration-300 ease-out" 
            style="width: {todayPercent}%;"
          ></div>
        </div>
      </div>

      <!-- Cycle Progress -->
      <div class="space-y-2.5">
        <div class="flex justify-between items-baseline px-0.5">
          <span class="text-base font-semibold text-ink-primary">Cycle Goal</span>
          <span class="text-base font-bold text-ink-primary">
            {$pullupStore.cycle} <span class="text-ink-muted font-normal text-sm">/ {$pullupStore.cycleTarget}</span>
          </span>
        </div>
        <div class="h-5 w-full bg-white rounded-full overflow-hidden p-0.5">
          <div 
            class="h-full bg-pastel-lavender rounded-full transition-all duration-300 ease-out" 
            style="width: {cyclePercent}%;"
          ></div>
        </div>
      </div>

      <!-- Chunky Steppers -->
      <div class="flex items-center justify-between gap-4 pt-1">
        <button 
          on:click={minusPullups}
          class="flex-1 py-4 rounded-3xl bg-pastel-lavenderSoft text-pastel-lavenderText font-bold text-lg active:scale-95 transition text-center"
        >
          -{$pullupStore.increment}
        </button>

        <!-- Working Settings Cog -->
        <button 
          on:click={openSettings}
          class="w-14 h-14 rounded-3xl bg-white text-ink-muted hover:text-ink-primary flex items-center justify-center active:scale-95 transition"
        >
          <Settings class="w-5 h-5 stroke-[2.2]" />
        </button>

        <button 
          on:click={addPullups}
          class="flex-1 py-4 rounded-3xl bg-pastel-mintSoft text-pastel-mintText font-bold text-lg active:scale-95 transition text-center"
        >
          +{$pullupStore.increment}
        </button>
      </div>

    </section>

    <!-- WORKOUTS JOURNEY TIMELINE -->
    <section class="space-y-3">
      <h3 class="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">Workouts This Cycle</h3>

      <div class="relative pl-8 space-y-3.5">
        {#each currentCycleWorkouts as workout, i}
          <TimelineItem 
            completed={true}
            nextCompleted={i < currentCycleWorkouts.length - 1}
            isLast={false}
            isHolding={holdingSessionId === workout.id}
            gap="14px"
          >
            <!-- Card: Holdable to delete, Tap to inspect -->
            <div 
              on:click={() => handleSessionClick(workout)}
              on:pointerdown={() => startSessionHold(workout)}
              on:pointerup={cancelSessionHold}
              on:pointerleave={cancelSessionHold}
              class="w-full p-4 rounded-3xl flex items-center justify-between cursor-pointer select-none transition-all duration-200 {holdingSessionId === workout.id ? 'bg-rose-50 scale-[0.98]' : 'bg-white active:scale-[0.99]'}"
              role="button"
              tabindex="0"
            >
              <div>
                <p class="font-bold text-sm leading-tight transition-colors {holdingSessionId === workout.id ? 'text-rose-600' : 'text-ink-primary'}">Session {i + 1}</p>
                <p class="text-xs font-medium mt-0.5 transition-colors {holdingSessionId === workout.id ? 'text-rose-500' : 'text-ink-muted'}">{workout.date} • {workout.exerciseCount} exercises</p>
              </div>
              <ChevronRight class="w-5 h-5 text-ink-muted stroke-[2]" />
            </div>
          </TimelineItem>
        {/each}

        <!-- Start / Resume Workout Node -->
        <TimelineItem 
          completed={false}
          isLast={true}
          isHolding={isHoldingResume}
          hollowBorder="border-emerald-500"
          gap="14px"
        >
          <button 
            on:click={startWorkout}
            on:pointerdown={startResumeHold}
            on:pointerup={cancelResumeHold}
            on:pointerleave={cancelResumeHold}
            class="w-full p-4 rounded-3xl flex items-center justify-between font-bold text-sm tracking-wide transition-all duration-200 {isHoldingResume ? 'bg-rose-50 text-rose-600 scale-[0.98]' : 'bg-pastel-mintSoft text-pastel-mintText active:scale-[0.98]'}"
          >
            {#if $activeWorkoutStore}
              <div class="flex items-center gap-2">
                <span>Resume Workout</span>
              </div>
            {:else}
              <span>Start Workout</span>
            {/if}
            <Play class="w-4 h-4 fill-current mr-1" />
          </button>
        </TimelineItem>
      </div>

    </section>

  </main>

  <!-- Bottom Action -->
  <footer class="pt-1">
    <button 
      on:click={() => router.navigate('progress')}
      class="w-full bg-white text-ink-primary py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition"
    >
      <span>History & Progress</span>
      <ArrowUpRight class="w-4 h-4 text-ink-muted stroke-[2.2]" />
    </button>
  </footer>

  <!-- 1. Advance Week Modal -->
  <BottomSheet 
    open={showAdvanceModal}
    subtitle="Next Cycle"
    title="Advance to Cycle {$cycleStore.current + 1}?"
    description="This will archive current workouts and reset your pull-up counters."
    confirmText="Advance ❯"
    confirmColor="bg-pastel-lavenderSoft text-pastel-lavenderText"
    on:close={() => showAdvanceModal = false}
    on:confirm={confirmAdvance}
  />

  <!-- 2. Pull-Up Settings Modal -->
  <BottomSheet 
    open={showSettingsModal}
    title="Pull-Up Config"
    confirmText="Save Changes"
    confirmColor="bg-pastel-mintSoft text-pastel-mintText"
    on:close={() => showSettingsModal = false}
    on:confirm={saveSettings}
  >
    <div class="space-y-3 pt-1">
      <!-- Reps per set -->
      <div class="flex items-center justify-between bg-canvas p-4 px-5 rounded-3xl">
        <span class="text-sm font-semibold text-ink-primary">Reps per Set</span>
        <input 
          type="number" 
          bind:value={editIncrement} 
          on:focus={(e) => e.currentTarget.select()}
          class="w-16 text-right font-extrabold text-base bg-transparent outline-none text-ink-primary"
        />
      </div>

      <!-- Daily Target -->
      <div class="flex items-center justify-between bg-canvas p-4 px-5 rounded-3xl">
        <span class="text-sm font-semibold text-ink-primary">Daily Goal</span>
        <input 
          type="number" 
          bind:value={editDailyTarget} 
          on:focus={(e) => e.currentTarget.select()}
          class="w-16 text-right font-extrabold text-base bg-transparent outline-none text-ink-primary"
        />
      </div>

      <!-- Cycle Target -->
      <div class="flex items-center justify-between bg-canvas p-4 px-5 rounded-3xl">
        <span class="text-sm font-semibold text-ink-primary">Cycle Goal</span>
        <input 
          type="number" 
          bind:value={editCycleTarget} 
          on:focus={(e) => e.currentTarget.select()}
          class="w-16 text-right font-extrabold text-base bg-transparent outline-none text-ink-primary"
        />
      </div>
    </div>
  </BottomSheet>
  <BottomSheet 
    open={showDeleteSessionModal}
    title="Delete Session?"
    subtitle="{sessionToDelete?.date} • {sessionToDelete?.exerciseCount} exercises"
    description="This will remove this workout from Cycle {$cycleStore.current} history."
    confirmText="Delete Session"
    confirmColor="bg-pastel-coralSoft text-pastel-coralText"
    on:close={() => showDeleteSessionModal = false}
    on:confirm={confirmDeleteSession}
  />
  <!-- Discard Active Workout BottomSheet -->
  <BottomSheet 
    open={showDiscardModal}
    title="Discard Workout?"
    subtitle="Active Session"
    description="This will cancel your running session without saving any sets to your history."
    confirmText="Discard Workout"
    confirmColor="bg-pastel-coralSoft text-pastel-coralText"
    on:close={() => showDiscardModal = false}
    on:confirm={confirmDiscard}
  />

</div>
