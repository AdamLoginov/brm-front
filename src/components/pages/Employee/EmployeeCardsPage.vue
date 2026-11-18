<template>
  <!-- --------- новый код chat: список сотрудников и совместные фильтры -->
  <div class="container-fluid employee-list-page py-3">
    <header class="list-header">
      <div><div class="list-eyebrow">Персонал</div><h1>Сотрудники <span>{{ cards.length }}</span></h1><p>Карточки, специализации и места работы сотрудников.</p></div>
      <router-link :to="{ name: 'employee-card-create' }" class="btn btn-outline-primary btn-sm create-card-button"><i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Создать карточку</router-link>
    </header>

    <section class="filter-panel" aria-label="Фильтры сотрудников">
      <!-- --------- новый код chat: поиск слева, две строки компактных фильтров справа -->
      <div class="filter-search-panel">
        <div class="filter-title"><i class="bi bi-sliders2" aria-hidden="true"></i><span>Поиск и фильтры</span></div>
        <div class="search-field"><label for="employees-search" class="visually-hidden">Поиск по ФИО</label><i class="bi bi-search" aria-hidden="true"></i><input id="employees-search" v-model="filters.search" class="form-control" type="search" placeholder="Фамилия, имя, отчество"></div>
        <button class="btn reset-button" type="button" :disabled="!hasFilters" @click="resetFilters"><i class="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>Сбросить фильтры</button>
      </div>
      <div class="filters-grid">
        <div><label for="employees-status">Статус</label><select id="employees-status" v-model="filters.status" class="form-select form-select-sm" :class="{ 'filter-selected': filters.status !== '' }"><option value="">Все сотрудники</option><option value="false">Работает</option><option value="true">Уволен</option></select></div>
        <div><label for="employees-profession">Должность</label><select id="employees-profession" v-model="filters.profession" class="form-select form-select-sm" :class="{ 'filter-selected': filters.profession !== '' }"><option value="">Все должности</option><option value="__empty">Не указана</option><option v-for="item in professions" :key="item.value" :value="item.value">{{ item.label }}</option></select></div>
        <div><label for="employees-specialization">Специализация</label><select id="employees-specialization" v-model="filters.specialization" class="form-select form-select-sm" :class="{ 'filter-selected': filters.specialization !== '' }"><option value="">Все специализации</option><option value="__empty">Не указана</option><option v-for="item in specializations" :key="item.ID" :value="String(item.ID)">{{ item.name }}</option></select></div>
        <!-- новый код chat: фильтр по договору / месту работы -->
        <div><label for="employees-agreement">Место работы</label><select id="employees-agreement" v-model="filters.agreement" class="form-select form-select-sm" :class="{ 'filter-selected': filters.agreement !== '' }"><option value="">Все места работы</option><option value="__empty">Не закреплён</option><option v-for="item in workplaces" :key="item.id" :value="item.id">{{ item.name }}</option></select></div>
        <div><label for="employees-itr">Сотрудник ИТР</label><select id="employees-itr" v-model="filters.itr" class="form-select form-select-sm" :class="{ 'filter-selected': filters.itr !== '' }"><option value="">Все</option><option value="true">Да</option><option value="false">Нет</option></select></div>
        <div><label for="employees-official">Устроен официально</label><select id="employees-official" v-model="filters.official" class="form-select form-select-sm" :class="{ 'filter-selected': filters.official !== '' }"><option value="">Все</option><option value="true">Да</option><option value="false">Нет</option></select></div>
      </div>
      <!-- --------- конец нового кода chat -->
    </section>

    <div v-if="errorMessage" class="alert alert-danger mt-3 d-flex align-items-center justify-content-between gap-2" role="alert"><span>{{ errorMessage }}</span><button v-if="loadFailed" type="button" class="btn btn-outline-danger btn-sm" @click="getEmployeeCardHandler">Повторить</button></div>
    <!-- новый код chat: результат копирования номера без изменения ширины таблицы -->
    <div v-if="copyMessage" class="copy-feedback" :class="{ 'text-danger': copyFailed }" role="status" aria-live="polite">{{ copyMessage }}</div>
    <section class="employees-panel mt-3" aria-label="Список сотрудников" :aria-busy="loading">
      <div class="results-heading"><h2>Список сотрудников</h2><span aria-live="polite">Найдено <strong>{{ filteredCards.length }}</strong> из {{ cards.length }}</span></div>
      <div v-if="loading" class="empty-state" role="status"><span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Загрузка сотрудников…</div>
      <div v-else-if="loadFailed" class="empty-state">Не удалось загрузить список сотрудников.</div>
      <div v-else-if="!filteredCards.length" class="empty-state"><i class="bi bi-people" aria-hidden="true"></i><h3>{{ cards.length ? 'Сотрудники не найдены' : 'Список сотрудников пока пуст' }}</h3><p>{{ cards.length ? 'Измените условия поиска или сбросьте фильтры.' : 'Создайте первую карточку сотрудника.' }}</p><button v-if="hasFilters" class="btn btn-outline-primary btn-sm" type="button" @click="resetFilters">Сбросить фильтры</button></div>
      <div v-else class="employees-table-scroll">
        <table class="table employees-table mb-0">
          <thead><tr><th scope="col" class="number-cell">№</th><th scope="col">Сотрудник</th><th scope="col">Статус</th><th scope="col">Должность</th><th scope="col">Специализации</th><th scope="col">Место работы</th><th scope="col">Телефоны</th><th scope="col"><span class="visually-hidden">Действия</span></th></tr></thead>
          <tbody><tr v-for="(card, index) in filteredCards" :key="card.ID" :class="{ 'dismissed-row': card.status }">
            <td class="number-cell">{{ index + 1 }}</td>
            <td class="name-cell"><router-link :to="{ name: 'employee-card-detail', params: { id: card.ID } }" class="employee-name">{{ fullName(card) || 'Без имени' }}</router-link><div class="employee-tags"><span class="employment-note"><i :class="card.officially_employed ? 'bi bi-shield-check' : 'bi bi-dash-circle'" aria-hidden="true"></i>{{ card.officially_employed ? 'Устроен официально' : 'Не устроен официально' }}</span></div></td>
            <td><span class="status-badge" :class="card.status ? 'status-dismissed' : 'status-working'">{{ card.status ? 'Уволен' : 'Работает' }}</span></td>
            <!-- новый код chat: отдельная колонка специализаций -->
            <td class="profession-cell">{{ card.profession || 'Не указана' }}</td>
            <td class="specializations-cell"><div v-if="card.specializations?.length" class="specialization-tags"><span v-for="item in card.specializations" :key="item.ID" class="small-tag">{{ item.name }}</span></div><span v-else class="text-secondary" aria-label="Специализации не указаны">—</span></td>
            <td class="agreement-cell"><router-link v-if="card.agreement_id" :to="{ name: 'agreement', params: { id: card.agreement_id } }">{{ card.agreement?.short_name || card.agreement?.name || 'Договор № ' + card.agreement_id }}</router-link><span v-else class="text-secondary">Не закреплён</span></td>
            <td class="phone-cell"><button v-for="phone in employeePhones(card)" :key="phone" type="button" class="phone-copy" :title="'Скопировать номер ' + phone" :aria-label="'Скопировать номер ' + phone" @click="copyPhone(phone)">{{ phone }}<i class="bi bi-copy" aria-hidden="true"></i></button><span v-if="!employeePhones(card).length" class="text-secondary">—</span></td>
            <td class="actions-cell"><button type="button" class="delete-button" :disabled="deletingIds.has(card.ID)" :aria-label="'Удалить карточку: ' + fullName(card)" title="Удалить карточку" @click="deleteEmployeeCardHandler(card)"><span v-if="deletingIds.has(card.ID)" class="spinner-border spinner-border-sm" aria-hidden="true"></span><i v-else class="bi bi-trash3" aria-hidden="true"></i></button></td>
          </tr></tbody>
        </table>
      </div>
    </section>
  </div>
  <!-- --------- конец нового кода chat -->
