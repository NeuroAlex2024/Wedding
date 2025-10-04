<script lang="ts">
  import Button from '$ui/button.svelte';
  import Input from '$ui/input.svelte';
  import Label from '$ui/label.svelte';
  import pb from '$lib/pocketbase';
  import { currentUser } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let mode: 'login' | 'register' = 'login';
  let email = '';
  let password = '';
  let passwordConfirm = '';
  let loading = false;
  let error = '';

  const toggleMode = () => {
    mode = mode === 'login' ? 'register' : 'login';
    error = '';
  };

  const redirectIfAuth = () => {
    if ($currentUser) {
      goto('/dashboard');
    }
  };

  onMount(() => {
    redirectIfAuth();
  });

  $: $currentUser, redirectIfAuth();

  const handleSubmit = async () => {
    loading = true;
    error = '';
    try {
      if (!email || !password) {
        throw new Error('Введите e-mail и пароль');
      }

      if (mode === 'register') {
        if (password !== passwordConfirm) {
          throw new Error('Пароли не совпадают');
        }
        await pb.collection('users').create({ email, password, passwordConfirm });
      }

      await pb.collection('users').authWithPassword(email, password);
      goto('/dashboard');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Не удалось выполнить операцию';
      console.error(err);
    } finally {
      loading = false;
    }
  };
</script>

<div class="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white/80 p-10 shadow-lg">
  <div class="space-y-2 text-center">
    <h1 class="font-display text-3xl font-semibold text-slate-900">
      {mode === 'login' ? 'Вход в WeddingFlow' : 'Регистрация в WeddingFlow'}
    </h1>
    <p class="text-sm text-slate-500">
      {mode === 'login'
        ? 'Продолжите планирование свадьбы с вашего аккаунта.'
        : 'Создайте аккаунт и получите доступ к инструментам планирования.'}
    </p>
  </div>

  <form
    class="mt-8 space-y-5"
    on:submit|preventDefault={handleSubmit}
  >
    <div class="space-y-2 text-left">
      <Label>E-mail</Label>
      <Input type="email" bind:value={email} placeholder="name@example.com" autocomplete="email" required />
    </div>
    <div class="space-y-2 text-left">
      <Label>Пароль</Label>
      <Input type="password" bind:value={password} placeholder="••••••••" autocomplete={mode === 'login' ? 'current-password' : 'new-password'} required />
    </div>
    {#if mode === 'register'}
      <div class="space-y-2 text-left">
        <Label>Повторите пароль</Label>
        <Input
          type="password"
          bind:value={passwordConfirm}
          placeholder="••••••••"
          autocomplete="new-password"
          required
        />
      </div>
    {/if}

    {#if error}
      <p class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
    {/if}

    <Button type="submit" size="lg" class="w-full" loading={loading}>
      {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
    </Button>
  </form>

  <p class="mt-6 text-center text-sm text-slate-500">
    {mode === 'login' ? 'Нет аккаунта?' : 'Уже с нами?'}
    <button type="button" class="ml-1 font-medium text-brand-600 hover:text-brand-700" on:click={toggleMode}>
      {mode === 'login' ? 'Зарегистрируйтесь' : 'Войдите'}
    </button>
  </p>
</div>
