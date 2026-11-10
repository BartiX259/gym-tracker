<script>
  import { 
    exercisesStore, 
    activeWorkoutStore, 
    router,
    getGhostStats 
  } from '../store.js';
  import { ChevronLeft, Search, Plus } from 'lucide-svelte';
  import BottomSheet from './BottomSheet.svelte';

  let searchTerm = '';
  let showDeleteModal = false;
  let exerciseToDelete = null;

  // Auto-Title-Casing helper (e.g. "dumbbell fly" -> "Dumbbell Fly")
  function toTitleCase(str) {
    return str
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  $: trimmedSearch = searchTerm.trim();
  $: formattedSearch = toTitleCase(trimmedSearch);

  // 1. Sort alphabetically and filter
  $: filteredExercises = [...$exercisesStore]
    .sort((a, b) => a.localeCompare(b))
    .filter(ex => ex.toLowerCase().includes(trimmedSearch.toLowerCase()));

  // 2. Check if the exact match already exists
  $: exactMatchExists = $exercisesStore.some(
    ex => ex.toLowerCase() === trimmedSearch.toLowerCase()
  );

  // Select an existing exercise & add to workout
  function selectExercise(name) {
    if (!$activeWorkoutStore) return;

    const ghost = getGhostStats(name);

    activeWorkoutStore.update(w => {
      const existing = w.exercises.find(e => e.name === name);
      if (!existing) {
        w.exercises.push({
          id: Date.now(),
          name,
          lastWeight: ghost.weight,
          lastReps: ghost.reps,
          sets: [
            { weight: ghost.weight, reps: ghost.reps, completed: false },
            { weight: ghost.weight, reps: ghost.reps, completed: false },
            { weight: ghost.weight, reps: ghost.reps, completed: false }
          ]
        });
      }
      return w;
    });

    router.back();
  }

  // Create new exercise & select immediately
  function createAndSelect(name) {
    const formatted = toTitleCase(name.trim());
    if (!formatted) return;

    if (!exactMatchExists) {
      exercisesStore.update(list => [...list, formatted]);
    }

    selectExercise(formatted);
  }

  // Long-press (350ms) to Delete
  let holdTimer;
  let holdingExercise = null;

  function startHold(ex) {
    holdingExercise = ex;
    holdTimer = setTimeout(() => {
      exerciseToDelete = ex;
      showDeleteModal = true;
      holdingExercise = null;
    }, 350);
  }

  function cancelHold() {
    clearTimeout(holdTimer);
    holdingExercise = null;
  }

  function confirmDelete() {
    if (exerciseToDelete) {
      exercisesStore.update(list => list.filter(e => e !== exerciseToDelete));
      exerciseToDelete = null;
      showDeleteModal = false;
    }
  }
</script>

<!-- Mobile Viewport Container -->
<div class="w-full max-w-none sm:max-w-[440px] bg-canvas h-dvh sm:h-[860px] sm:rounded-[44px] sm:shadow-2xl flex flex-col justify-between p-6 sm:p-7 relative overflow-hidden">

  <!-- Top Row: Back button + Search Bar Inline -->
  <header class="flex items-center gap-3 pt-2">
    <button 
      on:click={router.back}
      class="w-12 h-12 rounded-full bg-white text-ink-primary flex items-center justify-center active:scale-95 transition flex-shrink-0"
    >
      <ChevronLeft class="w-5 h-5 stroke-[2.5]" />
    </button>

    <div class="relative flex-1">
      <Search class="w-5 h-5 text-ink-muted absolute left-4.5 top-1/2 -translate-y-1/2 stroke-[2.2]" />
      <input 
        type="text" 
        bind:value={searchTerm}
        placeholder="Search or create..." 
        class="w-full bg-white py-3.5 pl-12 pr-4 rounded-full font-medium text-sm text-ink-primary placeholder:text-ink-muted outline-none focus:ring-2 focus:ring-pastel-mint transition"
      />
    </div>
  </header>

  <!-- Scrollable Exercise List -->
  <main class="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-3 py-3">

    <!-- 1. Matching Existing Exercises First -->
    {#each filteredExercises as exercise}
      <div 
        on:click={() => selectExercise(exercise)}
        on:pointerdown={() => startHold(exercise)}
        on:pointerup={cancelHold}
        on:pointerleave={cancelHold}
        class="w-full p-5 rounded-3xl transition-all duration-200 cursor-pointer flex items-center justify-between {holdingExercise === exercise ? 'bg-rose-950/40 scale-[0.98] text-pastel-coralText' : 'bg-white active:scale-[0.99] text-ink-primary'}"
        role="button"
        tabindex="0"
      >
        <span class="font-bold text-base transition-colors">{exercise}</span>
      </div>
    {/each}

    <!-- 2. Dynamic Green Create Card (Placed at the bottom of results, clean icon without bg-white) -->
    {#if trimmedSearch.length > 0 && !exactMatchExists}
      <div 
        on:click={() => createAndSelect(formattedSearch)}
        class="w-full p-5 rounded-3xl bg-pastel-mintSoft text-pastel-mintText flex items-center justify-between cursor-pointer active:scale-[0.98] transition"
        role="button"
        tabindex="0"
      >
        <span class="font-bold text-base">{formattedSearch}</span>
        <Plus class="w-5 h-5 stroke-[2.5] mr-1" />
      </div>
    {/if}

    <!-- Empty State -->
    {#if filteredExercises.length === 0 && trimmedSearch.length === 0}
      <div class="text-center py-16 text-ink-muted text-sm">
        No exercises in library yet.
      </div>
    {/if}
  </main>

  <!-- Empty Footer spacer -->
  <footer class="py-1"></footer>

  <!-- Delete Exercise Confirmation BottomSheet -->
  <BottomSheet 
    open={showDeleteModal}
    title="Delete {exerciseToDelete}?"
    subtitle="Remove Exercise"
    description="This will remove this exercise from your library."
    confirmText="Delete"
    confirmColor="bg-pastel-coralSoft text-pastel-coralText"
    on:close={() => showDeleteModal = false}
    on:confirm={confirmDelete}
  />

</div>
