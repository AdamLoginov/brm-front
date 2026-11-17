<!-- --------- новый код chat: премии договора -->
<template>
    <!-- новый код chat: навигация и общий контейнер перенесены в AgreementSalaryPage -->
    <div>
        <p class="text-secondary">Назначайте премии за конкретный месяц. Невыплаченные премии прибавляются к зарплате за этот месяц.</p>
        <hr>
        <div v-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
        <form class="row g-2 align-items-end mb-3" @submit.prevent="saveBonusHandler">
            <div class="col-md-3">
                <label for="bonus-employee" class="form-label">Сотрудник</label>
                <select id="bonus-employee" v-model="form.employee_card_id" class="form-select form-select-sm" required :disabled="busy">
                    <option :value="null" disabled>Выберите сотрудника</option>
                    <option v-if="previousEmployee" :value="previousEmployee.employee_card_id">{{ previousEmployee.employee_name }} (уже не в договоре)</option>
                    <option v-for="employee in employees" :key="employee.ID" :value="employee.ID">{{ employeeName(employee) }}</option>
                </select>
            </div>
            <div class="col-md-2">
                <label for="bonus-date" class="form-label">Месяц премии</label>
                <input id="bonus-date" v-model="form.period" type="month" class="form-control form-control-sm" required :disabled="busy">
            </div>
            <div class="col-md-2">
                <label for="bonus-amount" class="form-label">Сумма, ₽</label>
                <input id="bonus-amount" v-model="form.amount" type="text" inputmode="decimal" class="form-control form-control-sm" placeholder="0,00" required :disabled="busy">
            </div>
            <div class="col-md-3">
                <label for="bonus-comment" class="form-label">Комментарий</label>
                <input id="bonus-comment" v-model="form.comment" class="form-control form-control-sm" :disabled="busy">
            </div>
            <div class="col-md-2 d-flex gap-1">
                <button class="btn btn-primary btn-sm" :disabled="busy || (!employees.length && !editingID)">{{ editingID ? 'Сохранить' : 'Добавить' }}</button>
                <button v-if="editingID" type="button" class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="resetForm">Отмена</button>
            </div>
        </form>
        <p v-if="!busy && !employees.length" class="text-secondary">Для новой премии сначала закрепите сотрудника за договором.</p>
        <div v-if="busy" class="text-secondary py-3" role="status">Загружаем данные…</div>
        <div v-else class="col-12 col-xl-11 list-group">
            <div class="list-group-item bg-light salary-list-header salary-list-row fw-semibold">
                <!-- новый код chat: отдельная колонка статуса справа от даты -->
                <div>Месяц</div><div>Статус</div><div>Сотрудник</div><div>Сумма</div><div>Комментарий</div><div></div>
            </div>
            <div v-for="bonus in bonuses" :key="bonus.ID" class="list-group-item">
                <div class="salary-list-row align-items-center">
                    <div class="salary-list-cell">
                        <div>{{ formatPeriod(bonus) }}</div>
                    </div>
                    <!-- новый код chat: статус вынесен из колонки даты -->
                    <div class="salary-list-cell">
                        <!-- новый код chat: белый фон, текст и рамка цветом статуса -->
                        <span class="badge rounded-5 border bg-white fw-normal" :class="bonus.is_paid ? 'text-secondary border-secondary' : 'text-success border-success'" style="font-size: 10px;">{{ bonus.is_paid ? 'Выплачена' : 'Не выплачена' }}</span> <!-- новый код chat: обычная толщина текста статуса -->
                    </div>
                    <div class="salary-list-cell" :title="bonus.employee_name">{{ shortEmployeeName(bonus) }}</div> <!-- новый код chat: фамилия и инициалы -->
                    <div class="salary-list-cell">{{ formatMoney(bonus.amount_kopecks) }}</div>
                    <div class="salary-list-cell text-break">{{ bonus.comment || '—' }}</div> <!-- новый код chat: место для колонки статуса -->
                    <div class="text-end dropdown">
                        <button class="btn btn-sm" type="button" data-bs-toggle="dropdown" aria-label="Действия с премией">⋮</button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><button class="dropdown-item" @click="changePaid(bonus)">{{ bonus.is_paid ? 'Отметить как не выплаченную' : 'Отметить как выплаченную' }}</button></li> <!-- новый код chat -->
                            <li><button class="dropdown-item" @click="editBonusHandler(bonus)">Редактировать</button></li>
                            <li><button class="dropdown-item text-danger" @click="deleteBonusHandler(bonus)">Удалить</button></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div v-if="!bonuses.length && !errorMessage" class="list-group-item text-secondary">Премий пока нет.</div>
        </div>
    </div>
</template>
<!-- --------- конец нового кода chat -->

<script setup>
// --------- новый код chat: создание, редактирование и удаление премий
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '../../../api';

