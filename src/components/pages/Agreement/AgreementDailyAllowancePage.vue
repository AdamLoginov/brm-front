<!-- --------- новый код chat: календарь суточных и массовая выдача -->
<template>
    <div class="daily-page">
        <!-- --------- новый код chat: единая панель управления суточными -->
        <section class="daily-controls">
            <div class="daily-controls-top">
                <div class="daily-heading"><h2>Суточные</h2><span>Учёт дней и выдача сотрудникам</span></div>
                <div class="daily-month-tools">
                    <div><label for="daily-month" class="form-label">Месячный табель</label><select id="daily-month" v-model="monthID" class="form-select form-select-sm daily-month" :disabled="busy || editingList || !months.length" @change="changeMonth"><option v-for="month in months" :key="month.ID" :value="month.ID">{{ monthLabel(month) }}</option></select></div>
                    <button class="btn btn-sm btn-outline-primary" :disabled="busy || editingList" @click="historyOpen = true"><i class="bi bi-clock-history me-1" aria-hidden="true"></i>История выдач</button>
                </div>
            </div>
        </section>
        <div v-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
        <div v-if="successMessage" class="alert alert-success" role="status">{{ successMessage }}</div>
        <div v-if="!busy && months.length && !table.rate_kopecks" class="alert alert-info">Укажите суточные в настройках табеля. Выдача и автозаполнение пока недоступны.</div>
        <div v-if="table.forecast_warning" class="alert alert-warning">{{ table.forecast_warning }}. Прогноз оплаты будущих дней неполный.</div>

        <div v-if="editingList" class="daily-edit-notice" role="status"><i class="bi bi-people" aria-hidden="true"></i><span><strong>Редактирование списка.</strong> Отметьте сотрудников, которым начисляются суточные. Для исключённых начисления отменяются в выбранном месяце. Выдача денег временно недоступна.</span></div>
        <!-- новый код chat: правила постоянно открыты, без сворачивания -->
        <section class="daily-help" aria-labelledby="daily-help-title">
            <h3 id="daily-help-title" class="daily-help-title">Обозначения и правила заполнения</h3>
            <div class="daily-help-content">
        <div class="d-flex gap-3 flex-wrap small mb-3 daily-legend">
            <!-- новый код chat: формулировки оплаты дней -->
            <span><i class="daily-paid"></i>С — отработан и оплачен</span><span><i class="daily-unpaid"></i>Отработан, не оплачен полностью</span><span><i class="daily-letter"></i>Буквенная отметка</span><span><i class="daily-reserved"></i>День обеспечен вперёд</span>
            <span><i class="daily-preview"></i>Будущий день будет оплачен</span><span><i class="daily-preview-worked"></i>Отработанный день будет оплачен</span> <!-- новый код chat: отдельные цвета прогноза и погашения долга -->
        </div>

                <p class="small mb-0">Суммы должны быть кратны суточным выбранного табеля. Прогноз округляется вверх, остаток сохраняется. Красное ФИО — сотрудник переведён; новые выдачи здесь недоступны. Выбор даты заполняет суммы, но не фиксирует выдачу.</p>
            </div>
        </section>
        <!-- --------- конец нового кода chat -->
        <div v-if="busy" class="text-secondary py-2" role="status">Обрабатываем суточные…</div>
        <div v-if="!months.length && !busy" class="alert alert-info">Сначала создайте месячный табель.</div>
        <!-- новый код chat: ставка и дата обеспечения непосредственно у таблицы -->
            <div v-if="monthID" class="daily-controls-bottom daily-table-toolbar">
                <div class="daily-rate"><span>Суточные за день</span><strong>{{ money(table.rate_kopecks || 0) }} ₽</strong></div>
                <div class="daily-forecast"><label for="daily-through" class="form-label">Обеспечить по дату включительно</label><input id="daily-through" v-model="through" type="date" class="form-control form-control-sm daily-through" :disabled="busy || editingList || !monthID || !table.rate_kopecks" @change="loadTable"></div>
                <div class="daily-list-actions">
                    <button v-if="!editingList" class="btn btn-sm btn-outline-primary" :disabled="busy || !monthID" @click="editList"><i class="bi bi-people me-1" aria-hidden="true"></i>Править список</button>
                    <template v-else>
                        <button class="btn btn-sm btn-outline-primary" :disabled="busy || !table.employees?.length" @click="toggleAllEmployees">Выбрать все</button>
                        <button class="btn btn-sm btn-success" :disabled="busy" @click="saveList">Сохранить список</button>
                        <button class="btn btn-sm btn-outline-secondary" :disabled="busy" @click="editingList=false">Отмена</button>
                    </template>
                </div>
            </div>
        <div v-if="monthID" class="table-responsive daily-scroll" :class="{'daily-editing-list':editingList}">
            <table ref="dailyTableElement" class="table table-sm table-bordered align-middle daily-table">
                <thead ref="dailyHeaderElement" class="daily-sticky-header" :style="{transform: `translateY(${dailyHeaderOffset}px)`}"> <!-- новый код chat: закреплённый белый заголовок -->
                    <!-- новый код chat: выбранная дата подсвечивает число и день недели голубым, остальные выходные сохраняют свой фон -->
                    <tr><th v-if="editingList" rowspan="2" class="daily-check" aria-label="Отображать сотрудника"></th><th rowspan="2" class="daily-number">№</th><th rowspan="2" class="daily-name">Сотрудник</th><th v-for="day in days" :key="day.date" class="daily-day" :class="{'daily-weekend':day.weekend && day.date !== through, 'daily-selected-date':day.date === through}">{{ day.weekday }}</th><th rowspan="2" class="daily-balance">Баланс, ₽</th><th rowspan="2" class="daily-issue">К выдаче, ₽</th></tr> <!-- новый код chat: светло-жёлтый фон только названий выходных -->
                    <tr><th v-for="day in days" :key="day.date" class="daily-day" :class="{'daily-selected-date':day.date === through}">{{ day.number }}</th></tr>
                </thead>
                <tbody>
                    <tr v-for="(employee, index) in displayedEmployees" :key="employee.employee_card_id">
                        <td v-if="editingList" class="daily-check"><input v-model="enabledDraft[employee.employee_card_id]" type="checkbox" class="form-check-input" :disabled="busy" :aria-label="'Суточные: ' + employee.employee_name"></td>
                        <td class="daily-number">{{ index + 1 }}</td> <!-- новый код chat: номер строки -->
                        <td class="daily-name" :class="{'daily-transferred':!employee.is_assigned, 'daily-itr-cell':employee.is_itr, 'daily-dismissed-name':dismissedInCurrentMonth(employee)}" :title="employee.employee_name + (employee.is_assigned ? '' : ' — больше не закреплён за договором')"> <!-- новый код chat: фон увольнения в выбранном месяце -->
                            <router-link :to="{ name: 'employee-card-detail', params: { id: employee.employee_card_id } }" class="timesheet-employee-link" :title="employee.is_itr ? 'Открыть карточку сотрудника ИТР' : 'Открыть карточку сотрудника'">{{ shortName(employee) }}</router-link> <!-- новый код chat: фон перенесён на ячейку -->
                        </td>
