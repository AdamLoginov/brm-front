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
                    <!-- новый код chat: история рядом с выбором месяца начислений -->
                    <div class="col-auto">
                        <button type="button" class="btn btn-outline-primary btn-sm" :disabled="busy || !selectedMonthID" @click="showApprovalHistory = true">История согласований</button>
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
        <!-- новый код chat: одно временное уведомление поверх страницы справа снизу -->
        <Teleport to="body">
            <div v-if="successMessage" class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1090">
                <div class="toast show text-bg-success border-0" role="status" aria-live="polite" aria-atomic="true">
                    <div class="d-flex">
                        <div class="toast-body">{{ successMessage }}</div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Закрыть уведомление" @click="showSuccess('')"></button>
                    </div>
                </div>
            </div>
        </Teleport>
        <div v-if="loading || calculating" class="text-secondary py-3" role="status">{{ calculating ? 'Рассчитываем начисления…' : 'Загружаем данные…' }}</div> <!-- новый код chat: сохранение не скрывает таблицу -->
        <div v-else-if="!months.length && !errorMessage" class="alert alert-info">У договора пока нет табелей. Сначала создайте месячный табель.</div>
        <div v-else-if="selectedMonthID && !accruals.length && !errorMessage" class="alert alert-info">В выбранном табеле нет сотрудников для начисления зарплаты.</div>

        <!-- --------- новый код chat: управление согласованиями справа над таблицей -->
        <div v-if="accruals.length" class="d-flex gap-2 align-items-end justify-content-end flex-wrap mb-3">
            <div><label for="salary-approval-date" class="form-label">Дата согласования</label><input id="salary-approval-date" v-model="approvalDate" type="date" class="form-control form-control-sm" :disabled="busy"></div>
            <button v-if="!selectionMode" class="btn btn-primary btn-sm" :disabled="busy" @click="startApprovalSelection">Изменить согласования</button>
            <!-- новый код chat: общий сброс сохранений несогласованных сотрудников -->
            <button v-if="!selectionMode" class="btn btn-outline-secondary btn-sm" :disabled="busy || !hasResettableDrafts" @click="resetAllPaymentDrafts">Сбросить сохранения</button>
            <template v-else>
                <!-- новый код chat: одна кнопка переключает выделение всех сотрудников -->
                <button class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="toggleAllApprovals">Выбрать</button>
                <button class="btn btn-primary btn-sm" :disabled="busy || !selectionChanged || !approvalDate" @click="applySelectedApprovals">Применить</button>
                <button class="btn btn-secondary btn-sm" :disabled="busy" @click="selectionMode = false">Отмена</button>
            </template>
        </div>

        <div v-if="!loading && !calculating && accruals.length" class="table-responsive salary-table-wrap" :aria-busy="actionPending"> <!-- новый код chat: обновляем существующую таблицу без повторного создания -->
            <!-- новый код chat: уменьшенные отступы ячеек и высота строк -->
            <table ref="salaryTable" class="table table-sm table-bordered table-hover align-middle salary-table">
                <!-- новый код chat: шапка следует за прокруткой до конца таблицы -->
                <thead ref="salaryHeader" class="table-light salary-sticky-header" :style="{transform: `translateY(${salaryHeaderOffset}px)`}">
                    <tr>
                        <!-- новый код chat: порядковый номер и согласование -->
