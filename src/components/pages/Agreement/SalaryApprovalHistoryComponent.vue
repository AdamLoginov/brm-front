<!-- --------- новый код chat: история согласований выбранного месяца -->
<template>
    <Teleport to="body">
        <div ref="dialog" class="modal fade salary-history" tabindex="-1" aria-labelledby="salary-history-title" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header align-items-start">
                        <div class="history-heading"><span class="history-heading-icon" aria-hidden="true"><i class="bi bi-clock-history"></i></span><div><h5 id="salary-history-title" class="mb-1">История согласований</h5><div class="text-secondary small">{{ monthLabel }}</div></div></div> <!-- новый код chat: компактная шапка истории -->
                        <button type="button" class="btn-close" aria-label="Закрыть" :disabled="saving" @click="close"></button>
                    </div>
                    <div class="modal-body">
                        <div v-if="error" class="alert alert-danger" role="alert">{{ error }} <button class="btn btn-sm btn-outline-danger" :disabled="saving || loading" @click="load">Обновить</button></div>
                        <div v-if="loading" class="text-secondary py-3" role="status">Загружаем согласования…</div>
                        <p v-else-if="!groups.length && !error" class="text-secondary mb-0">За этот месяц нет действующих согласований.</p>
                        <section v-for="group in groups" :key="group.key" class="history-group">
                            <!-- новый код chat: один сотрудник отображается сразу, несколько — раскрываемой группой -->
                            <div class="history-record-meta"><span><i class="bi bi-person-check" aria-hidden="true"></i> Согласовал: <strong>{{ group.author_name }}</strong></span><span>{{ dateTime(group.created_at) }}</span></div>
                            <div class="history-group-header">
                                <div class="history-record-content">
                                    <div v-if="group.employees.length === 1" class="history-title">{{ group.employees[0].employee_name }}</div>
                                    <button v-else type="button" class="history-toggle" :aria-expanded="!!expanded[group.key]" @click="expanded[group.key] = !expanded[group.key]">
                                        <i class="bi" :class="expanded[group.key] ? 'bi-chevron-down' : 'bi-chevron-right'" aria-hidden="true"></i><span class="history-title">Групповое согласование</span><span class="history-count">{{ group.employees.length }}</span>
                                    </button>
                                </div>
                                <div class="history-group-actions"><span class="history-amount-label">{{ group.employees.length === 1 ? 'Выплата' : 'Общая сумма' }}</span><strong>{{ money(group.total_kopecks) }}</strong></div>
                                <button type="button" class="btn btn-sm btn-outline-danger history-cancel" :disabled="saving || loading" @click="cancel(group.employees)">{{ group.employees.length === 1 ? 'Отменить' : 'Отменить группу' }}</button>
                            </div>
                            <ul v-if="group.employees.length > 1 && expanded[group.key]" class="history-employees">
                                <li v-for="employee in group.employees" :key="employee.employee_card_id">
                                    <span class="history-employee-name">{{ employee.employee_name }}</span>
                                    <strong>{{ money(employee.payment_kopecks) }}</strong>
                                    <button type="button" class="btn btn-sm btn-outline-danger" :disabled="saving || loading" @click="cancel([employee])">Отменить</button>
                                </li>
                            </ul>
                        </section>
                    </div>
                    <div class="modal-footer"><button type="button" class="btn btn-sm btn-secondary" :disabled="saving" @click="close">Закрыть</button></div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
