<!-- --------- новый код chat: отдельная форма создания инструмента -->
<template>
    <Teleport to="body">
        <div ref="element" class="modal tool-create-modal" tabindex="-1" aria-labelledby="tool-create-title" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <form class="modal-content rounded-3" @submit.prevent="save">
                    <div class="modal-header">
                        <h2 id="tool-create-title" class="modal-title">{{ toolID ? 'Изменить инструмент' : 'Добавить инструмент' }}</h2>
                        <button type="button" class="btn-close" aria-label="Закрыть" :disabled="busy" @click="close"></button>
                    </div>
                    <div class="modal-body">
                        <div v-if="error" class="alert alert-danger py-2" role="alert">{{ error }}</div>
                        <fieldset :disabled="busy || loadingEmployees" class="border-0 p-0 m-0">
                            <div class="row g-3">
                                <!-- новый код chat: наименование в начале формы -->
                                <div class="col-12"><label for="tool-create-name" class="form-label">Наименование</label><input id="tool-create-name" v-model="form.name" required class="form-control form-control-sm" placeholder="Наименование инструмента"></div>
                                <!-- новый код chat: номера и даты проверок перед договором -->
                                <div class="col-sm-6"><label for="tool-create-inventory" class="form-label">Инвентарный номер</label><input id="tool-create-inventory" v-model="form.inv_number" class="form-control form-control-sm" placeholder="Инвентарный номер"></div>
                                <div class="col-sm-6"><label for="tool-create-serial" class="form-label">Серийный номер</label><input id="tool-create-serial" v-model="form.serial_number" class="form-control form-control-sm" placeholder="Серийный номер"></div>
                                <div class="col-sm-6"><label for="tool-inspection" class="form-label">Дата проверки</label><input id="tool-inspection" v-model="form.inspection_date" type="date" class="form-control form-control-sm" @change="fillNextInspection"></div> <!-- новый код chat: следующая проверка через год -->
                                <div class="col-sm-6"><label for="tool-next-inspection" class="form-label">Следующая проверка</label><input id="tool-next-inspection" v-model="form.next_inspection_date" type="date" :min="form.inspection_date || undefined" class="form-control form-control-sm"></div>
                                <!-- новый код chat: выбор договора при создании из МТР; существующий договор не переносим -->
                                <div v-if="!props.agreementId" class="col-12">
                                    <label for="tool-create-agreement" class="form-label">Договор</label>
                                    <select id="tool-create-agreement" v-model="form.agreement_id" required :disabled="!!toolID" class="form-select form-select-sm">
                                        <option :value="null" disabled>Выберите договор</option>
                                        <option v-if="toolID && !props.agreements.some(item => item.ID === form.agreement_id)" :value="form.agreement_id">Договор № {{ form.agreement_id }}</option>
                                        <option v-for="agreement in props.agreements" :key="agreement.ID" :value="agreement.ID">{{ agreement.short_name || agreement.name || 'Договор № ' + agreement.ID }}</option>
                                    </select>
                                </div>
                                <!-- новый код chat: ответственный сразу после договора -->
                                <div class="col-12">
                                    <label class="form-label">Ответственный сотрудник</label>
                                    <div v-if="loadingEmployees" role="status">Загружаем сотрудников…</div>
                                    <div v-else-if="busy" class="form-control form-control-sm">{{ employees.find(employee => employee.ID === form.employee_card_id) ? employeeLabel(employees.find(employee => employee.ID === form.employee_card_id)) : 'Не закреплён' }}</div> <!-- новый код chat: выбор заблокирован во время сохранения -->
                                    <MultiSelect v-else v-model="selectedEmployee" :options="employees" :multiple="false" :plain-selection="true" :label-key="employeeLabel" placeholder="Не закреплён" search-placeholder="Поиск по ФИО" />
                                    <button v-if="form.employee_card_id" type="button" class="btn btn-sm btn-link p-0 mt-1" @click="form.employee_card_id = null">Снять закрепление</button>
                                </div>
                                <div class="col-12">
                                    <label for="tool-create-status" class="form-label">Статус</label>
                                    <select id="tool-create-status" v-model="form.status" class="form-select form-select-sm">
                                        <option value="new">Новое</option>
                                        <option value="good">Хорошее</option>
                                        <option value="satisfactory">Удовлетворительное</option>
                                        <option value="broken">Сломано</option>
                                    </select>
                                </div>
                            </div>
                        </fieldset>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="close">Отмена</button>
                        <button type="submit" class="btn btn-primary btn-sm" :disabled="busy || loadingEmployees || !form.agreement_id || !form.name.trim()">{{ busy ? 'Сохранение…' : toolID ? 'Сохранить' : 'Добавить' }}</button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>
<!-- --------- конец нового кода chat -->

