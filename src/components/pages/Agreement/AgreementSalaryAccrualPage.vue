<!-- --------- новый код chat: страница начислений договора -->
<template>
    <!-- новый код chat: навигация и общий контейнер перенесены в AgreementSalaryPage -->
    <div>

        <div class="card mb-3">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-md-5 col-lg-4">
                        <label for="salary-timesheet" class="form-label">Месячный табель</label>
                        <!-- новый код chat: компактный размер текста выбора табеля -->
                        <select id="salary-timesheet" v-model="selectedMonthID" class="form-select form-select-sm" :disabled="busy || !months.length" @change="getAccrualsHandler">
                            <option :value="null" disabled>Выберите табель</option>
                            <option v-for="month in months" :key="month.ID" :value="month.ID">
                                {{ monthLabel(month) }} · №{{ month.ID }}
                            </option>
                        </select>
                    </div>
                </div>
                <p class="text-secondary small mt-3 mb-0">Часы по табелю ÷ часы в смене выбранного табеля × ставка за смену из карточки сотрудника. Пустая или некорректная ставка считается нулём.</p>
                <p class="text-secondary small mb-0">Начисления автоматически пересчитываются при открытии страницы и выборе табеля по актуальным часам и ставкам.</p>
                <!-- --------- новый код chat: пояснение предварительного вычета -->
                <p class="text-secondary small mb-0">Вычитаются все актуальные авансы сотрудника по договору независимо от даты и штрафы за месяц и год выбранного табеля. Остаток может быть отрицательным. Это предварительный расчёт: остатки разных табелей складывать нельзя, поскольку авансы в них повторяются.</p>
                <p class="text-secondary small mb-0">К выплате прибавляются невозмещённые личные расходы по договору за все месяцы. Они могут повторяться в разных табелях до отметки о возмещении.</p> <!-- новый код chat -->
                <!-- --------- конец нового кода chat -->
            </div>
        </div>

        <div v-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
        <div v-if="successMessage" class="alert alert-success" role="status">{{ successMessage }}</div>
        <div v-if="busy" class="text-secondary py-3" role="status">{{ calculating ? 'Рассчитываем начисления…' : 'Загружаем данные…' }}</div>
        <div v-else-if="!months.length && !errorMessage" class="alert alert-info">У договора пока нет табелей. Сначала создайте месячный табель.</div>
        <div v-else-if="selectedMonthID && !accruals.length && !errorMessage" class="alert alert-info">В выбранном табеле нет сотрудников для начисления зарплаты.</div>

        <div v-if="!busy && accruals.length" class="table-responsive salary-table-wrap">
            <!-- новый код chat: уменьшенные отступы ячеек и высота строк -->
            <table class="table table-sm table-bordered table-hover align-middle salary-table">
                <thead class="table-light">
                    <tr>
                        <th scope="col">Сотрудник</th>
                        <th scope="col" class="text-end">Часы</th> <!-- новый код chat: сумма отработанных часов -->
                        <th scope="col" class="text-end">Смены</th> <!-- новый код chat: часы отображаются в сменах -->
                        <th scope="col" class="text-end">Ставка</th> <!-- новый код chat: сокращённый заголовок, официальная ставка убрана из таблицы -->
                        <th scope="col" class="text-end">Начислено</th>
                        <th scope="col" class="text-end">Расходы</th> <!-- новый код chat -->
                        <th scope="col" class="text-end">Авансы</th>
                        <th scope="col" class="text-end">Штрафы</th> <!-- новый код chat -->
                        <th scope="col" class="text-end">Вычет 13%</th> <!-- новый код chat: от официальной месячной зарплаты -->
                        <th scope="col" class="text-end">Премии</th> <!-- новый код chat -->
                        <th scope="col" class="text-end" title="Долг компании">Долг К.</th><th scope="col" class="text-end" title="Долг сотрудника">Долг С.</th> <!-- новый код chat: сокращённые заголовки долгов -->
                        <th scope="col" class="text-end">К выплате</th><th scope="col">Выплата, ₽</th> <!-- новый код chat -->
                        <!-- новый код chat: колонка даты расчёта удалена -->
                    </tr>
                </thead>
                <tbody>
                    <!-- новый код chat: открытие подробностей мышью или клавиатурой -->
                    <tr v-for="accrual in accruals" :key="accrual.ID" class="salary-accrual-row" tabindex="0" aria-haspopup="dialog" :aria-label="`Подробности начисления: ${accrual.employee_name}`" @click="selectedAccrual = accrual" @keydown.enter.prevent="selectedAccrual = accrual" @keydown.space.prevent="selectedAccrual = accrual">
                        <td :title="accrual.employee_name">{{ formatEmployeeName(accrual) }}</td> <!-- новый код chat: фамилия и инициалы, полное имя в подсказке -->
                        <td class="text-end">{{ String(accrual.total_hours ?? 0).replace('.', ',') }}</td> <!-- новый код chat: часы сотрудника из начисления без округления -->
                        <td class="text-end">{{ formatShifts(accrual.total_hours, accrual.shift_hours) }}</td> <!-- новый код chat: норма смены из табеля -->
                        <td class="text-end text-nowrap">{{ formatMoney(accrual.salary_rate_kopecks) }}</td>
                        <td class="text-end text-nowrap fw-semibold">{{ formatMoney(accrual.amount_kopecks) }}</td>
                        <td class="text-end text-nowrap">{{ formatMoney(accrual.expenses_kopecks || 0) }}</td> <!-- новый код chat: прибавляем личные расходы -->
                        <td class="text-end text-nowrap">{{ formatMoney(accrual.advances_kopecks) }}</td>
                        <td class="text-end text-nowrap">{{ formatMoney(accrual.penalties_kopecks) }}</td> <!-- новый код chat -->
                        <td class="text-end text-nowrap">{{ formatMoney(accrual.deduction_kopecks || 0) }}</td> <!-- новый код chat -->
                        <!-- --------- новый код chat: предварительная премия и долг с Bootstrap-подсказками -->
                        <td class="text-end text-nowrap"><span v-payment-tooltip="paymentPreview(accrual).bonusTooltip" :class="{'text-success':paymentPreview(accrual).extra > 0}" :tabindex="paymentPreview(accrual).extra > 0 ? 0 : undefined">{{ formatMoney(paymentPreview(accrual).bonus) }}</span></td>
                        <td class="text-end"><span v-payment-tooltip="paymentPreview(accrual).debtTooltip" :class="{'text-danger':paymentPreview(accrual).shortfall > 0}" :tabindex="paymentPreview(accrual).shortfall > 0 ? 0 : undefined">{{ formatMoney(paymentPreview(accrual).debt) }}</span></td><td class="text-end">{{ formatMoney(accrual.employee_debt_kopecks || 0) }}</td>
                        <!-- --------- конец нового кода chat -->
                        <td class="text-end text-nowrap fw-semibold" :class="{'text-danger': accrual.payable_kopecks < 0}">{{ formatMoney(accrual.payable_kopecks) }}</td>
                        <td @click.stop @keydown.stop><input v-model="paymentAmounts[accrual.employee_card_id]" class="form-control form-control-sm salary-payment" inputmode="decimal" :disabled="approved || busy" :aria-label="`Выплата: ${accrual.employee_name}`"></td> <!-- новый код chat -->
                    </tr>
                </tbody>
                <tfoot class="table-light">
                    <tr>
                        <th scope="row" colspan="4">Итого по выбранному табелю</th> <!-- новый код chat: учтено удаление колонки официальной ставки -->
                        <td class="text-end text-nowrap fw-bold">{{ formatMoney(totalKopecks) }}</td>
                        <td class="text-end text-nowrap fw-bold">{{ formatMoney(totalExpensesKopecks) }}</td> <!-- новый код chat -->
                        <td class="text-end text-nowrap fw-bold">{{ formatMoney(totalAdvancesKopecks) }}</td>
                        <td class="text-end text-nowrap fw-bold">{{ formatMoney(totalPenaltiesKopecks) }}</td> <!-- новый код chat -->
                        <td class="text-end text-nowrap fw-bold">{{ formatMoney(totalDeductionKopecks) }}</td> <!-- новый код chat: сумма вычетов -->
                        <td class="text-end text-nowrap fw-bold">{{ formatMoney(totalBonusesKopecks) }}</td> <!-- новый код chat -->
                        <td class="text-end">{{ formatMoney(totalCompanyDebtKopecks) }}</td><td class="text-end">{{ formatMoney(totalEmployeeDebtKopecks) }}</td> <!-- новый код chat -->
                        <td class="text-end text-nowrap fw-bold" :class="{'text-danger': totalPayableKopecks < 0}">{{ formatMoney(totalPayableKopecks) }}</td><td class="text-end fw-bold">{{ paymentTotal.valid ? formatMoney(paymentTotal.amount) : 'Проверьте суммы' }}</td> <!-- новый код chat -->
                    </tr>
                </tfoot>
            </table>
        </div>
        <!-- --------- новый код chat: согласование всех строк табеля -->
        <div v-if="accruals.length" class="d-flex gap-2 align-items-end flex-wrap mt-3">
            <div><label for="salary-approval-date" class="form-label">Дата согласования</label><input id="salary-approval-date" v-model="approvalDate" type="date" class="form-control form-control-sm" :disabled="approved || busy"></div>
            <button v-if="!approved" class="btn btn-primary btn-sm" :disabled="busy || !paymentTotal.valid || !approvalDate" @click="approveHandler">Согласовано</button>
            <template v-else><span class="text-success">Начисления согласованы</span><button class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="cancelApprovalHandler">Отменить согласование</button></template>
        </div>
        <p v-if="accruals.length" class="small text-secondary mt-2">Согласование сохраняет расчёт для ведомости и закрывает учтённые суммы. Это не отметка о физической выдаче денег.</p>
        <!-- --------- конец нового кода chat -->
        <!-- новый код chat: отдельное окно календаря и удержаний сотрудника -->
        <SalaryAccrualDetailComponent v-if="selectedAccrual && selectedMonth" :agreement-id="route.params.id" :month="calculationMonth || selectedMonth" :accrual="selectedAccrual" :approved="approved" :approval-date="approvalDate" :payment-amount="paymentAmounts[selectedAccrual.employee_card_id]" @close="selectedAccrual = null" @changed="refreshAfterPenalty" /> <!-- новый код chat: пересчёт после прощения штрафа -->
    </div>
