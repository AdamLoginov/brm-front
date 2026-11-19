<!-- --------- новый код chat: календарь суточных и массовая выдача -->
<template>
    <div>
        <!-- новый код chat: компактный выбор табеля и история выдач рядом -->
        <div class="d-flex gap-2 align-items-end flex-wrap mb-3">
            <div><label for="daily-month" class="form-label">Месячный табель</label><select id="daily-month" v-model="monthID" class="form-select form-select-sm daily-month" :disabled="busy || !months.length" @change="changeMonth"><option v-for="month in months" :key="month.ID" :value="month.ID">{{ monthLabel(month) }} · №{{ month.ID }}</option></select></div>
            <div><button class="btn btn-sm btn-outline-primary" :disabled="busy" @click="historyOpen = true">История выдач</button></div>
        </div>
        <div v-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
        <div v-if="successMessage" class="alert alert-success" role="status">{{ successMessage }}</div>
        <div v-if="!busy && months.length && !table.rate_kopecks" class="alert alert-info">Укажите суточные в настройках табеля. Выдача и автозаполнение пока недоступны.</div>
        <div v-if="table.forecast_warning" class="alert alert-warning">{{ table.forecast_warning }}. Прогноз оплаты будущих дней неполный.</div>
        <!-- новый код chat: пояснение перенесено над обозначениями цветов -->
        <p class="small text-secondary">Суммы должны быть кратны суточным выбранного табеля. Прогноз округляется вверх, остаток сохраняется. Красное ФИО — сотрудник переведён; новые выдачи здесь недоступны.</p>
        <div class="d-flex gap-3 flex-wrap small mb-3 daily-legend">
            <!-- новый код chat: формулировки оплаты дней -->
            <span><i class="daily-paid"></i>С — отработан и оплачен</span><span><i class="daily-unpaid"></i>Отработан, не оплачен полностью</span><span><i class="daily-letter"></i>Буквенная отметка</span><span><i class="daily-reserved"></i>День обеспечен вперёд</span>
            <span><i class="daily-preview"></i>Будущий день будет оплачен</span><span><i class="daily-preview-worked"></i>Отработанный день будет оплачен</span> <!-- новый код chat: отдельные цвета прогноза и погашения долга -->
        </div>
        <!-- новый код chat: одинаковая сумма и выбор сотрудников удалены; ставка сохранена -->
        <div class="d-flex align-items-center gap-3 flex-wrap mb-2"> <!-- новый код chat: ставка и дата обеспечения в одной строке -->
            <span>Суточные: <strong>{{ money(table.rate_kopecks || 0) }}</strong></span>
            <!-- новый код chat: компактное поле даты справа от ставки суточных -->
            <div class="d-flex align-items-center gap-2 flex-wrap"><label for="daily-through" class="form-label mb-0 small">Обеспечить по дату включительно</label><input id="daily-through" v-model="through" type="date" class="form-control form-control-sm daily-through" :disabled="busy || !monthID || !table.rate_kopecks" @change="loadTable"></div>
        </div>
        <div v-if="busy" class="text-secondary py-2" role="status">Обрабатываем суточные…</div>
        <div v-if="!months.length && !busy" class="alert alert-info">Сначала создайте месячный табель.</div>
        <div v-if="monthID" class="table-responsive daily-scroll">
            <table ref="dailyTableElement" class="table table-sm table-bordered align-middle daily-table">
                <thead ref="dailyHeaderElement" class="daily-sticky-header" :style="{transform: `translateY(${dailyHeaderOffset}px)`}"> <!-- новый код chat: закреплённый белый заголовок -->
                    <!-- новый код chat: выбранная дата подсвечивает число и день недели голубым, остальные выходные сохраняют свой фон -->
                    <tr><th rowspan="2" class="daily-number">№</th><th rowspan="2" class="daily-name">Сотрудник</th><th v-for="day in days" :key="day.date" class="daily-day" :class="{'daily-weekend':day.weekend && day.date !== through, 'daily-selected-date':day.date === through}">{{ day.weekday }}</th><th rowspan="2" class="daily-balance">Баланс, ₽</th><th rowspan="2" class="daily-issue">К выдаче, ₽</th></tr> <!-- новый код chat: светло-жёлтый фон только названий выходных -->
                    <tr><th v-for="day in days" :key="day.date" class="daily-day" :class="{'daily-selected-date':day.date === through}">{{ day.number }}</th></tr>
                </thead>
                <tbody>
                    <tr v-for="(employee, index) in table.employees" :key="employee.employee_card_id">
                        <td class="daily-number">{{ index + 1 }}</td> <!-- новый код chat: номер строки -->
                        <td class="daily-name" :class="{'daily-transferred':!employee.is_assigned, 'daily-itr-cell':employee.is_itr}" :title="employee.employee_name + (employee.is_assigned ? '' : ' — больше не закреплён за договором')"> <!-- новый код chat: ИТР — фон всей ячейки -->
                            <router-link :to="{ name: 'employee-card-detail', params: { id: employee.employee_card_id } }" class="timesheet-employee-link" :title="employee.is_itr ? 'Открыть карточку сотрудника ИТР' : 'Открыть карточку сотрудника'">{{ shortName(employee) }}</router-link> <!-- новый код chat: фон перенесён на ячейку -->
                        </td>
                        <td v-for="cell in employee.cells" :key="cell.date" class="daily-day" :class="isPreviewCovered(employee, cell) ? (cell.state === 'unpaid' ? 'daily-preview-worked' : 'daily-preview') : `daily-${cell.state}`" :title="isPreviewCovered(employee, cell) ? `${cell.date}: будет оплачен после фиксации выдачи` : cellTitle(cell)">{{ cell.mark }}</td> <!-- новый код chat: покрытие отработанного дня выделено сиреневым без дополнительной отметки -->
                        <td class="text-end daily-balance" :class="employee.balance_kopecks < 0 ? 'text-danger' : 'text-success'">{{ money(employee.balance_kopecks) }}</td>
                        <td class="daily-issue"><input v-if="employee.is_assigned" v-model="amounts[employee.employee_card_id]" inputmode="decimal" class="form-control form-control-sm" :disabled="busy || !table.rate_kopecks" :aria-label="`К выдаче: ${employee.employee_name}`" placeholder="0,00"></td>
                    </tr>
                    <tr v-if="!table.employees?.length && !busy"><td :colspan="days.length + 4" class="text-secondary">Сотрудников пока нет.</td></tr>
                </tbody>
            </table>
        </div>
        <div class="d-flex gap-3 align-items-center flex-wrap my-3">
            <span>Получателей: <strong>{{ totals.count }}</strong></span><span>Итого к выдаче: <strong>{{ totals.valid ? money(totals.amount) : 'Проверьте суммы' }}</strong></span>
            <!-- новый код chat: дата выплаты непосредственно перед фиксацией выдачи -->
            <div class="d-flex align-items-center gap-2"><label for="daily-payment-date" class="form-label mb-0 text-nowrap">Дата выплаты</label><input id="daily-payment-date" v-model="paymentDate" type="date" class="form-control form-control-sm" :disabled="busy"></div>
            <button class="btn btn-primary btn-sm" :disabled="busy || !table.rate_kopecks || !totals.count || !totals.valid || !paymentDate" @click="pay">Зафиксировать выдачу</button>
        </div>
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
const monthLabel = month => new Date(month.year,month.month-1,1).toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
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
const eligible = computed(() => (table.value.employees || []).filter(row => row.is_assigned));
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
    if (!employee.is_assigned || cell.state === 'letter' || !cell.preview_required_kopecks) return false;
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
        amounts.value = Object.fromEntries(res.data.employees.filter(row => row.is_assigned).map(row => [row.employee_card_id,through.value ? amountText(row.suggested_kopecks) : '']));
    } catch (err) { if (current === version) errorMessage.value = errorText(err); }
    finally { if (current === version) busy.value = false; }
};
const changeMonth = () => { through.value = ''; table.value = {employees:[]}; successMessage.value = ''; loadTable(); };
const loadMonths = async() => {
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
    if (busy.value || !totals.value.valid || !totals.value.count) return;
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
/* новый код chat: ссылка ФИО с сохранением оформления табеля */
.timesheet-employee-link { color: inherit; text-decoration: none; }
.timesheet-employee-link:hover { text-decoration: underline; }
.timesheet-employee-link:focus-visible { outline: 2px solid #0d6efd; outline-offset: 2px; }
</style>
