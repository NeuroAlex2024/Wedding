<script lang="ts">
  import Button from '$ui/button.svelte';
</script>

<section class="grid gap-12 lg:grid-cols-2 lg:items-center">
  <div class="space-y-6">
    <p class="inline-flex items-center rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-brand-600 shadow">Всё для вашей свадьбы</p>
    <h1 class="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
      WeddingFlow — ваш русскоязычный помощник в подготовке к идеальной свадьбе
    </h1>
    <p class="max-w-xl text-lg text-slate-600">
      Управляйте списком задач, бюджетом, приглашениями и подрядчиками в одном месте. Создайте сайт-приглашение для гостей за пару минут и наслаждайтесь организацией без стресса.
    </p>
    <div class="flex flex-wrap gap-4">
      <Button size="lg" on:click={() => (window.location.href = '/auth')}>
        Создать приглашение
      </Button>
      <Button variant="ghost" size="lg" on:click={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
        Узнать подробнее
      </Button>
    </div>
    <div class="flex items-center gap-6 pt-4 text-sm text-slate-500">
      <div class="flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
        Онлайн и бесплатно
      </div>
      <div class="flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-brand-400"></span>
        Поддержка 24/7
      </div>
    </div>
  </div>
  <div class="relative hidden lg:block">
    <div class="absolute -right-10 top-10 h-32 w-32 rounded-full bg-brand-200/60 blur-3xl"></div>
    <div class="relative overflow-hidden rounded-[2.5rem] border border-slate-100 shadow-xl">
      <img src="https://images.unsplash.com/photo-1520854221050-0f4caff449fb?auto=format&fit=crop&w=900&q=80" alt="Счастливая пара" class="h-full w-full object-cover" />
    </div>
  </div>
</section>

<section id="features" class="mt-24 grid gap-10 md:grid-cols-2">
  <div class="space-y-4">
    <h2 class="font-display text-3xl font-semibold text-slate-900">Сделано, чтобы заботиться о важных моментах</h2>
    <p class="text-base text-slate-600">
      WeddingFlow объединяет ключевые инструменты, которые помогают парам оставаться организованными: от списка дел и бюджета до красивых приглашений и поиска идеальных подрядчиков.
    </p>
  </div>
  <div class="grid gap-6">
    <div class="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-slate-900">Чек-лист подготовки</h3>
      <p class="mt-2 text-sm text-slate-600">Отмечайте прогресс по задачам, делитесь планом с партнёром и не упускайте ни одной детали.</p>
    </div>
    <div class="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-slate-900">Умный бюджет</h3>
      <p class="mt-2 text-sm text-slate-600">Контролируйте расходы, отслеживайте оплаты и планируйте в рамках бюджета.</p>
    </div>
    <div class="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-slate-900">Публичные приглашения</h3>
      <p class="mt-2 text-sm text-slate-600">Создавайте стильные страницы-приглашения с красивыми ссылками и делитесь ими с гостями.</p>
    </div>
  </div>
</section>

<section class="mt-24 rounded-[3rem] bg-gradient-to-r from-brand-500 to-rose-500 px-8 py-12 text-white shadow-xl">
  <div class="mx-auto max-w-3xl text-center">
    <h2 class="font-display text-3xl font-semibold">Готовы начать?</h2>
    <p class="mt-4 text-base text-white/80">
      Зарегистрируйтесь прямо сейчас и получите доступ к панели управления, чек-листу, бюджету и инструментам приглашений.
    </p>
    <div class="mt-6 flex flex-wrap justify-center gap-4">
      <Button variant="secondary" size="lg" on:click={() => (window.location.href = '/auth')}>
        Присоединиться бесплатно
      </Button>
      <Button variant="ghost" size="lg" on:click={() => (window.location.href = '/vendors')}>
        Посмотреть подрядчиков
      </Button>
    </div>
  </div>
</section>
