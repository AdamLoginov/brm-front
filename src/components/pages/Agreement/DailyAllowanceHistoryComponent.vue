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
                    <div class="mb-3"><label for="daily-history-search" class="form-label">Сотрудник</label><input id="daily-history-search" v-model="search" class="form-control form-control-sm" placeholder="Поиск по ФИО"></div>
                    <div v-if="busy" class="text-secondary" role="status">Обрабатываем данные…</div>
                    <div class="table-responsive daily-history-table"> <!-- новый код chat: скруглённая рамка таблицы истории -->
                        <table class="table table-sm table-bordered align-middle">
                            <thead class="table-light"><tr><th>Дата выплаты</th><th>Сотрудник</th><th>Месяц и год</th><th>Сумма, ₽</th><th>Действия</th></tr></thead>
                            <tbody>
                                <tr v-for="row in filtered" :key="row.ID">
                                    <td><input v-if="editingID === row.ID" v-model="form.date" type="date" class="form-control form-control-sm" :disabled="busy" aria-label="Дата выплаты"><span v-else>{{ formatDate(row.date) }}</span></td>
                                    <td>{{ row.employee_name || `Сотрудник №${row.employee_card_id}` }}</td>
                                    <td>{{ monthLabel(row.time_sheet_month_id) }}</td> <!-- новый код chat: месяц и год исходного табеля -->
                                    <td><input v-if="editingID === row.ID" v-model="form.amount" inputmode="decimal" class="form-control form-control-sm" :disabled="busy" aria-label="Сумма выплаты"><span v-else>{{ formatMoney(row.amount_kopecks) }}</span></td>
                                    <td>
                                        <div class="d-flex gap-1 flex-wrap">
                                            <template v-if="editingID === row.ID"><button class="btn btn-sm btn-primary" :disabled="busy" @click="save(row)">Сохранить</button><button class="btn btn-sm btn-outline-secondary" :disabled="busy" @click="editingID = null">Отмена</button></template>
                                            <template v-else><button class="btn btn-sm btn-outline-primary" :disabled="busy" @click="edit(row)">Изменить</button><button class="btn btn-sm btn-outline-danger" :disabled="busy" @click="remove(row)">Удалить</button></template>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-if="!busy && !filtered.length"><td colspan="5" class="text-secondary">Выдачи не найдены.</td></tr>
                            </tbody>
                        </table>
                    </div>
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
// --------- новый код chat: месяц и год табеля вместо номера
const monthLabel = id => {
    const month = props.months.find(item => Number(item.ID) === Number(id));
    return month ? new Date(month.year, month.month - 1, 1).toLocaleDateString('ru-RU', {month:'long', year:'numeric'}) : 'Табель удалён';
};
// --------- конец нового кода chat
const formatDate = value => value.split('-').reverse().join('.');
const formatMoney = value => (Number(value) / 100).toLocaleString('ru-RU', {minimumFractionDigits:2, maximumFractionDigits:2});
const errorText = err => typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось выполнить запрос. Повторите попытку.';
const close = () => { if (!busy.value) emit('close'); };
const load = async() => {
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
watch(() => props.agreementId, load, {immediate:true});
onBeforeUnmount(() => { version++; });
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: скругление таблицы истории без двойной внешней рамки */
.daily-history-table { border: 1px solid var(--bs-border-color); border-radius: var(--bs-border-radius); overflow: auto; margin-bottom: 1rem; }
.daily-history-table .table { margin-bottom: 0; }
.daily-history-table .table > thead > tr:first-child { border-top: 0; }
.daily-history-table .table > tbody > tr:last-child { border-bottom: 0; }
.daily-history-table .table > :not(caption) > tr > :first-child { border-left: 0; }
.daily-history-table .table > :not(caption) > tr > :last-child { border-right: 0; }
/* --------- конец нового кода chat */
/* --------- новый код chat: окно истории поверх таблицы */
.daily-history-backdrop { position: fixed; inset: 0; z-index: 1060; overflow-y: auto; background: #0008; padding: 0 16px; }
.daily-history-backdrop .modal-content { background-color: #fff; } /* новый код chat: непрозрачный белый фон окна истории */
/* --------- новый код chat: отступы и скругление окна истории */
.daily-history-backdrop .modal-content { border-radius: 12px; overflow: hidden; }
.daily-history-backdrop .modal-header,
.daily-history-backdrop .modal-body,
.daily-history-backdrop .modal-footer { padding: 16px 20px; }
/* --------- конец нового кода chat */
/* --------- новый код chat: шрифт окна истории как у сотрудников в табеле */
.daily-history-backdrop .modal-content { font-size: 14px; font-weight: 400; }
.daily-history-backdrop .table th { font-weight: 600; }
.daily-history-backdrop .form-control,
.daily-history-backdrop .btn { font-family: inherit; font-size: 14px; }
/* --------- конец нового кода chat */
/* --------- конец нового кода chat */
</style>
