<template>
  <div class="agreement-tools-page"> <!-- новый код chat: заголовок и навигация вынесены в общую оболочку МТР -->
    <div>
        <!-- --------- новый код chat: фильтры и таблица ответственных и проверок -->
        <div class="row g-2 align-items-center mb-3"> <!-- новый код chat: создание в общей строке фильтров -->
            <div class="col-12 col-xl"><input v-model="filterData.searchQuery" type="search" class="form-control form-control-sm" placeholder="Наименование, инвентарный или серийный №" aria-label="Поиск по наименованию, инвентарному или серийному номеру"></div> <!-- новый код chat: поиск по трём полям -->
            <div class="col-6 col-md-4 col-xl-2"><select v-model="filterData.status" class="form-select form-select-sm" aria-label="Состояние инструмента"><option value="">Все состояния</option><option value="new">Новое</option><option value="good">Хорошее</option><option value="satisfactory">Удовлетворительное</option><option value="broken">Сломано</option></select></div>
            <div class="col-6 col-md-4 col-xl-2"><select v-model="inspectionFilter" class="form-select form-select-sm" aria-label="Срок проверки"><option value="">Все проверки</option><option value="due">Просрочена</option><option value="valid">Срок не наступил</option><option value="none">Дата не указана</option></select></div>
            <!-- новый код chat: ответственный из списка закреплённых за инструментами сотрудников -->
            <div class="col-12 col-md-4 col-xl-2">
                <!-- новый код chat: выбор нескольких сотрудников с поиском по полному ФИО -->
                <MultiSelect v-model="employeeFilter" :options="employeeFilterOptions" :multiple="true" :plain-selection="true" label-key="label" search-key="search" placeholder="Все сотрудники" search-placeholder="Поиск по ФИО" />
            </div>
            <!-- новый код chat: фильтр договора только в общем разделе МТР -->
            <div v-if="isGlobal" class="col-12 col-md-4 col-xl-2">
                <select v-model="agreementFilter" class="form-select form-select-sm" aria-label="Договор"><option value="">Все договоры</option><option v-for="agreement in agreements" :key="agreement.ID" :value="String(agreement.ID)">{{ agreementLabel(agreement.ID) }}</option></select>
            </div>
            <div class="col-12 col-xl-auto d-flex justify-content-end"> <!-- новый код chat -->
                <button type="button" class="btn btn-outline-primary btn-sm text-nowrap" @click="createModal.open()"><i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Добавить инструмент</button>
            </div>
        </div>
        <div v-if="listError" class="alert alert-danger" role="alert">{{ listError }}</div>
        <div class="col-12 table-responsive tools-table-wrap">
            <table class="table table-sm align-middle mb-0 tools-table">
                <thead><tr><th class="text-center">№</th><th class="text-center">Состояние</th><th class="tool-name-column">Наименование</th><th>Инвентарный №</th><th>Серийный №</th><th v-if="isGlobal">Договор</th><th>Ответственный</th><th>Дата проверки</th><th>Следующая проверка</th><th></th></tr></thead> <!-- новый код chat: широкое наименование, остальные заголовки без переноса -->
                <tbody>
                    <tr v-for="(tool, index) in filter" :key="tool.ID" :class="{'tool-inspection-due':isInspectionDue(tool)}">
                        <td class="text-center">{{ index + 1 }}</td> <!-- новый код chat: номер по центру -->
                        <td class="text-center"><span class="tool-status border rounded-pill" :class="{new:'text-success border-success',good:'text-success border-success',satisfactory:'text-warning-emphasis border-warning',broken:'text-danger border-danger'}[tool.status]">{{ {new:'Новое',good:'Хорошее',satisfactory:'Удовлетв.',broken:'Сломано'}[tool.status] }}</span></td> <!-- новый код chat: состояние по центру -->
                        <td class="tool-name-column">{{ tool.name }}</td><td>{{ tool.inv_number || '—' }}</td><td>{{ tool.serial_number || '—' }}</td> <!-- новый код chat: перенос только наименования -->
                        <td v-if="isGlobal"><router-link :to="{name:'agreement',params:{id:tool.agreement_id}}">{{ agreementLabel(tool.agreement_id) }}</router-link></td>
                        <td><router-link v-if="tool.employee_card" :to="{name:'employee-card-detail',params:{id:tool.employee_card_id}}">{{ employeeName(tool.employee_card) }}</router-link><span v-else>—</span></td> <!-- новый код chat: прочерк, если ответственный не назначен -->
                        <td>{{ displayDate(tool.inspection_date) }}</td>
                        <td>{{ displayDate(tool.next_inspection_date) }}<i v-if="isInspectionDue(tool)" class="bi bi-exclamation-circle text-danger ms-1" title="Требуется проверка" role="img" aria-label="Требуется проверка"></i></td> <!-- новый код chat: индикатор проверки в одной строке с датой -->
                        <td>
                            <div class="dropdown">
                                <button class="btn btn-sm border-0" type="button" data-bs-toggle="dropdown" aria-label="Действия с инструментом" @focus="prepareToolMenu" @click="prepareToolMenu"><i class="bi bi-three-dots-vertical" aria-hidden="true"></i></button> <!-- новый код chat: меню вне обрезаемой области таблицы -->
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li><button class="dropdown-item" @click="createModal.open(tool)">Изменить</button></li>
                                    <li><button class="dropdown-item text-danger" @click="deleteToolHandler(tool.ID)">Удалить</button></li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                    <tr v-if="!filter.length"><td :colspan="isGlobal ? 10 : 9" class="text-center py-4">Инструменты не найдены</td></tr>
                </tbody>
            </table>
        </div>
        <!-- --------- конец нового кода chat -->
    </div>
    <ToolCreateModal :key="route.fullPath" ref="createModal" :agreement-id="isGlobal ? null : route.params.id" :agreements="agreements" @saved="getAgreementToolsHandler" /> <!-- новый код chat -->
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '../../api';
import { Dropdown } from 'bootstrap/dist/js/bootstrap.bundle.min.js'; // новый код chat
import ToolCreateModal from './Agreement/ToolCreateModal.vue'; // новый код chat
import MultiSelect from '../MultiSelect.vue'; // новый код chat: общий компонент выбора с поиском
const createModal = ref(null); // новый код chat: открытие формы создания
// --------- новый код chat: фиксированное позиционирование сохраняет меню видимым у края таблицы
const toolMenus = new Set();
const prepareToolMenu = event => {
    const menu = Dropdown.getOrCreateInstance(event.currentTarget, {
        boundary: 'viewport',
        popperConfig: config => ({ ...config, strategy: 'fixed' }),
    });
    toolMenus.add(menu);
};
onBeforeUnmount(() => { toolMenus.forEach(menu => menu.dispose()); toolMenus.clear(); });
// --------- конец нового кода chat