// --------- новый код chat: загрузка истории и атомарная отмена через существующее API
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { Modal } from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import api from '../../../api';
const props = defineProps({agreementId:{type:[String,Number],required:true},monthId:{type:[String,Number],required:true},monthLabel:String});
const emit = defineEmits(['close','updated']);
const dialog = ref(null), groups = ref([]), expanded = ref({}), loading = ref(false), saving = ref(false), error = ref('');
let modal, disposed = false, pendingRequest = null;
const money = value => (Number(value || 0) / 100).toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' ₽';
const dateTime = value => new Date(value).toLocaleString('ru-RU',{timeZone:'Europe/Moscow',dateStyle:'short',timeStyle:'short'}) + ' МСК';
const url = () => `/agreements/${props.agreementId}/timesheetmonth/${props.monthId}`;
const errorText = err => typeof err.response?.data === 'string' ? err.response.data : 'Не удалось загрузить или изменить согласования.';
const load = async() => {
    loading.value = true; error.value = '';
    try {
        const response = await api.get(url() + '/approval-history');
        if (!disposed) groups.value = response.data || [];
    } catch(err) { if (!disposed) error.value = errorText(err); }
    finally { if (!disposed) loading.value = false; }
};
const cancel = async employees => {
    if (saving.value || loading.value) return;
    const message = employees.length === 1 ? `Отменить согласование сотрудника «${employees[0].employee_name}»?` : `Отменить согласование всей группы (сотрудников: ${employees.length})?`;
    if (!window.confirm(message + ' Учтённые суммы снова станут активными, сохранённые выплаты останутся при неизменных исходных данных.')) return;
    const selections = employees.map(row => ({employee_card_id:row.employee_card_id,approval_id:row.approval_id,approved:false}));
    const signature = JSON.stringify(selections);
    if (pendingRequest?.signature !== signature) pendingRequest = {signature,key:crypto.randomUUID()};
    saving.value = true; error.value = '';
    try {
        const response = await api.post(url() + '/employee-approvals',{request_key:pendingRequest.key,employees:selections});
        if (disposed) return;
        pendingRequest = null;
        emit('updated',response.data);
        await load();
    } catch(err) { if (!disposed) error.value = errorText(err); }
    finally { if (!disposed) saving.value = false; }
};
const hidden = () => emit('close');
const preventBusyClose = event => { if (saving.value) event.preventDefault(); };
const close = () => { if (!saving.value) modal?.hide(); };
onMounted(() => {
    modal = new Modal(dialog.value);
    dialog.value.addEventListener('hidden.bs.modal',hidden);
    dialog.value.addEventListener('hide.bs.modal',preventBusyClose);
    modal.show(); load();
});
onBeforeUnmount(() => {
    disposed = true;
    dialog.value?.removeEventListener('hidden.bs.modal',hidden);
    dialog.value?.removeEventListener('hide.bs.modal',preventBusyClose);
    // Убираем fade при внешнем закрытии, чтобы Bootstrap синхронно удалил backdrop.
    dialog.value?.classList.remove('fade');
    modal?.hide(); modal?.dispose();
});
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: карточки согласований с отдельными автором, выплатой и действиями */
.salary-history { font-size: 13px; color: #212529; }
.modal-content { border: 0; border-radius: 16px; overflow: hidden; }
.modal-header, .modal-footer { padding: 16px 20px; border-color: #e9edf1; }
.modal-header h5 { font-size: 17px; font-weight: 600; }
.history-heading { display: flex; align-items: center; gap: 12px; }
.history-heading-icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; background: #edf4ff; color: var(--bs-primary); font-size: 20px; }
.modal-body { background: #f6f8fa; padding: 20px; }
.history-group { background: #fff; border: 1px solid #e1e6eb; border-radius: 12px; overflow: hidden; }
.history-group + .history-group { margin-top: 12px; }
.history-record-meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 16px; padding: 9px 14px; background: #fafbfc; border-bottom: 1px solid #edf0f3; font-size: 12px; color: #626b74; overflow-wrap: anywhere; }
.history-record-meta strong { color: #343a40; font-weight: 500; }
.history-record-meta i { margin-right: 4px; }
.history-group-header { display: flex; gap: 16px; align-items: center; padding: 16px 14px; }
.history-record-content { flex: 1; min-width: 0; }
.history-toggle { display: flex; align-items: center; gap: 8px; border: 0; background: none; padding: 0; text-align: left; color: inherit; width: 100%; }
.history-toggle > i { color: var(--bs-primary); font-size: 12px; }
.history-title { font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
.history-count { background: #edf4ff; color: #275ea7; border-radius: 20px; padding: 2px 8px; font-size: 12px; }
.history-group-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.history-amount-label { color: #626b74; font-size: 11px; }
.history-group-actions strong { white-space: nowrap; font-size: 16px; font-variant-numeric: tabular-nums; }
.history-cancel { flex-shrink: 0; font-size: 12px; }
.history-employees { list-style: none; padding: 0 14px; margin: 0; border-top: 1px solid #e1e6eb; }
.history-employees li { display: flex; align-items: center; gap: 12px; padding: 10px 0; }
.history-employees li + li { border-top: 1px solid #edf0f3; }
.history-employee-name { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.history-employees strong { white-space: nowrap; }
@media(max-width:575px) {
    .modal-body { padding: 12px; }
    .history-group-header { flex-wrap: wrap; gap: 12px; }
    .history-record-content { flex-basis: 100%; }
    .history-group-actions { align-items: flex-start; margin-right: auto; }
    .history-employees li { flex-wrap: wrap; }
    .history-employee-name { flex-basis: 100%; }
}
/* --------- конец нового кода chat */
</style>