<th v-if="selectionMode" class="salary-selection">Согл.</th><th class="salary-number">№</th><th scope="col">Сотрудник</th> <!-- новый код chat: компактные колонки согласования и номера -->
                        <th scope="col" class="text-end">Часы</th> <!-- новый код chat: сумма отработанных часов -->
                        <th scope="col" class="text-end">Смены</th> <!-- новый код chat: часы отображаются в сменах -->
                        <th scope="col" class="text-end">Ставка</th> <!-- новый код chat: сокращённый заголовок, официальная ставка убрана из таблицы -->
                        <th scope="col" class="text-end">Начислено</th>
                        <th scope="col" class="text-end">Расходы</th> <!-- новый код chat -->
                        <th scope="col" class="text-end">Авансы</th>
                        <th scope="col" class="text-end">Штрафы</th> <!-- новый код chat -->
                        <th scope="col" class="text-end">Вычет 13%</th> <!-- новый код chat: от официальной месячной зарплаты -->
                        <th scope="col" class="text-end">Алименты</th> <!-- новый код chat: справочная колонка -->
                        <th scope="col" class="text-end">Премии</th> <!-- новый код chat -->
                        <th scope="col" class="text-end" title="Долг компании">Долг К.</th><th scope="col" class="text-end" title="Долг сотрудника">Долг С.</th> <!-- новый код chat: сокращённые заголовки долгов -->
                        <th scope="col" class="text-end">Итого</th><th scope="col" class="salary-payment-heading">Выплата, ₽</th> <!-- новый код chat: компактная колонка выплаты -->
                        <!-- новый код chat: колонка даты расчёта удалена -->
                    </tr>
                </thead>
                <tbody>
                    <!-- новый код chat: открытие подробностей мышью или клавиатурой -->
                    <tr v-for="(accrual, index) in sortedAccruals" :key="accrual.employee_card_id" class="salary-accrual-row" :class="{'salary-approved-row': accrual.approved}" tabindex="0" aria-haspopup="dialog" :aria-label="`Подробности начисления: ${accrual.employee_name}`" @click="selectedAccrual = accrual" @keydown.enter.prevent="selectedAccrual = accrual" @keydown.space.prevent="selectedAccrual = accrual">
                        <!-- новый код chat: выбор без открытия окна -->
