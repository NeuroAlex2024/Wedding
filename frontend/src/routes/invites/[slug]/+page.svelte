<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';
  import Card from '$ui/card.svelte';
  import Button from '$ui/button.svelte';
  import pb from '$lib/pocketbase';

  let slug = '';
  let loading = true;
  let notFound = false;
  let invite: any = null;

  onMount(async () => {
    const { params } = get(page);
    slug = params.slug;
    try {
      invite = await pb.collection('invites').getFirstListItem(`slug = "${slug}" && (isPublished = true)`);
    } catch (error) {
      console.error(error);
      notFound = true;
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <p class="text-center text-sm text-slate-500">Загрузка приглашения…</p>
{:else if notFound || !invite}
  <Card class="mx-auto max-w-2xl text-center">
    <h1 class="font-display text-3xl text-slate-900">Приглашение не найдено</h1>
    <p class="mt-3 text-sm text-slate-500">Проверьте ссылку или попросите пару отправить приглашение повторно.</p>
    <Button class="mt-6" on:click={() => (window.location.href = '/')}>Вернуться на главную</Button>
  </Card>
{:else}
  <article class="mx-auto flex max-w-3xl flex-col gap-8">
    {#if invite.hero}
      <div class="overflow-hidden rounded-[2.5rem] shadow-xl">
        <img src={invite.hero} alt={invite.title} class="h-64 w-full object-cover" />
      </div>
    {/if}
    <div class="text-center">
      <p class="text-sm uppercase tracking-[0.25em] text-brand-500">Приглашение</p>
      <h1 class="mt-3 font-display text-4xl text-slate-900">{invite.title}</h1>
      {#if invite.date}
        <p class="mt-3 text-base text-slate-600">{new Date(invite.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      {/if}
      {#if invite.location}
        <p class="text-base text-slate-500">{invite.location}</p>
      {/if}
    </div>
    {#if invite.description}
      <Card class="space-y-4 text-base leading-relaxed text-slate-600">
        <p>{invite.description}</p>
      </Card>
    {/if}
    <Card class="space-y-2 text-center text-sm text-slate-500">
      <p>Мы будем рады разделить этот день с вами.</p>
      <p class="font-semibold text-slate-700">С любовью, {invite.title}</p>
    </Card>
  </article>
{/if}
