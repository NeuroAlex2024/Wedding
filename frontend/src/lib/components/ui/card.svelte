<script lang="ts">
  import { cn } from '$lib/utils/cn';
  export let className = '';
  export let class: string | undefined = undefined;
</script>

<div class={cn('rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur', className, class)}>
  <slot />
</div>
