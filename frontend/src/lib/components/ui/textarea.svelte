<script lang="ts">
  import { cn } from '$lib/utils/cn';
  export let className = '';
  export let class: string | undefined = undefined;
  export let value: string | undefined = undefined;
</script>

<textarea
  bind:value
  class={cn(
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:ring-offset-0',
    className,
    class
  )}
  rows={4}
  {...$$restProps}
>
  <slot />
</textarea>
