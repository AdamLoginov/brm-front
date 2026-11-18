<!-- новый код chat: сводная проверка данных и документов сотрудников -->
<template>
  <div class="container-fluid completeness-page py-3">
    <router-link :to="{ name: 'employee-cards' }" class="back-link"><i class="bi bi-arrow-left" aria-hidden="true"></i> Сотрудники</router-link>
    <header class="page-heading">
      <!-- новый код chat: выбор полей вместо широкой таблицы отдельных столбцов -->
      <div><h1>Заполненность данных</h1><p>Все сведения карточек и документы по категориям. Выберите данные и условия отбора.</p></div>
      <button type="button" class="btn btn-outline-primary" :disabled="loading" @click="loadData"><i class="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>Обновить</button>
    </header>
    <div v-if="error" class="alert alert-danger" role="alert">{{ error }} <button type="button" class="btn btn-outline-danger btn-sm" :disabled="loading" @click="loadData">Повторить</button></div>
    <div v-if="loading" class="audit-panel" role="status"><span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Загрузка сотрудников и документов…</div>
    <template v-else-if="loaded && !error">
      <section class="audit-panel" aria-label="Настройки отображения">
        <details>
          <summary>Что выводить <span class="counter">{{ visibleColumns.length }} из {{ columns.length }}</span></summary>
          <div class="selection-toolbar">
            <label>Найти поле или категорию<input v-model="columnSearch" class="form-control" type="search" placeholder="Например: паспорт"></label>
            <button type="button" class="btn btn-outline-secondary btn-sm" @click="selectedKeys = columns.map(c => c.key)">Выбрать всё</button>
            <button type="button" class="btn btn-outline-secondary btn-sm" @click="selectedKeys = []">Убрать всё</button>
          </div>
          <div class="column-groups">
            <fieldset v-for="group in searchedGroups" :key="group.label">
              <legend>{{ group.label }}</legend>
              <div class="group-actions"><button type="button" @click="selectGroup(group, true)">Выбрать</button><button type="button" @click="selectGroup(group, false)">Убрать</button></div>
              <label v-for="column in group.columns" :key="column.key" class="column-checkbox"><input v-model="selectedKeys" type="checkbox" :value="column.key">{{ column.label }}</label>
            </fieldset>
          </div>
          <p v-if="!searchedGroups.length" class="hint">Поля не найдены.</p>
          <p class="hint mb-0">Выбор полей сохраняется в этом браузере. Скрытие поля не отменяет проверку данных и категорий.</p>
        </details>
      </section>

      <section class="audit-panel" aria-label="Фильтры сотрудников">
        <div class="base-filters">
          <label>Поиск по ФИО<input v-model="search" class="form-control" type="search" placeholder="Фамилия, имя, отчество"></label>
          <label>Статус<select v-model="status" class="form-select"><option value="working">Работающие</option><option value="all">Все сотрудники</option><option value="dismissed">Уволенные</option></select></label>
          <label>Заполненность<select v-model="completeness" class="form-select"><option value="all">Все</option><option value="missing">Есть пропуски</option><option value="fields">Есть пустые поля</option><option value="documents">Есть категории без файлов</option><option value="complete">Всё заполнено</option></select></label>
        </div>
        <div class="conditions-heading"><h2>Условия по полям и документам</h2><button type="button" class="btn btn-outline-primary btn-sm" @click="addCondition"><i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Добавить условие</button></div>
        <label v-if="conditions.length" class="condition-mode">Совпадение<select v-model="conditionMode" class="form-select"><option value="all">Все условия одновременно (И)</option><option value="any">Хотя бы одно условие (ИЛИ)</option></select></label>
        <div v-for="(condition, index) in conditions" :key="condition.id" class="condition-row">
          <label>Поле / категория {{ index + 1 }}<select v-model="condition.key" class="form-select"><optgroup v-for="group in groups" :key="group.label" :label="group.label"><option v-for="column in group.columns" :key="column.key" :value="column.key">{{ column.label }}</option></optgroup></select></label>
          <label>Условие<select v-model="condition.operator" class="form-select"><option value="missing">Не заполнено / нет файлов</option><option value="filled">Заполнено / есть файлы</option><option value="contains">Содержит текст</option><option value="equals">Равно значению</option><option value="na">Не применяется</option></select></label>
          <label v-if="['contains', 'equals'].includes(condition.operator)">Значение<input v-model="condition.value" class="form-control" placeholder="Например: Да, Иркутск, pdf" :aria-invalid="!condition.value.trim()"></label>
          <span v-else class="condition-spacer"></span>
          <button type="button" class="btn btn-outline-danger remove-condition" :aria-label="'Удалить условие ' + (index + 1)" @click="conditions = conditions.filter(item => item.id !== condition.id)"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
        </div>
        <p v-if="invalidConditions" class="condition-warning" role="status">Введите значение во всех текстовых условиях. До этого результаты не показываются.</p>
        <p class="hint">Условия работают и по скрытым полям. Для категорий текст ищется в названиях файлов. «Не применяется» — месячная зарплата при неофициальном трудоустройстве.</p>
        <button type="button" class="btn btn-outline-secondary btn-sm" @click="resetFilters">Сбросить фильтры</button>
      </section>

      <section class="audit-panel results-panel" aria-label="Результаты проверки">
        <div class="results-toolbar">
          <div aria-live="polite"><strong>Найдено {{ filteredRows.length }}</strong> из {{ employees.length }} сотрудников</div>
        </div>
        <div class="legend"><span class="state-missing">Не заполнено / нет файлов</span><span class="state-filled">Заполнено</span><span class="state-na">Не применяется</span></div>
        <p class="hint">Итоги учитывают все {{ employeeFields.length }} полей и все {{ requiredCategoryCount }} категорий справочника, включая скрытые. «Нет» и нулевая сумма считаются заполненными значениями. Подсветка показывает отсутствие данных, а не обязательность их заполнения.</p>
        <p v-if="!requiredCategoryCount" class="hint">В справочнике пока нет категорий документов.</p>
        <p v-if="!visibleColumns.length" class="hint">Все поля скрыты — показаны только сотрудники и итоги. Выберите нужные данные в разделе «Что выводить».</p>
        <div v-if="!filteredRows.length" class="empty-result">{{ employees.length ? 'Нет сотрудников, соответствующих условиям.' : 'Сотрудники пока не добавлены.' }}</div>
        <!-- новый код chat: единая таблица без пагинации, данные сотрудника в компактных группах -->
        <div v-else class="audit-table-scroll">
          <table class="table audit-table mb-0">
            <thead><tr><th scope="col" class="employee-column">Сотрудник / итоги</th><th v-if="visibleGroups.length" scope="col">Данные и документы</th></tr></thead>
            <tbody><tr v-for="row in filteredRows" :key="row.employee.ID">
              <th scope="row" class="employee-column">
                <router-link :to="{ name: 'employee-card-detail', params: { id: row.employee.ID } }" class="employee-link">{{ row.name }}</router-link>
                <span class="employee-status">{{ row.employee.status ? 'Уволен' : 'Работает' }}</span>
                <div class="totals"><span :class="row.missingFields ? 'state-missing' : 'state-filled'">Пустых полей: {{ row.missingFields }}</span><span :class="row.missingDocuments ? 'state-missing' : 'state-filled'">Категорий без файлов: {{ row.missingDocuments }}</span></div>
                <div class="employee-actions"><router-link :to="{ name: 'employee-card-update', params: { id: row.employee.ID } }">Заполнить данные</router-link><router-link :to="{ name: 'employee-card-document-create', params: { id: row.employee.ID } }">Добавить файл</router-link></div>
              </th>
              <td v-if="visibleGroups.length" class="employee-data">
                <div class="employee-data-groups">
                  <section v-for="group in visibleGroups" :key="group.label" class="data-group" :class="{ 'documents-group': group.label === 'Документы' }" :aria-label="group.label">
                    <h3>{{ group.label }}</h3>
                    <dl class="data-group-fields">
                      <div v-for="column in group.columns" :key="column.key" class="data-field" :class="'state-' + row.cells[column.key].state">
                        <dt>{{ column.label }}</dt>
                        <dd>
                          <ul v-if="column.kind === 'documents' && row.cells[column.key].files.length" class="document-list"><li v-for="file in row.cells[column.key].files" :key="file.ID"><a :href="documentFileUrl(file.ID)" :title="file.file_name || file.document_name || 'Файл № ' + file.ID" target="_blank" rel="noopener" @click.prevent="openDocumentFile(file.ID)"><i class="bi bi-file-earmark-text" aria-hidden="true"></i><span>{{ file.file_name || file.document_name || 'Файл № ' + file.ID }}</span></a></li></ul>
                          <span v-else>{{ row.cells[column.key].text }}</span>
                        </dd>
                      </div>
                    </dl>
                  </section>
                </div>
              </td>
            </tr></tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