const route = useRoute();
// --------- новый код chat: один компонент для общего и договорного списка
const isGlobal = computed(() => route.meta.mtrGlobal === true); // новый код chat: контекст общей оболочки
const agreements = ref([]), agreementFilter = ref('');
const agreementLabel = id => {
    const agreement = agreements.value.find(item => Number(item.ID) === Number(id));
    return agreement?.short_name || agreement?.name || `Договор № ${id}`;
};
let listVersion = 0;
onBeforeUnmount(() => { listVersion++; });
// --------- конец нового кода chat

const filterData = ref({
    status: "",
    searchQuery: ""
});

const tools = ref(null);
// --------- новый код chat: проверка наступает в указанный день по московскому времени
const inspectionFilter = ref(''), listError = ref('');
const dateKey = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const today = ref(dateKey());
let dateTimer;
const isInspectionDue = tool => !!tool.next_inspection_date && tool.next_inspection_date <= today.value;
const displayDate = value => value ? value.split('-').reverse().join('.') : '—';
const employeeName = employee => [employee.surname, employee.name?.[0] ? employee.name[0]+'.' : '', employee.middle_name?.[0] ? employee.middle_name[0]+'.' : ''].filter(Boolean).join(' ') || '—';
// --------- новый код chat: варианты не зависят от остальных фильтров
const employeeFilter = ref([]); // новый код chat: пустой выбор показывает всех
const responsibleEmployees = computed(() => {
    const employees = new Map();
    for (const tool of tools.value || []) {
        if (tool.employee_card && tool.employee_card_id) employees.set(tool.employee_card_id, {...tool.employee_card, ID:tool.employee_card_id});
    }
    return [...employees.values()].sort((a,b) => employeeName(a).localeCompare(employeeName(b), 'ru'));
});
// новый код chat: одинаковый формат ID и отдельный вариант без ответственного
const employeeFilterOptions = computed(() => [
    {ID:'none', label:'Не закреплён', search:''},
    ...responsibleEmployees.value.map(employee => ({ID:String(employee.ID), label:employeeName(employee), search:[employee.surname, employee.name, employee.middle_name].filter(Boolean).join(' ')})),
]);
// --------- конец нового кода chat
onMounted(() => { dateTimer = setInterval(() => { today.value = dateKey(); }, 30000); });
onBeforeUnmount(() => clearInterval(dateTimer));
// --------- конец нового кода chat

const deleteToolHandler = async(id) =>{
    if (!window.confirm('Удалить инструмент?')) return; // новый код chat: подтверждение удаления
    try{
        const res = await api.delete(`/tools/delete/${id}`)
        tools.value = tools.value.filter(item => item.ID != id);
    }catch(err){
        console.log("[Ошибка при удалении]", err);
    }
}

