<!-- --------- новый код chat: создание и редактирование расходника -->
<template>
    <Teleport to="body">
        <div ref="element" class="modal consumable-modal" tabindex="-1" aria-labelledby="consumable-title" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <form class="modal-content rounded-3" @submit.prevent="save">
                    <div class="modal-header">
                        <h2 id="consumable-title" class="modal-title">{{ recordID ? 'Изменить расходник' : 'Добавить расходник' }}</h2>
                        <button type="button" class="btn-close" :disabled="busy" aria-label="Закрыть" @click="close"></button>
                    </div>
                    <div class="modal-body">
                        <div v-if="error" class="alert alert-danger py-2" role="alert">{{ error }}</div>
                        <fieldset :disabled="busy" class="border-0 p-0 m-0">
                            <div class="row g-3">
                                <div class="col-12"><label for="consumable-name" class="form-label">Наименование</label><input id="consumable-name" v-model="form.name" maxlength="500" required class="form-control form-control-sm"></div>
                                <div class="col-sm-6"><label for="consumable-date" class="form-label">Дата добавления</label><input id="consumable-date" v-model="form.added_date" type="date" required class="form-control form-control-sm"></div>
                                <div class="col-sm-6"><label for="consumable-quantity" class="form-label">Количество, шт.</label><input id="consumable-quantity" v-model="form.quantity" type="number" min="1" step="1" max="9007199254740991" required class="form-control form-control-sm"></div>
                                <div class="col-12"><label for="consumable-agreement" class="form-label">Договор</label><select id="consumable-agreement" v-model="form.agreement_id" :disabled="!!agreementId" class="form-select form-select-sm"><option :value="null">Не указан</option><option v-for="agreement in agreements" :key="agreement.ID" :value="agreement.ID">{{ agreement.short_name || agreement.name || 'Договор № ' + agreement.ID }}</option><option v-if="form.agreement_id && !agreements.some(row => row.ID === form.agreement_id)" :value="form.agreement_id">Договор № {{ form.agreement_id }}</option></select></div>
                                <!-- новый код chat: справочник доступен при создании и изменении -->
                                <div class="col-12">
                                    <div class="d-flex justify-content-between align-items-center gap-2 mb-1">
                                        <label for="consumable-category" class="form-label mb-0">Категория</label>
                                        <button type="button" class="btn btn-outline-primary btn-sm" @click="openCategories">Категории расходников</button>
                                    </div>
                                    <select id="consumable-category" v-model="form.category_id" class="form-select form-select-sm"><option :value="null">Не указана</option><option v-for="category in categories" :key="category.ID" :value="category.ID">{{ category.name }}</option></select>
                                </div>
                            </div>
                        </fieldset>
                        <div v-if="!form.agreement_id || !form.category_id" class="alert alert-warning py-2 mt-3 mb-0" role="status">Не указан{{ !form.agreement_id && !form.category_id ? 'ы договор и категория' : !form.agreement_id ? ' договор' : 'а категория' }}. Можно сохранить после подтверждения.</div>
                    </div>
                    <div class="modal-footer"><button type="button" class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="close">Отмена</button><button type="submit" class="btn btn-primary btn-sm" :disabled="busy">{{ busy ? 'Сохранение…' : 'Сохранить' }}</button></div>
                </form>
            </div>
        </div>
    </Teleport>
    <!-- новый код chat: переключение окон с сохранением заполненных полей -->
    <ConsumableCategoryModal ref="categoryModal" @changed="categoriesChanged" @closed="resumeEditor" />
</template>
<script setup>
// --------- новый код chat: необязательные связи и положительное целое количество
import { reactive, ref, onBeforeUnmount } from 'vue';
import { Modal } from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import api from '../../../api';
import ConsumableCategoryModal from './ConsumableCategoryModal.vue'; // новый код chat
const props = defineProps({agreementId:{type:[Number,String],default:null},agreements:{type:Array,default:()=>[]},categories:{type:Array,default:()=>[]}});
const emit = defineEmits(['saved', 'categories-changed']); // новый код chat
const categoryModal = ref(null); // новый код chat
const element = ref(null), recordID = ref(null), busy = ref(false), error = ref('');
const form = reactive({name:'',added_date:'',quantity:1,agreement_id:null,category_id:null});
let modal, disposed = false;
const today = () => {
    const parts = new Intl.DateTimeFormat('en', {timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const part = type => parts.find(item => item.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
};
const open = (row = null) => {
    if (busy.value) return;
    recordID.value = row?.ID || null; error.value = '';
    Object.assign(form,{name:row?.name || '',added_date:row?.added_date || today(),quantity:row?.quantity ?? 1,agreement_id:props.agreementId ? Number(props.agreementId) : row?.agreement_id || null,category_id:row?.category_id || null});
    modal ||= new Modal(element.value,{backdrop:'static',keyboard:false}); modal.show();
};
const close = () => { if (!busy.value) modal?.hide(); };
// --------- новый код chat: одновременно открыто только одно окно Bootstrap
const openCategories = () => {
    if (busy.value) return;
    element.value.addEventListener('hidden.bs.modal', () => {
        if (!disposed) categoryModal.value.open();
    }, {once:true});
    modal?.hide();
};
const resumeEditor = () => { if (!disposed) modal?.show(); };
const categoriesChanged = updated => {
    if (form.category_id && !updated.some(row => row.ID === form.category_id)) form.category_id = null;
    emit('categories-changed', updated);
};
// --------- конец нового кода chat
const save = async() => {
    if (busy.value) return;
    const quantity = Number(form.quantity);
    if (!form.name.trim() || !form.added_date || !Number.isSafeInteger(quantity) || quantity <= 0) { error.value = 'Укажите наименование, дату и положительное целое количество.'; return; }
    const missing = [!form.agreement_id ? 'договор' : '', !form.category_id ? 'категория' : ''].filter(Boolean);
    if (missing.length && !window.confirm(`Не заполнены: ${missing.join(', ')}. Сохранить расходник без этих данных?`)) return;
    busy.value = true; error.value = '';
    try {
        const payload = {...form,name:form.name.trim(),quantity,agreement_id:form.agreement_id ? Number(form.agreement_id) : null,category_id:form.category_id ? Number(form.category_id) : null};
        if (recordID.value) await api.put(`/consumables/${recordID.value}`,payload); else await api.post('/consumables',payload);
        if (disposed) return;
        modal?.hide(); emit('saved');
    } catch(err) { if (!disposed) error.value = typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось сохранить расходник.'; }
    finally { busy.value = false; }
};
defineExpose({open});
onBeforeUnmount(() => { disposed = true; modal?.hide(); modal?.dispose(); });
// --------- конец нового кода chat
</script>
<style scoped>
/* новый код chat: компактная форма в стиле инструментов */
.consumable-modal { font-size: 13px; color: #000; }
.modal-title { font-size: 17px; font-weight: 600; }
.form-label { font-size: 13px; font-weight: 500; margin-bottom: 5px; }
.form-control, .form-select, .btn { font-size: 13px; }
.modal-footer { background: #f8f9fa; }
</style>
<!-- --------- конец нового кода chat -->