<!-- новый код chat: отсутствие на объекте отображается серым -->
                        <td v-for="cell in employee.cells.filter(cell => cell.state !== 'dismissed')" :key="cell.date" class="daily-day" :style="cell.mark === 'Н' || cell.mark === 'О' ? {backgroundColor: '#CED4DA'} : undefined" :class="isPreviewCovered(employee, cell) ? (cell.state === 'unpaid' ? 'daily-preview-worked' : 'daily-preview') : (cell.mark === 'Н' || cell.mark === 'О' ? 'daily-not-working' : `daily-${cell.state}`)" :title="isPreviewCovered(employee, cell) ? `${cell.date}: будет оплачен после фиксации выдачи` : cellTitle(cell)">{{ cell.mark === 'О' ? 'Н' : cell.mark }}</td> <!-- новый код chat: закрытые дни вынесены в объединённую ячейку -->
                        <td v-if="employee.cells.some(cell => cell.state === 'dismissed')" :colspan="employee.cells.filter(cell => cell.state === 'dismissed').length" class="daily-dismissed-days" :title="'Уволен с ' + employee.dismissal_date">Уволен</td> <!-- новый код chat: блок как в рабочем табеле -->
                        <td class="text-end daily-balance" :class="employee.balance_kopecks < 0 ? 'text-danger' : 'text-success'">{{ money(employee.balance_kopecks) }}</td>
                        <td class="daily-issue"><!-- новый код chat: проверка суммы непосредственно в строке -->
                            <template v-if="employee.is_assigned && employee.enabled !== false">
                                <input v-model="amounts[employee.employee_card_id]" inputmode="decimal" class="form-control form-control-sm" :class="{'is-invalid':!editingList && amountError(employee)}" :disabled="busy || editingList || !table.rate_kopecks" :aria-label="`К выдаче: ${employee.employee_name}`" :aria-invalid="!editingList && !!amountError(employee)" :aria-describedby="!editingList && amountError(employee) ? `daily-amount-error-${employee.employee_card_id}` : undefined" placeholder="0,00">
                                <small v-if="!editingList && amountError(employee)" :id="`daily-amount-error-${employee.employee_card_id}`" class="daily-amount-error">{{ amountError(employee) }}</small>
                            </template></td>
                    </tr>
                    <tr v-if="!displayedEmployees.length && !busy"><td :colspan="days.length + 4 + (editingList ? 1 : 0)" class="text-secondary">Сотрудников пока нет.</td></tr>
                </tbody>
            </table>
        </div>
        <!-- --------- новый код chat: итоги и фиксация доступны при прокрутке длинной таблицы -->
        <div v-if="monthID && !editingList" class="daily-payment-bar">
            <div class="daily-payment-summary"><span>Получателей <strong>{{ totals.count }}</strong></span><div><span>Итого к выдаче</span><strong class="daily-payment-total" :class="{'text-danger':!totals.valid}">{{ totals.valid ? money(totals.amount) + ' ₽' : 'Проверьте суммы' }}</strong></div></div>
            <div class="daily-payment-actions">
                <div><label for="daily-payment-date" class="form-label">Дата выплаты</label><input id="daily-payment-date" v-model="paymentDate" type="date" class="form-control form-control-sm" :disabled="busy"></div>
                <button class="btn btn-primary btn-sm" :disabled="busy || !table.rate_kopecks || !totals.count || !totals.valid || !paymentDate" @click="pay">Зафиксировать выдачу</button>
            </div>
        </div>
        <!-- --------- конец нового кода chat -->
        <!-- новый код chat: передаём месяцы табелей для истории выдач -->
        <DailyAllowanceHistoryComponent v-if="historyOpen" :agreement-id="route.params.id" :months="months" @close="historyOpen = false" @changed="historyChanged" />
    </div>
