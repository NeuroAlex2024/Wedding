<script lang="ts">
  import { cn } from '$lib/utils/cn';
  export let className = '';
  export let class: string | undefined = undefined;
</script>

<label class={cn('text-sm font-medium text-slate-700', className, class)}>
  <slot />
</label>