</template>
<!-- --------- конец нового кода chat -->

<script setup>
// --------- новый код chat: автоматический пересчёт при открытии и выборе табеля
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '../../../api';
import { rememberSalaryMonth, restoreSalaryMonth } from '../../../utils/salaryMonthStorage'; // новый код chat: отдельный выбранный месяц начислений
import SalaryAccrualDetailComponent from './SalaryAccrualDetailComponent.vue'; // новый код chat: подробности начисления
import { Tooltip } from 'bootstrap/dist/js/bootstrap.bundle.min.js'; // новый код chat: подсказки предварительного расчёта

// --------- новый код chat: Bootstrap Tooltip с обновлением и очисткой
const paymentTooltips = new WeakMap();
const updatePaymentTooltip = (element, binding) => {
    const instance = paymentTooltips.get(element);
    if (!binding.value) { instance?.dispose(); paymentTooltips.delete(element); return; }
    if (!instance) paymentTooltips.set(element, new Tooltip(element, {title:binding.value, container:'body', trigger:'hover focus', animation:false}));
    else if (binding.value !== binding.oldValue) instance.setContent({'.tooltip-inner':binding.value});
};
const vPaymentTooltip = {mounted:updatePaymentTooltip, updated:updatePaymentTooltip, beforeUnmount:element => { paymentTooltips.get(element)?.dispose(); paymentTooltips.delete(element); }};
// --------- конец нового кода chat