<td v-if="selectionMode" class="salary-selection" @click.stop @keydown.stop><input v-model="approvalSelection[accrual.employee_card_id]" type="checkbox" class="form-check-input" :aria-label="`Согласовать: ${accrual.employee_name}`" :disabled="busy"></td><td class="salary-number">{{ index + 1 }}</td> <!-- новый код chat: компактное согласование, номер по центру -->
<td :title="accrual.employee_name">{{ formatEmployeeName(accrual) }}</td> <!-- новый код chat: ФИО без ссылки, нажатие открывает подробности начисления -->
                        <td class="text-end">{{ String(accrual.total_hours ?? 0).replace('.', ',') }}</td> <!-- новый код chat: часы сотрудника из начисления без округления -->
                        <td class="text-end">{{ formatShifts(accrual.total_hours, accrual.shift_hours) }}</td> <!-- новый код chat: норма смены из табеля -->
                        <!-- новый код chat: красная ячейка при нулевой ставке -->
                        <td class="text-end text-nowrap" :class="{'salary-zero-rate': Number(accrual.salary_rate_kopecks) === 0}">{{ formatMoney(accrual.salary_rate_kopecks) }}</td>
                        <td class="text-end text-nowrap fw-semibold">{{ formatMoney(accrual.amount_kopecks) }}</td>
                        <td class="text-end text-nowrap">{{ formatMoney(accrual.expenses_kopecks || 0) }}</td> <!-- новый код chat: прибавляем личные расходы -->
                        <td class="text-end text-nowrap">{{ formatMoney(accrual.advances_kopecks) }}</td>
                        <td class="text-end text-nowrap">{{ formatMoney(accrual.penalties_kopecks) }}</td> <!-- новый код chat -->
                        <td class="text-end text-nowrap">{{ formatMoney(accrual.deduction_kopecks || 0) }}</td> <!-- новый код chat -->
                        <!-- новый код chat: нулевое значение с подсветкой по отметке сотрудника -->
                        <td class="text-end text-nowrap" :class="{'salary-alimony-cell': accrual.has_alimony && !accrual.alimony_kopecks}" :title="accrual.has_alimony ? 'Сотрудник выплачивает алименты' : undefined">{{ formatMoney(accrual.alimony_kopecks || 0) }}</td> <!-- новый код chat: сохранённая сумма -->
                        <!-- --------- новый код chat: предварительная премия и долг с Bootstrap-подсказками -->
                        <td class="text-end text-nowrap"><span v-payment-tooltip="paymentPreview(accrual).bonusTooltip" :class="{'text-success':paymentPreview(accrual).extra > 0}" :tabindex="paymentPreview(accrual).extra > 0 ? 0 : undefined">{{ formatMoney(paymentPreview(accrual).bonus) }}</span></td>
                        <td class="text-end"><span v-payment-tooltip="paymentPreview(accrual).debtTooltip" :class="{'text-danger':paymentPreview(accrual).shortfall > 0}" :tabindex="paymentPreview(accrual).shortfall > 0 ? 0 : undefined">{{ formatMoney(paymentPreview(accrual).debt) }}</span></td><td class="text-end">{{ formatMoney(accrual.employee_debt_kopecks || 0) }}</td>
                        <!-- --------- конец нового кода chat -->
                        <td class="text-end text-nowrap fw-semibold" :class="{'text-danger': accrual.payable_kopecks < 0}">{{ formatMoney(accrual.payable_kopecks) }}</td>
                        <!-- новый код chat: ввод выплаты в таблице, без открытия окна при работе с полем -->
                        <td class="text-end text-nowrap salary-payment-cell" @click.stop @keydown.stop>
                            <!-- новый код chat: сохранённая выплата заблокирована до сброса -->
                            <div class="input-group input-group-sm salary-payment-group">
                                <MoneyInputComponent v-model="paymentAmounts[accrual.employee_card_id]" class="form-control salary-payment text-end" :class="{'is-invalid': paymentCents(paymentAmounts[accrual.employee_card_id]) === null}" :disabled="busy || accrual.approved || accrual.has_draft" :aria-label="`Выплата: ${accrual.employee_name}`" />
                                <!-- новый код chat: компактная синяя кнопка с SVG -->
                                <button type="button" class="btn btn-outline-primary" :class="{'salary-save-saved': accrual.has_draft}" :disabled="busy || accrual.approved || paymentCents(paymentAmounts[accrual.employee_card_id]) === null || accrual.has_draft" :aria-label="`Сохранить выплату: ${accrual.employee_name}`" title="Сохранить выплату" @click="savePayment({amount:paymentAmounts[accrual.employee_card_id],reset:false},accrual)"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-4-4a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg></button>
                                <!-- новый код chat: действия конкретного сотрудника без открытия окна -->
                                <button v-payment-menu type="button" class="btn btn-outline-secondary salary-payment-menu-button" :disabled="busy" :aria-label="`Действия с выплатой: ${accrual.employee_name}`" aria-expanded="false" @click="togglePaymentMenu"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="8" cy="3" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="13" r="1.5"/></svg></button> <!-- новый код chat: меню доступно и после согласования -->
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <!-- новый код chat: сброс доступен только для сохранённой выплаты -->
                                    <li v-if="accrual.has_draft && !accrual.approved"><button type="button" class="dropdown-item" :disabled="busy" @click="savePayment({amount:'',reset:true},accrual)">Сбросить сохранение</button></li> <!-- новый код chat: явное название сброса черновика -->
                                    <li v-if="!accrual.approved"><button type="button" class="dropdown-item" :disabled="busy || !approvalDate || paymentCents(paymentAmounts[accrual.employee_card_id]) === null" @click="approveTableEmployee(accrual)">Согласовать</button></li>
                                    <li v-else><button type="button" class="dropdown-item" :disabled="busy" @click="cancelTableEmployee(accrual)">Сбросить согласование</button></li> <!-- новый код chat: отмена согласования прямо из строки -->
                                </ul>
                            </div>
                            <span v-if="accrual.has_draft && !accrual.approved && paymentCents(paymentAmounts[accrual.employee_card_id]) === Number(accrual.payment_kopecks)" class="salary-draft-dot" role="img" aria-label="Сохранён черновик выплаты" title="Сохранён черновик выплаты"></span>
                        </td>
                    </tr>
                </tbody>
                <!-- новый код chat: жирное начертание всей строки итогов, включая долги -->
                <tfoot class="table-light fw-bold">
                    <tr>
                        <th scope="row" :colspan="selectionMode ? 6 : 5">Итого по выбранному табелю</th> <!-- новый код chat: учтено удаление колонки официальной ставки -->
                        <td class="text-end text-nowrap fw-bold">{{ formatMoney(totalKopecks) }}</td>
                        <td class="text-end text-nowrap fw-bold">{{ formatMoney(totalExpensesKopecks) }}</td> <!-- новый код chat -->
                        <td class="text-end text-nowrap fw-bold">{{ formatMoney(totalAdvancesKopecks) }}</td>
                        <td class="text-end text-nowrap fw-bold">{{ formatMoney(totalPenaltiesKopecks) }}</td> <!-- новый код chat -->
                        <td class="text-end text-nowrap fw-bold">{{ formatMoney(totalDeductionKopecks) }}</td> <!-- новый код chat: сумма вычетов -->
                        <td class="text-end text-nowrap fw-bold">{{ formatMoney(totalAlimonyKopecks) }}</td> <!-- новый код chat: итог алиментов -->
                        <td class="text-end text-nowrap fw-bold">{{ formatMoney(totalBonusesKopecks) }}</td> <!-- новый код chat -->
                        <td class="text-end">{{ formatMoney(totalCompanyDebtKopecks) }}</td><td class="text-end">{{ formatMoney(totalEmployeeDebtKopecks) }}</td> <!-- новый код chat -->
                        <td class="text-end text-nowrap fw-bold" :class="{'text-danger': totalPayableKopecks < 0}">{{ formatMoney(totalPayableKopecks) }}</td><td class="text-end fw-bold">{{ paymentTotal.valid ? formatMoney(paymentTotal.amount) : 'Проверьте суммы' }}</td> <!-- новый код chat -->
                    </tr>
                </tfoot>
            </table>
        </div>
        <!-- --------- конец нового кода chat -->
        <!-- новый код chat: история согласований отдельным модальным окном -->
        <SalaryApprovalHistoryComponent v-if="showApprovalHistory && selectedMonth" :agreement-id="route.params.id" :month-id="selectedMonthID" :month-label="monthLabel(selectedMonth)" @close="showApprovalHistory = false" @updated="applyHistoryResponse" />
        <!-- новый код chat: отдельное окно календаря и удержаний сотрудника -->
        <SalaryAccrualDetailComponent v-if="selectedAccrual && selectedMonth" :agreement-id="route.params.id" :month="calculationMonth || selectedMonth" :accrual="selectedAccrual" :approved="!!selectedAccrual.approved" :approval-date="selectedAccrual.approval_date || approvalDate" :payment-amount="paymentAmounts[selectedAccrual.employee_card_id]" :busy="busy" :action-error="errorMessage" @close="selectedAccrual = null" @changed="refreshAfterPenalty" @save-payment="savePayment" @approve="approveEmployee" @cancel-approval="cancelEmployee" /> <!-- новый код chat: действия сотрудника -->
    </div>
