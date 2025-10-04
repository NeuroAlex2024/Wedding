<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import Button from '$ui/button.svelte';
  import Card from '$ui/card.svelte';
  import Input from '$ui/input.svelte';
  import Label from '$ui/label.svelte';
  import pb from '$lib/pocketbase';
  import { currentUser } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { formatCurrency } from '$lib/utils/format';
  import { get } from 'svelte/store';

  type TaskRecord = {
    id: string;
    title: string;
    done: boolean;
  };

  type BudgetRecord = {
    id: string;
    title: string;
    amount: number;
    paid: boolean;
  };

  let tasks: TaskRecord[] = [];
  let budget: BudgetRecord[] = [];
  let loadingTasks = false;
  let loadingBudget = false;
  let newTaskTitle = '';
  let newBudgetTitle = '';
  let newBudgetAmount: number | '' = '';
  let newBudgetPaid = false;
  let taskError = '';
  let budgetError = '';
  let userId: string | null = null;
  let user = get(currentUser);

  const fetchTasks = async (ownerId: string) => {
    loadingTasks = true;
    taskError = '';
    try {
      const records = await pb.collection('tasks').getFullList<TaskRecord>({
        filter: `owner = "${ownerId}"`,
        sort: '-created'
      });
      tasks = records.map((record) => ({
        id: record.id,
        title: record.title,
        done: record.done
      }));
    } catch (error) {
      console.error(error);
      taskError = 'Не удалось загрузить задачи';
    } finally {
      loadingTasks = false;
    }
  };

  const fetchBudget = async (ownerId: string) => {
    loadingBudget = true;
    budgetError = '';
    try {
      const records = await pb.collection('budget_items').getFullList<BudgetRecord>({
        filter: `owner = "${ownerId}"`,
        sort: '-created'
      });
      budget = records.map((record) => ({
        id: record.id,
        title: record.title,
        amount: Number(record.amount) || 0,
        paid: record.paid
      }));
    } catch (error) {
      console.error(error);
      budgetError = 'Не удалось загрузить бюджет';
    } finally {
      loadingBudget = false;
    }
  };

  const ensureAuth = () => {
    if (!user) {
      goto('/auth');
      return false;
    }
    return user;
  };

  onMount(() => {
    const user = pb.authStore.model;
    if (!user) {
      goto('/auth');
      return;
    }
    userId = user.id;
    fetchTasks(user.id);
    fetchBudget(user.id);
  });

  const unsubscribe = currentUser.subscribe((value) => {
    user = value;
    if (value?.id && value.id !== userId) {
      userId = value.id;
      fetchTasks(userId);
      fetchBudget(userId);
    }
    if (!value && userId) {
      userId = null;
      tasks = [];
      budget = [];
    }
  });

  onDestroy(() => unsubscribe());

  const addTask = async () => {
    const user = ensureAuth();
    if (!user) return;
    if (!newTaskTitle.trim()) return;
    try {
      const record = await pb.collection('tasks').create({
        title: newTaskTitle,
        done: false,
        owner: user.id
      });
      tasks = [
        { id: record.id, title: record.title, done: record.done },
        ...tasks
      ];
      newTaskTitle = '';
    } catch (error) {
      console.error(error);
      taskError = 'Не удалось добавить задачу';
    }
  };

  const toggleTask = async (task: TaskRecord) => {
    const user = ensureAuth();
    if (!user) return;
    try {
      await pb.collection('tasks').update(task.id, { done: !task.done });
      tasks = tasks.map((item) => (item.id === task.id ? { ...item, done: !item.done } : item));
    } catch (error) {
      console.error(error);
      taskError = 'Не удалось обновить задачу';
    }
  };

  const deleteTask = async (task: TaskRecord) => {
    const user = ensureAuth();
    if (!user) return;
    try {
      await pb.collection('tasks').delete(task.id);
      tasks = tasks.filter((item) => item.id !== task.id);
    } catch (error) {
      console.error(error);
      taskError = 'Не удалось удалить задачу';
    }
  };

  const addBudgetItem = async () => {
    const user = ensureAuth();
    if (!user) return;
    if (!newBudgetTitle.trim()) return;
    const amountNumber = Number(newBudgetAmount) || 0;
    try {
      const record = await pb.collection('budget_items').create({
        title: newBudgetTitle,
        amount: amountNumber,
        paid: newBudgetPaid,
        owner: user.id
      });
      budget = [
        { id: record.id, title: record.title, amount: Number(record.amount) || 0, paid: record.paid },
        ...budget
      ];
      newBudgetTitle = '';
      newBudgetAmount = '';
      newBudgetPaid = false;
    } catch (error) {
      console.error(error);
      budgetError = 'Не удалось добавить статью бюджета';
    }
  };

  const toggleBudgetPaid = async (item: BudgetRecord) => {
    const user = ensureAuth();
    if (!user) return;
    try {
      await pb.collection('budget_items').update(item.id, { paid: !item.paid });
      budget = budget.map((entry) => (entry.id === item.id ? { ...entry, paid: !entry.paid } : entry));
    } catch (error) {
      console.error(error);
      budgetError = 'Не удалось обновить статус оплаты';
    }
  };

  const deleteBudgetItem = async (item: BudgetRecord) => {
    const user = ensureAuth();
    if (!user) return;
    try {
      await pb.collection('budget_items').delete(item.id);
      budget = budget.filter((entry) => entry.id !== item.id);
    } catch (error) {
      console.error(error);
      budgetError = 'Не удалось удалить статью бюджета';
    }
  };

  $: plannedTotal = budget.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  $: paidTotal = budget.filter((item) => item.paid).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
