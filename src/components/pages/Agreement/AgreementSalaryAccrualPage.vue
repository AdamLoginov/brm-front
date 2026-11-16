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
                <!-- --------- конец нового кода chat -->
            </div>
        </div>

        <div v-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
        <div v-if="successMessage" class="alert alert-success" role="status">{{ successMessage }}</div>
        <div v-if="busy" class="text-secondary py-3" role="status">{{ calculating ? 'Рассчитываем начисления…' : 'Загружаем данные…' }}</div>
        <div v-else-if="!months.length && !errorMessage" class="alert alert-info">У договора пока нет табелей. Сначала создайте месячный табель.</div>
        <div v-else-if="selectedMonthID && !accruals.length && !errorMessage" class="alert alert-info">В выбранном табеле нет сотрудников для начисления зарплаты.</div>

        <div v-if="!busy && accruals.length" class="table-responsive">
            <!-- новый код chat: уменьшенные отступы ячеек и высота строк -->
            <table class="table table-sm table-bordered table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th scope="col">Сотрудник</th>
                        <th scope="col" class="text-end">Смены</th> <!-- новый код chat: часы отображаются в сменах -->
                        <th scope="col" class="text-end">Ставка за смену</th>
                        <th scope="col" class="text-end">Начислено</th>
                        <th scope="col" class="text-end">Авансы</th>
                        <th scope="col" class="text-end">Штрафы</th> <!-- новый код chat -->
                        <th scope="col" class="text-end">К выплате</th>
                        <!-- новый код chat: колонка даты расчёта удалена -->
                    </tr>
                </thead>
                <tbody>
                    <!-- новый код chat: открытие подробностей мышью или клавиатурой -->
                    <tr v-for="accrual in accruals" :key="accrual.ID" class="salary-accrual-row" tabindex="0" aria-haspopup="dialog" :aria-label="`Подробности начисления: ${accrual.employee_name}`" @click="selectedAccrual = accrual" @keydown.enter.prevent="selectedAccrual = accrual" @keydown.space.prevent="selectedAccrual = accrual">
                        <td :title="accrual.employee_name">{{ formatEmployeeName(accrual) }}</td> <!-- новый код chat: фамилия и инициалы, полное имя в подсказке -->
                        <td class="text-end">{{ formatShifts(accrual.total_hours, accrual.shift_hours) }}</td> <!-- новый код chat: норма смены из табеля -->
                        <td class="text-end text-nowrap">{{ formatMoney(accrual.salary_rate_kopecks) }}</td>
                        <td class="text-end text-nowrap fw-semibold">{{ formatMoney(accrual.amount_kopecks) }}</td>
                        <td class="text-end text-nowrap">{{ formatMoney(accrual.advances_kopecks) }}</td>
                        <td class="text-end text-nowrap">{{ formatMoney(accrual.penalties_kopecks) }}</td> <!-- новый код chat -->
                        <td class="text-end text-nowrap fw-semibold" :class="{'text-danger': accrual.payable_kopecks < 0}">{{ formatMoney(accrual.payable_kopecks) }}</td>
                    </tr>
                </tbody>
                <tfoot class="table-light">
                    <tr>
                        <th scope="row" colspan="3">Итого по выбранному табелю</th>
                        <td class="text-end text-nowrap fw-bold">{{ formatMoney(totalKopecks) }}</td>
                        <td class="text-end text-nowrap fw-bold">{{ formatMoney(totalAdvancesKopecks) }}</td>
                        <td class="text-end text-nowrap fw-bold">{{ formatMoney(totalPenaltiesKopecks) }}</td> <!-- новый код chat -->
                        <td class="text-end text-nowrap fw-bold" :class="{'text-danger': totalPayableKopecks < 0}">{{ formatMoney(totalPayableKopecks) }}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        <!-- новый код chat: отдельное окно календаря и удержаний сотрудника -->
        <SalaryAccrualDetailComponent v-if="selectedAccrual && selectedMonth" :agreement-id="route.params.id" :month="selectedMonth" :accrual="selectedAccrual" @close="selectedAccrual = null" @changed="refreshAfterPenalty" /> <!-- новый код chat: пересчёт после прощения штрафа -->
    </div>
</template>
<!-- --------- конец нового кода chat -->

<script setup>
// --------- новый код chat: автоматический пересчёт при открытии и выборе табеля
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '../../../api';
import SalaryAccrualDetailComponent from './SalaryAccrualDetailComponent.vue'; // новый код chat: подробности начисления

const route = useRoute();
const months = ref([]);
const selectedMonthID = ref(null);
const accruals = ref([]);
const selectedAccrual = ref(null); // новый код chat: сотрудник открытого окна
const selectedMonth = computed(() => months.value.find(month => Number(month.ID) === Number(selectedMonthID.value))); // новый код chat: месяц календаря
const totalKopecks = ref(0);
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
    totalKopecks.value = 0;
    totalPenaltiesKopecks.value = 0; // новый код chat
    totalAdvancesKopecks.value = 0; // новый код chat
    totalPayableKopecks.value = 0; // новый код chat
};

const applyResponse = (data) => {
    accruals.value = data.accruals || [];
    totalKopecks.value = data.total_kopecks || 0;
    totalPenaltiesKopecks.value = data.total_penalties_kopecks || 0; // новый код chat
    totalAdvancesKopecks.value = data.total_advances_kopecks || 0; // новый код chat
    totalPayableKopecks.value = data.total_payable_kopecks || 0; // новый код chat
};

const getAccrualsHandler = async() => {
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
        selectedMonthID.value = months.value[0]?.ID || null;
        loading.value = false;
        if (selectedMonthID.value) await getAccrualsHandler();
    } catch (err) {
        if (version === requestVersion) errorMessage.value = requestError(err);
    } finally {
        if (version === requestVersion) loading.value = false;
    }
};

watch(() => route.params.id, getMonthsHandler, {immediate: true});
onBeforeUnmount(() => { requestVersion++; });
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: доступные для открытия строки начислений */
.salary-accrual-row { cursor: pointer; }
.salary-accrual-row:focus-visible { outline: 2px solid var(--bs-primary); outline-offset: -2px; }
/* --------- конец нового кода chat */
</style>