</template>
<!-- --------- конец нового кода chat -->

<script setup>
// --------- новый код chat: автоматический пересчёт при открытии и выборе табеля
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'; // новый код chat: закрепление шапки
import MoneyInputComponent from '../../MoneyInputComponent.vue'; // новый код chat: общее денежное поле
import { useRoute } from 'vue-router';
import api from '../../../api';
import { rememberSalaryMonth, restoreSalaryMonth } from '../../../utils/salaryMonthStorage'; // новый код chat: отдельный выбранный месяц начислений
import SalaryAccrualDetailComponent from './SalaryAccrualDetailComponent.vue'; // новый код chat: подробности начисления
import SalaryApprovalHistoryComponent from './SalaryApprovalHistoryComponent.vue'; // новый код chat: история по месяцу
import { Tooltip, Dropdown } from 'bootstrap/dist/js/bootstrap.bundle.min.js'; // новый код chat: подсказки и меню выплаты

// --------- новый код chat: меню не обрезается прокручиваемой таблицей
const paymentMenuButtons = new Set(); // новый код chat: отслеживание меню строк
const vPaymentMenu = {
    mounted: element => { paymentMenuButtons.add(element); Dropdown.getOrCreateInstance(element, {boundary:'viewport', popperConfig:config => ({...config,strategy:'fixed'})}); },
    beforeUnmount: element => { paymentMenuButtons.delete(element); Dropdown.getInstance(element)?.dispose(); },
};
const togglePaymentMenu = event => Dropdown.getInstance(event.currentTarget)?.toggle();
// новый код chat: capture обрабатывает и клики в ячейках с @click.stop
const closePaymentMenusOutside = event => {
    for (const button of paymentMenuButtons) {
        const menu = button.nextElementSibling;
        if (!button.contains(event.target) && !menu?.contains(event.target)) Dropdown.getInstance(button)?.hide();
    }
};
// --------- конец нового кода chat

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
const showApprovalHistory = ref(false); // новый код chat
const selectedMonth = computed(() => months.value.find(month => Number(month.ID) === Number(selectedMonthID.value))); // новый код chat: месяц календаря
// --------- новый код chat: выплаты и сохранённое согласование
const approved = ref(false), approvalID = ref(null), approvalDate = ref(new Date().toLocaleDateString('sv-SE', {timeZone:'Europe/Moscow'}));
const revision = ref(''), paymentAmounts = ref({});
const totalCompanyDebtKopecks = ref(0), totalEmployeeDebtKopecks = ref(0);
// --------- новый код chat: выбор и порядок сотрудников
const selectionMode = ref(false), approvalSelection = ref({});
const sortedAccruals = computed(() => [...accruals.value].sort((a,b) => Number(!!a.approved)-Number(!!b.approved) || a.employee_name.localeCompare(b.employee_name,'ru') || a.employee_card_id-b.employee_card_id));
const selectionChanged = computed(() => accruals.value.some(row => !!approvalSelection.value[row.employee_card_id] !== !!row.approved));
const hasResettableDrafts = computed(() => accruals.value.some(row => row.has_draft && !row.approved)); // новый код chat: доступность общего сброса
const startApprovalSelection = () => { approvalSelection.value = Object.fromEntries(accruals.value.map(row => [row.employee_card_id,!!row.approved])); selectionMode.value = true; };
// новый код chat: при частичном выборе отмечаем всех, при полном — снимаем все отметки
const toggleAllApprovals = () => {
    const value = !accruals.value.every(row => !!approvalSelection.value[row.employee_card_id]);
    approvalSelection.value = Object.fromEntries(accruals.value.map(row => [row.employee_card_id,value]));
};
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
const totalAlimonyKopecks = computed(() => accruals.value.reduce((sum,row) => sum + Number(row.alimony_kopecks || 0),0)); // новый код chat
const totalPenaltiesKopecks = ref(0); // новый код chat: штрафы за месяц
const totalAdvancesKopecks = ref(0); // новый код chat: сумма авансов
const totalPayableKopecks = ref(0); // новый код chat: остаток к выплате
const loading = ref(false);
const actionPending = ref(false); // новый код chat: фоновое сохранение без скрытия таблицы
const calculating = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
// --------- новый код chat: новое уведомление заменяет предыдущее, включая одинаковый текст
let successTimer;
const showSuccess = message => {
    clearTimeout(successTimer);
    successMessage.value = message;
    if (message) successTimer = setTimeout(() => { successMessage.value = ''; }, 3000); // новый код chat: уведомление на 3 секунды
};
// --------- конец нового кода chat
const busy = computed(() => loading.value || calculating.value || actionPending.value); // новый код chat: блокируем повторные действия во время сохранения
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
    showApprovalHistory.value = false; // новый код chat: история принадлежит выбранному табелю
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
    if (accruals.value.some(row => row.draft_reset)) showSuccess('Исходные данные изменились: черновики затронутых сотрудников сброшены к расчётным суммам.'); // новый код chat: временное уведомление
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
    showSuccess(''); // новый код chat: очищаем уведомление и таймер
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
    showSuccess(''); // новый код chat: очищаем уведомление и таймер
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
    actionPending.value = true; errorMessage.value = ''; // новый код chat: данные остаются на экране до ответа
    for (const button of paymentMenuButtons) Dropdown.getInstance(button)?.hide(); // новый код chat: закрываем меню без удаления таблицы
    try {
        const res = await api.post(`/agreements/${route.params.id}/timesheetmonth/${selectedMonthID.value}/${path}`,body);
        if (version === requestVersion) { applyResponse(res.data); if (!(res.data.accruals || []).some(row => row.draft_reset)) showSuccess(message); } // новый код chat: заменяем уведомление и запускаем таймер заново
    } catch (err) { if (version === requestVersion) errorMessage.value = requestError(err); }
    finally { actionPending.value = false; } // новый код chat: возвращаем доступность действий
};
const savePayment = async({amount,reset}, row = selectedAccrual.value) => { // новый код chat: общая функция таблицы и окна
    if (!row || busy.value || row.approved || (reset ? !row.has_draft : row.has_draft || paymentCents(amount) === null)) return; // новый код chat: изменение сохранённой выплаты только после сброса
    // новый код chat: сохранение одной строки не стирает ввод в остальных строках
    const context = `${route.params.id}/${selectedMonthID.value}`;
    const pending = accruals.value.filter(item => item.employee_card_id !== row.employee_card_id && !item.approved)
        .map(item => ({id:item.employee_card_id,revision:item.revision,amount:paymentAmounts.value[item.employee_card_id]}));
    await runSalaryAction('payment-draft',{employee_card_id:row.employee_card_id,revision:row.revision,amount,reset},reset ? 'Выплата возвращена к расчётной сумме.' : 'Выплата сохранена.');
    if (context !== `${route.params.id}/${selectedMonthID.value}`) return;
    for (const item of pending) {
        const current = accruals.value.find(value => value.employee_card_id === item.id);
        if (current && !current.approved && current.revision === item.revision) paymentAmounts.value[item.id] = item.amount;
    }
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
const approveTableEmployee = row => { // новый код chat: согласование из меню строки
    const amount = paymentAmounts.value[row.employee_card_id];
    if (busy.value || row.approved || !approvalDate.value || paymentCents(amount) === null) return;
    return submitApprovals([selectionEntry(row,true,amount)]);
};
const cancelEmployee = () => selectedAccrual.value && submitApprovals([selectionEntry(selectedAccrual.value,false)]);
// новый код chat: отмена из истории обновляет таблицу без перезагрузки
const applyHistoryResponse = data => {
    applyResponse(data);
    showSuccess('Согласование отменено.');
};
// новый код chat: обновление таблицы без перезагрузки после общего сброса
const resetAllPaymentDrafts = () => {
    if (busy.value || !hasResettableDrafts.value) return;
    // новый код chat: защита от случайного общего сброса сохранённых выплат
    if (!window.confirm('Сбросить все сохранённые выплаты несогласованных сотрудников выбранного табеля? Вручную сохранённые суммы будут заменены расчётными. Согласованные выплаты останутся без изменений.')) return;
    return runSalaryAction('payment-draft',{reset_all:true},'Сохранения несогласованных сотрудников сброшены.');
};
// новый код chat: тот же процесс отмены согласования для меню таблицы
const cancelTableEmployee = row => {
    if (busy.value || !row.approved) return;
    return submitApprovals([selectionEntry(row,false)]);
};
const applySelectedApprovals = () => submitApprovals(accruals.value.map(row => selectionEntry(row,!!approvalSelection.value[row.employee_card_id])));
// --------- конец нового кода chat
watch(() => route.params.id, getMonthsHandler, {immediate: true});
// --------- новый код chat: закрепление заголовков с сохранением горизонтальной прокрутки
const salaryTable = ref(null), salaryHeader = ref(null), salaryHeaderOffset = ref(0);
let salaryHeaderFrame = 0, salaryHeaderObserver;
const updateSalaryHeader = () => {
    salaryHeaderFrame = 0;
    if (!salaryTable.value || !salaryHeader.value) { salaryHeaderOffset.value = 0; return; }
    const rect = salaryTable.value.getBoundingClientRect();
    salaryHeaderOffset.value = Math.max(0, Math.min(-rect.top, rect.height - salaryHeader.value.offsetHeight));
};
const scheduleSalaryHeader = () => {
    if (!salaryHeaderFrame) salaryHeaderFrame = requestAnimationFrame(updateSalaryHeader);
};
watch([salaryTable, salaryHeader], () => {
    salaryHeaderObserver?.disconnect();
    if (salaryTable.value) salaryHeaderObserver?.observe(salaryTable.value);
    if (salaryHeader.value) salaryHeaderObserver?.observe(salaryHeader.value);
    scheduleSalaryHeader();
}, {flush:'post'});
onMounted(() => {
    document.addEventListener('click', closePaymentMenusOutside, true); // новый код chat
    window.addEventListener('scroll', scheduleSalaryHeader, {capture:true, passive:true});
    window.addEventListener('resize', scheduleSalaryHeader);
    salaryHeaderObserver = new ResizeObserver(scheduleSalaryHeader);
    if (salaryTable.value) salaryHeaderObserver.observe(salaryTable.value);
    if (salaryHeader.value) salaryHeaderObserver.observe(salaryHeader.value);
    scheduleSalaryHeader();
});
onBeforeUnmount(() => {
    clearTimeout(successTimer); // новый код chat: очищаем таймер при уходе со страницы
    document.removeEventListener('click', closePaymentMenusOutside, true); // новый код chat
    requestVersion++;
    window.removeEventListener('scroll', scheduleSalaryHeader, true);
    window.removeEventListener('resize', scheduleSalaryHeader);
    salaryHeaderObserver?.disconnect();
    if (salaryHeaderFrame) cancelAnimationFrame(salaryHeaderFrame);
});
// --------- конец нового кода chat
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: доступные для открытия строки начислений */
.salary-accrual-row { cursor: pointer; }
.salary-approved-row { --bs-table-bg: #e7f4e8; --bs-table-hover-bg: #dceedd; } /* новый код chat: согласованные строки */
.salary-approved-row .salary-payment { background-color: #e7f4e8; } /* новый код chat: зелёный фон поля согласованной выплаты */
/* новый код chat: нулевая ставка выделена и в согласованных строках, и при наведении */
.salary-table td.salary-zero-rate { --bs-table-bg: #f8d7da; --bs-table-hover-bg: #f1c5c9; }
/* новый код chat: подсветка алиментов сохраняется в согласованных строках */
.salary-table td.salary-alimony-cell { --bs-table-bg: #f8d7da; --bs-table-hover-bg: #f1c5c9; }
.salary-accrual-row:focus-visible { outline: 2px solid var(--bs-primary); outline-offset: -2px; }
/* --------- конец нового кода chat */
/* --------- новый код chat: компактная таблица с округлённой рамкой */
.salary-table-wrap { border: 1px solid var(--bs-border-color); border-radius: 6px; overflow: auto; }
.salary-table { font-size: 13px; margin-bottom: 0; } /* новый код chat: увеличенный шрифт таблицы */
/* новый код chat: непрозрачная шапка поверх строк без дополнительной толстой рамки */
.salary-sticky-header { position: relative; z-index: 5; background: #f8f9fa; }
.salary-sticky-header th { background: #f8f9fa; }
.salary-table th { white-space: normal; min-width: 65px; }
/* --------- новый код chat: узкий номер и отметка черновика в углу выплаты */
.salary-table .salary-number { width: 32px; min-width: 32px; text-align: center; white-space: nowrap; }
/* новый код chat: минимальная ширина согласования по содержимому */
.salary-table .salary-selection { width: 1%; min-width: 0; padding: 3px 2px; text-align: center; white-space: nowrap; }
.salary-payment-cell { position: relative; }
.salary-table .salary-payment-heading, .salary-table .salary-payment-cell { width: 184px; min-width: 184px; } /* новый код chat: место для суммы 100 000 000,00 и кнопок */
.salary-table td.salary-payment-cell { padding: 0 2px; } /* новый код chat: минимальные боковые отступы группы ввода */
.salary-draft-dot { position: absolute; top: 3px; right: 3px; width: 6px; height: 6px; border-radius: 50%; background-color: var(--bs-success); }
/* --------- конец нового кода chat */
.salary-table th, .salary-table td { padding: 3px 4px; }
.salary-table > thead > tr:first-child { border-top: 0; }
.salary-table > tfoot > tr:last-child { border-bottom: 0; }
.salary-table > :not(caption) > tr > :first-child { border-left: 0; }
.salary-table > :not(caption) > tr > :last-child { border-right: 0; }
.salary-payment { width: 100px; font-size: 13px; padding: 2px 4px; min-height: 24px; } /* новый код chat: шрифт поля выплаты как в таблице */
/* новый код chat: компактная группа без переноса кнопки */
.salary-payment-group { width: 100%; min-width: 180px; flex-wrap: nowrap; } /* новый код chat: группа для большой суммы и обеих кнопок */
.salary-payment-group .dropdown-menu { font-size: 13px; text-align: left; }
/* новый код chat: правые углы последней кнопки скруглены независимо от меню */
.salary-payment-group > .salary-payment-menu-button { border-top-right-radius: var(--bs-border-radius-sm, .25rem) !important; border-bottom-right-radius: var(--bs-border-radius-sm, .25rem) !important; }
.salary-payment-group .salary-payment { width: 1%; min-width: 130px; font-size: 13px; font-variant-numeric: tabular-nums; color: #000; } /* новый код chat: сумма 100 000 000,00 помещается целиком */
/* новый код chat: сохранённая выплата — заливка кнопки как при наведении */
.salary-payment-group .salary-save-saved:disabled { background-color: var(--bs-btn-hover-bg); border-color: var(--bs-btn-hover-border-color); color: var(--bs-btn-hover-color); opacity: 1; }
.salary-payment-group .salary-payment:disabled { cursor: default; caret-color: transparent; } /* новый код chat: заблокированная выплата без курсора ввода */
.salary-payment-group .btn { padding: 2px 4px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; } /* новый код chat: кнопки не сжимаются рядом с суммой */
/* --------- конец нового кода chat */
/* новый код chat: оформление ссылок ФИО */
.salary-employee-link { color: inherit; text-decoration: none; }
.salary-employee-link:hover { color: #0d6efd; text-decoration: underline; }
.salary-employee-link:focus-visible { outline: 2px solid #0d6efd; outline-offset: 2px; }
</style>