const route = useRoute();
const months = ref([]);
const selectedMonthID = ref(null);
const calculationMonth = ref(null); // новый код chat: календарный месяц снимка
const accruals = ref([]);
const selectedAccrual = ref(null); // новый код chat: сотрудник открытого окна
const selectedMonth = computed(() => months.value.find(month => Number(month.ID) === Number(selectedMonthID.value))); // новый код chat: месяц календаря
// --------- новый код chat: выплаты и сохранённое согласование
const approved = ref(false), approvalID = ref(null), approvalDate = ref(new Date().toLocaleDateString('sv-SE', {timeZone:'Europe/Moscow'}));
const revision = ref(''), paymentAmounts = ref({});
const totalCompanyDebtKopecks = ref(0), totalEmployeeDebtKopecks = ref(0);
let pendingApproval = null;
const centsText = cents => { const value = BigInt(cents); return `${value / 100n}.${String(value % 100n).padStart(2,'0')}`; };
const paymentCents = value => {
    const text = String(value ?? '').trim().replace(',', '.');
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
    const [whole, fraction = ''] = text.split('.');
    const amount = BigInt(whole) * 100n + BigInt(fraction.padEnd(2,'0'));
    return amount <= 9007199254740991n ? amount : null;
};
const paymentTotal = computed(() => {
    let amount = 0n;
    for (const row of accruals.value) { const value = paymentCents(paymentAmounts.value[row.employee_card_id]); if (value === null) return {valid:false,amount:0}; amount += value; }
    return {valid:amount <= 9007199254740991n,amount:Number(amount)};
});
// --------- конец нового кода chat
const totalKopecks = ref(0);
const totalBonusesKopecks = ref(0); // новый код chat
const totalExpensesKopecks = ref(0); // новый код chat
const totalDeductionKopecks = ref(0); // новый код chat: общий вычет 13%
const totalPenaltiesKopecks = ref(0); // новый код chat: штрафы за месяц
const totalAdvancesKopecks = ref(0); // новый код chat: сумма авансов
const totalPayableKopecks = ref(0); // новый код chat: остаток к выплате
const loading = ref(false);
const calculating = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const busy = computed(() => loading.value || calculating.value);
let requestVersion = 0;

