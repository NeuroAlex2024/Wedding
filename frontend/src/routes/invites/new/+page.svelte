<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Button from '$ui/button.svelte';
  import Card from '$ui/card.svelte';
  import Input from '$ui/input.svelte';
  import Label from '$ui/label.svelte';
  import Textarea from '$ui/textarea.svelte';
  import pb from '$lib/pocketbase';
  import { currentUser } from '$lib/stores/auth';
  import { get } from 'svelte/store';

  let user = get(currentUser);
  let loading = false;
  let error = '';
  let success = '';
  let slugSuggestion = '';
  let form = {
    title: '',
    slug: '',
    date: '',
    location: '',
    hero: '',
    description: '',
    isPublished: false
  };

  onMount(() => {
    const authUser = pb.authStore.model;
    if (!authUser) {
      goto('/auth');
      return;
    }
    user = authUser;
  });

  const unsubscribe = currentUser.subscribe((value) => {
    user = value;
    if (!value) {
      goto('/auth');
    }
  });

  onDestroy(() => unsubscribe());

  const updateSlugSuggestion = () => {
    if (!form.slug && form.title) {
      slugSuggestion = form.title
        .toLowerCase()
        .replace(/[^a-zа-я0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      goto('/auth');
      return;
    }
    loading = true;
    error = '';
    success = '';
    try {
      const payload = {
        ...form,
        slug: form.slug || slugSuggestion,
        owner: user.id
      };
      if (!payload.slug) {
        throw new Error('Добавьте адрес приглашения (slug).');
      }
      const record = await pb.collection('invites').create(payload);
      success = 'Приглашение создано! Теперь вы можете отредактировать подробности.';
      goto(`/invites/${record.id}/edit`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Не удалось создать приглашение';
      console.error(err);
    } finally {
      loading = false;
    }
  };
</script>

<Card class="mx-auto max-w-3xl space-y-6">
  <div>
    <h1 class="font-display text-3xl text-slate-900">Новое приглашение</h1>
    <p class="mt-2 text-sm text-slate-500">Создайте ссылку, которой можно поделиться с гостями.</p>
  </div>

  <form class="space-y-5" on:submit|preventDefault={handleSubmit}>
    <div class="space-y-2">
      <Label>Название</Label>
      <Input bind:value={form.title} on:input={updateSlugSuggestion} placeholder="Свадьба Ани и Пети" required />
    </div>
    <div class="space-y-2">
      <Label>Ссылка (slug)</Label>
      <Input bind:value={form.slug} placeholder={slugSuggestion || 'anna-i-petr'} required />
      <p class="text-xs text-slate-500">Гости будут переходить по адресу <span class="font-mono">ваш-домен/{form.slug || slugSuggestion || 'slug'}</span>.</p>
    </div>
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <Label>Дата</Label>
        <Input type="date" bind:value={form.date} />
      </div>
      <div class="space-y-2">
        <Label>Локация</Label>
        <Input bind:value={form.location} placeholder="Загородный клуб «Лесной»" />
      </div>
    </div>
    <div class="space-y-2">
      <Label>Обложка (ссылка на изображение)</Label>
      <Input bind:value={form.hero} placeholder="https://..." />
    </div>
    <div class="space-y-2">
      <Label>Описание</Label>
      <Textarea bind:value={form.description} placeholder="Добавьте тёплые слова для гостей" />
    </div>
    <label class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-sm">
      <input type="checkbox" bind:checked={form.isPublished} class="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400" />
      Опубликовать сразу
    </label>

    {#if error}
      <p class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
    {/if}
    {#if success}
      <p class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{success}</p>
    {/if}

    <Button type="submit" size="lg" loading={loading}>
      Создать приглашение
    </Button>
  </form>
</Card>