const getAgreementToolsHandler = async()=>{
    const request = ++listVersion; // новый код chat: защита от устаревших ответов при переходах
    listError.value = ''; // новый код chat
    try{
        // новый код chat: общий API и справочник договоров загружаются независимо
        const [toolResult, agreementResult] = await Promise.allSettled([
            api.get(isGlobal.value ? '/tools' : `/agreements/${route.params.id}/tools/create`),
            isGlobal.value ? api.get('/agreements') : Promise.resolve({data:[]}),
        ]);
        if (request !== listVersion) return;
        if (toolResult.status === 'rejected') throw toolResult.reason;
        const res = toolResult.value;
        if (agreementResult.status === 'fulfilled') {
            agreements.value = (agreementResult.value.data || []).sort((a,b) => (a.short_name || a.name || '').localeCompare(b.short_name || b.name || '', 'ru'));
        } else {
            listError.value = 'Не удалось загрузить список договоров. Обновите страницу.';
        }
        // новый код chat: первоначальная сортировка по наименованию от А до Я
        tools.value = [...(res.data || [])].sort((a, b) =>
            String(a.name || '').trim().localeCompare(String(b.name || '').trim(), 'ru', {sensitivity:'base', numeric:true}) || a.ID - b.ID);
    }catch(err){
        if (request !== listVersion) return; // новый код chat
        listError.value = 'Не удалось обновить список инструментов. Обновите страницу.'; // новый код chat
    }
}

const filter = computed(() => {
    if (!tools.value) {
        return [];
    }

    const query = filterData.value.searchQuery.toLowerCase().trim();
    return tools.value.filter(item => {
        const matchesTools = !filterData.value.status || item.status === filterData.value.status;
        // новый код chat: совпадение по любому из трёх полей, без учёта регистра
        const matchesQuery = !query || [item.name, item.inv_number, item.serial_number]
            .some(value => String(value ?? '').toLowerCase().includes(query));
        // новый код chat: фильтр сроков проверки, включая сегодняшний день
        const matchesInspection = !inspectionFilter.value
            || (inspectionFilter.value === 'due' && isInspectionDue(item))
            || (inspectionFilter.value === 'valid' && !!item.next_inspection_date && !isInspectionDue(item))
            || (inspectionFilter.value === 'none' && !item.next_inspection_date);
        // новый код chat: отбор по ответственному вместе с поиском и остальными фильтрами
        const matchesEmployee = !employeeFilter.value.length || employeeFilter.value.includes(
            item.employee_card ? String(item.employee_card_id) : 'none'); // новый код chat: совпадение с любым выбранным сотрудником
        const matchesAgreement = !isGlobal.value || !agreementFilter.value || String(item.agreement_id) === agreementFilter.value; // новый код chat
        return matchesTools && matchesQuery && matchesInspection && matchesEmployee && matchesAgreement;
    })
}); 

// новый код chat: переход между МТР и договором обновляет список и сбрасывает фильтры
watch(() => route.fullPath, () => {
    tools.value = []; agreements.value = []; agreementFilter.value = '';
    filterData.value = {status:'',searchQuery:''}; employeeFilter.value = []; inspectionFilter.value = '';
    getAgreementToolsHandler();
}, {immediate:true});
</script>

<style scoped>
/* --------- новый код chat: размеры текста списка и форм как во вкладке расходов */
.agreement-tools-page { font-size: 14px; }
.agreement-tools-page h5 { font-size: 15px; font-weight: 600; }
.agreement-tools-page form, .agreement-tools-page .form-control,
.agreement-tools-page .form-select, .agreement-tools-page .form-select-sm,
.agreement-tools-page .btn { font-size: 13px; font-family: inherit; }
.agreement-tools-page .form-label { font-weight: 500; }
.agreement-tools-page .dropdown-menu { font-size: 14px; }
/* --------- конец нового кода chat */
/* --------- новый код chat: строки проверки и компактные статусы */
.tools-table-wrap { border: 1px solid var(--bs-border-color); border-radius: 8px; }
.tools-table th { font-size: 12px; font-weight: 600; white-space: nowrap; background: #f8f9fa; }
/* --------- новый код chat: ширина по содержимому, свободное место — наименованию */
.tools-table { width: 100%; }
.tools-table td, .tools-table th { padding: 8px; width: 1%; white-space: nowrap; }
.tools-table .tool-name-column { width: 33.333333%; min-width: 240px; white-space: normal; overflow-wrap: anywhere; } /* новый код chat: более узкое наименование, ориентир col-4 */
/* --------- конец нового кода chat */
.tools-table .tool-inspection-due > td { background: #f8d7da; }
.tool-status { display: inline-block; font-size: 10px; line-height: 1.3; padding: 3px 6px; white-space: nowrap; }
/* новый код chat: ссылки ответственного используют стандартные цвета Bootstrap */
.tools-table small { font-size: 11px; }
/* --------- конец нового кода chat */
</style>
