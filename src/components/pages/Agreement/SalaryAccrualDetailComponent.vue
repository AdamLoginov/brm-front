<!-- --------- новый код chat: подробности начисления сотрудника -->
<template>
    <Teleport to="body">
    <!-- новый код chat: стандартное модальное окно Bootstrap -->
    <div ref="dialog" class="modal salary-detail" tabindex="-1" aria-labelledby="salary-detail-title" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"><div class="modal-content">
        <div class="modal-body p-3 p-md-4">
            <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
                <div><h5 id="salary-detail-title" class="mb-1">{{ accrual.employee_name }}</h5><div class="text-secondary">{{ monthLabel }}</div></div>
                <button class="btn-close" aria-label="Закрыть" @click="close"></button>
            </div>
            <!-- --------- новый код chat: финансовые данные слева, справочные справа -->
            <div class="row g-3 mb-3 salary-summary">
                <div class="col-md-6">
                    <div v-for="item in financialRows" :key="item.label" class="d-flex justify-content-between gap-2 mb-1"><span>{{ item.label }}</span><strong>{{ money(item.value) }}</strong></div>
                    <div class="d-flex justify-content-between gap-2 mb-1"><span>Премии</span><strong>{{ money(accrual.bonuses_kopecks || 0) }} <span v-if="paymentPreview?.bonus" class="text-success">+ {{ money(paymentPreview.bonus) }}</span></strong></div>
                    <div v-if="paymentPreview?.companyDebt" class="d-flex justify-content-between gap-2 text-danger"><span>Новый долг К.</span><strong>+ {{ money(paymentPreview.companyDebt) }}</strong></div>
                    <div v-if="paymentPreview?.employeeDebt" class="d-flex justify-content-between gap-2 text-danger"><span>Новый долг С.</span><strong>+ {{ money(paymentPreview.employeeDebt) }}</strong></div>
                </div>
                <div class="col-md-6">
                    <div class="d-flex justify-content-between gap-2 mb-1"><span>Ставка за смену</span><strong>{{ money(accrual.salary_rate_kopecks) }}</strong></div>
                    <div class="d-flex justify-content-between gap-2 mb-1"><span>Устроен официально</span><strong>{{ accrual.officially_employed ? 'Да' : 'Нет' }}</strong></div>
                    <div class="d-flex justify-content-between gap-2 mb-1"><span>Оф. зарплата в месяц</span><strong>{{ accrual.officially_employed ? money(accrual.monthly_salary_kopecks || 0) : '—' }}</strong></div>
                    <div class="d-flex justify-content-between gap-2 mb-1"><span>Отработано часов</span><strong>{{ String(accrual.total_hours ?? 0).replace('.', ',') }}</strong></div>
                    <div class="d-flex justify-content-between gap-2 mb-1"><span>Часов в смене</span><strong>{{ accrual.shift_hours }}</strong></div>
                    <div class="d-flex justify-content-between gap-2"><span>Отработано смен</span><strong>{{ totalShifts }}</strong></div>
                </div>
            </div>
            <div class="border rounded p-3 mb-3">
                <div class="mb-2"><strong class="d-block">К выдаче</strong><strong class="d-block" style="font-size: 16px;">{{ money(Math.max(0, accrual.payable_kopecks)) }}</strong></div> <!-- новый код chat: сумма под надписью, 16 px -->
                <div v-if="accrual.payable_kopecks < 0" class="text-secondary small mb-2">Расчётный остаток: {{ money(accrual.payable_kopecks) }}</div>
                <label for="salary-detail-payment" class="form-label">Выплата, ₽</label>
                <MoneyInputComponent id="salary-detail-payment" v-model="editedPayment" class="form-control form-control-sm" :disabled="approved || busy" :class="{'is-invalid': !paymentPreview}" style="max-width: 220px;" /> <!-- новый код chat: денежное поле с разделением разрядов -->
                <div v-if="!paymentPreview" class="text-danger small mt-1">Введите неотрицательную сумму до копеек.</div>
                <div v-if="accrual.draft_reset" class="text-warning-emphasis small mt-2">Исходные данные изменились, сохранённая выплата сброшена.</div>
                <div v-if="actionError" class="alert alert-danger mt-2 mb-0" role="alert">{{ actionError }} <button class="btn btn-sm btn-outline-danger" :disabled="busy || saving" @click="emit('changed')">Обновить расчёт</button></div> <!-- новый код chat: восстановление после конфликта версии -->
                <div class="d-flex gap-2 flex-wrap align-items-center mt-3">
                    <template v-if="!approved">
                        <button v-if="differsFromCalculation" class="btn btn-primary btn-sm" :disabled="busy || saving || !paymentPreview || savedPayment" @click="emit('save-payment',{amount:editedPayment,reset:false})">{{ savedPayment ? 'Сохранено' : 'Сохранить' }}</button>
                        <button v-if="accrual.has_draft" class="btn btn-outline-secondary btn-sm" :disabled="busy || saving" @click="emit('save-payment',{amount:'',reset:true})">Сбросить к расчётной</button>
                        <button class="btn btn-primary btn-sm" :disabled="busy || saving || !paymentPreview || !approvalDate" @click="emit('approve',editedPayment)">Согласовать</button> <!-- новый код chat: синяя кнопка -->
                        <span class="text-secondary small">Дата согласования: {{ dateLabel(approvalDate) }}</span>
                    </template>
                    <template v-else><span class="text-success">Согласовано {{ dateLabel(approvalDate) }}</span><button class="btn btn-outline-secondary btn-sm" :disabled="busy || saving" @click="emit('cancel-approval')">Отменить согласование</button></template>
                </div>
            </div>
            <!-- --------- конец нового кода chat -->
            <div v-if="loading" class="text-secondary" role="status">Загружаем табель и удержания…</div>
            <div v-else-if="error" class="alert alert-danger" role="alert">{{ error }} <button class="btn btn-sm btn-outline-danger" @click="load">Повторить</button></div>
            <template v-else>
                <h6>Табель за {{ monthLabel }}</h6>
                <div class="salary-calendar mb-2">
                    <div v-for="weekday in weekdays" :key="weekday" class="calendar-heading">{{ weekday }}</div>
                    <div v-for="(day, index) in calendar" :key="index" class="calendar-day" :class="{'calendar-blank': !day}" :style="{backgroundColor: day ? timesheetColors[day.mark] || '#fff' : undefined}">
                        <template v-if="day"><span class="calendar-number">{{ day.number }}</span><strong :title="day.worked ? `${day.mark} ч.` : day.mark">{{ day.mark }}<small v-if="day.worked"> ч.</small></strong></template>
                    </div>
                </div>
                <section v-for="group in groups" :key="group.title" class="mt-3">
                    <h6>{{ group.title }} — {{ money(group.rows.reduce((sum, row) => sum + ((group.isPenalty && row.status !== 'active') || (group.isBonus && row.is_paid) ? 0 : Number(row.amount_kopecks)), 0)) }}</h6> <!-- новый код chat: в сумму удержаний входят только актуальные штрафы -->
                    <p class="small text-secondary">{{ group.description }}</p>
                    <div v-if="group.rows.length" class="table-responsive detail-table">
                        <table class="table table-sm table-bordered align-middle mb-0">
                            <!-- новый код chat: статус штрафа и прощение прогула -->
                            <thead class="table-light"><tr><th>{{ group.dateLabel }}</th><th v-if="group.isPenalty || group.isBonus">Статус</th><th class="text-end">Сумма</th><th>Комментарий</th><th v-if="group.isPenalty">Действия</th></tr></thead>
                            <tbody><tr v-for="row in group.rows" :key="row.ID">
                                <td class="text-nowrap">{{ group.isBonus ? monthLabel : dateLabel(row.date) }}</td>
                                <td v-if="group.isBonus"><span class="badge rounded-5 border bg-white fw-normal" :class="approved || row.is_paid ? 'text-secondary border-secondary' : 'text-success border-success'">{{ approved || row.is_paid ? 'Выплачена' : 'Не выплачена' }}</span></td> <!-- новый код chat: учтённые премии закрыты при согласовании -->
                                <td v-if="group.isPenalty"><span class="badge rounded-5 border bg-white fw-normal" :class="statusClass(approved && row.status === 'active' ? 'closed' : row.status)">{{ statusLabel(approved && row.status === 'active' ? 'closed' : row.status) }}</span></td> <!-- новый код chat: статус в момент согласования -->
                                <td class="text-end text-nowrap">{{ money(row.amount_kopecks) }}</td><td class="detail-comment">{{ row.comment || '—' }}</td>
                                <td v-if="group.isPenalty"><button v-if="canForgive(row)" class="btn btn-sm btn-outline-primary" :disabled="saving || busy" @click="forgive(row)">Простить</button></td>
                            </tr></tbody>
                        </table>
                    </div>
                    <p v-else class="text-secondary">{{ group.empty }}</p>
                </section>
            </template>
            <div class="text-end mt-3"><button class="btn btn-sm btn-secondary" @click="close">Закрыть</button></div>
        </div>
    </div></div></div>
    </Teleport>
