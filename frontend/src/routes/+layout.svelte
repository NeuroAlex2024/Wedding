<script lang="ts">
  import '../app.css';
  import Button from '$ui/button.svelte';
  import { currentUser, authReady, logout } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  const links = [
    { href: '/dashboard', label: 'Панель' },
    { href: '/invites/new', label: 'Приглашения' },
    { href: '/vendors', label: 'Подрядчики' }
  ];

  const handleLogout = () => {
    logout();
    goto('/');
  };
</script>

<svelte:head>
  <title>WeddingFlow — подготовка к свадьбе</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-rose-50 via-white to-white">
  <header class="border-b border-slate-200/70 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
      <a href="/" class="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white font-display text-xl">WF</span>
        WeddingFlow
      </a>
      {#if $authReady}
        <nav class="hidden items-center gap-4 md:flex">
          {#each links as link}
            <a
              href={link.href}
              class="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              {link.label}
            </a>
          {/each}
        </nav>
        <div class="flex items-center gap-3">
          {#if $currentUser}
            <span class="hidden text-sm text-slate-500 md:inline">{$currentUser.email}</span>
            <Button variant="ghost" size="sm" on:click={handleLogout}>
              Выйти
            </Button>
          {:else}
            <Button variant="ghost" size="sm" on:click={() => goto('/auth')}>
              Войти
            </Button>
            <Button size="sm" on:click={() => goto('/auth')}>
              Регистрация
            </Button>
          {/if}
        </div>
      {/if}
    </div>
  </header>

  <main class="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-10">
    <slot />
  </main>

  <footer class="border-t border-slate-200/70 py-10">
    <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-center text-sm text-slate-500 md:flex-row md:text-left">
      <p>© {new Date().getFullYear()} WeddingFlow. Любовь в деталях.</p>
      <div class="flex gap-4">
        <a href="/vendors" class="hover:text-slate-700">Каталог подрядчиков</a>
        <a href="/invites/new" class="hover:text-slate-700">Создать приглашение</a>
      </div>
    </div>
  </footer>
</div>