</template>

<script setup>
// --------- новый код chat: фильтрация данных существующего API
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue';
import api from '../../../api';

// --------- новый код chat: копирование телефона, в том числе на локальном HTTP
const copyMessage = ref('');
const copyFailed = ref(false);
let copyTimer;
const copyPhone = async phone => {
  clearTimeout(copyTimer);
  copyFailed.value = false;
  try {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(phone);
    } else {
      const previousFocus = document.activeElement;
      const field = document.createElement('textarea');
      field.value = phone;
      field.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
      document.body.appendChild(field);
      try {
        field.focus();
        field.select();
        if (!document.execCommand('copy')) throw new Error('Copy failed');
      } finally {
        field.remove();
        previousFocus?.focus();
      }
    }
    copyMessage.value = `Номер ${phone} скопирован`;
  } catch {
    copyFailed.value = true;
    copyMessage.value = 'Не удалось скопировать номер. Проверьте разрешения браузера.';
  }
  copyTimer = setTimeout(() => { copyMessage.value = ''; }, 3000);
};
onBeforeUnmount(() => clearTimeout(copyTimer));
// --------- конец нового кода chat
const cards = ref([]);
const loading = ref(true);
const loadFailed = ref(false);
const errorMessage = ref('');
const deletingIds = reactive(new Set());
const emptyFilters = () => ({ search: '', status: 'false', profession: '', specialization: '', agreement: '', itr: '', official: '' });
const filters = reactive(emptyFilters());
const normalize = value => String(value ?? '').trim().toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/\s+/g, ' ');
const fullName = card => [card.surname, card.name, card.middle_name].filter(Boolean).join(' ');
const employeePhones = card => [...new Set((card.phones?.length ? card.phones : [card.phone]).filter(Boolean).map(String))];
const hasFilters = computed(() => Object.entries(filters).some(([key, value]) => value !== emptyFilters()[key]));
const resetFilters = () => Object.assign(filters, emptyFilters());
const professions = computed(() => {
  const values = new Map();
  cards.value.forEach(card => { const value = normalize(card.profession); if (value && !values.has(value)) values.set(value, { value, label: card.profession.trim() }); });
  return [...values.values()].sort((a, b) => a.label.localeCompare(b.label, 'ru'));
});
const specializations = computed(() => {
  const values = new Map();
  cards.value.forEach(card => (card.specializations || []).forEach(item => values.set(item.ID, item)));
  return [...values.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
});
// --------- новый код chat: список мест работы и фильтрация по ID договора
const workplaces = computed(() => {
  const values = new Map();
  cards.value.forEach(card => {
    if (card.agreement_id) values.set(String(card.agreement_id), {
      id: String(card.agreement_id),
      name: card.agreement?.short_name || card.agreement?.name || 'Договор № ' + card.agreement_id,
    });
  });
  return [...values.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
});
// --------- конец нового кода chat
const matchesBoolean = (value, filter) => filter === '' || Boolean(value) === (filter === 'true');
const filteredCards = computed(() => {
  const words = normalize(filters.search).split(' ').filter(Boolean);
  return cards.value.filter(card => {
    if (!words.every(word => normalize(fullName(card)).includes(word))) return false;
    if (!matchesBoolean(card.status, filters.status) || !matchesBoolean(card.is_itr, filters.itr) || !matchesBoolean(card.officially_employed, filters.official)) return false;
    if (filters.profession === '__empty' ? normalize(card.profession) !== '' : filters.profession && normalize(card.profession) !== filters.profession) return false;
    // новый код chat: место работы учитывается совместно с остальными фильтрами
    if (filters.agreement === '__empty' ? Boolean(card.agreement_id) : filters.agreement && String(card.agreement_id) !== filters.agreement) return false;
    const specs = card.specializations || [];
    if (filters.specialization === '__empty' ? specs.length > 0 : filters.specialization && !specs.some(item => String(item.ID) === filters.specialization)) return false;
    return true;
  });
});
const deleteEmployeeCardHandler = async card => {
  if (deletingIds.has(card.ID) || !window.confirm(`Удалить карточку сотрудника «${fullName(card) || 'Без имени'}»?`)) return;
  deletingIds.add(card.ID);
  errorMessage.value = '';
  try {
    await api.delete(`/employeescard/delete/${card.ID}`);
    cards.value = cards.value.filter(item => item.ID !== card.ID);
  } catch {
    errorMessage.value = 'Не удалось удалить карточку сотрудника. Попробуйте ещё раз.';
  } finally { deletingIds.delete(card.ID); }
};
const getEmployeeCardHandler = async () => {
  loading.value = true;
  loadFailed.value = false;
  errorMessage.value = '';
  try {
    const { data } = await api.get('/employeecards');
    cards.value = (Array.isArray(data) ? data : []).sort((a, b) => fullName(a).localeCompare(fullName(b), 'ru'));
  } catch {
    loadFailed.value = true;
    errorMessage.value = 'Не удалось загрузить сотрудников. Проверьте подключение и повторите попытку.';
  } finally { loading.value = false; }
};
onMounted(getEmployeeCardHandler);
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: компактная страница в стиле карточек сотрудников */
.employee-list-page { color: #263445; font-size: 14px; }
.list-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.list-eyebrow { color: #778496; font-size: 12px; margin-bottom: 4px; }
.list-header h1 { font-size: 24px; font-weight: 650; margin: 0; display: flex; align-items: center; gap: 10px; }
.list-header h1 span { background: #edf3fc; color: #3569ad; border-radius: 8px; font-size: 14px; padding: 4px 9px; }
.list-header p { color: #778496; margin: 7px 0 0; font-size: 14px; }
.employee-list-page .btn { font-size: 14px; border-radius: 8px; }
/* новый код chat: компактная кнопка создания */
.list-header .create-card-button { padding: 5px 10px; font-size: 13px; border-radius: 7px; white-space: nowrap; }
.filter-panel, .employees-panel { background: #fff; border: 1px solid #e2e7ef; border-radius: 12px; box-shadow: 0 2px 6px #24344d04; }
/* --------- новый код chat: поиск занимает свободную ширину, селекты выровнены справа */
.filter-panel { display: grid; grid-template-columns: minmax(250px, 1fr) minmax(0, 780px); padding: 16px; gap: 20px; align-items: stretch; }
.filter-search-panel { display: flex; flex-direction: column; justify-content: space-between; gap: 10px; padding-right: 20px; border-right: 1px solid #e9edf3; }
.filter-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #354358; }
.filter-title > i { color: #5375a3; font-size: 14px; }
.filters-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 16px; width: 100%; align-items: end; }
.filters-grid > div { min-width: 0; }
.filters-grid label { display: block; margin-bottom: 5px; font-size: 12px; font-weight: 500; line-height: 1.4; color: #65738a; }
.filters-grid select { height: 32px; font-size: 12px; border-radius: 7px; padding-top: 4px; padding-bottom: 4px; border-color: #e5eaf1; background-color: #f8fafc; color: #354358; cursor: pointer; transition: border-color .15s, background-color .15s; }
.filters-grid select:hover { border-color: #bdcbe0; background-color: #fff; }
.filters-grid select.filter-selected { background-color: #f1f6ff; border-color: #cdddf4; color: #315e9c; }
.filters-grid select:focus, .search-field input:focus { border-color: #8bb5f2; box-shadow: 0 0 0 3px #0d6efd12; }
.search-field { position: relative; }
.search-field > i { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 12px; color: #8793a3; pointer-events: none; }
.search-field input { height: 32px; padding: 4px 28px; font-size: 12px; border-radius: 7px; border-color: #dfe5ed; background-color: #fff; }
.search-field input::placeholder { color: #8994a3; }
.employee-list-page .reset-button { align-self: flex-start; padding: 0; font-size: 12px; border: 0; color: #5375a3; border-radius: 4px; line-height: 1.5; }
.employee-list-page .reset-button:hover:not(:disabled) { color: #0d6efd; }
.employee-list-page .reset-button:disabled { color: #98a2b0; opacity: .7; }
@media (max-width: 1050px) { .filter-panel { grid-template-columns: 210px minmax(0, 1fr); gap: 14px; } .filter-search-panel { padding-right: 14px; } .filters-grid { gap: 10px; } }
@media (max-width: 767px) { .filter-panel { grid-template-columns: 1fr; } .filter-search-panel { padding: 0 0 12px; border-right: 0; border-bottom: 1px solid #e9edf3; } .filter-search-panel .search-field { max-width: 340px; width: 100%; } }
/* --------- конец нового кода chat */
.results-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 15px 18px; }
.results-heading h2 { font-size: 16px; font-weight: 600; margin: 0; }
.results-heading > span { color: #7b8795; font-size: 13px; }
.results-heading strong { color: #263445; }
.employees-table-scroll { overflow-x: auto; border-radius: 0 0 12px 12px; }
.employees-table { font-size: 14px; vertical-align: middle; min-width: 1100px; }
.employees-table th { background: #f8fafc; color: #778496; font-size: 13px; font-weight: 600; border-top: 1px solid #e9edf3; padding: 11px 12px; white-space: nowrap; }
.employees-table td { padding: 12px; color: #354358; border-color: #edf0f5; }
.employees-table tbody tr:last-child td { border-bottom: 0; }
.employees-table tbody tr:hover td { background: #f8fbff; }
.employees-table .number-cell { width: 44px; text-align: center; color: #8b95a4; padding-left: 10px; padding-right: 10px; }
.name-cell { min-width: 230px; }
/* новый код chat: чёрный цвет ФИО сотрудников */
.employee-name { color: #000; font-weight: 600; text-decoration: none; }
.employee-name:hover { color: #0d6efd; text-decoration: underline; }
.employee-tags, .specialization-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; align-items: center; }
.small-tag { display: inline-block; font-size: 12px; border-radius: 5px; background: #f1f4f8; color: #637085; padding: 2px 6px; }
.employment-note { color: #8490a0; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; }
.status-badge { display: inline-flex; align-items: center; gap: 6px; border: 1px solid; border-radius: 999px; padding: 2px 8px; font-size: 11px; line-height: 1.5; white-space: nowrap; background: white; }

.status-working { color: #218259; border-color: #b9dfcc; }
.status-dismissed { color: #c65a64; border-color: #edc8ce; }
/* новый код chat: читаемые самостоятельные колонки */
.profession-cell { min-width: 140px; max-width: 220px; }
.specializations-cell { min-width: 160px; max-width: 260px; }
.specializations-cell .specialization-tags { margin-top: 0; }
.specializations-cell .small-tag { font-size: 11px; line-height: 1.5; border-radius: 999px; padding: 2px 8px; }
.agreement-cell { min-width: 160px; max-width: 260px; overflow-wrap: anywhere; }
.agreement-cell a { color: #263445; text-decoration: none; }
.agreement-cell a:hover { color: #0d6efd; text-decoration: underline; }
.phone-cell { white-space: nowrap; }
/* --------- новый код chat: телефоны-кнопки и уведомление о копировании */
.phone-copy { display: flex; align-items: center; gap: 7px; border: 0; background: transparent; padding: 2px 0; font: inherit; color: #263445; line-height: 1.6; text-align: left; }
.phone-copy i { font-size: 11px; color: #8994a3; }
.phone-copy:hover, .phone-copy:focus-visible { color: #0d6efd; }
.copy-feedback { position: fixed; right: 20px; bottom: 20px; z-index: 1090; padding: 12px 16px; max-width: calc(100vw - 40px); border: 1px solid #dfe5ed; border-radius: 10px; background: #fff; color: #218259; box-shadow: 0 4px 20px #26344518; font-size: 13px; }
/* --------- конец нового кода chat */
.actions-cell { width: 40px; }
.delete-button { border: 0; background: transparent; color: #97a1af; border-radius: 6px; padding: 6px 8px; }
.delete-button:hover, .delete-button:focus-visible { background: #fff0f1; color: #c84f5c; }
.delete-button:disabled { opacity: .5; }
.dismissed-row .employee-name { color: #000; }
.empty-state { text-align: center; padding: 44px 20px; color: #7b8795; border-top: 1px solid #edf0f5; }
.empty-state > i { display: block; font-size: 28px; color: #a6b6cc; margin-bottom: 10px; }
.empty-state h3 { font-size: 16px; color: #354358; }
.empty-state p { font-size: 14px; }
@media (max-width: 767px) { .list-header { align-items: flex-start; flex-direction: column; } .filters-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 420px) { .filters-grid { grid-template-columns: 1fr; } .results-heading { align-items: flex-start; flex-direction: column; } }
/* --------- конец нового кода chat */
</style>