// новый код chat: единая загрузка, выбор столбцов и фильтрация без повторных запросов карточек
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import api from '../../../api';
import { documentFileUrl, openDocumentFile } from '../../../utils/fileAccess';
import { employeeFields, buildDocumentColumns, buildEmployeeRow, matchesEmployeeConditions, normalizeEmployeeText } from '../../../utils/employeeCompleteness';

const employees = ref([]);
const categories = ref([]);
const loading = ref(false);
const loaded = ref(false);
const error = ref('');
const search = ref('');
const status = ref('working');
const completeness = ref('all');
const columnSearch = ref('');
const selectedKeys = ref([]);
const conditions = ref([]);
const conditionMode = ref('all');
let conditionID = 0;
let controller;
let preferencesReady = false;
const preferenceKey = 'brm-employee-completeness-columns-v1';
const documentColumns = computed(() => buildDocumentColumns(categories.value, employees.value));
const columns = computed(() => [...employeeFields, ...documentColumns.value]);
const requiredCategoryCount = computed(() => documentColumns.value.filter(c => c.requiredCategory).length);
const groups = computed(() => {
  const result = new Map();
  for (const column of columns.value) {
    if (!result.has(column.group)) result.set(column.group, { label: column.group, columns: [] });
    result.get(column.group).columns.push(column);
  }
  return [...result.values()];
});
const searchedGroups = computed(() => groups.value.map(group => ({ ...group, columns: group.columns.filter(column => normalizeEmployeeText(column.label + ' ' + group.label).includes(normalizeEmployeeText(columnSearch.value))) })).filter(group => group.columns.length));
const visibleColumns = computed(() => columns.value.filter(column => selectedKeys.value.includes(column.key)));
// новый код chat: выбранные поля распределяются по группам внутри одной ячейки сотрудника
const visibleGroups = computed(() => groups.value.map(group => ({ ...group, columns: group.columns.filter(column => selectedKeys.value.includes(column.key)) })).filter(group => group.columns.length));
const rows = computed(() => employees.value.map(employee => buildEmployeeRow(employee, columns.value)).sort((a, b) => a.name.localeCompare(b.name, 'ru')));
const invalidConditions = computed(() => conditions.value.some(condition => ['contains', 'equals'].includes(condition.operator) && !condition.value.trim()));
const filteredRows = computed(() => {
  if (invalidConditions.value) return [];
  const words = normalizeEmployeeText(search.value).split(' ').filter(Boolean);
  return rows.value.filter(row => {
    if (status.value === 'working' && row.employee.status || status.value === 'dismissed' && !row.employee.status) return false;
    if (!words.every(word => normalizeEmployeeText(row.name).includes(word))) return false;
    if (completeness.value === 'fields' && !row.missingFields) return false;
    if (completeness.value === 'documents' && !row.missingDocuments) return false;
    if (completeness.value === 'missing' && !row.missingFields && !row.missingDocuments) return false;
    if (completeness.value === 'complete' && (row.missingFields || row.missingDocuments)) return false;
    return matchesEmployeeConditions(row, conditions.value, conditionMode.value);
  });
});
watch(selectedKeys, value => {
  if (preferencesReady) { try { localStorage.setItem(preferenceKey, JSON.stringify(value)); } catch { /* Выбор остаётся действующим в текущем сеансе. */ } }
}, { deep: true });
const selectGroup = (group, selected) => {
  const keys = group.columns.map(column => column.key);
  selectedKeys.value = selected ? [...new Set([...selectedKeys.value, ...keys])] : selectedKeys.value.filter(key => !keys.includes(key));
};
const addCondition = () => { conditions.value.push({ id: ++conditionID, key: 'phones', operator: 'missing', value: '' }); };
const resetFilters = () => { search.value = ''; status.value = 'working'; completeness.value = 'all'; conditions.value = []; conditionMode.value = 'all'; };
const loadData = async () => {
  controller?.abort();
  const request = new AbortController();
  controller = request;
  loading.value = true;
  error.value = '';
  try {
    const [employeeResponse, categoryResponse] = await Promise.all([
      api.get('/employeecards', { params: { include_documents: 'true' }, signal: request.signal }),
      api.get('/employeescard/document/category', { signal: request.signal }),
    ]);
    if (request.signal.aborted) return;
    if (!Array.isArray(employeeResponse.data) || !Array.isArray(categoryResponse.data)) throw new Error('Некорректный ответ сервера');
    employees.value = employeeResponse.data;
    categories.value = categoryResponse.data;
    const keys = columns.value.map(column => column.key);
    if (!preferencesReady) {
      let saved;
      try { saved = JSON.parse(localStorage.getItem(preferenceKey) || 'null'); } catch { /* Повреждённые настройки заменяются исходными. */ }
      selectedKeys.value = Array.isArray(saved) ? keys.filter(key => saved.includes(key)) : keys;
      preferencesReady = true;
    } else selectedKeys.value = selectedKeys.value.filter(key => keys.includes(key));
    conditions.value = conditions.value.filter(condition => keys.includes(condition.key));
    loaded.value = true;
  } catch {
    if (!request.signal.aborted) error.value = 'Не удалось загрузить сотрудников и категории. Проверка заполненности недоступна — повторите загрузку.';
  } finally { if (controller === request) loading.value = false; }
};
onMounted(loadData);
onBeforeUnmount(() => controller?.abort());
</script>

