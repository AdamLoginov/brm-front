<!-- --------- новый код chat: история фактических выдач суточных -->
<template>
    <div class="daily-history-backdrop" @click.self="close">
        <div class="modal-dialog modal-xl w-100 my-4" role="dialog" aria-modal="true" aria-labelledby="daily-history-title" @keydown.esc="close">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 id="daily-history-title" class="modal-title">История выдач суточных</h5>
                    <button class="btn-close" :disabled="busy" aria-label="Закрыть" @click="close"></button>
                </div>
                <div class="modal-body">
                    <div v-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
                    <div class="daily-history-search mb-3"><label for="daily-history-search" class="form-label">Сотрудник</label><input id="daily-history-search" v-model="search" class="form-control form-control-sm" placeholder="Поиск по ФИО"></div>
                    <div v-if="busy" class="text-secondary" role="status">Обрабатываем данные…</div>
                    <!-- --------- новый код chat: отдельная карточка даты с итогом и действиями -->
                    <section v-for="group in groupedPayments" :key="group.date" class="daily-history-day">
                        <div class="daily-history-day-header">
                            <button type="button" class="btn daily-history-toggle" :disabled="busy" :aria-expanded="isGroupOpen(group.date)" @click="toggleGroup(group.date)">
                                <i :class="isGroupOpen(group.date) ? 'bi bi-chevron-down' : 'bi bi-chevron-right'" aria-hidden="true"></i>
                                <span><strong>{{ formatDate(group.date) }}</strong><small>Сотрудников: {{ group.employeeCount }} · Выдач: {{ group.rows.length }}</small></span>
                                <strong class="daily-history-total">{{ formatMoney(group.total) }} ₽</strong>
                            </button>
                            <!-- новый код chat: SVG удаления всех выдач за день с подсказкой -->
                            <button type="button" class="daily-history-action daily-history-action-delete daily-history-delete-day" :disabled="busy" title="Удалить выдачи за день" aria-label="Удалить выдачи за день" @click="removeDay(group.date)">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1M4 4v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4z"/></svg>
                            </button>
                        </div>
                        <div v-if="isGroupOpen(group.date)" class="table-responsive daily-history-table">
                            <table class="table table-sm align-middle">
                                <thead><tr><th>Дата выплаты</th><th>Сотрудник</th><th>Месяц и год</th><th>Сумма, ₽</th><th>Действия</th></tr></thead>
                                <tbody>
                                <tr v-for="row in group.rows" :key="row.ID">
                                    <td><input v-if="editingID === row.ID" v-model="form.date" type="date" class="form-control form-control-sm" :disabled="busy" aria-label="Дата выплаты"><span v-else>{{ formatDate(row.date) }}</span></td>
                                    <td>{{ row.employee_name || `Сотрудник №${row.employee_card_id}` }}</td>
                                    <td>{{ monthLabel(row.time_sheet_month_id) }}</td> <!-- новый код chat: месяц и год исходного табеля -->
                                    <td><input v-if="editingID === row.ID" v-model="form.amount" inputmode="decimal" class="form-control form-control-sm" :disabled="busy" aria-label="Сумма выплаты"><span v-else>{{ formatMoney(row.amount_kopecks) }}</span></td>
                                    <td>
                                        <div class="d-flex gap-1 flex-wrap">
                                            <template v-if="editingID === row.ID"><button class="btn btn-sm btn-primary" :disabled="busy" @click="save(row)">Сохранить</button><button class="btn btn-sm btn-outline-secondary" :disabled="busy" @click="editingID = null">Отмена</button></template>
                                            <!-- новый код chat: компактные SVG действий с доступными подписями -->
                                            <template v-else>
                                                <button type="button" class="daily-history-action" :disabled="busy" title="Изменить выдачу" aria-label="Изменить выдачу" @click="edit(row)"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.196.12l-4.5 1.5a.5.5 0 0 1-.632-.632l1.5-4.5a.5.5 0 0 1 .12-.196zm-.646 2.061L13.793 4.5 14.793 3.5 12.5 1.207zM13.086 5.207 10.793 2.914 3 10.707V11h1a.5.5 0 0 1 .5.5v1h.293zM2.761 11.5l-.106.106-.98 2.94 2.94-.98.106-.106H4a.5.5 0 0 1-.5-.5v-1h-1a.5.5 0 0 1-.5-.5z"/></svg></button>
                                                <button type="button" class="daily-history-action daily-history-action-delete" :disabled="busy" title="Удалить выдачу" aria-label="Удалить выдачу" @click="remove(row)"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1M4 4v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4z"/></svg></button>
                                            </template>
                                        </div>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                    <div v-if="!busy && !filtered.length" class="daily-history-empty">Выдачи не найдены.</div>
                    <!-- --------- конец нового кода chat -->
                    <p class="small text-secondary mb-0">Изменение суммы проверяется по текущей ставке исходного табеля. При изменении только даты прежняя сумма сохраняется.</p>
                </div>
                <div class="modal-footer"><button class="btn btn-sm btn-secondary" :disabled="busy" @click="close">Закрыть</button></div>
            </div>
        </div>
    </div>