const route = useRoute();
const bonuses = ref([]);
const employees = ref([]);
const busy = ref(false);
const errorMessage = ref('');
const editingID = ref(null);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const emptyForm = () => ({employee_card_id:null, period:today().slice(0,7), amount:'', comment:''});
const form = ref(emptyForm());
let requestVersion = 0;
const employeeName = (employee) => [employee.surname, employee.name, employee.middle_name].filter(Boolean).join(' ');
// --------- новый код chat: сокращённое ФИО в списке
const shortEmployeeName = (row) => {
    const parts = (row.employee_name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return `Сотрудник №${row.employee_card_id}`;
    return [parts[0], ...parts.slice(1).map(part => `${part[0].toLocaleUpperCase('ru-RU')}.`)].join(' ');
};
// --------- конец нового кода chat
const formatMoney = (kopecks) => (Number(kopecks) / 100).toLocaleString('ru-RU', {style:'currency', currency:'RUB'});
const formatPeriod = row => new Date(row.year, row.month - 1, 1).toLocaleDateString('ru-RU', {month:'long', year:'numeric'}); // новый код chat
const requestError = (err) => typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось выполнить запрос. Попробуйте ещё раз.';
const previousEmployee = computed(() => {
    const row = bonuses.value.find(item => item.ID === editingID.value);
    return row && !employees.value.some(item => item.ID === row.employee_card_id) ? row : null;
});
const resetForm = () => { editingID.value = null; form.value = emptyForm(); };
const editBonusHandler = (row) => {
    editingID.value = row.ID;
    // Копейки преобразуются в строку без промежуточного округления большой суммы.
    const cents = BigInt(row.amount_kopecks);
    form.value = {employee_card_id:row.employee_card_id, period:`${row.year}-${String(row.month).padStart(2,'0')}`, amount:`${cents / 100n}.${String(cents % 100n).padStart(2,'0')}`, comment:row.comment};
};
const getBonusesHandler = async() => {
    const version = ++requestVersion;
    busy.value = true; errorMessage.value = ''; resetForm(); bonuses.value = []; employees.value = [];
    try {
        const [rows, people] = await Promise.all([api.get(`/agreements/${route.params.id}/bonuses`), api.get(`/agreements/${route.params.id}/employee`)]);
        if (version !== requestVersion) return;
        bonuses.value = rows.data || [];
        employees.value = (people.data || []).sort((a,b) => employeeName(a).localeCompare(employeeName(b),'ru'));
    } catch (err) { if (version === requestVersion) errorMessage.value = requestError(err); }
    finally { if (version === requestVersion) busy.value = false; }
};
const saveBonusHandler = async() => {
    if (busy.value) return;
    const amount = form.value.amount.replace(/[\s\u00a0\u202f]/g, '').replace(',', '.');
    if (!/^\d+(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) { errorMessage.value = 'Введите положительную сумму с точностью до копеек.'; return; }
    const version = requestVersion;
    busy.value = true; errorMessage.value = '';
    try {
        const suffix = editingID.value ? `${editingID.value}/update` : 'create';
        const res = await api.post(`/agreements/${route.params.id}/bonuses/${suffix}`, {employee_card_id:form.value.employee_card_id, month:Number(form.value.period.split('-')[1]), year:Number(form.value.period.split('-')[0]), amount, comment:form.value.comment});
        if (version !== requestVersion) return;
        bonuses.value = [...bonuses.value.filter(row => row.ID !== res.data.ID), res.data].sort((a,b) => b.year - a.year || b.month - a.month || b.ID - a.ID);
        resetForm();
    } catch (err) { if (version === requestVersion) errorMessage.value = requestError(err); }
    finally { if (version === requestVersion) busy.value = false; }
};
const deleteBonusHandler = async(row) => {
    if (busy.value || !window.confirm(`Удалить премию ${formatMoney(row.amount_kopecks)} для ${row.employee_name}?`)) return;
    const version = requestVersion;
    busy.value = true; errorMessage.value = '';
    try {
        await api.delete(`/agreements/${route.params.id}/bonuses/${row.ID}`);
        if (version !== requestVersion) return;
        bonuses.value = bonuses.value.filter(item => item.ID !== row.ID);
        if (editingID.value === row.ID) resetForm();
    } catch (err) { if (version === requestVersion) errorMessage.value = requestError(err); }
    finally { if (version === requestVersion) busy.value = false; }
};
// --------- новый код chat: статус премии переключается вручную
const changePaid = async(row) => {
    if (busy.value) return;
    const version = requestVersion;
    busy.value = true; errorMessage.value = '';
    try {
        const res = await api.patch(`/agreements/${route.params.id}/bonuses/${row.ID}/status`, {is_paid:!row.is_paid});
        if (version === requestVersion) bonuses.value = bonuses.value.map(item => item.ID === row.ID ? res.data : item);
    } catch (err) { if (version === requestVersion) errorMessage.value = requestError(err); }
    finally { if (version === requestVersion) busy.value = false; }
};
// --------- конец нового кода chat
watch(() => route.params.id, getBonusesHandler, {immediate:true});
onBeforeUnmount(() => { requestVersion++; });
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: компактные колонки, остаток ширины для комментария */
.salary-list-row {
    display: grid;
    gap: 8px;
}
.salary-list-header {
    display: none;
}
.salary-list-cell {
    min-width: 0;
    overflow-wrap: anywhere;
}
@media (min-width: 768px) {
    .salary-list-row {
        grid-template-columns: 140px 115px 150px 125px minmax(0, 1fr) 28px;
    }
    .salary-list-header {
        display: grid;
    }
}
/* --------- конец нового кода chat */
</style>
