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
                        <!-- новый код chat: порядковый номер и согласование -->
<th v-if="selectionMode">Согл.</th><th class="salary-number">№</th><th scope="col">Сотрудник</th> <!-- новый код chat: компактная колонка номера -->
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
                    <tr v-for="(accrual, index) in sortedAccruals" :key="accrual.employee_card_id" class="salary-accrual-row" :class="{'salary-approved-row': accrual.approved}" tabindex="0" aria-haspopup="dialog" :aria-label="`Подробности начисления: ${accrual.employee_name}`" @click="selectedAccrual = accrual" @keydown.enter.prevent="selectedAccrual = accrual" @keydown.space.prevent="selectedAccrual = accrual">
                        <!-- новый код chat: выбор без открытия окна -->
<td v-if="selectionMode" @click.stop @keydown.stop><input v-model="approvalSelection[accrual.employee_card_id]" type="checkbox" class="form-check-input" :aria-label="`Согласовать: ${accrual.employee_name}`" :disabled="busy"></td><td class="salary-number">{{ index + 1 }}</td> <!-- новый код chat: номер по центру -->
<td :title="accrual.employee_name"><router-link :to="{ name: 'employee-card-detail', params: { id: accrual.employee_card_id } }" class="salary-employee-link" @click.stop @keydown.stop>{{ formatEmployeeName(accrual) }}</router-link></td> <!-- новый код chat: ссылка на сотрудника без открытия модального окна строки -->
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
                        <td class="text-end text-nowrap salary-payment-cell">{{ formatMoney(paymentCents(paymentAmounts[accrual.employee_card_id]) ?? 0) }}<span v-if="accrual.has_draft && !accrual.approved" class="salary-draft-dot" role="img" aria-label="Сохранён черновик выплаты" title="Сохранён черновик выплаты"></span></td> <!-- новый код chat: зелёная отметка сохранённого черновика -->
                    </tr>
                </tbody>
                <tfoot class="table-light">
                    <tr>
                        <th scope="row" :colspan="selectionMode ? 6 : 5">Итого по выбранному табелю</th> <!-- новый код chat: учтено удаление колонки официальной ставки -->
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
        <!-- --------- новый код chat: массовое изменение индивидуальных согласований -->
        <div v-if="accruals.length" class="d-flex gap-2 align-items-end flex-wrap mt-3">
            <div><label for="salary-approval-date" class="form-label">Дата согласования</label><input id="salary-approval-date" v-model="approvalDate" type="date" class="form-control form-control-sm" :disabled="busy"></div>
            <button v-if="!selectionMode" class="btn btn-primary btn-sm" :disabled="busy" @click="startApprovalSelection">Изменить согласования</button>
            <template v-else>
                <button class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="selectAllApprovals(true)">Выделить всех</button>
                <button class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="selectAllApprovals(false)">Снять выделение</button>
                <button class="btn btn-primary btn-sm" :disabled="busy || !selectionChanged || !approvalDate" @click="applySelectedApprovals">Применить</button>
                <button class="btn btn-secondary btn-sm" :disabled="busy" @click="selectionMode = false">Отмена</button>
            </template>
        </div>
        <p v-if="accruals.length" class="small text-secondary mt-2">Согласование сохраняет расчёт для ведомости и закрывает учтённые суммы. Это не отметка о физической выдаче денег.</p>
        <!-- --------- конец нового кода chat -->
        <!-- новый код chat: отдельное окно календаря и удержаний сотрудника -->
        <SalaryAccrualDetailComponent v-if="selectedAccrual && selectedMonth" :agreement-id="route.params.id" :month="calculationMonth || selectedMonth" :accrual="selectedAccrual" :approved="!!selectedAccrual.approved" :approval-date="selectedAccrual.approval_date || approvalDate" :payment-amount="paymentAmounts[selectedAccrual.employee_card_id]" :busy="busy" :action-error="errorMessage" @close="selectedAccrual = null" @changed="refreshAfterPenalty" @save-payment="savePayment" @approve="approveEmployee" @cancel-approval="cancelEmployee" /> <!-- новый код chat: действия сотрудника -->
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
// --------- новый код chat: выбор и порядок сотрудников
const selectionMode = ref(false), approvalSelection = ref({});
const sortedAccruals = computed(() => [...accruals.value].sort((a,b) => Number(!!a.approved)-Number(!!b.approved) || a.employee_name.localeCompare(b.employee_name,'ru') || a.employee_card_id-b.employee_card_id));
const selectionChanged = computed(() => accruals.value.some(row => !!approvalSelection.value[row.employee_card_id] !== !!row.approved));
const startApprovalSelection = () => { approvalSelection.value = Object.fromEntries(accruals.value.map(row => [row.employee_card_id,!!row.approved])); selectionMode.value = true; };
const selectAllApprovals = value => { approvalSelection.value = Object.fromEntries(accruals.value.map(row => [row.employee_card_id,value])); };
// --------- конец нового кода chat
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
    approved.value = false; approvalID.value = null; revision.value = ''; paymentAmounts.value = {}; selectionMode.value = false; // новый код chat
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
    // новый код chat: обновляем открытое окно и сообщаем о сбросе черновика
    if (selectedAccrual.value) selectedAccrual.value = accruals.value.find(row => row.employee_card_id === selectedAccrual.value.employee_card_id) || null;
    selectionMode.value = false;
    pendingSelectionRequest = null; // новый код chat: завершённый запрос больше не повторяем
    if (accruals.value.some(row => row.draft_reset)) successMessage.value = 'Исходные данные изменились: черновики затронутых сотрудников сброшены к расчётным суммам.';
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
        if (version === requestVersion) errorMessage.value = 'Не удалось обновить начисления. ' + requestError(err); // новый код chat: обновление также используется после конфликта черновика
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

