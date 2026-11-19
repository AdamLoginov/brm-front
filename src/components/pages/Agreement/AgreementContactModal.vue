<!-- --------- новый код chat: создание и редактирование контакта договора -->
<template>
    <Teleport to="body">
        <div ref="element" class="modal contact-modal" tabindex="-1" aria-labelledby="agreement-contact-title" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <form class="modal-content rounded-3" @submit.prevent="save">
                    <div class="modal-header">
                        <h2 id="agreement-contact-title" class="modal-title">{{ contactID ? 'Изменить контакт' : 'Новый контакт' }}</h2>
                        <button type="button" class="btn-close" aria-label="Закрыть" :disabled="busy" @click="close"></button>
                    </div>
                    <div class="modal-body">
                        <div v-if="error" class="alert alert-danger py-2" role="alert">{{ error }}</div>
                        <fieldset :disabled="busy" class="border-0 p-0 m-0">
                            <div class="row g-3">
                                <div class="col-md-7"><label for="contact-name" class="form-label">ФИО <span class="text-danger">*</span></label><input id="contact-name" v-model="form.full_name" required maxlength="200" class="form-control form-control-sm" autocomplete="name"></div>
                                <div class="col-md-5"><label for="contact-position" class="form-label">Должность</label><input id="contact-position" v-model="form.position" maxlength="200" class="form-control form-control-sm"></div>
                                <div v-for="field in communicationFields" :key="field.key" class="col-md-6">
                                    <h3 class="contact-field-title">{{ field.title }}</h3>
                                    <div v-for="(_, index) in form[field.key]" :key="index" class="input-group input-group-sm mb-2">
                                        <input v-model="form[field.key][index]" :type="field.type" :maxlength="field.limit" :aria-label="`${field.label} ${index + 1}`" :placeholder="field.placeholder" class="form-control">
                                        <button type="button" class="btn btn-outline-secondary" :aria-label="`Убрать ${field.label} ${index + 1}`" @click="form[field.key].splice(index, 1)"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
                                    </div>
                                    <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="form[field.key].length >= 30" @click="form[field.key].push('')"><i class="bi bi-plus-lg me-1" aria-hidden="true"></i>{{ field.add }}</button>
                                </div>
                                <div class="col-12"><label for="contact-comment" class="form-label">Комментарий</label><textarea id="contact-comment" v-model="form.comment" rows="3" maxlength="5000" class="form-control form-control-sm"></textarea></div>
                            </div>
                        </fieldset>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="close">Отмена</button>
                        <button class="btn btn-primary btn-sm" :disabled="busy || !form.full_name.trim()">{{ busy ? 'Сохранение…' : 'Сохранить' }}</button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
// --------- новый код chat: независимая форма и Bootstrap-модальное окно
import { reactive, ref, onBeforeUnmount } from 'vue';
import { Modal } from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import api from '../../../api';
const props = defineProps({ agreementId: { type: [Number, String], required: true } });
const emit = defineEmits(['saved']);
const element = ref(null), contactID = ref(null), busy = ref(false), error = ref('');
const form = reactive({ full_name: '', position: '', phones: [''], emails: [''], comment: '' });
const communicationFields = [
    { key: 'phones', title: 'Телефоны', label: 'Телефон', type: 'tel', limit: 100, placeholder: '+7 …', add: 'Добавить телефон' },
    { key: 'emails', title: 'Электронная почта', label: 'Email', type: 'email', limit: 254, placeholder: 'name@example.ru', add: 'Добавить email' }
];
let modal, disposed = false;
const open = (contact = null) => {
    if (busy.value) return;
    contactID.value = contact?.ID || null; error.value = '';
    Object.assign(form, { full_name: contact?.full_name || '', position: contact?.position || '', comment: contact?.comment || '', phones: contact?.phones?.length ? [...contact.phones] : [''], emails: contact?.emails?.length ? [...contact.emails] : [''] });
    modal ||= new Modal(element.value, { backdrop: 'static', keyboard: false });
    modal.show();
};
const close = () => { if (!busy.value) modal?.hide(); };
const save = async () => {
    if (busy.value || !form.full_name.trim()) return;
    busy.value = true; error.value = '';
    const agreementID = props.agreementId;
    const payload = { ...form, full_name: form.full_name.trim(), phones: form.phones.map(value => value.trim()).filter(Boolean), emails: form.emails.map(value => value.trim()).filter(Boolean) };
    try {
        const url = `/agreements/${agreementID}/contacts`;
        if (contactID.value) await api.patch(`${url}/${contactID.value}`, payload);
        else await api.post(`${url}/create`, payload); // новый код chat: маршрут создания в стиле проекта
        if (disposed) return;
        modal?.hide(); emit('saved', agreementID);
    } catch (err) {
        if (!disposed) error.value = typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось сохранить контакт';
    } finally { busy.value = false; }
};
defineExpose({ open });
onBeforeUnmount(() => { disposed = true; modal?.hide(); modal?.dispose(); });
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: оформление в стиле остальных форм */
.contact-modal { font-size: 13px; }
.modal-title { font-size: 17px; font-weight: 600; }
.form-label, .contact-field-title { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
.form-control, .btn { font-size: 13px; }
/* --------- конец нового кода chat */
</style>