<script setup>
// --------- новый код chat: Bootstrap-окно, блокировка повторной отправки и ошибки
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { Modal } from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import api from '../../../api';
import MultiSelect from '../../MultiSelect.vue'; // новый код chat
const props = defineProps({ agreementId: { type: [Number, String], default: null }, agreements: {type:Array, default:() => []} }); // новый код chat: договор выбирается в общем разделе
const emit = defineEmits(['saved']);
const element = ref(null), busy = ref(false), error = ref('');
// новый код chat: редактирование, общий список сотрудников и выбор одного ответственного
const toolID = ref(null), employees = ref([]), loadingEmployees = ref(false);
let employeeRequest = 0;
const employeeLabel = employee => [employee.surname, employee.name, employee.middle_name].filter(Boolean).join(' ') || `Сотрудник №${employee.ID}`;
const selectedEmployee = computed({get: () => form.employee_card_id ? [form.employee_card_id] : [], set: ids => { form.employee_card_id = ids[0] || null; }});
const form = reactive({ agreement_id: null, name: '', inv_number: '', serial_number: '', status: 'new', employee_card_id: null, inspection_date: '', next_inspection_date: '' });
let modal, disposed = false;
// --------- новый код chat: заполнение формы и загрузка сотрудников всех договоров
const open = async(tool = null) => {
    if (busy.value) return;
    error.value = ''; toolID.value = tool?.ID || null;
    Object.assign(form, {agreement_id:Number(props.agreementId || tool?.agreement_id) || null, name:tool?.name || '', inv_number:tool?.inv_number || '', serial_number:tool?.serial_number || '', status:tool?.status || 'new', employee_card_id:tool?.employee_card_id || null, inspection_date:tool?.inspection_date || '', next_inspection_date:tool?.next_inspection_date || ''});
    modal ||= new Modal(element.value, { backdrop: 'static', keyboard: false });
    modal.show();
    const request = ++employeeRequest;
    loadingEmployees.value = true; employees.value = [];
    try {
        const {data} = await api.get('/employeecards');
        if (disposed || request !== employeeRequest) return;
        employees.value = (data || []).filter(employee => !employee.status).sort((a,b) => employeeLabel(a).localeCompare(employeeLabel(b), 'ru'));
    } catch {
        if (!disposed && request === employeeRequest) error.value = 'Не удалось загрузить сотрудников. Закройте окно и повторите попытку.';
    } finally { if (request === employeeRequest) loadingEmployees.value = false; }
};
// --------- конец нового кода chat
const close = () => { if (!busy.value) modal?.hide(); };
// --------- новый код chat: автозаполнение только при ручном изменении даты проверки
const fillNextInspection = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.inspection_date)) return;
    const [year, month, day] = form.inspection_date.split('-').map(Number);
    if (year >= 9999) return;
    const nextYear = year + 1;
    const leap = nextYear % 4 === 0 && (nextYear % 100 !== 0 || nextYear % 400 === 0);
    const nextDay = month === 2 && day === 29 && !leap ? 28 : day;
    form.next_inspection_date = `${String(nextYear).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(nextDay).padStart(2,'0')}`;
};
// --------- конец нового кода chat
const save = async() => {
    if (busy.value || loadingEmployees.value || !form.name.trim()) return;
    if (form.inspection_date && form.next_inspection_date && form.next_inspection_date < form.inspection_date) { error.value = 'Следующая проверка не может быть раньше проведённой'; return; }
    busy.value = true; error.value = '';
    try {
        // новый код chat: единая форма создания и редактирования
        const payload = { ...form, name: form.name.trim(), agreement_id: Number(props.agreementId || form.agreement_id) };
        if (toolID.value) await api.put(`/tools/${toolID.value}`, payload);
        else await api.post('/tools/create', payload);
        if (disposed) return;
        modal?.hide();
        emit('saved');
    } catch (err) {
        if (!disposed) error.value = typeof err.response?.data === 'string' && err.response.data.trim()
            ? err.response.data.trim() : 'Не удалось сохранить инструмент. Повторите попытку.';
    } finally { busy.value = false; }
};
defineExpose({ open });
onBeforeUnmount(() => { disposed = true; modal?.hide(); modal?.dispose(); });
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: компактная форма в стиле сайта */
.tool-create-modal { font-size: 13px; color: #000; }
.modal-title { font-size: 17px; font-weight: 600; }
.form-label { font-size: 13px; font-weight: 500; margin-bottom: 5px; }
.form-control, .form-select, .btn { font-size: 13px; }
.modal-body { overflow: visible; }
.modal-dialog-scrollable .modal-content { overflow: visible; }
.modal-footer { background: #f8f9fa; }
/* --------- конец нового кода chat */
</style>