// --------- новый код chat: сохранение черновика и атомарное изменение согласований
const runSalaryAction = async(path,body,message) => {
    if (busy.value) return;
    const version = ++requestVersion;
    loading.value = true; errorMessage.value = ''; successMessage.value = '';
    try {
        const res = await api.post(`/agreements/${route.params.id}/timesheetmonth/${selectedMonthID.value}/${path}`,body);
        if (version === requestVersion) { applyResponse(res.data); if (!successMessage.value) successMessage.value = message; }
    } catch (err) { if (version === requestVersion) errorMessage.value = requestError(err); }
    finally { if (version === requestVersion) loading.value = false; }
};
const savePayment = ({amount,reset}) => {
    const row = selectedAccrual.value;
    if (!row) return;
    return runSalaryAction('payment-draft',{employee_card_id:row.employee_card_id,revision:row.revision,amount,reset},reset ? 'Выплата возвращена к расчётной сумме.' : 'Выплата сохранена.');
};
const selectionEntry = (row,approved,amount) => ({employee_card_id:row.employee_card_id,approved,approval_id:row.approval_id || 0,revision:row.revision || '',amount:amount ?? paymentAmounts.value[row.employee_card_id]});
// новый код chat: одинаковый повтор после сетевой ошибки использует прежний ключ
let pendingSelectionRequest = null;
const submitApprovals = employees => {
    const body = {date:approvalDate.value,employees};
    const signature = JSON.stringify({agreement:route.params.id,month:selectedMonthID.value,...body});
    if (!pendingSelectionRequest || pendingSelectionRequest.signature !== signature) pendingSelectionRequest = {signature,key:crypto.randomUUID()};
    return runSalaryAction('employee-approvals',{...body,request_key:pendingSelectionRequest.key},'Согласования обновлены.');
};
const approveEmployee = amount => selectedAccrual.value && submitApprovals([selectionEntry(selectedAccrual.value,true,amount)]);
const cancelEmployee = () => selectedAccrual.value && submitApprovals([selectionEntry(selectedAccrual.value,false)]);
const applySelectedApprovals = () => submitApprovals(accruals.value.map(row => selectionEntry(row,!!approvalSelection.value[row.employee_card_id])));
// --------- конец нового кода chat
watch(() => route.params.id, getMonthsHandler, {immediate: true});
onBeforeUnmount(() => { requestVersion++; });
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: доступные для открытия строки начислений */
.salary-accrual-row { cursor: pointer; }
.salary-approved-row { --bs-table-bg: #e7f4e8; --bs-table-hover-bg: #dceedd; } /* новый код chat: согласованные строки */
.salary-accrual-row:focus-visible { outline: 2px solid var(--bs-primary); outline-offset: -2px; }
/* --------- конец нового кода chat */
/* --------- новый код chat: компактная таблица с округлённой рамкой */
.salary-table-wrap { border: 1px solid var(--bs-border-color); border-radius: 6px; overflow: auto; }
.salary-table { font-size: 13px; margin-bottom: 0; } /* новый код chat: увеличенный шрифт таблицы */
.salary-table th { white-space: normal; min-width: 65px; }
/* --------- новый код chat: узкий номер и отметка черновика в углу выплаты */
.salary-table .salary-number { width: 32px; min-width: 32px; text-align: center; white-space: nowrap; }
.salary-payment-cell { position: relative; }
.salary-table td.salary-payment-cell { padding-right: 12px; }
.salary-draft-dot { position: absolute; top: 3px; right: 3px; width: 6px; height: 6px; border-radius: 50%; background-color: var(--bs-success); }
/* --------- конец нового кода chat */
.salary-table th, .salary-table td { padding: 3px 4px; }
.salary-table > thead > tr:first-child { border-top: 0; }
.salary-table > tfoot > tr:last-child { border-bottom: 0; }
.salary-table > :not(caption) > tr > :first-child { border-left: 0; }
.salary-table > :not(caption) > tr > :last-child { border-right: 0; }
.salary-payment { width: 100px; font-size: 13px; padding: 2px 4px; min-height: 24px; } /* новый код chat: шрифт поля выплаты как в таблице */
/* --------- конец нового кода chat */
/* новый код chat: оформление ссылок ФИО */
.salary-employee-link { color: inherit; text-decoration: none; }
.salary-employee-link:hover { color: #0d6efd; text-decoration: underline; }
.salary-employee-link:focus-visible { outline: 2px solid #0d6efd; outline-offset: 2px; }
</style>
