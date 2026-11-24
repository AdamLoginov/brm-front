<template>
  <!-- --------- новый код chat: список сотрудников и совместные фильтры -->
  <div class="container-fluid employee-list-page py-3">
    <header class="list-header">
      <div><div class="list-eyebrow">Персонал</div><h1>Сотрудники <span>{{ cards.length }}</span></h1><p>Карточки, специализации и места работы сотрудников.</p></div>
      <!-- новый код chat: переход к сводной проверке данных сотрудников -->
      <div class="d-flex flex-wrap gap-2">
        <router-link :to="{ name: 'employee-completeness' }" class="btn btn-outline-secondary btn-sm create-card-button"><i class="bi bi-list-check me-1" aria-hidden="true"></i>Заполненность данных</router-link>
        <router-link :to="{ name: 'employee-card-create' }" class="btn btn-outline-primary btn-sm create-card-button"><i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Создать карточку</router-link>
      </div>
    </header>

    <section class="filter-panel" aria-label="Фильтры сотрудников">
      <!-- --------- новый код chat: поиск слева, две строки компактных фильтров справа -->
      <div class="filter-search-panel">
        <div class="filter-title"><i class="bi bi-sliders2" aria-hidden="true"></i><span>Поиск и фильтры</span></div>
        <div class="search-field"><label for="employees-search" class="visually-hidden">Поиск по ФИО</label><i class="bi bi-search" aria-hidden="true"></i><input id="employees-search" v-model="filters.search" class="form-control" type="search" placeholder="Фамилия, имя, отчество"></div>
        <button class="btn reset-button" type="button" :disabled="!hasFilters" @click="resetFilters"><i class="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>Сбросить фильтры</button>
      </div>
      <!-- новый код chat: на телефоне дополнительные фильтры раскрываются кнопкой -->
      <button type="button" class="mobile-filters-toggle btn btn-outline-primary" :aria-expanded="mobileFiltersOpen" aria-controls="employee-filters" @click="mobileFiltersOpen = !mobileFiltersOpen"><i class="bi bi-sliders2" aria-hidden="true"></i> Фильтры <span v-if="activeFilterCount">({{ activeFilterCount }})</span><i :class="mobileFiltersOpen ? 'bi bi-chevron-up' : 'bi bi-chevron-down'" aria-hidden="true"></i></button>
      <div id="employee-filters" class="filters-grid" :class="{ 'mobile-filters-open': mobileFiltersOpen }">
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
            <td class="name-cell"><router-link :to="{ name: 'employee-card-detail', params: { id: card.ID } }" class="employee-name">{{ fullName(card) || 'Без имени' }}</router-link><div v-if="card.officially_employed" class="employee-tags"><span class="employment-note"><i class="bi bi-shield-check" aria-hidden="true"></i>Устроен официально</span></div></td> <!-- новый код chat: отметка только для официально трудоустроенных -->
            <!-- новый код chat: статус располагается рядом с должностью на телефоне -->
            <td class="employee-status-cell"><span class="status-badge" :class="card.status ? 'status-dismissed' : 'status-working'">{{ card.status ? 'Уволен' : 'Работает' }}</span></td>
            <!-- новый код chat: отдельная колонка специализаций -->
            <!-- новый код chat: подписи полей для мобильных карточек -->
            <td class="profession-cell" data-label="Должность"><span v-if="card.profession?.trim()">{{ card.profession }}</span><span v-else class="text-secondary" aria-label="Должность не указана">—</span></td> <!-- новый код chat: прочерк как в специализации -->
            <td class="specializations-cell" data-label="Специализации"><div v-if="card.specializations?.length" class="specialization-tags"><span v-for="item in card.specializations" :key="item.ID" class="small-tag">{{ item.name }}</span></div><span v-else class="text-secondary" aria-label="Специализации не указаны">—</span></td>
            <td class="agreement-cell" data-label="Место работы"><router-link v-if="card.agreement_id" :to="{ name: 'agreement', params: { id: card.agreement_id } }">{{ card.agreement?.short_name || card.agreement?.name || 'Договор № ' + card.agreement_id }}</router-link><span v-else class="text-secondary">Не закреплён</span></td>
            <td class="phone-cell" data-label="Телефоны · нажмите, чтобы скопировать"><button v-for="phone in employeePhones(card)" :key="phone" type="button" class="phone-copy" :title="'Скопировать номер ' + phone" :aria-label="'Скопировать номер ' + phone" @click="copyPhone(phone)">{{ phone }}<i class="bi bi-copy" aria-hidden="true"></i></button><span v-if="!employeePhones(card).length" class="text-secondary">—</span></td>
            <!-- новый код chat: удаление на телефоне находится в отдельном раскрываемом меню -->
            <td class="actions-cell"><button type="button" class="delete-button desktop-delete-button" :disabled="deletingIds.has(card.ID)" :aria-label="'Удалить карточку: ' + fullName(card)" title="Удалить карточку" @click="deleteEmployeeCardHandler(card)"><span v-if="deletingIds.has(card.ID)" class="spinner-border spinner-border-sm" aria-hidden="true"></span><i v-else class="bi bi-trash3" aria-hidden="true"></i></button>
              <!-- новый код chat: компактное меню в правом верхнем углу карточки -->
              <details class="mobile-card-actions" @keydown.esc="$event.currentTarget.open = false" @focusout="!$event.currentTarget.contains($event.relatedTarget) && ($event.currentTarget.open = false)"><summary :aria-label="'Действия с карточкой: ' + fullName(card)" title="Действия с карточкой"><i class="bi bi-three-dots" aria-hidden="true"></i></summary><button type="button" class="delete-button" :disabled="deletingIds.has(card.ID)" :aria-label="'Удалить карточку: ' + fullName(card)" @click="deleteEmployeeCardHandler(card)"><i class="bi bi-trash3 me-2" aria-hidden="true"></i>{{ deletingIds.has(card.ID) ? 'Удаление…' : 'Удалить карточку' }}</button></details>
            </td>
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
// новый код chat: состояние мобильных фильтров, счётчик условий без строки поиска
const mobileFiltersOpen = ref(false);
const activeFilterCount = computed(() => Object.entries(filters).filter(([key, value]) => key !== 'search' && value !== '').length);
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
/* новый код chat: только мобильное представление; настольные правила остаются прежними */
.mobile-filters-toggle { display: none; }
.mobile-card-actions { display: none; }
@media (max-width: 767px) {
  .employee-list-page { font-size: 16px; color: #000; }
  .list-header { gap: 12px; margin-bottom: 14px; }
  .list-header p, .list-eyebrow { color: #000; font-size: 14px; }
  .list-header .create-card-button { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; width: 100%; }
  .filter-panel { padding: 12px; gap: 10px; }
  .filter-search-panel { gap: 8px; padding: 0; border: 0; }
  .filter-title { font-size: 16px; color: #000; }
  .filter-search-panel .search-field { max-width: none; }
  .search-field input { height: 46px; font-size: 16px; color: #000; padding-left: 34px; }
  .search-field > i { font-size: 16px; color: #000; }
  .employee-list-page .reset-button { min-height: 44px; padding: 8px 0; font-size: 14px; color: #000; }
  .mobile-filters-toggle { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; font-size: 16px; color: #000; }
  .filters-grid { display: none; grid-template-columns: minmax(0, 1fr); gap: 14px; }
  .filters-grid.mobile-filters-open { display: grid; }
  .filters-grid label { font-size: 14px; color: #000; }
  .filters-grid select, .filters-grid select.filter-selected { height: 46px; font-size: 16px; color: #000; }
  .results-heading { padding: 14px 12px; flex-wrap: wrap; }
  .results-heading > span, .results-heading strong { color: #000; font-size: 14px; }
  .employees-table-scroll { overflow: visible; padding: 0 12px 12px; }
  .employees-table { display: block; min-width: 0; width: 100%; font-size: 16px; }
  .employees-table thead { display: none; }
  /* новый код chat: плотная карточка с должностью и статусом на общей строке */
  .employees-table tbody { display: grid; gap: 8px; }
  .employees-table tbody tr { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: 'name name' 'profession status' 'specializations specializations' 'agreement agreement' 'phone phone'; gap: 5px 8px; padding: 10px 12px; border: 1px solid #e2e7ef; border-radius: 9px; background: #fff; }
  .employees-table td { display: block; width: auto; min-width: 0; max-width: none; padding: 0; border: 0; color: #000; overflow-wrap: anywhere; }
  .employees-table tbody tr:hover td { background: transparent; }
  .employees-table .number-cell { display: none; }
  .employees-table td[data-label]::before { display: none; }
  .employee-name { display: inline-flex; align-items: center; min-height: 32px; font-size: 16px; line-height: 1.35; }
  .employee-tags { margin-top: 2px; }
  .employment-note, .employees-table .text-secondary { color: #000 !important; font-size: 12px; }
  .employee-status-cell { grid-area: status; align-self: center; }
  .profession-cell { grid-area: profession; align-self: center; font-size: 14px; }
  .status-badge { font-size: 12px; color: #000; padding: 2px 7px; }
  .specializations-cell { grid-area: specializations; }
  .specializations-cell .small-tag { font-size: 12px; color: #000; white-space: normal; padding: 2px 6px; }
  .agreement-cell { grid-area: agreement; font-size: 13px; }
  .employees-table .agreement-cell::before { content: 'Место работы: '; display: inline; font-size: 12px; }
  .agreement-cell a { display: inline; color: #000; line-height: 1.7; }
  .employees-table .phone-cell { grid-area: phone; display: flex; flex-wrap: wrap; gap: 0 12px; border-top: 1px solid #edf0f5; margin-top: 3px; padding-top: 3px; white-space: normal; }
  .phone-copy { min-height: 40px; width: auto; max-width: 100%; font-size: 15px; color: #000; overflow-wrap: anywhere; }
  .phone-copy i { font-size: 13px; color: #000; }
  /* новый код chat: действия встроены в шапку без отдельной нижней строки */
  .employees-table tbody tr { position: relative; }
  .employees-table .name-cell { grid-area: name; padding-right: 34px; margin-bottom: 3px; }
  .employees-table .actions-cell { position: absolute; top: 6px; right: 6px; padding: 0; text-align: right; }
  .delete-button { min-width: 44px; min-height: 44px; color: #000; }
  .desktop-delete-button { display: none; }
  .mobile-card-actions { display: block; position: relative; }
  .mobile-card-actions summary { display: grid; place-items: center; width: 40px; min-height: 40px; font-size: 21px; border-radius: 8px; cursor: pointer; list-style: none; }
  .mobile-card-actions summary:hover, .mobile-card-actions[open] summary { background: #edf3fc; }
  .mobile-card-actions summary::-webkit-details-marker { display: none; }
  .mobile-card-actions .delete-button { position: absolute; right: 0; top: 44px; z-index: 2; width: 190px; padding: 10px 12px; text-align: left; background: #fff; border: 1px solid #e2e7ef; border-radius: 8px; box-shadow: 0 6px 20px #2634451a; font-size: 14px; }
  .empty-state, .empty-state p { font-size: 16px; color: #000; }
  .employee-list-page .alert { flex-wrap: wrap; }
}
</style>