</template>
<!-- --------- конец нового кода chat -->

<script setup>
// --------- новый код chat: календарь, прогноз и атомарная массовая выдача
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '../../../api';
import { rememberSalaryMonth, restoreSalaryMonth } from '../../../utils/salaryMonthStorage'; // новый код chat: отдельный выбранный месяц суточных
import DailyAllowanceHistoryComponent from './DailyAllowanceHistoryComponent.vue';
const route = useRoute();
// --------- новый код chat: закрепление двух строк шапки в пределах таблицы суточных
const dailyTableElement = ref(null), dailyHeaderElement = ref(null), dailyHeaderOffset = ref(0);
let dailyHeaderFrame = 0, dailyHeaderObserver = null;
const updateDailyHeader = () => {
    dailyHeaderFrame = 0;
    if (!dailyTableElement.value || !dailyHeaderElement.value) return;
    const table = dailyTableElement.value.getBoundingClientRect();
    dailyHeaderOffset.value = Math.max(0, Math.min(-table.top, table.height - dailyHeaderElement.value.offsetHeight));
};
const scheduleDailyHeader = () => { if (!dailyHeaderFrame) dailyHeaderFrame = requestAnimationFrame(updateDailyHeader); };
watch([dailyTableElement, dailyHeaderElement], () => {
    dailyHeaderObserver?.disconnect();
    dailyHeaderObserver = new ResizeObserver(scheduleDailyHeader);
    if (dailyTableElement.value) dailyHeaderObserver.observe(dailyTableElement.value);
    if (dailyHeaderElement.value) dailyHeaderObserver.observe(dailyHeaderElement.value);
    scheduleDailyHeader();
}, {flush:'post'});
onMounted(() => {
    window.addEventListener('scroll', scheduleDailyHeader, {capture:true,passive:true});
    window.addEventListener('resize', scheduleDailyHeader);
});
onBeforeUnmount(() => {
    window.removeEventListener('scroll', scheduleDailyHeader, true);
    window.removeEventListener('resize', scheduleDailyHeader);
    dailyHeaderObserver?.disconnect();
    if (dailyHeaderFrame) cancelAnimationFrame(dailyHeaderFrame);
});
// --------- конец нового кода chat
const months = ref([]), monthID = ref(null), through = ref(''), paymentDate = ref(''), table = ref({employees:[]});
const amounts = ref({}), busy = ref(false), errorMessage = ref(''), successMessage = ref(''), historyOpen = ref(false);
let version = 0;
let pendingRequest = null;
const maximum = 9007199254740991n;
const money = cents => (Number(cents) / 100).toLocaleString('ru-RU', {minimumFractionDigits:2, maximumFractionDigits:2});
const amountText = cents => { const value = BigInt(cents); return `${value / 100n}.${String(value % 100n).padStart(2,'0')}`; };
const parseAmount = value => {
    const normalized = String(value ?? '').trim().replace(',', '.');
    if (!normalized) return 0n;
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
    const [rubles, cents = ''] = normalized.split('.');
    const result = BigInt(rubles) * 100n + BigInt(cents.padEnd(2,'0'));
    return result <= maximum ? result : null;
};
// --------- новый код chat: локальные пояснения без изменения расчёта и отправки
const amountError = employee => {
    const amount = parseAmount(amounts.value[employee.employee_card_id]);
    if (amount === null) return 'Введите положительную сумму до копеек.';
    const rate = BigInt(table.value.rate_kopecks || 0);
    if (amount > 0n && rate > 0n && amount % rate !== 0n) return `Сумма кратна ${money(table.value.rate_kopecks)} ₽`;
    return '';
};
// --------- конец нового кода chat
const monthLabel = month => new Date(month.year,month.month-1,1).toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
// новый код chat: подсветка только в месяце увольнения
const dismissedInCurrentMonth = employee => employee.status && employee.dismissal_date?.slice(0, 7) === `${table.value.year}-${String(table.value.month).padStart(2, '0')}`;
const shortName = employee => { const parts = (employee.employee_name || '').trim().split(/\s+/).filter(Boolean); return parts.length ? [parts[0], ...parts.slice(1).map(part => `${part[0]}.`)].join(' ') : `Сотрудник №${employee.employee_card_id}`; };
const errorText = err => typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось выполнить запрос. Повторите попытку.';
const days = computed(() => {
    if (!table.value.year || !table.value.month) return [];
    const count = new Date(table.value.year,table.value.month,0).getDate();
    return Array.from({length:count},(_,i) => {
        const date = new Date(table.value.year,table.value.month-1,i+1);
        return {date:`${table.value.year}-${String(table.value.month).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`,number:i+1,weekday:date.toLocaleDateString('ru-RU',{weekday:'short'}),weekend:[0,6].includes(date.getDay())};
    });
});
const eligible = computed(() => (table.value.employees || []).filter(row => row.is_assigned && row.enabled !== false)); // новый код chat
const totals = computed(() => {
    let total = 0n, count = 0; const rate = BigInt(table.value.rate_kopecks || 0);
    for (const employee of eligible.value) {
        const amount = parseAmount(amounts.value[employee.employee_card_id]);
        if (amount === null || (amount > 0n && (rate <= 0n || amount % rate !== 0n))) return {valid:false,count,amount:0};
        if (amount > 0n) { total += amount; count++; }
    }
    return {valid:total <= maximum,count,amount:Number(total)};
});
// --------- новый код chat: мгновенный прогноз по введённой сумме, без запросов и записи в БД
const isPreviewCovered = (employee, cell) => {
    if (editingList.value || employee.enabled === false || !employee.is_assigned || cell.state === 'letter' || !cell.preview_required_kopecks) return false;
    const amount = parseAmount(amounts.value[employee.employee_card_id]);
    const rate = BigInt(table.value.rate_kopecks || 0);
    return amount !== null && amount > 0n && rate > 0n && amount % rate === 0n && amount >= BigInt(cell.preview_required_kopecks);
};
// --------- конец нового кода chat
const cellTitle = cell => {
    if (cell.state === 'letter') return `${cell.date}: ${cell.mark}, суточные не начисляются`;
    if (cell.state === 'empty' && !cell.amount_kopecks) return `${cell.date}: нет начисления`;
    return `${cell.date}: ${cell.state === 'reserved' ? 'Обеспечено вперёд' : 'Оплачено'} ${money(cell.covered_kopecks)} из ${money(cell.amount_kopecks)} ₽`;
};
const loadTable = async() => {
    rememberSalaryMonth(route.params.id, 'daily-allowance', monthID.value); // новый код chat: сохраняем выбранный табель
    const current = ++version; busy.value = true; errorMessage.value = ''; amounts.value = {}; pendingRequest = null;
    if (!monthID.value) { table.value = {employees:[]}; busy.value = false; return; }
    try {
        const res = await api.get(`/agreements/${route.params.id}/daily-allowance`, {params:{month_id:monthID.value,through:through.value || undefined}});
        if (current !== version) return;
        table.value = res.data;
        if (!paymentDate.value) paymentDate.value = res.data.today;
        amounts.value = Object.fromEntries(res.data.employees.filter(row => row.is_assigned && row.enabled !== false).map(row => [row.employee_card_id,through.value ? amountText(row.suggested_kopecks) : '']));
    } catch (err) { if (current === version) errorMessage.value = errorText(err); }
    finally { if (current === version) busy.value = false; }
};
const changeMonth = () => { through.value = ''; table.value = {employees:[]}; successMessage.value = ''; loadTable(); };
const loadMonths = async() => {
    editingList.value = false; // новый код chat
    const current = ++version; busy.value = true; errorMessage.value = ''; successMessage.value = ''; historyOpen.value = false; through.value = ''; paymentDate.value = ''; table.value = {employees:[]}; months.value = []; monthID.value = null; amounts.value = {}; pendingRequest = null;
    try {
        const res = await api.get(`/agreements/${route.params.id}/timesheetmonth`);
        if (current !== version) return;
        months.value = (res.data || []).sort((a,b) => b.year-a.year || b.month-a.month || b.ID-a.ID);
        monthID.value = restoreSalaryMonth(route.params.id, 'daily-allowance', months.value); // новый код chat: восстановление месяца суточных
        await loadTable();
    } catch (err) { if (current === version) errorMessage.value = errorText(err); }
    finally { if (current === version) busy.value = false; }
};
const pay = async() => {
    if (editingList.value || busy.value || !totals.value.valid || !totals.value.count) return;
    if (!window.confirm(`Зафиксировать выдачу ${money(totals.value.amount)} ₽ для ${totals.value.count} сотрудников?`)) return;
    const payload = {month_id:monthID.value,date:paymentDate.value,payments:eligible.value.filter(row => parseAmount(amounts.value[row.employee_card_id]) > 0n).map(row => ({employee_card_id:row.employee_card_id,amount:amountText(parseAmount(amounts.value[row.employee_card_id]))}))};
    const signature = JSON.stringify(payload);
    if (!pendingRequest || pendingRequest.signature !== signature) pendingRequest = {signature,key:crypto.randomUUID()};
    const current = version; busy.value = true; errorMessage.value = ''; successMessage.value = '';
    try {
        await api.post(`/agreements/${route.params.id}/daily-allowance/payments`, {...payload,request_key:pendingRequest.key});
        if (current !== version) return;
        amounts.value = {}; pendingRequest = null; successMessage.value = 'Выдача сохранена. Балансы обновлены.';
        await loadTable();
    } catch (err) { if (current === version) errorMessage.value = errorText(err); }
    finally { if (current === version) busy.value = false; }
};
// --------- новый код chat: состав суточных по выбранному табелю
const editingList = ref(false), enabledDraft = ref({});
// --------- новый код chat: общий выбор и перенос неотмеченных вниз
const allEmployeesSelected = computed(() => !!table.value.employees?.length && table.value.employees.every(row => enabledDraft.value[row.employee_card_id]));
const toggleAllEmployees = () => {
    if (busy.value || !editingList.value) return;
    const selected = !allEmployeesSelected.value;
    enabledDraft.value = Object.fromEntries((table.value.employees || []).map(row => [row.employee_card_id, selected]));
};
const displayedEmployees = computed(() => {
    const employees = (table.value.employees || []).filter(row => editingList.value || row.enabled !== false);
    if (editingList.value) employees.sort((a, b) => Number(!!enabledDraft.value[b.employee_card_id]) - Number(!!enabledDraft.value[a.employee_card_id]));
    return employees;
});
// --------- конец нового кода chat
const editList = () => {
    enabledDraft.value = Object.fromEntries((table.value.employees || []).map(row => [row.employee_card_id, row.enabled !== false]));
    historyOpen.value = false;
    editingList.value = true;
};
const saveList = async() => {
    if (busy.value) return;
    busy.value = true; errorMessage.value = '';
    const current = version, selectedMonth = monthID.value;
    try {
        const enabled_ids = (table.value.employees || []).filter(row => enabledDraft.value[row.employee_card_id]).map(row => row.employee_card_id);
        await api.put(`/agreements/${route.params.id}/daily-allowance/list`, {month_id:selectedMonth, enabled_ids});
        if (current !== version) return;
        editingList.value = false; amounts.value = {}; through.value = ''; pendingRequest = null;
        successMessage.value = 'Список суточных сохранён.';
        await loadTable();
    } catch (err) { if (current === version) errorMessage.value = errorText(err); }
    finally { if (current === version) busy.value = false; }
};
// --------- конец нового кода chat
const historyChanged = () => { successMessage.value = ''; loadTable(); };
watch(() => route.params.id, loadMonths, {immediate:true});
onBeforeUnmount(() => { version++; });
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: белая закреплённая шапка без жёлтого фона выходных */
.daily-sticky-header { position: relative; z-index: 6; }
.daily-table thead th { background: #fff !important; color: #000; box-shadow: none; }
.daily-table thead th.daily-weekend { background: var(--bs-warning-bg-subtle, #fff3cd) !important; } /* новый код chat: суббота и воскресенье, без окрашивания чисел месяца */
/* --------- конец нового кода chat */
/* --------- новый код chat: календарь как в табеле, цвета оплаты и отдельная колонка ввода */
/* --------- новый код chat: скругление внешней рамки как у list-group в табеле */
.daily-scroll { border: 1px solid var(--bs-border-color); border-radius: var(--bs-border-radius); overflow: auto; }
.daily-table { width: max-content; min-width: 100%; margin-bottom: 0; font-size: 14px; }
.daily-table > thead > tr:first-child { border-top: 0; }
.daily-table > tbody > tr:last-child { border-bottom: 0; }
.daily-table > :not(caption) > tr > :first-child { border-left: 0; }
.daily-table > :not(caption) > tr > :last-child { border-right: 0; }
/* --------- конец нового кода chat */
.daily-table th, .daily-table td { height: 24px; padding: 1px 3px; } /* новый код chat: компактные строки */
/* --------- новый код chat: узкие закреплённые колонки номера и ФИО */
.daily-number { width: 32px; min-width: 32px; max-width: 32px; position: sticky; left: 0; z-index: 2; background: white; text-align: center; }
.daily-name { width: 225px; min-width: 225px; max-width: 225px; position: sticky; left: 32px; z-index: 1; background: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } /* новый код chat: ширина увеличена на 50% */
/* --------- конец нового кода chat */
.daily-day { min-width: 26px; width: 26px; text-align: center; }
.daily-through { width: 145px; font-size: 12px; } /* новый код chat: компактное поле даты обеспечения */
.daily-month { width: 200px; } /* новый код chat: уменьшенная ширина выбора месячного табеля */
.daily-table th.daily-selected-date { background: #dceeff !important; color: #000; box-shadow: none; } /* новый код chat: голубая подсветка обоих заголовков выбранной даты */
/* --------- новый код chat: размеры и насыщенность шрифта как в табеле */
.daily-table th, .daily-number { font-weight: 600; }
.daily-table .daily-day { font-size: 12px; font-weight: 600; }
.daily-table thead tr:first-child .daily-day { font-weight: 400; }
.daily-table tbody .daily-day { font-size: 10px; } /* новый код chat: уменьшенные буквенные отметки в ячейках */
/* --------- конец нового кода chat */
.daily-balance { min-width: 105px; }
.daily-issue { min-width: 130px; width: 145px; background: #dceeff !important; }
.daily-issue input { background: #eaf4ff; font-size: 14px; min-height: 20px; height: 20px; padding: 0 4px; } /* новый код chat: размер текста как в табеле, компактная высота */
/* --------- новый код chat: палитра ячеек из вкладки табеля */
.daily-paid { background: #20B936 !important; }
.daily-unpaid { background: #dd4433 !important; }
.daily-letter { background: #fff200 !important; }
.daily-reserved { background: #B8F0B5 !important; }
.daily-preview-worked { background: #eadcf5 !important; } /* новый код chat: прогноз погашения долга за отработанный день */
.daily-preview { background: #dceeff !important; } /* новый код chat: предварительное покрытие введённой суммой */
.daily-transferred { background: #dd4433 !important; }
/* новый код chat: подсветка ФИО при вводе суммы, включая переход клавишей Tab */
.daily-table tbody tr:focus-within .daily-name:not(.daily-transferred) { background: var(--bs-primary-bg-subtle, #cfe2ff) !important; }
/* --------- конец нового кода chat */
.daily-legend i { display: inline-block; width: 14px; height: 14px; border: 1px solid #aaa; border-radius: 4px; vertical-align: middle; margin-right: 4px; } /* новый код chat: скруглённые цветные обозначения */
/* Bootstrap рисует фон ячеек через внутреннюю тень. */
.daily-table td { box-shadow: none; }
/* --------- конец нового кода chat */
/* новый код chat: жёлтая отметка ФИО не скрывает статус перевода и выбор строки */
.daily-name.daily-itr-cell { background: #fff3cd; color: #000; } /* новый код chat: перевод и фокус сохраняют приоритет */
.daily-table td.daily-dismissed-days { background: #f8d7da; color: #842029; text-align: center; vertical-align: middle; font-size: 12px; } /* новый код chat: закрытые дни */
.daily-table tbody tr .daily-name.daily-dismissed-name { background-color: #f8d7da !important; } /* новый код chat: цвет увольнения приоритетнее ИТР и фокуса */
/* новый код chat: ссылка ФИО с сохранением оформления табеля */
.timesheet-employee-link { color: inherit; text-decoration: none; }
.timesheet-employee-link:hover { text-decoration: underline; }
.timesheet-employee-link:focus-visible { outline: 2px solid #0d6efd; outline-offset: 2px; }
/* новый код chat: колонка выбора рядом с номером, ФИО сохраняет закрепление */
.daily-check { width: 28px; min-width: 28px; position: sticky; left: 0; background: #fff; z-index: 2; text-align: center; }
.daily-editing-list .daily-number { left: 28px; }
.daily-editing-list .daily-name { left: 60px; }
/* --------- новый код chat: компактные панели и закреплённые денежные колонки */
.daily-page { color: #000; font-size: 14px; }
.daily-controls { border: 1px solid var(--bs-border-color); border-radius: 12px; background: #fff; margin-bottom: 12px; overflow: hidden; }
.daily-controls-top, .daily-controls-bottom { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; padding: 14px 16px; }
.daily-controls-top { justify-content: space-between; }
.daily-controls-bottom { background: #f8f9fa; border-top: 1px solid var(--bs-border-color); }
/* --------- новый код chat: панель ввода связана с таблицей, правила расположены выше */
.daily-table-toolbar { border: 1px solid var(--bs-border-color); border-bottom: 0; border-radius: 10px 10px 0 0; padding: 12px 14px; }
.daily-table-toolbar + .daily-scroll { border-radius: 0 0 10px 10px; }
.daily-table-toolbar .daily-rate { flex-direction: row; align-items: center; gap: 8px; min-width: 0; padding-right: 16px; border-right: 1px solid var(--bs-border-color); }
.daily-table-toolbar .daily-rate strong { font-size: 15px; white-space: nowrap; }
/* --------- конец нового кода chat */
.daily-heading h2 { font-size: 18px; font-weight: 600; margin: 0 0 4px; }
.daily-heading > span { font-size: 12px; color: #495057; }
.daily-month-tools, .daily-payment-actions { display: flex; align-items: end; gap: 10px; flex-wrap: wrap; }
.daily-page .form-label { font-size: 12px; font-weight: 600; margin-bottom: 4px; }
.daily-rate { min-width: 150px; display: flex; flex-direction: column; gap: 4px; }
.daily-rate > span { font-size: 12px; }
.daily-rate strong { font-size: 16px; }
.daily-forecast { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.daily-forecast .form-label { margin-bottom: 0; }
.daily-list-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-left: auto; }
.daily-edit-notice { display: flex; gap: 10px; padding: 12px 16px; background: #eaf4ff; border: 1px solid #b6d4fe; border-radius: 8px; margin-bottom: 12px; font-size: 13px; }
.daily-help { margin: 0 0 12px; border: 1px solid var(--bs-border-color); border-radius: 8px; background: #fff; }
.daily-help-title { padding: 9px 12px; margin: 0; font-size: 13px; font-weight: 500; } /* новый код chat: заголовок постоянного блока правил */
.daily-help-content { padding: 4px 12px 12px; }
.daily-help-content p { color: #495057; }
.daily-scroll { border-radius: 10px; }
.daily-balance { position: sticky; right: 145px; z-index: 2; background: #fff !important; }
.daily-issue { position: sticky; right: 0; z-index: 2; width: 145px; min-width: 145px; max-width: 145px; }
.daily-table thead .daily-balance, .daily-table thead .daily-issue { z-index: 3; }
.daily-table .daily-issue input.is-invalid { background-image: none; border-color: var(--bs-danger); padding-right: 4px; }
.daily-amount-error { display: block; color: #b02a37; font-size: 11px; line-height: 1.2; white-space: normal; padding: 3px 0; }
.daily-payment-bar { position: sticky; bottom: 0; z-index: 7; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; background: #fff; border: 1px solid var(--bs-border-color); border-radius: 10px; padding: 12px 16px; margin-top: 12px; box-shadow: 0 -3px 12px #0000000a; }
.daily-payment-summary { display: flex; align-items: center; flex-wrap: wrap; gap: 24px; }
.daily-payment-summary > span, .daily-payment-summary > div > span { font-size: 12px; }
.daily-payment-summary > div { display: flex; flex-direction: column; gap: 2px; }
.daily-payment-total { font-size: 18px; font-weight: 600; }
.daily-payment-actions input { width: 150px; }
@media (max-width: 767px) {
    .daily-controls-top, .daily-controls-bottom { padding: 12px; gap: 12px; }
    .daily-list-actions { margin-left: 0; width: 100%; }
    .daily-month-tools { width: 100%; }
    .daily-payment-bar { padding: 10px; }
    .daily-payment-summary { gap: 12px; }
    .daily-name { width: 160px; min-width: 160px; max-width: 160px; }
}
@media (max-width: 575px) {
    .daily-balance, .daily-issue { position: static; }
}
/* --------- конец нового кода chat */
</style>
