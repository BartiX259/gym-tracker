<script>
  import { createEventDispatcher } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  export let open = false;
  export let title = '';
  export let subtitle = '';
  export let description = '';
  export let confirmText = 'Confirm';
  export let confirmColor = 'bg-pastel-lavenderSoft text-pastel-lavenderText';
  export let showCancel = true;

  const dispatch = createEventDispatcher();

  function close() {
    dispatch('close');
  }

  function confirm() {
    dispatch('confirm');
  }
</script>

{#if open}
  <!-- Clean Dimmed Backdrop (Tap to Cancel) -->
  <div 
    transition:fade={{ duration: 180 }}
    class="absolute inset-0 bg-ink-primary/35 z-50 cursor-pointer"
    on:click={close}
    role="button"
    tabindex="0"
    on:keydown={(e) => e.key === 'Escape' && close()}
  ></div>

  <!-- Smooth Slide-Up Sheet -->
  <div 
    transition:fly={{ y: 380, duration: 250, easing: cubicOut }}
    class="absolute inset-x-0 bottom-0 bg-white rounded-t-[36px] p-7 pt-5 z-50 space-y-5 shadow-2xl select-none"
  >
    <!-- Aesthetic Bar (Static) -->
    <div class="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-1"></div>

    <!-- Header -->
    <div class="space-y-1">
      {#if subtitle}
        <p class="text-xs font-bold uppercase tracking-wider text-ink-muted">{subtitle}</p>
      {/if}
      <h3 class="text-xl font-extrabold text-ink-primary tracking-tight">{title}</h3>
      {#if description}
        <p class="text-xs font-medium text-ink-muted leading-relaxed pt-1">{description}</p>
      {/if}
    </div>

    <!-- Custom Slot Content -->
    <slot />

    <!-- Action Buttons -->
    <div class="flex gap-3 pt-2">
      {#if showCancel}
        <button 
          on:click={close}
          type="button"
          class="flex-1 py-4 rounded-3xl bg-canvas text-ink-primary font-bold text-sm active:scale-95 transition text-center"
        >
          Cancel
        </button>
      {/if}
      <button 
        on:click={confirm}
        type="button"
        class="flex-1 py-4 rounded-3xl {confirmColor} font-bold text-sm active:scale-95 transition text-center"
      >
        {confirmText}
      </button>
    </div>
  </div>
{/if}
