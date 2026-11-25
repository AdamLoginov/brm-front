<!-- --------- новый код chat: подробности начисления сотрудника -->
<template>
    <Teleport to="body">
    <!-- новый код chat: стандартное модальное окно Bootstrap -->
    <div ref="dialog" class="modal salary-detail" tabindex="-1" aria-labelledby="salary-detail-title" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable salary-dialog"><div class="modal-content">
        <!-- новый код chat: постоянная шапка с сотрудником и состоянием расчёта -->
            <div class="modal-header salary-header align-items-start">
                <div><h5 id="salary-detail-title" class="mb-1"><router-link :to="{ name: 'employee-card-detail', params: { id: accrual.employee_card_id } }" class="salary-employee-link">{{ accrual.employee_name }}</router-link></h5><!-- новый код chat: переход из начисления в карточку сотрудника --><div class="salary-header-meta"><span>{{ monthLabel }}</span><span class="salary-state" :class="approved ? 'salary-state-approved' : 'salary-state-draft'">{{ approved ? 'Согласовано' : 'Расчёт' }}</span></div></div>
                <button class="btn-close" aria-label="Закрыть" @click="close"></button>
            </div>
        <div class="modal-body p-3 p-md-4">
            <!-- --------- новый код chat: финансовые данные слева, справочные справа -->
            <div class="row g-3 mb-3 salary-summary">
                <!-- новый код chat: работа и ставка слева, расчёт зарплаты справа -->
                <div class="col-md-6"><section class="salary-info-panel salary-reference-panel">
                    <h6 class="salary-section-title"><i class="bi bi-person-badge" aria-hidden="true"></i> Работа и ставка</h6>
                    <div class="d-flex justify-content-between gap-2 mb-1"><span>Ставка за смену</span><strong>{{ money(accrual.salary_rate_kopecks) }}</strong></div>
                    <div class="d-flex justify-content-between gap-2 mb-1"><span>Устроен официально</span><strong>{{ accrual.officially_employed ? 'Да' : 'Нет' }}</strong></div>
                    <!-- новый код chat: отметка об алиментах из профиля сотрудника -->
                    <div class="d-flex justify-content-between gap-2 mb-1"><span>Алименты</span><strong>{{ accrual.has_alimony ? 'Да' : 'Нет' }}</strong></div>
                    <div class="d-flex justify-content-between gap-2 mb-1"><span>Оф. зарплата в месяц</span><strong>{{ accrual.officially_employed ? money(accrual.monthly_salary_kopecks || 0) : '—' }}</strong></div>
                    <div class="d-flex justify-content-between gap-2 mb-1"><span>Отработано часов</span><strong>{{ String(accrual.total_hours ?? 0).replace('.', ',') }}</strong></div>
                    <div class="d-flex justify-content-between gap-2 mb-1"><span>Часов в смене</span><strong>{{ accrual.shift_hours }}</strong></div>
                    <div class="d-flex justify-content-between gap-2"><span>Отработано смен</span><strong>{{ totalShifts }}</strong></div>
                </section></div>
                <div class="col-md-6"><section class="salary-info-panel">
                    <h6 class="salary-section-title"><i class="bi bi-calculator" aria-hidden="true"></i> Расчёт зарплаты</h6>
                    <div v-for="item in financialRows" :key="item.label" class="d-flex justify-content-between gap-2 mb-1"><span>{{ item.label }}</span><strong>{{ money(item.value) }}</strong></div>
                    <div class="d-flex justify-content-between gap-2 mb-1"><span>Премии</span><strong>{{ money(accrual.bonuses_kopecks || 0) }} <span v-if="paymentPreview?.bonus" class="text-success">+ {{ money(paymentPreview.bonus) }}</span></strong></div>
                    <div v-if="paymentPreview?.companyDebt" class="d-flex justify-content-between gap-2 text-danger"><span>Новый долг К.</span><strong>+ {{ money(paymentPreview.companyDebt) }}</strong></div>
                    <div v-if="paymentPreview?.employeeDebt" class="d-flex justify-content-between gap-2 text-danger"><span>Новый долг С.</span><strong>+ {{ money(paymentPreview.employeeDebt) }}</strong></div>
                </section></div>
            </div>
            <!-- новый код chat: итог и поля ввода в едином блоке выплаты -->
            <section class="salary-payment-panel mb-4">
              <div class="salary-payment-grid">
               <div class="salary-payable">
                <div class="mb-2"><strong class="d-block">К выдаче</strong><strong class="d-block salary-payable-amount">{{ money(Math.max(0, previewPayable)) }}</strong></div> <!-- новый код chat: сумма под надписью, 16 px -->
                <div v-if="previewPayable < 0" class="text-secondary small mb-2">Расчётный остаток: {{ money(previewPayable) }}</div>
               </div>
                <!-- новый код chat: сумма алиментов сохраняется вместе с выплатой -->
                <div v-if="accrual.has_alimony" class="salary-input-group">
                    <label for="salary-detail-alimony" class="form-label">Алименты, ₽</label>
                    <MoneyInputComponent id="salary-detail-alimony" v-model="editedAlimony" class="form-control form-control-sm" :disabled="approved || busy" :class="{'is-invalid': alimonyCents === null}" />
                    <div v-if="alimonyCents === null" class="text-danger small">Введите сумму от нуля до копеек.</div>
                </div>
                <div class="salary-input-group">
                <label for="salary-detail-payment" class="form-label">Выплата, ₽</label>
                <MoneyInputComponent id="salary-detail-payment" v-model="editedPayment" class="form-control form-control-sm" :disabled="approved || busy" :class="{'is-invalid': !paymentPreview}" /> <!-- новый код chat: денежное поле с разделением разрядов -->
                <div v-if="!paymentPreview" class="text-danger small mt-1">Введите неотрицательную сумму до копеек.</div>
                </div>
              </div>
                <div v-if="accrual.draft_reset" class="text-warning-emphasis small mt-2">Исходные данные изменились, сохранённая выплата сброшена.</div>
                <div v-if="actionError" class="alert alert-danger mt-2 mb-0" role="alert">{{ actionError }} <button class="btn btn-sm btn-outline-danger" :disabled="busy || saving" @click="emit('changed')">Обновить расчёт</button></div> <!-- новый код chat: восстановление после конфликта версии -->
                <div class="salary-actions d-flex gap-2 flex-wrap align-items-center">
                    <template v-if="!approved">
                        <button v-if="differsFromCalculation || alimonyChanged" class="btn btn-success btn-sm" :disabled="busy || saving || !paymentPreview || alimonyCents === null || savedPayment" @click="emit('save-payment',{amount:editedPayment,alimony_amount:editedAlimony,reset:false})">{{ savedPayment ? 'Сохранено' : 'Сохранить' }}</button>
                        <button v-if="accrual.has_draft" class="btn btn-outline-secondary btn-sm" :disabled="busy || saving" @click="emit('save-payment',{amount:'',reset:true})">Сбросить к расчётной</button>
                        <button class="btn btn-primary btn-sm" :disabled="busy || saving || !paymentPreview || alimonyChanged || alimonyCents === null || !approvalDate" @click="emit('approve',editedPayment)">Согласовать</button> <!-- новый код chat: синяя кнопка -->
                        <!-- новый код chat: согласование использует сохранённые алименты -->
                        <span v-if="alimonyChanged" class="text-secondary small">Сначала сохраните сумму алиментов.</span>
                        <span class="text-secondary small">Дата согласования: {{ dateLabel(approvalDate) }}</span>
                    </template>
                    <template v-else><span class="text-success">Согласовано {{ dateLabel(approvalDate) }}</span><button class="btn btn-outline-secondary btn-sm" :disabled="busy || saving" @click="emit('cancel-approval')">Отменить согласование</button></template>
                </div>
            </section>
            <!-- --------- конец нового кода chat -->
            <div v-if="loading" class="text-secondary" role="status">Загружаем табель и удержания…</div>
            <div v-else-if="error" class="alert alert-danger" role="alert">{{ error }} <button class="btn btn-sm btn-outline-danger" @click="load">Повторить</button></div>
            <template v-else>
                <section class="salary-calendar-panel"><h6 class="salary-section-title"><i class="bi bi-calendar3" aria-hidden="true"></i> Табель за {{ monthLabel }}</h6>
                <div class="salary-calendar mb-2">
                    <div v-for="weekday in weekdays" :key="weekday" class="calendar-heading">{{ weekday }}</div>
                    <div v-for="(day, index) in calendar" :key="index" class="calendar-day" :class="{'calendar-blank': !day}" :style="{backgroundColor: day ? timesheetColors[day.mark] || '#fff' : undefined}">
                        <template v-if="day"><span class="calendar-number">{{ day.number }}</span><strong :title="day.worked ? `${day.mark} ч.` : day.mark">{{ day.mark }}<small v-if="day.worked"> ч.</small></strong></template>
                    </div>
                </div>
                </section>
                <section v-for="group in groups" :key="group.title" class="salary-record-panel">
                    <h6 class="salary-record-heading"><span>{{ group.title }}</span><strong>{{ money(group.rows.reduce((sum, row) => sum + ((group.isPenalty && row.status !== 'active') || (group.isBonus && row.is_paid) ? 0 : Number(row.amount_kopecks)), 0)) }}</strong></h6> <!-- новый код chat: в сумму удержаний входят только актуальные штрафы -->
                    <p class="salary-record-description">{{ group.description }}</p>
                    <!-- --------- новый код chat: компактные списки вместо таблиц -->
                    <ul v-if="group.rows.length" class="salary-entry-list">
                        <li v-for="row in group.rows" :key="row.ID" class="salary-entry">
                            <div class="salary-entry-content">
                                <div class="salary-entry-date"><i class="bi bi-calendar3" aria-hidden="true"></i><span>{{ group.dateLabel }}: {{ group.isBonus ? monthLabel : dateLabel(row.date) }}</span></div>
                                <p class="salary-entry-comment" :class="{'salary-entry-empty': !row.comment}">{{ row.comment || 'Без комментария' }}</p>
                            </div>
                            <div class="salary-entry-summary">
                                <strong class="salary-entry-amount">{{ money(row.amount_kopecks) }}</strong>
                                <div v-if="group.isBonus || group.isPenalty" class="salary-entry-actions">
                                    <span v-if="group.isBonus" class="badge rounded-5 border bg-white fw-normal" :class="approved || row.is_paid ? 'text-secondary border-secondary' : 'text-success border-success'">{{ approved || row.is_paid ? 'Выплачена' : 'Не выплачена' }}</span>
                                    <span v-if="group.isPenalty" class="badge rounded-5 border bg-white fw-normal" :class="statusClass(approved && row.status === 'active' ? 'closed' : row.status)">{{ statusLabel(approved && row.status === 'active' ? 'closed' : row.status) }}</span>
                                    <button v-if="group.isPenalty && canForgive(row)" class="btn btn-sm btn-link salary-forgive-button" :disabled="saving || busy" @click="forgive(row)">Простить</button>
                                </div>
                            </div>
                        </li>
                    </ul>
                    <!-- --------- конец нового кода chat -->
                    <p v-else class="salary-empty">{{ group.empty }}</p>
                </section>
            </template>
        </div>
        <!-- новый код chat: кнопка закрытия доступна при прокрутке -->
        <div class="modal-footer salary-footer"><button class="btn btn-sm btn-outline-secondary" @click="close">Закрыть</button></div>
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
// --------- новый код chat: предварительный расчёт алиментов в копейках
const editedAlimony = ref((Number(props.accrual.alimony_kopecks || 0)/100).toFixed(2));
const alimonyCents = computed(() => {
    const text = String(editedAlimony.value ?? '').replace(',', '.').trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
    const [whole, fraction = ''] = text.split('.');
    const cents = BigInt(whole)*100n + BigInt(fraction.padEnd(2,'0'));
    return cents <= 9007199254740991n ? Number(cents) : null;
});
const alimonyChanged = computed(() => alimonyCents.value !== Number(props.accrual.alimony_kopecks || 0));
const previewPayable = computed(() => Number(props.accrual.payable_kopecks) + Number(props.accrual.alimony_kopecks || 0) - (alimonyCents.value ?? Number(props.accrual.alimony_kopecks || 0)));
watch(previewPayable, (value, previous) => {
    if (!props.approved && Number(editedPayment.value) === Math.max(0,previous)/100) editedPayment.value = (Math.max(0,value)/100).toFixed(2);
});
watch(() => [props.accrual,props.paymentAmount], () => {
    editedAlimony.value = (Number(props.accrual.alimony_kopecks || 0)/100).toFixed(2);
    editedPayment.value = props.paymentAmount ?? '0';
});
// --------- конец нового кода chat
const paymentPreview = computed(() => {
    const text = String(editedPayment.value ?? '').replace(',', '.').trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
    const [whole,fraction = ''] = text.split('.');
    const cents = BigInt(whole)*100n + BigInt(fraction.padEnd(2,'0'));
    if (cents > 9007199254740991n) return null;
    const value = Number(cents);
    const base = Math.max(0, Number(previewPayable.value));
    return {amount:value,bonus:Math.max(0,value-base),companyDebt:Math.max(0,base-value),employeeDebt:Math.max(0,-Number(previewPayable.value))};
});
// --------- конец нового кода chat
const emit = defineEmits(['close', 'changed', 'save-payment', 'approve', 'cancel-approval']); // новый код chat: обновление начислений после прощения
// --------- новый код chat: сохранение отличающейся суммы и финансовая сводка
const differsFromCalculation = computed(() => !!paymentPreview.value && paymentPreview.value.amount !== Math.max(0,Number(previewPayable.value)));
const savedPayment = computed(() => !alimonyChanged.value && props.accrual.has_draft && paymentPreview.value?.amount === Math.round(Number(props.paymentAmount)*100));
const financialRows = computed(() => [
    {label:'Начислено',value:props.accrual.amount_kopecks},
    {label:'Расходы',value:props.accrual.expenses_kopecks || 0},
    {label:'Авансы',value:props.accrual.advances_kopecks || 0},
    {label:'Штрафы',value:props.accrual.penalties_kopecks || 0},
    {label:'Вычет 13%',value:props.accrual.deduction_kopecks || 0},
    {label:'Алименты',value:alimonyCents.value ?? props.accrual.alimony_kopecks ?? 0}, // новый код chat
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
    'О': '#EAF044', // новый код chat: отпуск, цвет из табеля
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
// --------- новый код chat: прощение любого актуального штрафа через существующее API
const statusLabel = status => ({active:'Актуален', closed:'Закрыт', forgiven:'Прощён'}[status] || status);
const statusClass = status => ({active:'text-success border-success', closed:'text-secondary border-secondary', forgiven:'text-primary border-primary'}[status] || 'text-secondary border-secondary');
const canForgive = row => !props.approved && row.status === 'active'; // новый код chat: не только прогул
const forgive = async(row) => {
    if (saving.value || props.busy || !canForgive(row) || !window.confirm(`Простить штраф на сумму ${money(row.amount_kopecks)}? Он останется в списке, но больше не будет вычитаться из начисления.`)) return; // новый код chat
    const current = version; saving.value = true;
    try {
        const res = await api.patch(`/agreements/${props.agreementId}/penalties/${row.ID}/status`, {status:'forgiven'});
        emit('changed');
        if (current !== version) return;
        penalties.value = penalties.value.map(item => item.ID === row.ID ? res.data : item);
    } catch (err) {
        if (current === version) error.value = typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось простить штраф.';
    } finally { saving.value = false; } // новый код chat: снимаем блокировку и после обновления расчёта
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
        expenses.value = (detail.expenses || []).map(row => ({ID:row.ID,date:row.expense_date || row.CreatedAt.slice(0,10),amount_kopecks:Math.round(Number(row.price)*100),comment:row.name})); // новый код chat: дата расхода
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
        expenses.value = (expenseRows.data.expenses || []).filter(row => belongs(row) && row.account === 'employee' && !row.is_reimbursed).map(row => ({ID:row.ID, date:row.expense_date || row.CreatedAt.slice(0,10), amount_kopecks:Math.round(Number(row.price) * 100), comment:row.name})).sort(byDate); // новый код chat: дата расхода
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
/* --------- конец нового кода chat */
/* --------- конец нового кода chat */
/* новый код chat: оформление ссылок ФИО */
.salary-employee-link { color: inherit; text-decoration: none; }
.salary-employee-link:hover { color: #0d6efd; text-decoration: underline; }
.salary-employee-link:focus-visible { outline: 2px solid #0d6efd; outline-offset: 2px; }

/* --------- новый код chat: современная компоновка в стилистике карточек сайта */
.salary-dialog { max-width: 960px; }
.salary-detail .modal-content { border: 1px solid var(--bs-border-color); border-radius: 16px; overflow: hidden; box-shadow: 0 18px 60px #14213926; color: #111827; }
.salary-header { padding: 20px 24px; background: #fff; gap: 16px; }
.salary-header h5 { font-size: 19px; font-weight: 600; line-height: 1.4; }
.salary-header-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 7px; font-size: 13px; }
.salary-state { border-radius: 50rem; padding: 3px 10px; font-size: 11px; font-weight: 500; border: 1px solid; }
.salary-state-approved { color: #146c43; background: #edf8f1; border-color: #b9dfc9; }
.salary-state-draft { color: #084298; background: #eff5ff; border-color: #cfe2ff; }
.salary-detail .modal-body { background: #f7f8fa; }
.salary-info-panel, .salary-calendar-panel, .salary-record-panel { padding: 18px; border: 1px solid #dee3e9; border-radius: 12px; background: #fff; }
.salary-info-panel { height: 100%; }
.salary-section-title { display: flex; align-items: center; gap: 9px; font-size: 14px; font-weight: 600; margin-bottom: 14px; }
.salary-section-title i { color: #0d6efd; font-size: 16px; }
.salary-info-panel > .d-flex { padding: 6px 0; margin-bottom: 0 !important; border-bottom: 1px solid #f0f2f5; font-size: 13px; }
.salary-info-panel > .d-flex:last-child { border-bottom: 0; }
.salary-info-panel strong { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
.salary-reference-panel { background: #fcfdff; }
.salary-payment-panel { border: 1px solid #ccdcef; border-radius: 12px; background: #fff; padding: 18px; }
.salary-payment-grid { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 18px 24px; }
.salary-payable { flex: 1 1 210px; }
.salary-payable > .mb-2 > strong:first-child { font-size: 12px; font-weight: 500; color: #41536c; margin-bottom: 6px; }
.salary-payable-amount { font-size: 26px; font-weight: 600; line-height: 1.25; color: #084298; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.salary-input-group { flex: 1 1 180px; min-width: 0; }
.salary-input-group .form-label { font-size: 12px; font-weight: 600; margin-bottom: 7px; }
.salary-input-group :deep(input) { font-size: 15px; min-height: 38px; border-radius: 7px; font-variant-numeric: tabular-nums; }
.salary-actions { margin-top: 16px; padding-top: 14px; border-top: 1px solid #e6ebf2; }
.salary-actions .btn, .salary-footer .btn { font-size: 13px; border-radius: 7px; padding: 6px 12px; }
.salary-calendar-panel { margin-bottom: 16px; }
.salary-calendar { gap: 6px; }
.calendar-heading { font-weight: 600; color: #344054; }
.calendar-day { min-height: 59px; border-color: #e2e6ec; border-radius: 8px; }
.calendar-number { line-height: 1.2; }
.calendar-day strong { font-size: 14px; margin-top: 4px; color: #111; }
.salary-record-panel { margin-top: 14px; }
.salary-record-heading { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 14px; font-weight: 600; margin-bottom: 6px; }
.salary-record-heading strong { font-size: 14px; font-variant-numeric: tabular-nums; }
/* новый код chat: разделитель между шапкой и списком во всех блоках */
.salary-record-description { font-size: 12px; color: #526174; margin-bottom: 0; padding-bottom: 14px; border-bottom: 1px solid #dee3e9; line-height: 1.5; }
.salary-empty { margin: 0; font-size: 13px; color: #526174; padding: 8px 0 2px; }
.salary-footer { background: #fff; padding: 10px 24px; }
@media (max-width: 575px) {
    .salary-dialog { margin: 8px; }
    .salary-header { padding: 16px; }
    .salary-header h5 { font-size: 16px; }
    .salary-info-panel, .salary-payment-panel, .salary-calendar-panel, .salary-record-panel { padding: 12px; }
    .salary-payable { flex-basis: 100%; }
    .salary-input-group { flex-basis: 100%; }
    .salary-calendar { gap: 3px; }
    .calendar-day { min-height: 52px; padding: 4px 2px; }
    .calendar-day strong { font-size: 12px; }
    .salary-actions .small { flex-basis: 100%; }
}
/* --------- конец нового кода chat */

/* --------- новый код chat: лёгкие разделители и адаптивные строки списков */
.salary-entry-list { list-style: none; padding: 0; margin: 0; }
.salary-entry { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px 24px; padding: 14px 0; }
.salary-entry + .salary-entry { border-top: 1px solid #edf0f4; }
.salary-entry:last-child { padding-bottom: 0; }
.salary-entry-content { flex: 1; min-width: 0; }
.salary-entry-date { display: flex; align-items: baseline; gap: 7px; color: #526174; font-size: 12px; line-height: 1.5; }
.salary-entry-date i { color: #6b7d93; }
.salary-entry-comment { margin: 5px 0 0; font-size: 13px; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; color: #111827; }
.salary-entry-empty { color: #667085; }
.salary-entry-summary { display: flex; flex-direction: column; align-items: flex-end; gap: 7px; flex-shrink: 0; max-width: 50%; }
.salary-entry-amount { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; text-align: right; }
.salary-entry-actions { display: flex; justify-content: flex-end; align-items: center; gap: 8px; flex-wrap: wrap; }
.salary-entry-actions .badge { font-size: 11px; padding: 4px 8px; }
.salary-forgive-button { padding: 2px 0; font-size: 12px; text-decoration: none; }
.salary-forgive-button:hover { text-decoration: underline; }
@media (max-width: 575px) {
    .salary-entry { flex-wrap: wrap; gap: 8px; padding-top: 12px; padding-bottom: 12px; }
    .salary-entry-content { flex-basis: 100%; }
    .salary-entry-summary { flex-direction: row; align-items: center; justify-content: space-between; width: 100%; max-width: none; gap: 12px; }
    .salary-entry-amount { text-align: left; }
}
/* --------- конец нового кода chat */
</style>