</template>
<!-- --------- конец нового кода chat -->

<script setup>
// --------- новый код chat: редактирование и удаление истории, включая переведённых сотрудников
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import api from '../../../api';
const props = defineProps({agreementId: {type: [String, Number], required: true}, months: {type: Array, default: () => []}}); // новый код chat: список табелей для названия месяца
const emit = defineEmits(['close', 'changed']);
const rows = ref([]), busy = ref(false), errorMessage = ref(''), search = ref(''), editingID = ref(null);
const form = ref({date:'', amount:''});
let version = 0;
const filtered = computed(() => rows.value.filter(row => (row.employee_name || '').toLocaleLowerCase('ru-RU').includes(search.value.toLocaleLowerCase('ru-RU'))));
// --------- новый код chat: свежие даты сверху, суммы и сотрудники внутри группы
const expandedDates = ref(new Set());
const groupedPayments = computed(() => {
    const groups = new Map();
    for (const row of filtered.value) {
        if (!groups.has(row.date)) groups.set(row.date, {date:row.date, rows:[], total:0n});
        const group = groups.get(row.date);
        group.rows.push(row);
        group.total += BigInt(row.amount_kopecks);
    }
    return [...groups.values()].map(group => ({
        ...group,
        employeeCount:new Set(group.rows.map(row => row.employee_card_id)).size,
        rows:group.rows.sort((a,b) => (a.employee_name || '').localeCompare(b.employee_name || '', 'ru') || a.ID-b.ID),
    })).sort((a,b) => b.date.localeCompare(a.date));
});
const isGroupOpen = date => expandedDates.value.has(date);
const toggleGroup = date => {
    const next = new Set(expandedDates.value);
    if (next.has(date)) next.delete(date); else next.add(date);
    expandedDates.value = next;
};
watch(search, () => { expandedDates.value = new Set(search.value.trim() ? groupedPayments.value.map(group => group.date) : []); });
// --------- конец нового кода chat
// --------- новый код chat: месяц и год табеля вместо номера
const monthLabel = id => {
    const month = props.months.find(item => Number(item.ID) === Number(id));
    return month ? new Date(month.year, month.month - 1, 1).toLocaleDateString('ru-RU', {month:'long', year:'numeric'}) : 'Табель удалён';
};
// --------- конец нового кода chat
const formatDate = value => value.split('-').reverse().join('.');
const formatMoney = value => { const cents = BigInt(value); return `${(cents / 100n).toLocaleString('ru-RU')},${String(cents % 100n).padStart(2,'0')}`; }; // новый код chat: точная сумма группы в копейках
const errorText = err => typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось выполнить запрос. Повторите попытку.';
const close = () => { if (!busy.value) emit('close'); };
const load = async() => {
    expandedDates.value = new Set(); // новый код chat: группы свёрнуты при открытии истории
    const current = ++version; busy.value = true; errorMessage.value = ''; rows.value = []; editingID.value = null;
    try { const res = await api.get(`/agreements/${props.agreementId}/daily-allowance/payments`); if (current === version) rows.value = res.data || []; }
    catch (err) { if (current === version) errorMessage.value = errorText(err); }
    finally { if (current === version) busy.value = false; }
};
const edit = row => {
    editingID.value = row.ID; errorMessage.value = '';
    const amount = BigInt(row.amount_kopecks);
    form.value = {date:row.date, amount:`${amount / 100n}.${String(amount % 100n).padStart(2,'0')}`};
};
const save = async(row) => {
    if (busy.value) return;
    const amount = form.value.amount.trim().replace(',', '.');
    if (!/^\d+(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0 || !form.value.date) { errorMessage.value = 'Укажите дату и положительную сумму до копеек.'; return; }
    const current = version; busy.value = true; errorMessage.value = '';
    try {
        const res = await api.put(`/agreements/${props.agreementId}/daily-allowance/payments/${row.ID}`, {date:form.value.date, amount});
        if (current !== version) return;
        rows.value = rows.value.map(item => item.ID === row.ID ? res.data : item).sort((a,b) => b.date.localeCompare(a.date) || b.ID-a.ID);
        expandedDates.value = new Set([...expandedDates.value, res.data.date]); // новый код chat: изменённая выдача видна в новой дате
        editingID.value = null; emit('changed');
    } catch (err) { if (current === version) errorMessage.value = errorText(err); }
    finally { if (current === version) busy.value = false; }
};
const remove = async(row) => {
    if (busy.value || !window.confirm(`Удалить выдачу ${formatMoney(row.amount_kopecks)} ₽ для ${row.employee_name}? Баланс будет пересчитан.`)) return;
    const current = version; busy.value = true; errorMessage.value = '';
    try {
        await api.delete(`/agreements/${props.agreementId}/daily-allowance/payments/${row.ID}`);
        if (current !== version) return;
        rows.value = rows.value.filter(item => item.ID !== row.ID); if (editingID.value === row.ID) editingID.value = null; emit('changed');
    } catch (err) { if (current === version) errorMessage.value = errorText(err); }
    finally { if (current === version) busy.value = false; }
};
// --------- новый код chat: удаление всей даты, включая скрытые поиском выдачи
const removeDay = async(date) => {
    if (busy.value) return;
    const payments = rows.value.filter(row => row.date === date);
    const total = payments.reduce((sum, row) => sum + BigInt(row.amount_kopecks), 0n);
    if (!window.confirm(`Удалить ВСЕ выдачи за ${formatDate(date)} в этом договоре?\nВыдач: ${payments.length}. Сумма: ${formatMoney(total)} ₽.\nВключая выдачи, скрытые поиском. Балансы будут пересчитаны.`)) return;
    const current = version; busy.value = true; errorMessage.value = '';
    try {
        await api.delete(`/agreements/${props.agreementId}/daily-allowance/payments/by-date/${date}`);
        if (current !== version) return;
        if (payments.some(row => row.ID === editingID.value)) editingID.value = null;
        rows.value = rows.value.filter(row => row.date !== date);
        const expanded = new Set(expandedDates.value);
        expanded.delete(date);
        expandedDates.value = expanded;
        emit('changed');
    } catch (err) { if (current === version) errorMessage.value = errorText(err); }
    finally { if (current === version) busy.value = false; }
};
// --------- конец нового кода chat
watch(() => props.agreementId, load, {immediate:true});
onBeforeUnmount(() => { version++; });
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: компактные карточки дат и непрозрачное окно в стиле страницы */
.daily-history-backdrop { position: fixed; inset: 0; z-index: 1060; overflow-y: auto; background: #0008; padding: 0 16px; }
.daily-history-backdrop .modal-content { background: #fff; border-radius: 12px; overflow: hidden; font-size: 14px; font-weight: 400; box-shadow: 0 12px 40px #0002; }
.daily-history-backdrop .modal-header,
.daily-history-backdrop .modal-body,
.daily-history-backdrop .modal-footer { padding: 16px 20px; }
.daily-history-backdrop .modal-title { font-size: 18px; font-weight: 600; color: #000; }
.daily-history-backdrop .modal-footer { background: #f8f9fa; }
.daily-history-search { max-width: 420px; }
.daily-history-search .form-label { font-weight: 600; margin-bottom: 5px; }
.daily-history-day { border: 1px solid var(--bs-border-color); border-radius: 10px; overflow: hidden; margin-bottom: 12px; }
.daily-history-day-header { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: #f8f9fa; }
.daily-history-toggle { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; text-align: left; color: #000; padding: 2px; border: 0; }
.daily-history-toggle small { display: block; margin-top: 3px; color: #495057; font-size: 12px; }
.daily-history-total { margin-left: auto; white-space: nowrap; }
/* --------- новый код chat: иконки без обводки, как в задачах */
.daily-history-action { display: inline-flex; align-items: center; justify-content: center; width: 27px; height: 27px; border: 0; border-radius: 5px; background: transparent; color: #000; }
.daily-history-action:hover { background: var(--bs-secondary-bg); color: var(--bs-primary); }
.daily-history-action-delete:hover { color: var(--bs-danger); background: var(--bs-danger-bg-subtle); }
.daily-history-action:focus-visible { outline: 2px solid var(--bs-primary); outline-offset: 1px; }
.daily-history-action:disabled { opacity: .45; cursor: default; }
/* --------- конец нового кода chat */
.daily-history-delete-day { flex-shrink: 0; }
.daily-history-table { overflow: auto; border-top: 1px solid var(--bs-border-color); }
.daily-history-table .table { margin-bottom: 0; }
.daily-history-table th { font-weight: 600; font-size: 12px; background: #fff; white-space: nowrap; }
.daily-history-table td, .daily-history-table th { padding: 9px 12px; color: #000; }
.daily-history-table tr:last-child td { border-bottom: 0; }
.daily-history-table td:nth-child(4) { white-space: nowrap; }
.daily-history-table .form-control { min-width: 120px; }
.daily-history-empty { padding: 24px; text-align: center; color: #495057; border: 1px dashed var(--bs-border-color); border-radius: 10px; margin-bottom: 12px; }
.daily-history-backdrop .form-control, .daily-history-backdrop .btn { font-family: inherit; font-size: 14px; }
@media (max-width: 576px) {
    .daily-history-day-header { flex-wrap: wrap; }
    .daily-history-toggle { flex-basis: 100%; }
    .daily-history-delete-day { margin-left: auto; }
    .daily-history-backdrop .modal-body { padding: 12px; }
}
/* --------- конец нового кода chat */
</style>