<style scoped>
/* новый код chat: читаемая сводка на компьютере и вертикальные карточки на телефоне */
.completeness-page { color: #000; font-family: var(--bs-body-font-family); font-size: 14px; }
.back-link { display: inline-flex; align-items: center; gap: 6px; color: #000; text-decoration: none; min-height: 36px; }
.page-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin: 12px 0 18px; }
h1 { font-size: 24px; margin: 0 0 8px; }
h2 { font-size: 16px; margin: 0; }
.page-heading p { margin: 0; }
.audit-panel { padding: 16px; border: 1px solid #e2e7ef; border-radius: 10px; background: #fff; margin-bottom: 14px; }
summary { cursor: pointer; font-size: 16px; font-weight: 600; }
.counter { display: inline-block; padding: 2px 7px; margin-left: 6px; background: #edf3fc; border-radius: 6px; font-size: 12px; }
.selection-toolbar, .conditions-heading, .results-toolbar { display: flex; align-items: end; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; }
.selection-toolbar { margin-top: 16px; justify-content: flex-start; }
label { display: grid; gap: 5px; font-size: 13px; min-width: 0; }
.form-control, .form-select { color: #000; font-size: 14px; }
.column-groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; margin-bottom: 14px; }
fieldset { border: 1px solid #e8ecf2; border-radius: 8px; padding: 12px; min-width: 0; }
legend { float: none; width: auto; font-size: 14px; font-weight: 600; padding: 0 4px; margin: 0; }
.group-actions { display: flex; gap: 12px; margin-bottom: 6px; }
.group-actions button { border: 0; background: none; padding: 4px 0; color: #1755a3; font-size: 12px; }
.column-checkbox { display: flex; gap: 8px; align-items: start; padding: 5px 0; cursor: pointer; overflow-wrap: anywhere; }
.column-checkbox input { margin-top: 3px; flex-shrink: 0; }
.base-filters { display: grid; grid-template-columns: 2fr 1fr 1.5fr; gap: 12px; margin-bottom: 18px; }
.conditions-heading { align-items: center; }
.condition-mode { max-width: 340px; margin-bottom: 12px; }
.condition-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) 38px; gap: 10px; align-items: end; margin-bottom: 10px; }
.remove-condition { height: 38px; padding: 0; }
.hint { margin-top: 12px; font-size: 12px; line-height: 1.6; }
.condition-warning { color: #9c3026; }
.legend, .totals { display: flex; flex-wrap: wrap; gap: 6px; }
.legend span, .totals span { padding: 4px 7px; border-radius: 5px; font-size: 12px; }
.state-missing { background-color: #fff0eb !important; color: #802b18; }
.state-filled { background-color: #f0f8f2 !important; color: #000; }
.state-na { background-color: #f3f4f6 !important; color: #000; }
/* новый код chat: таблица по ширине экрана, без внутренней прокрутки и широких столбцов */
.audit-table-scroll { border: 1px solid #e2e7ef; border-radius: 8px; }
.audit-table { width: 100%; table-layout: fixed; font-size: 12px; }
.audit-table th, .audit-table td { padding: 8px; border: 1px solid #e5e9ee; overflow-wrap: anywhere; vertical-align: top; box-shadow: none; }
.audit-table thead th { background: #f8fafc; font-size: 12px; font-weight: 600; }
.audit-table .employee-column { width: 180px; background: #fff; font-weight: 400; }
.audit-table thead .employee-column { background: #f8fafc; font-weight: 600; }
.employee-link { font-size: 14px; font-weight: 600; color: #000; text-decoration: none; line-height: 1.35; }
.employee-status { display: block; margin: 3px 0 6px; font-size: 11px; }
.totals { flex-direction: column; align-items: flex-start; }
.totals span { padding: 2px 5px; font-size: 11px; }
.employee-actions { display: grid; gap: 5px; margin-top: 8px; font-size: 12px; }
.employee-actions a, .document-list a { color: #174f91; }
.document-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 3px; }
.document-list a { display: flex; gap: 4px; align-items: baseline; overflow-wrap: anywhere; }
.document-list a span { min-width: 0; }
.document-list i { flex-shrink: 0; }
.employee-data-groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: 8px; align-items: start; }
.data-group { min-width: 0; }
.data-group h3 { font-size: 11px; font-weight: 600; margin: 0 0 4px; color: #000; }
.data-group-fields { display: grid; gap: 3px; margin: 0; }
.data-field { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 5px; padding: 3px 5px; border-radius: 4px; line-height: 1.4; min-width: 0; }
.data-field dt { font-size: 11px; font-weight: 500; margin: 0; }
.data-field dt::after { content: ':'; }
.data-field dd { font-size: 12px; margin: 0; min-width: 0; overflow-wrap: anywhere; }
.documents-group { grid-column: 1 / -1; border-top: 1px solid #edf0f5; padding-top: 6px; }
.documents-group .data-group-fields { grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); align-items: start; gap: 4px; }
.documents-group .data-field { display: block; }
.documents-group dt { margin-bottom: 2px; }
.empty-result { padding: 30px 12px; text-align: center; }
@media (max-width: 767px) {
  .audit-panel { padding: 12px; }
  .page-heading { align-items: start; flex-direction: column; }
  h1 { font-size: 22px; }
  .base-filters, .condition-row { grid-template-columns: minmax(0, 1fr); }
  .condition-row { padding: 12px; border: 1px solid #e2e7ef; border-radius: 8px; }
  .condition-spacer { display: none; }
  .remove-condition { justify-self: end; width: 44px; }
  .form-control, .form-select { font-size: 16px; min-height: 44px; }
  .btn, .column-checkbox { min-height: 44px; }
  .column-groups { grid-template-columns: minmax(0, 1fr); }
  /* новый код chat: на телефоне группы остаются компактными, сотрудник расположен сверху */
  .audit-table-scroll { border: 0; }
  .audit-table, .audit-table tbody { display: block; width: 100%; min-width: 0; }
  .audit-table thead { display: none; }
  .audit-table tr { display: grid; gap: 6px; border: 1px solid #e2e7ef; padding: 10px; border-radius: 8px; margin-bottom: 12px; }
  .audit-table td, .audit-table .employee-column { display: block; min-width: 0; width: auto; padding: 4px; border: 0; font-size: 14px; }
  .employee-data-groups { grid-template-columns: minmax(0, 1fr); gap: 10px; }
  .documents-group .data-group-fields { grid-template-columns: minmax(0, 1fr); }
  .data-group h3, .data-field dt { font-size: 12px; }
  .data-field dd { font-size: 14px; }
  .data-field { padding: 4px 6px; }
  .employee-link { font-size: 17px; }
  .employee-actions a, .document-list a { min-height: 36px; }
}
</style>