const formatMoney = (kopecks) => (Number(kopecks) / 100).toLocaleString('ru-RU', {style: 'currency', currency: 'RUB'});
// --------- новый код chat: меняется только отображение, исходный расчёт не затрагивается
const paymentPreview = row => {
    const entered = paymentCents(paymentAmounts.value[row.employee_card_id]);
    const base = BigInt(Math.max(0, row.payable_kopecks));
    const delta = entered === null ? 0n : entered - base;
    const extra = delta > 0n ? delta : 0n, shortfall = delta < 0n ? -delta : 0n;
    const bonus = BigInt(row.bonuses_kopecks || 0) + extra;
    const debt = BigInt(row.company_debt_kopecks || 0) - shortfall;
    return {
        extra, shortfall, bonus, debt,
        bonusTooltip:extra > 0n ? `Назначенная премия: ${formatMoney(row.bonuses_kopecks || 0)} + разница по выплате: ${formatMoney(extra)} = ${formatMoney(bonus)}` : '',
        debtTooltip:shortfall > 0n ? `Долг компании в расчёте: ${formatMoney(row.company_debt_kopecks || 0)} − недоплата: ${formatMoney(shortfall)} = ${formatMoney(debt)}. Новый долг при согласовании: ${formatMoney(shortfall)}.` : '',
    };
};
// --------- конец нового кода chat
// --------- новый код chat: сокращённое отображение ФИО сотрудника
const formatEmployeeName = (accrual) => {
    const parts = (accrual.employee_name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return `Сотрудник №${accrual.employee_card_id}`;
    return [parts[0], ...parts.slice(1).map(part => `${part[0].toLocaleUpperCase('ru-RU')}.`)].join(' ');
};
// --------- конец нового кода chat
const formatShifts = (hours, shiftHours) => (Number(hours) / Number(shiftHours)).toLocaleString('ru-RU', {minimumFractionDigits: 1, maximumFractionDigits: 1}); // новый код chat: смены с одним знаком после запятой
const monthLabel = (month) => new Date(month.year, month.month - 1, 1).toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'});
const requestError = (err) => typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось выполнить запрос. Попробуйте ещё раз.';

const clearAccruals = () => {
    selectedAccrual.value = null; // новый код chat: закрытие карточки при смене табеля или договора
    accruals.value = [];
    calculationMonth.value = null; // новый код chat
    approved.value = false; approvalID.value = null; revision.value = ''; paymentAmounts.value = {}; pendingApproval = null; // новый код chat
    totalCompanyDebtKopecks.value = 0; totalEmployeeDebtKopecks.value = 0; // новый код chat
    totalKopecks.value = 0;
    totalBonusesKopecks.value = 0; // новый код chat
    totalExpensesKopecks.value = 0; // новый код chat
    totalDeductionKopecks.value = 0; // новый код chat
    totalPenaltiesKopecks.value = 0; // новый код chat
    totalAdvancesKopecks.value = 0; // новый код chat
    totalPayableKopecks.value = 0; // новый код chat
};

const applyResponse = (data) => {
    accruals.value = data.accruals || [];
    calculationMonth.value = data.calendar_month ? {ID:selectedMonthID.value,month:data.calendar_month,year:data.calendar_year} : null; // новый код chat
    // --------- новый код chat: восстановление согласованной или расчётной выплаты
    approved.value = !!data.approved; approvalID.value = data.approval_id || null; revision.value = data.revision || '';
    if (data.approval_date) approvalDate.value = data.approval_date;
    totalCompanyDebtKopecks.value = data.total_company_debt_kopecks || 0;
    totalEmployeeDebtKopecks.value = data.total_employee_debt_kopecks || 0;
    paymentAmounts.value = Object.fromEntries(accruals.value.map(row => [row.employee_card_id,centsText(row.payment_kopecks ?? Math.max(0,row.payable_kopecks))]));
    pendingApproval = null;
    // --------- конец нового кода chat
    totalKopecks.value = data.total_kopecks || 0;
    totalBonusesKopecks.value = data.total_bonuses_kopecks || 0; // новый код chat
    totalExpensesKopecks.value = data.total_expenses_kopecks || 0; // новый код chat
    totalDeductionKopecks.value = data.total_deduction_kopecks || 0; // новый код chat
    totalPenaltiesKopecks.value = data.total_penalties_kopecks || 0; // новый код chat
    totalAdvancesKopecks.value = data.total_advances_kopecks || 0; // новый код chat
    totalPayableKopecks.value = data.total_payable_kopecks || 0; // новый код chat
};

const getAccrualsHandler = async() => {
    rememberSalaryMonth(route.params.id, 'accruals', selectedMonthID.value); // новый код chat: сохраняем выбор месяца
    const version = ++requestVersion;
    clearAccruals();
    errorMessage.value = '';
    successMessage.value = '';
    if (!selectedMonthID.value) return;
    loading.value = true;
    calculating.value = true; // новый код chat: пересчёт при загрузке табеля
    try {
        const res = await api.post(`/agreements/${route.params.id}/timesheetmonth/${selectedMonthID.value}/accruals/calculate`); // новый код chat: сохранить актуальный расчёт
        if (version === requestVersion) applyResponse(res.data);
    } catch (err) {
        if (version === requestVersion) errorMessage.value = requestError(err);
    } finally {
        if (version === requestVersion) { loading.value = false; calculating.value = false; } // новый код chat: завершение автоматического расчёта
    }
};

// --------- новый код chat: обновляем суммы, сохраняя открытое окно сотрудника
const refreshAfterPenalty = async() => {
    const version = ++requestVersion;
    errorMessage.value = '';
    try {
        const res = await api.post(`/agreements/${route.params.id}/timesheetmonth/${selectedMonthID.value}/accruals/calculate`);
        if (version !== requestVersion) return;
        applyResponse(res.data);
        if (selectedAccrual.value) selectedAccrual.value = accruals.value.find(row => row.employee_card_id === selectedAccrual.value.employee_card_id) || null;
    } catch (err) {
        if (version === requestVersion) errorMessage.value = 'Статус штрафа сохранён, но обновить начисления не удалось. Обновите страницу. ' + requestError(err);
    }
};
// --------- конец нового кода chat

const getMonthsHandler = async() => {
    const version = ++requestVersion;
    months.value = [];
    selectedMonthID.value = null;
    clearAccruals();
    errorMessage.value = '';
    successMessage.value = '';
    calculating.value = false;
    loading.value = true;
    try {
        const res = await api.get(`/agreements/${route.params.id}/timesheetmonth`);
        if (version !== requestVersion) return;
        months.value = (res.data || []).sort((a, b) => b.year - a.year || b.month - a.month || b.ID - a.ID);
        selectedMonthID.value = restoreSalaryMonth(route.params.id, 'accruals', months.value); // новый код chat: восстановление месяца начислений
        loading.value = false;
        if (selectedMonthID.value) await getAccrualsHandler();
    } catch (err) {
        if (version === requestVersion) errorMessage.value = requestError(err);
    } finally {
        if (version === requestVersion) loading.value = false;
    }
};

// --------- новый код chat: единое согласование и отмена
const approveHandler = async() => {
    if (busy.value || approved.value || !paymentTotal.value.valid) return;
    if (!window.confirm('Согласовать суммы всех сотрудников и закрыть учтённые авансы, штрафы, премии, расходы и долги?')) return;
    const body = {date:approvalDate.value,revision:revision.value,payments:accruals.value.map(row => ({employee_card_id:row.employee_card_id,amount:centsText(paymentCents(paymentAmounts.value[row.employee_card_id]))}))};
    const signature = JSON.stringify(body);
    if (!pendingApproval || pendingApproval.signature !== signature) pendingApproval = {signature,key:crypto.randomUUID()};
    const version = ++requestVersion; loading.value = true; errorMessage.value = '';
    try {
        const res = await api.post(`/agreements/${route.params.id}/timesheetmonth/${selectedMonthID.value}/approval`, {...body,request_key:pendingApproval.key});
        if (version === requestVersion) { applyResponse(res.data); successMessage.value = 'Начисления согласованы.'; }
    } catch (err) { if (version === requestVersion) errorMessage.value = requestError(err); }
    finally { if (version === requestVersion) loading.value = false; }
};
const cancelApprovalHandler = async() => {
    if (busy.value || !approved.value || !window.confirm('Отменить согласование и восстановить учтённые статусы? Созданные открытые долги и дополнительная премия будут удалены; закрытые долги сохранятся.')) return;
    const version = ++requestVersion; loading.value = true; errorMessage.value = '';
    try {
        await api.delete(`/agreements/${route.params.id}/timesheetmonth/${selectedMonthID.value}/approval`, {data:{approval_id:approvalID.value}});
        if (version !== requestVersion) return;
        await getAccrualsHandler();
    } catch (err) { if (version === requestVersion) errorMessage.value = requestError(err); }
    finally { if (version === requestVersion) loading.value = false; }
};
// --------- конец нового кода chat
watch(() => route.params.id, getMonthsHandler, {immediate: true});
onBeforeUnmount(() => { requestVersion++; });
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: доступные для открытия строки начислений */
.salary-accrual-row { cursor: pointer; }
.salary-accrual-row:focus-visible { outline: 2px solid var(--bs-primary); outline-offset: -2px; }
/* --------- конец нового кода chat */
/* --------- новый код chat: компактная таблица с округлённой рамкой */
.salary-table-wrap { border: 1px solid var(--bs-border-color); border-radius: 6px; overflow: auto; }
.salary-table { font-size: 13px; margin-bottom: 0; } /* новый код chat: увеличенный шрифт таблицы */
.salary-table th { white-space: normal; min-width: 65px; }
.salary-table th, .salary-table td { padding: 3px 4px; }
.salary-table > thead > tr:first-child { border-top: 0; }
.salary-table > tfoot > tr:last-child { border-bottom: 0; }
.salary-table > :not(caption) > tr > :first-child { border-left: 0; }
.salary-table > :not(caption) > tr > :last-child { border-right: 0; }
.salary-payment { width: 100px; font-size: 13px; padding: 2px 4px; min-height: 24px; } /* новый код chat: шрифт поля выплаты как в таблице */
/* --------- конец нового кода chat */
</style>
