<script>
  export let completed = false;
  export let nextCompleted = false;
  export let isLast = false;
  export let isHolding = false;
  export let hollowBorder = 'border-slate-300';
  export let gap = '16px'; // 16px in Workout, 14px in Dashboard
</script>

<div class="relative flex items-center justify-between">
  <!-- 1. The Dot (Solid, Hollow, or Charging Coral Ring) -->
  {#if completed}
    <div 
      class="absolute -left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full z-10 transition-all duration-200 {isHolding ? 'scale-140 bg-rose-500 ring-4 ring-rose-200' : 'bg-emerald-500'}"
    ></div>
  {:else}
    <div 
      class="absolute -left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-canvas z-10 transition-all duration-200 {isHolding ? 'scale-140 border-2 border-rose-500 bg-rose-100 ring-4 ring-rose-200' : `border-2 ${hollowBorder}`}"
    ></div>
  {/if}

  <!-- 2. Segmented Connector Line (Turns Green if both this and next are completed) -->
  {#if !isLast}
    <div 
      class="absolute -left-[18px] top-1/2 w-0.5 transition-colors duration-300 {completed && nextCompleted ? 'bg-emerald-500' : 'bg-pastel-slateTrack'}"
      style="height: calc(100% + {gap});"
    ></div>
  {/if}

  <!-- Row Content (Slot) -->
  <slot />
</div>
