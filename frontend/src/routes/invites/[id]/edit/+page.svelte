<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';
  import Button from '$ui/button.svelte';
  import Card from '$ui/card.svelte';
  import Input from '$ui/input.svelte';
  import Label from '$ui/label.svelte';
  import Textarea from '$ui/textarea.svelte';
  import pb from '$lib/pocketbase';
  import { currentUser } from '$lib/stores/auth';

  let user = get(currentUser);
  let inviteId = '';
  let loading = true;
  let saving = false;
  let error = '';
  let success = '';
  let invite = {
    title: '',
    slug: '',
    date: '',
    location: '',
    hero: '',
    description: '',
    isPublished: false
  };
  let shareUrl = '';

  const unsubscribe = currentUser.subscribe((value) => {
    user = value;
    if (!value) {
      goto('/auth');
    }
  });

  onDestroy(() => unsubscribe());

  onMount(async () => {
    const { params } = get(page);
    inviteId = params.id;
    if (!pb.authStore.isValid) {
      goto('/auth');
      return;
    }
    try {
      const record = await pb.collection('invites').getOne(inviteId);
      invite = {
        title: record.title ?? '',
        slug: record.slug ?? '',
        date: record.date ?? '',
        location: record.location ?? '',
        hero: record.hero ?? '',
        description: record.description ?? '',
        isPublished: record.isPublished ?? false
      };
    } catch (err) {
      console.error(err);
      error = 'Не удалось загрузить приглашение';
    } finally {
      loading = false;
    }
  });

  const saveInvite = async () => {
    if (!inviteId) return;
    saving = true;
    error = '';
    success = '';
    try {
      await pb.collection('invites').update(inviteId, invite);
      success = 'Изменения сохранены';
    } catch (err) {
      console.error(err);
      error = err instanceof Error ? err.message : 'Не удалось сохранить изменения';
    } finally {
      saving = false;
    }
  };

  $: shareUrl = invite.slug ? `${window.location.origin}/invites/${invite.slug}` : '';
</script>

<Card class="mx-auto max-w-3xl space-y-6">
  {#if loading}
    <p class="text-sm text-slate-500">Загрузка приглашения…</p>
  {:else}
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="font-display text-3xl text-slate-900">Редактирование приглашения</h1>
        <p class="text-sm text-slate-500">Обновите информацию для гостей и поделитесь ссылкой.</p>
      </div>
      {#if shareUrl}
        <Button variant="outline" on:click={() => window.open(shareUrl, '_blank')}>
          Открыть публичную страницу
        </Button>
      {/if}
    </div>

    <form class="space-y-5" on:submit|preventDefault={saveInvite}>
      <div class="space-y-2">
        <Label>Название</Label>
        <Input bind:value={invite.title} placeholder="Свадьба Ани и Пети" required />
      </div>
      <div class="space-y-2">
        <Label>Ссылка (slug)</Label>
        <Input bind:value={invite.slug} placeholder="anna-i-petr" required />
        <p class="text-xs text-slate-500">Публичная ссылка: <span class="font-mono">{shareUrl || '—'}</span></p>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2">
          <Label>Дата</Label>
          <Input type="date" bind:value={invite.date} />
        </div>
        <div class="space-y-2">
          <Label>Локация</Label>
          <Input bind:value={invite.location} placeholder="Загородный клуб «Лесной»" />
        </div>
      </div>
      <div class="space-y-2">
        <Label>Обложка (ссылка на изображение)</Label>
        <Input bind:value={invite.hero} placeholder="https://..." />
      </div>
      <div class="space-y-2">
        <Label>Описание</Label>
        <Textarea bind:value={invite.description} rows={5} placeholder="Добавьте тёплые слова для гостей" />
      </div>
      <label class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-sm">
        <input type="checkbox" bind:checked={invite.isPublished} class="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400" />
        Сделать страницу публичной
      </label>

      {#if error}
        <p class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
      {/if}
      {#if success}
        <p class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{success}</p>
      {/if}

      <div class="flex flex-wrap gap-3">
        <Button type="submit" loading={saving}>
          Сохранить изменения
        </Button>
        <Button variant="ghost" type="button" on:click={() => goto('/dashboard')}>
          Вернуться в панель
        </Button>
      </div>
    </form>
  {/if}
</Card>