</script>

{#if !user}
  <div class="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white/80 p-10 text-center shadow">
    <h2 class="font-display text-2xl font-semibold text-slate-900">Войдите, чтобы увидеть панель</h2>
    <p class="mt-2 text-sm text-slate-500">
      Авторизация необходима для доступа к вашим задачам, бюджету и приглашениям.
    </p>
    <Button class="mt-6" size="lg" on:click={() => goto('/auth')}>
      Перейти к авторизации
    </Button>
  </div>
{:else}
  <div class="space-y-10">
    <div class="grid gap-6 md:grid-cols-2">
      <Card class="space-y-4">
        <div>
          <h2 class="font-display text-2xl text-slate-900">Чек-лист подготовки</h2>
          <p class="text-sm text-slate-500">Добавляйте задачи и отмечайте выполненные шаги.</p>
        </div>
        <form class="flex flex-col gap-3 sm:flex-row" on:submit|preventDefault={addTask}>
          <Input class="flex-1" placeholder="Добавить задачу" bind:value={newTaskTitle} />
          <Button type="submit">Добавить</Button>
        </form>
        {#if taskError}
          <p class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{taskError}</p>
        {/if}
        {#if loadingTasks}
          <p class="text-sm text-slate-500">Загрузка задач…</p>
        {:else if tasks.length === 0}
          <p class="text-sm text-slate-500">Список пуст. Добавьте первую задачу!</p>
        {:else}
          <ul class="space-y-3">
            {#each tasks as task (task.id)}
              <li class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm shadow-sm">
                <label class="flex items-center gap-3">
                  <input type="checkbox" checked={task.done} on:change={() => toggleTask(task)} class="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400" />
                  <span class:line-through={task.done} class="text-slate-700">{task.title}</span>
                </label>
                <button
                  type="button"
                  class="text-xs font-medium text-slate-400 hover:text-rose-500"
                  on:click={() => deleteTask(task)}
                >
                  Удалить
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </Card>

      <Card class="space-y-4">
        <div>
          <h2 class="font-display text-2xl text-slate-900">Бюджет свадьбы</h2>
          <p class="text-sm text-slate-500">Планируйте расходы и отмечайте оплаченные позиции.</p>
        </div>
        <form class="grid gap-3 md:grid-cols-[1fr_auto]" on:submit|preventDefault={addBudgetItem}>
          <div class="space-y-2">
            <Label>Статья</Label>
            <Input placeholder="Например, банкет" bind:value={newBudgetTitle} required />
          </div>
          <div class="space-y-2">
            <Label>Сумма, ₽</Label>
            <Input type="number" min="0" step="1000" bind:value={newBudgetAmount} required />
          </div>
          <label class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-sm md:col-span-2">
            <input type="checkbox" bind:checked={newBudgetPaid} class="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400" />
            Отмечать как оплачено
          </label>
          <Button type="submit" class="md:col-span-2">Добавить</Button>
        </form>
        {#if budgetError}
          <p class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{budgetError}</p>
        {/if}
        {#if loadingBudget}
          <p class="text-sm text-slate-500">Загрузка бюджета…</p>
        {:else if budget.length === 0}
          <p class="text-sm text-slate-500">Ещё нет добавленных статей. Начните с бюджета свадьбы.</p>
        {:else}
          <div class="space-y-4">
            <div class="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm shadow-sm">
              <div class="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p class="text-xs uppercase tracking-wide text-slate-400">Планируемый бюджет</p>
                  <p class="text-lg font-semibold text-slate-900">{formatCurrency(plannedTotal)}</p>
                </div>
                <div>
                  <p class="text-xs uppercase tracking-wide text-slate-400">Оплачено</p>
                  <p class="text-lg font-semibold text-emerald-600">{formatCurrency(paidTotal)}</p>
                </div>
                <div>
                  <p class="text-xs uppercase tracking-wide text-slate-400">Осталось</p>
                  <p class="text-lg font-semibold text-brand-600">{formatCurrency(plannedTotal - paidTotal)}</p>
                </div>
              </div>
            </div>
            <ul class="space-y-3">
              {#each budget as item (item.id)}
                <li class="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div class="flex items-center gap-3">
                    <input type="checkbox" checked={item.paid} on:change={() => toggleBudgetPaid(item)} class="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400" />
                    <div>
                      <p class={`font-medium ${item.paid ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{item.title}</p>
                      <p class="text-xs text-slate-400">{formatCurrency(Number(item.amount) || 0)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="text-xs font-medium text-slate-400 hover:text-rose-500"
                    on:click={() => deleteBudgetItem(item)}
                  >
                    Удалить
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </Card>
    </div>

    <Card class="grid gap-6 md:grid-cols-2">
      <div class="space-y-3">
        <h2 class="font-display text-2xl text-slate-900">Следующий шаг — приглашение</h2>
        <p class="text-sm text-slate-500">
          Создайте красивую страницу-приглашение, добавьте дату, место и ссылку для гостей. Вы сможете обновлять информацию в реальном времени.
        </p>
        <Button size="lg" on:click={() => goto('/invites/new')}>
          Создать приглашение
        </Button>
      </div>
      <div class="rounded-3xl border border-dashed border-brand-200 bg-brand-50/60 p-6 text-sm text-brand-700">
        <p class="font-semibold">Подсказка</p>
        <p class="mt-2">После публикации приглашение будет доступно по красивому адресу вида <span class="font-mono">weddingflow.ru/имя</span>.</p>
      </div>
    </Card>
  </div>
{/if}
