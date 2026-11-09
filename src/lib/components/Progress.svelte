<script>
  import { onMount, tick } from 'svelte';
  import { 
    router, 
    exercisesStore, 
    cycleHistoryStore, 
    dailyPullupsStore,
    exerciseLogsStore,
    pullupStore
  } from '../store.js';
  import { ChevronLeft, ChevronDown, Check, TrendingUp, TrendingDown } from 'lucide-svelte';
  import BottomSheet from './BottomSheet.svelte';
  import { 
    Chart, 
    BarController, 
    BarElement, 
    LineController, 
    LineElement, 
    PointElement, 
    LinearScale, 
    CategoryScale, 
    Tooltip 
  } from 'chart.js';

  Chart.register(
    BarController, 
    BarElement, 
    LineController, 
    LineElement, 
    PointElement, 
    LinearScale, 
    CategoryScale, 
    Tooltip
  );

  $: sortedExercises = [...$exercisesStore].sort((a, b) => a.localeCompare(b));

  // Global typography alignment for Chart.js
  Chart.defaults.font.family = '"Plus Jakarta Sans", sans-serif';
  Chart.defaults.font.size = 11;
  Chart.defaults.font.weight = '600';
  Chart.defaults.color = '#7E8695';

  let selectedExercise = $exercisesStore[0] || 'Bench Press';
  let showExercisePicker = false;

  // Carousel slide tracking
  let pullupActiveSlide = 0;   // 0: Cycle, 1: Daily
  let exerciseActiveSlide = 0; // 0: 1RM, 1: Weight, 2: Volume

  // Canvas references
  let pullupCycleCanvas;
  let pullupDailyCanvas;
  let ormCanvas;
  let weightCanvas;
  let volumeCanvas;

  // Chart instances
  let pullupCycleChart = null;
  let pullupDailyChart = null;
  let ormChart = null;
  let weightChart = null;
  let volumeChart = null;

  $: logs = $exerciseLogsStore[selectedExercise] || [];
  $: bestWeight = logs.length ? Math.max(...logs.map(l => l.weight)) : 0;
  $: best1RM = logs.length ? Math.max(...logs.map(l => l.est1RM)) : 0;
  $: bestVolume = logs.length ? Math.max(...logs.map(l => l.volume || (l.weight * l.reps * 3))) : 0;

  function chooseExercise(ex) {
    selectedExercise = ex;
    showExercisePicker = false;
  }
  function getExerciseTrend(name) {
    const logs = $exerciseLogsStore[name] || [];
    if (logs.length < 2) return null;
    const latest = logs[logs.length - 1];
    const prev = logs[logs.length - 2];

    if (latest.est1RM > prev.est1RM) return 'up';
    if (latest.est1RM < prev.est1RM) return 'down';
    return null;
  }

  // --- 1. Pull-Up Charts (Rendered Once on Mount) ---
  function renderPullupCharts() {
    // Slide 1: Cycle History
    if (pullupCycleCanvas) {
      if (pullupCycleChart) pullupCycleChart.destroy();
      pullupCycleChart = new Chart(pullupCycleCanvas, {
        type: 'bar',
        data: {
          labels: $cycleHistoryStore.map(c => `C${c.cycle}`),
          datasets: [{
            data: $cycleHistoryStore.map(c => c.pullups),
            backgroundColor: '#C4B5FD',
            hoverBackgroundColor: '#A78BFA',
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 22
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { tooltip: { cornerRadius: 10, padding: 8 } },
          scales: {
            x: { grid: { display: false }, border: { display: false } },
            y: { grid: { color: '#262A33' }, border: { display: false }, beginAtZero: true }
          }
        }
      });
    }

    // Slide 2: Daily Breakdown (Colors green if >= 12 target)
    if (pullupDailyCanvas) {
      if (pullupDailyChart) pullupDailyChart.destroy();
      pullupDailyChart = new Chart(pullupDailyCanvas, {
        type: 'bar',
        data: {
          labels: $dailyPullupsStore.map(d => d.day),
          datasets: [{
            data: $dailyPullupsStore.map(d => d.count),
            backgroundColor: $dailyPullupsStore.map(d => d.count >= 12 ? '#86EFAC' : '#C4B5FD'),
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 20
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { tooltip: { cornerRadius: 10, padding: 8 } },
          scales: {
            x: { grid: { display: false }, border: { display: false } },
            y: { grid: { color: '#262A33' }, border: { display: false }, beginAtZero: true }
          }
        }
      });
    }
  }

  // --- 2. Exercise Charts (Only these re-render on selection change) ---
  async function renderExerciseCharts() {
    await tick();

    // Slide 1: Est 1RM
    if (ormCanvas) {
      if (ormChart) ormChart.destroy();
      ormChart = new Chart(ormCanvas, {
        type: 'line',
        data: {
          labels: logs.map(l => l.date),
          datasets: [{
            data: logs.map(l => l.est1RM),
            borderColor: '#86EFAC',
            backgroundColor: 'rgba(74, 222, 128, 0.12)',
            tension: 0.35,
            pointRadius: 4.5,
            pointBackgroundColor: '#15803D',
            pointBorderColor: '#181B20',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { tooltip: { cornerRadius: 10, padding: 8 } },
          scales: {
            x: { grid: { display: false }, border: { display: false } },
            y: { grid: { color: '#262A33' }, border: { display: false } }
          }
        }
      });
    }

    // Slide 2: Working Weight
    if (weightCanvas) {
      if (weightChart) weightChart.destroy();
      weightChart = new Chart(weightCanvas, {
        type: 'line',
        data: {
          labels: logs.map(l => l.date),
          datasets: [{
            data: logs.map(l => l.weight),
            borderColor: '#93C5FD',
            backgroundColor: 'rgba(96, 165, 250, 0.12)',
            tension: 0.35,
            pointRadius: 4.5,
            pointBackgroundColor: '#1D4ED8',
            pointBorderColor: '#181B20',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { tooltip: { cornerRadius: 10, padding: 8 } },
          scales: {
            x: { grid: { display: false }, border: { display: false } },
            y: { grid: { color: '#262A33' }, border: { display: false } }
          }
        }
      });
    }

    // Slide 3: Session Volume / Tonnage
    if (volumeCanvas) {
      if (volumeChart) volumeChart.destroy();
      volumeChart = new Chart(volumeCanvas, {
        type: 'line',
        data: {
          labels: logs.map(l => l.date),
          datasets: [{
            data: logs.map(l => l.volume || (l.weight * l.reps * 3)),
            borderColor: '#C4B5FD',
            backgroundColor: 'rgba(167, 139, 250, 0.12)',
            tension: 0.35,
            pointRadius: 4.5,
            pointBackgroundColor: '#6D28D9',
            pointBorderColor: '#181B20',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { tooltip: { cornerRadius: 10, padding: 8 } },
          scales: {
            x: { grid: { display: false }, border: { display: false } },
            y: { grid: { color: '#262A33' }, border: { display: false } }
          }
        }
      });
    }
  }

  onMount(() => {
    renderPullupCharts();
    renderExerciseCharts();
  });

  $: if (selectedExercise) {
    renderExerciseCharts();
  }
</script>

<!-- Mobile Viewport Container -->
<div class="w-full max-w-none sm:max-w-[440px] bg-canvas min-h-screen sm:min-h-0 sm:h-[860px] sm:rounded-[44px] sm:shadow-2xl flex flex-col justify-between p-6 sm:p-7 relative overflow-hidden">

  <!-- Header -->
  <header class="flex items-center gap-4 pt-1">
    <button 
      on:click={router.back}
      class="w-11 h-11 rounded-full bg-white text-ink-primary flex items-center justify-center active:scale-95 transition flex-shrink-0"
    >
      <ChevronLeft class="w-5 h-5 stroke-[2.5]" />
    </button>
    <h1 class="text-2xl font-extrabold text-ink-primary tracking-tight">Progress</h1>
  </header>

  <!-- Main Area -->
  <main class="space-y-5 my-auto py-2">

    <!-- 1. PULL-UP CAROUSEL SECTION -->
    <section class="space-y-2">
      <h3 class="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">Pull-Up Volume</h3>
      
      <!-- Pull-Up Gallery -->
      <div 
        on:scroll={(e) => pullupActiveSlide = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth)}
        class="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1"
      >
        <!-- Slide 1: Cycle History -->
        <div class="w-full flex-shrink-0 snap-center space-y-1.5">
          <div class="flex justify-between items-baseline px-1">
            <span class="text-base font-semibold text-ink-primary">By Cycle</span>
            <span class="text-base font-bold text-ink-primary">{$pullupStore.cycle} <span class="text-ink-muted font-normal text-xs">this cycle</span></span>
          </div>
          <div class="w-full bg-white p-4 rounded-3xl h-36 flex items-center justify-center">
            <canvas bind:this={pullupCycleCanvas}></canvas>
          </div>
        </div>

        <!-- Slide 2: Daily Breakdown -->
        <div class="w-full flex-shrink-0 snap-center space-y-1.5">
          <div class="flex justify-between items-baseline px-1">
            <span class="text-base font-semibold text-ink-primary">Daily Breakdown</span>
            <span class="text-base font-bold text-emerald-600">Goal: 12 <span class="text-ink-muted font-normal text-xs">/ day</span></span>
          </div>
          <div class="w-full bg-white p-4 rounded-3xl h-36 flex items-center justify-center">
            <canvas bind:this={pullupDailyCanvas}></canvas>
          </div>
        </div>
      </div>

      <!-- Pull-Up Pagination Dots -->
      <div class="flex justify-center items-center gap-1.5 pt-0.5">
        <div class="h-1.5 rounded-full transition-all duration-200 {pullupActiveSlide === 0 ? 'w-5 bg-ink-primary' : 'w-1.5 bg-pastel-slateTrack'}"></div>
        <div class="h-1.5 rounded-full transition-all duration-200 {pullupActiveSlide === 1 ? 'w-5 bg-ink-primary' : 'w-1.5 bg-pastel-slateTrack'}"></div>
      </div>
    </section>

    <!-- 2. EXERCISE SELECTOR & STAT BADGES -->
    <section class="space-y-2.5">
      <h3 class="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">Exercise Deep Dive</h3>

      <!-- Selector Button -->
      <button 
        on:click={() => showExercisePicker = true}
        class="w-full bg-white p-4 px-5 rounded-3xl flex items-center justify-between font-bold text-base text-ink-primary active:scale-[0.99] transition"
      >
        <span>{selectedExercise}</span>
        <div class="w-8 h-8 rounded-full bg-canvas flex items-center justify-center text-ink-muted">
          <ChevronDown class="w-4 h-4 stroke-[2.5]" />
        </div>
      </button>

      <!-- Stat Badges (Matching Dashboard Typography) -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-white p-4 rounded-3xl space-y-1">
          <p class="text-xs font-bold uppercase tracking-wider text-ink-muted">All-Time Weight</p>
          <p class="text-xl font-extrabold text-ink-primary">{bestWeight} <span class="text-xs font-semibold text-ink-muted">kg</span></p>
        </div>
        <div class="bg-white p-4 rounded-3xl space-y-1">
          <p class="text-xs font-bold uppercase tracking-wider text-ink-muted">Best Est. 1RM</p>
          <p class="text-xl font-extrabold text-emerald-600">{best1RM} <span class="text-xs font-semibold text-ink-muted">kg</span></p>
        </div>
      </div>
    </section>

    <!-- 3. EXERCISE CAROUSEL (3 SLIDES) -->
    <section class="space-y-2">
      <div 
        on:scroll={(e) => exerciseActiveSlide = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth)}
        class="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1"
      >
        <!-- Slide 1: Estimated 1RM -->
        <div class="w-full flex-shrink-0 snap-center space-y-1.5">
          <div class="flex justify-between items-baseline px-1">
            <span class="text-base font-semibold text-ink-primary">Estimated 1RM</span>
            <span class="text-base font-bold text-emerald-600">Peak: {best1RM} <span class="text-ink-muted font-normal text-xs">kg</span></span>
          </div>
          <div class="w-full bg-white p-4 rounded-3xl h-38 flex items-center justify-center">
            <canvas bind:this={ormCanvas}></canvas>
          </div>
        </div>

        <!-- Slide 2: Working Weight Progression -->
        <div class="w-full flex-shrink-0 snap-center space-y-1.5">
          <div class="flex justify-between items-baseline px-1">
            <span class="text-base font-semibold text-ink-primary">Working Weight</span>
            <span class="text-base font-bold text-blue-600">Peak: {bestWeight} <span class="text-ink-muted font-normal text-xs">kg</span></span>
          </div>
          <div class="w-full bg-white p-4 rounded-3xl h-38 flex items-center justify-center">
            <canvas bind:this={weightCanvas}></canvas>
          </div>
        </div>

        <!-- Slide 3: Session Volume / Tonnage -->
        <div class="w-full flex-shrink-0 snap-center space-y-1.5">
          <div class="flex justify-between items-baseline px-1">
            <span class="text-base font-semibold text-ink-primary">Total Volume</span>
            <span class="text-base font-bold text-violet-600">Peak: {bestVolume} <span class="text-ink-muted font-normal text-xs">kg</span></span>
          </div>
          <div class="w-full bg-white p-4 rounded-3xl h-38 flex items-center justify-center">
            <canvas bind:this={volumeCanvas}></canvas>
          </div>
        </div>
      </div>

      <!-- Exercise Carousel Pagination Dots (3 Dots) -->
      <div class="flex justify-center items-center gap-1.5 pt-0.5">
        <div class="h-1.5 rounded-full transition-all duration-200 {exerciseActiveSlide === 0 ? 'w-5 bg-ink-primary' : 'w-1.5 bg-pastel-slateTrack'}"></div>
        <div class="h-1.5 rounded-full transition-all duration-200 {exerciseActiveSlide === 1 ? 'w-5 bg-ink-primary' : 'w-1.5 bg-pastel-slateTrack'}"></div>
        <div class="h-1.5 rounded-full transition-all duration-200 {exerciseActiveSlide === 2 ? 'w-5 bg-ink-primary' : 'w-1.5 bg-pastel-slateTrack'}"></div>
      </div>
    </section>

  </main>

  <!-- Clean Exercise Selector BottomSheet -->
  <BottomSheet 
    open={showExercisePicker}
    title="Select Exercise"
    subtitle="Deep Dive"
    showCancel={false}
    confirmText="Close"
    confirmColor="bg-canvas text-ink-primary"
    on:close={() => showExercisePicker = false}
    on:confirm={() => showExercisePicker = false}
  >
    <div class="max-h-60 overflow-y-auto no-scrollbar space-y-2 py-1">
      {#each sortedExercises as ex}
        {@const trend = getExerciseTrend(ex)}

        <button 
          on:click={() => chooseExercise(ex)}
          class="w-full p-4 rounded-2xl flex items-center justify-between font-bold text-sm transition {selectedExercise === ex ? 'bg-pastel-mintSoft text-pastel-mintText' : 'bg-canvas text-ink-primary active:scale-[0.99]'}"
        >
          <span>{ex}</span>

          <!-- Trend Icon (Trending Up / Down) -->
          <div class="flex items-center gap-2">
            {#if trend === 'up'}
              <TrendingUp class="w-4 h-4" />
            {:else if trend === 'down'}
              <TrendingDown class="w-4 h-4" />
            {/if}
          </div>
        </button>
      {/each}
    </div>
  </BottomSheet>

</div>
