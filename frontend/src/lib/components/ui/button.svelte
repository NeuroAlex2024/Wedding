<script lang="ts">
  import type { ButtonHTMLAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils/cn';

  export let className = '';
  export let class: string | undefined = undefined;
  export let variant: 'primary' | 'secondary' | 'ghost' | 'outline' = 'primary';
  export let size: 'default' | 'sm' | 'lg' = 'default';
  export let loading = false;
  export let type: ButtonHTMLAttributes['type'] = 'button';
  export let disabled = false;

  const base = 'inline-flex items-center justify-center gap-2 rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
  const variants = {
    primary: 'bg-brand-500 text-white shadow hover:bg-brand-600',
    secondary: 'bg-slate-900 text-white hover:bg-slate-800',
    outline: 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
    ghost: 'text-slate-900 hover:bg-slate-100'
  } as const;

  const sizes = {
    default: 'px-5 py-2.5 text-sm',
    sm: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  } as const;

  $: classes = cn(base, variants[variant], sizes[size], className, class);
</script>

<button
  {type}
  class={classes}
  disabled={disabled || loading}
  {...$$restProps}
>
  {#if loading}
    <svg
      class="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      ></path>
    </svg>
  {/if}
  <slot />
</button>