</template>
<!-- --------- конец нового кода chat -->

<script setup>
// --------- новый код chat: данные выбранного сотрудника и календарь табеля
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import api from '../../../api';
import MoneyInputComponent from '../../MoneyInputComponent.vue'; // новый код chat: общее поле денежных сумм
import { Modal } from 'bootstrap/dist/js/bootstrap.bundle.min.js'; // новый код chat: тот же Bootstrap, что подключён в main.js
const props = defineProps({agreementId: {type: [String, Number], required: true}, month: {type: Object, required: true}, accrual: {type: Object, required: true}, approved:Boolean, approvalDate:String, paymentAmount:String, busy:Boolean, actionError:String}); // новый код chat: согласованная выплата
// --------- новый код chat: параметры согласованной выплаты
// новый код chat: локальный ввод меняет только предварительное отображение до сохранения
const editedPayment = ref(props.paymentAmount ?? '0');
watch(() => [props.accrual,props.paymentAmount], () => { editedPayment.value = props.paymentAmount ?? '0'; });
const paymentPreview = computed(() => {
    const text = String(editedPayment.value ?? '').replace(',', '.').trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
    const [whole,fraction = ''] = text.split('.');
    const cents = BigInt(whole)*100n + BigInt(fraction.padEnd(2,'0'));
    if (cents > 9007199254740991n) return null;
    const value = Number(cents);
    const base = Math.max(0, Number(props.accrual.payable_kopecks));
    return {amount:value,bonus:Math.max(0,value-base),companyDebt:Math.max(0,base-value),employeeDebt:Math.max(0,-Number(props.accrual.payable_kopecks))};
});
// --------- конец нового кода chat
const emit = defineEmits(['close', 'changed', 'save-payment', 'approve', 'cancel-approval']); // новый код chat: обновление начислений после прощения
// --------- новый код chat: сохранение отличающейся суммы и финансовая сводка
const differsFromCalculation = computed(() => !!paymentPreview.value && paymentPreview.value.amount !== Math.max(0,Number(props.accrual.payable_kopecks)));
const savedPayment = computed(() => props.accrual.has_draft && paymentPreview.value?.amount === Math.round(Number(props.paymentAmount)*100));
const financialRows = computed(() => [
    {label:'Начислено',value:props.accrual.amount_kopecks},
    {label:'Расходы',value:props.accrual.expenses_kopecks || 0},
    {label:'Авансы',value:props.accrual.advances_kopecks || 0},
    {label:'Штрафы',value:props.accrual.penalties_kopecks || 0},
    {label:'Вычет 13%',value:props.accrual.deduction_kopecks || 0},
    {label:'Долг К.',value:props.accrual.company_debt_kopecks || 0},
    {label:'Долг С.',value:props.accrual.employee_debt_kopecks || 0},
]);
// --------- конец нового кода chat
const saving = ref(false); // новый код chat: защита от повторной отправки
const dialog = ref(null), loading = ref(true), error = ref('');
const entries = ref([]), advances = ref([]), penalties = ref([]);
const expenses = ref([]); // новый код chat: невозмещённые личные расходы
const debts = ref([]); // новый код chat: активные долги расчёта
const bonuses = ref([]); // новый код chat: премии выбранного месяца всех статусов
let version = 0;
// --------- новый код chat: палитра отметок из табеля
const timesheetColors = {
    '':   '#fff',
    'Д':  '#c07ff1',
    'В':  '#fff200',
    'П':  '#dd4433',
    'Б':  '#e97c17',
    '0':  '#fff200',
    '1':  '#B8F0B5',
    '2':  '#A9EBAA',
    '3':  '#9AE69E',
    '4':  '#8BE193',
    '5':  '#7CDC87',
    '6':  '#6DD77B',
    '7':  '#5ED26F',
    '8':  '#4FCD63',
    '9':  '#40C857',
    '10': '#31C34B',
    '11': '#28BE3F',
    '12': '#20B936',
    '13': '#A8D8FF',
    '14': '#94D0FF',
    '15': '#80C8FF',
    '16': '#6BC0FF',
    '17': '#57B8FF',
    '18': '#43B0FF',
    '19': '#2FA8FF',
    '20': '#1B9FFF',
    '21': '#1293F0',
    '22': '#0987E0',
    '23': '#047BD0',
    '24': '#006FC0',
};
let modal = null, previousFocus = null;
const close = () => modal?.hide();
const afterHidden = () => { previousFocus?.focus(); emit('close'); };
// --------- конец нового кода chat
const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const money = value => (Number(value) / 100).toLocaleString('ru-RU', {style:'currency', currency:'RUB'});
// --------- новый код chat: смены с одним знаком после запятой, как в начислениях
const totalShifts = computed(() => {
    const hours = Number(props.accrual.total_hours), shiftHours = Number(props.accrual.shift_hours);
    return (shiftHours > 0 && Number.isFinite(hours) ? hours / shiftHours : 0).toLocaleString('ru-RU', {minimumFractionDigits: 1, maximumFractionDigits: 1});
});
// --------- конец нового кода chat
const dateLabel = value => value.split('-').reverse().join('.');
const monthLabel = computed(() => new Date(props.month.year, props.month.month - 1, 1).toLocaleDateString('ru-RU', {month:'long', year:'numeric'}));
const monthPrefix = computed(() => `${props.month.year}-${String(props.month.month).padStart(2, '0')}`);
const calendar = computed(() => {
    const marks = new Map();
    for (const entry of [...entries.value].sort((a,b) => a.ID - b.ID)) marks.set(entry.date, entry.status);
    const offset = (new Date(props.month.year, props.month.month - 1, 1).getDay() + 6) % 7;
    const count = new Date(props.month.year, props.month.month, 0).getDate();
    const days = Array(offset).fill(null);
    for (let number = 1; number <= count; number++) {
        const mark = String(marks.get(`${monthPrefix.value}-${String(number).padStart(2, '0')}`) || '').trim();
        const numeric = /^\d+(?:[.,]\d+)?$/.test(mark);
        days.push({number, mark, worked: numeric && Number(mark.replace(',', '.')) > 0, letter: !!mark && !numeric});
    }
    while (days.length % 7) days.push(null);
    return days;
});
const groups = computed(() => [
    {title:'Долг компании',description:'Прибавляется к выплате. Активные долги за все месяцы договора.',dateLabel:'Дата начисления',rows:debts.value.filter(row => row.side === 'company'),empty:'Долгов компании нет.'}, // новый код chat
    {title:'Долг сотрудника',description:'Вычитается из выплаты. Активные долги за все месяцы договора.',dateLabel:'Дата начисления',rows:debts.value.filter(row => row.side === 'employee'),empty:'Долгов сотрудника нет.'}, // новый код chat
    {title:'Премии', isBonus:true, description:'Премии за выбранный месяц. К выплате прибавляются только невыплаченные.', dateLabel:'Месяц премии', rows:bonuses.value, empty:'Премий за этот месяц нет.'}, // новый код chat
    {title:'Возмещение расходов', description:'Невозмещённые личные расходы по договору за все месяцы. Прибавляются к выплате.', dateLabel:'Дата расхода', rows:expenses.value, empty:'Невозмещённых личных расходов нет.'}, // новый код chat
    {title:'Авансы', description:'Актуальные авансы по договору, учитываемые в начислении.', dateLabel:'Дата выплаты', rows:advances.value, empty:'Актуальных авансов нет.'},
    {title:'Штрафы', isPenalty:true, description:'Штрафы за месяц выбранного табеля. В сумму удержаний входят только актуальные.', dateLabel:'Дата назначения', rows:penalties.value, empty:'Штрафов за этот месяц нет.'}, // новый код chat: сохраняем видимость прощённых штрафов
]);
// --------- новый код chat: прощение штрафа за прогул через существующее API
const statusLabel = status => ({active:'Актуален', closed:'Закрыт', forgiven:'Прощён'}[status] || status);
const statusClass = status => ({active:'text-success border-success', closed:'text-secondary border-secondary', forgiven:'text-primary border-primary'}[status] || 'text-secondary border-secondary');
const canForgive = row => !props.approved && row.status === 'active' && (row.source_time_sheet_id || (row.comment || '').trim().toLocaleLowerCase('ru-RU') === 'прогул');
const forgive = async(row) => {
    if (saving.value || !canForgive(row) || !window.confirm('Простить штраф за прогул? Он больше не будет вычитаться из начисления.')) return;
    const current = version; saving.value = true;
    try {
        const res = await api.patch(`/agreements/${props.agreementId}/penalties/${row.ID}/status`, {status:'forgiven'});
        emit('changed');
        if (current !== version) return;
        penalties.value = penalties.value.map(item => item.ID === row.ID ? res.data : item);
    } catch (err) {
        if (current === version) error.value = typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось простить штраф.';
    } finally { if (current === version) saving.value = false; }
};
// --------- конец нового кода chat
const load = async() => {
    const current = ++version; loading.value = true; error.value = '';
    // --------- новый код chat: календарь и списки из единого расчёта или сохранённого снимка
    if (props.accrual.detail) {
        const detail = props.accrual.detail;
        entries.value = detail.time_sheets || [];
        advances.value = detail.advances || [];
        penalties.value = detail.penalties || [];
        bonuses.value = detail.bonuses || [];
        debts.value = detail.debts || [];
        expenses.value = (detail.expenses || []).map(row => ({ID:row.ID,date:row.CreatedAt.slice(0,10),amount_kopecks:Math.round(Number(row.price)*100),comment:row.name}));
        loading.value = false;
        return;
    }
    // --------- конец нового кода chat
    try {
        const [sheet, advanceRows, penaltyRows, expenseRows, bonusRows] = await Promise.all([ // новый код chat: загрузка премий
            api.get(`/agreements/timesheetmonth/detail/${props.month.ID}`),
            api.get(`/agreements/${props.agreementId}/advances`),
            api.get(`/agreements/${props.agreementId}/penalties`),
            api.get(`/agreements/${props.agreementId}/expenses`), // новый код chat
            api.get(`/agreements/${props.agreementId}/bonuses`), // новый код chat
        ]);
        if (current !== version) return;
        const belongs = row => Number(row.employee_card_id) === Number(props.accrual.employee_card_id);
        const byDate = (a,b) => a.date.localeCompare(b.date) || a.ID - b.ID;
        bonuses.value = (bonusRows.data || []).filter(row => belongs(row) && Number(row.month) === Number(props.month.month) && Number(row.year) === Number(props.month.year)); // новый код chat: премии строго за месяц табеля
        // --------- новый код chat: приводим личные расходы к общему виду списков
        expenses.value = (expenseRows.data.expenses || []).filter(row => belongs(row) && row.account === 'employee' && !row.is_reimbursed).map(row => ({ID:row.ID, date:row.CreatedAt.slice(0,10), amount_kopecks:Math.round(Number(row.price) * 100), comment:row.name})).sort(byDate);
        // --------- конец нового кода chat
        entries.value = (sheet.data.time_sheets || []).filter(belongs);
        advances.value = (advanceRows.data || []).filter(row => belongs(row) && !row.is_settled).sort(byDate);
        penalties.value = (penaltyRows.data || []).filter(row => belongs(row) && row.date.startsWith(`${monthPrefix.value}-`)).sort(byDate); // новый код chat: все статусы штрафов выбранного месяца
    } catch (err) {
        if (current === version) error.value = typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось загрузить подробности начисления.';
    } finally { if (current === version) loading.value = false; }
};
// --------- новый код chat: открытие и очистка Bootstrap Modal без анимации
watch(() => props.accrual, load); // новый код chat: обновление состава после пересчёта
onMounted(() => {
    previousFocus = document.activeElement;
    dialog.value.addEventListener('hidden.bs.modal', afterHidden);
    modal = new Modal(dialog.value);
    modal.show();
    load();
});
onBeforeUnmount(() => {
    version++;
    dialog.value?.removeEventListener('hidden.bs.modal', afterHidden);
    modal?.hide();
    modal?.dispose();
});
// --------- конец нового кода chat
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: непрозрачное окно и календарь сотрудника */
.salary-detail { font-size: 14px; } /* новый код chat: размеры и фон задаёт Bootstrap Modal */
.salary-calendar { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
.calendar-heading { text-align: center; font-size: 12px; padding: 4px; }
.calendar-day { min-height: 64px; border: 1px solid var(--bs-border-color); border-radius: 6px; padding: 5px; display: flex; flex-direction: column; }
.calendar-day strong { text-align: center; overflow-wrap: anywhere; }
.calendar-number { font-size: 12px; }
.calendar-blank { visibility: hidden; }
.detail-table { border-radius: 6px; border: 1px solid var(--bs-border-color); overflow: auto; }
/* --------- новый код chat: внешняя граница 1 px без дублирующих границ таблицы */
.detail-table .table > thead > tr:first-child { border-top: 0; }
.detail-table .table > tbody > tr:last-child { border-bottom: 0; }
.detail-table .table > :not(caption) > tr > :first-child { border-left: 0; }
.detail-table .table > :not(caption) > tr > :last-child { border-right: 0; }
/* --------- конец нового кода chat */
.detail-table th { font-weight: 600; }
.detail-comment { white-space: pre-wrap; overflow-wrap: anywhere; min-width: 120px; }
/* --------- конец нового кода chat */
</style>
