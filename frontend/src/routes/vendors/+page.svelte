<script lang="ts">
  import { onMount } from 'svelte';
  import Card from '$ui/card.svelte';
  import Button from '$ui/button.svelte';
  import pb from '$lib/pocketbase';

  type Vendor = {
    id: string;
    name: string;
    category: string;
    city: string;
    priceFrom: number;
    avatar?: string;
  };

  let vendors: Vendor[] = [];
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      const records = await pb.collection('vendors').getFullList<Vendor>({ sort: 'name' });
      vendors = records.map((record) => ({
        id: record.id,
        name: record.name,
        category: record.category,
        city: record.city,
        priceFrom: Number(record.priceFrom) || 0,
        avatar: record.avatar
      }));
    } catch (err) {
      console.error(err);
      error = 'Не удалось загрузить каталог подрядчиков';
    } finally {
      loading = false;
    }
  });
</script>

<section class="space-y-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="font-display text-3xl text-slate-900">Подрядчики WeddingFlow</h1>
      <p class="text-sm text-slate-500">Каталог исполнителей. Наполните его своими любимыми подрядчиками.</p>
    </div>
    <Button variant="outline" on:click={() => (window.location.href = '/auth')}>
      Добавить своего подрядчика
    </Button>
  </div>

  {#if loading}
    <p class="text-sm text-slate-500">Загрузка каталога…</p>
  {:else if error}
    <p class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
  {:else if vendors.length === 0}
    <Card class="text-center text-sm text-slate-500">
      Каталог пока пуст. Свяжитесь с нами, если хотите добавить своего подрядчика.
    </Card>
  {:else}
    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {#each vendors as vendor (vendor.id)}
        <Card class="space-y-4">
          <div class="flex items-center gap-4">
            {#if vendor.avatar}
              <img src={vendor.avatar} alt={vendor.name} class="h-16 w-16 rounded-full object-cover" />
            {:else}
              <div class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                {vendor.name.slice(0, 1)}
              </div>
            {/if}
            <div>
              <h3 class="text-base font-semibold text-slate-900">{vendor.name}</h3>
              <p class="text-xs uppercase tracking-wide text-slate-400">{vendor.category}</p>
            </div>
          </div>
          <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p>Город: <span class="font-medium text-slate-900">{vendor.city}</span></p>
            <p class="mt-1">Стоимость от: <span class="font-medium text-slate-900">{vendor.priceFrom.toLocaleString('ru-RU')} ₽</span></p>
          </div>
          <Button variant="ghost" class="w-full" on:click={() => alert('Скоро здесь появится связь с подрядчиком!')}>
            Связаться
          </Button>
        </Card>
      {/each}
    </div>
  {/if}
</section>
