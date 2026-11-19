<!-- --------- новый код chat: отдельные контакты представителей другой стороны договора -->
<template>
    <div class="container-fluid py-3 agreement-contacts">
        <router-link :to="{name: 'agreement', params: {id: agreementID}}" class="contacts-back"><i class="bi bi-arrow-left me-1" aria-hidden="true"></i>К договору</router-link>
        <section class="border rounded-3 bg-white p-3 mt-3">
            <header class="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                    <h1 class="contacts-title">Контакты <span class="text-secondary">{{ contacts.length }}</span></h1>
                    <div class="text-secondary">{{ agreement ? `Договор № ${agreement.number || '—'} · ${agreement.name}` : 'Представители другой стороны договора' }}</div>
                </div>
                <button type="button" class="btn btn-primary btn-sm" :disabled="!agreement || loading" @click="contactModal?.open()"><i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Добавить контакт</button>
            </header>
            <!-- новый код chat: единый поиск по ФИО и должности -->
            <div class="contacts-search mt-3">
                <label for="contact-search" class="form-label fw-semibold">Поиск по ФИО и должности</label>
                <input id="contact-search" v-model="search" type="search" class="form-control form-control-sm" placeholder="Введите имя или должность">
            </div>
        </section>
        <div v-if="error" class="alert alert-danger mt-3" role="alert">{{ error }} <button type="button" class="btn btn-link btn-sm" @click="load">Повторить загрузку</button></div>
        <div v-if="copyMessage" class="copy-feedback" :class="{ 'text-danger': copyFailed }" role="status" aria-live="polite">{{ copyMessage }}</div> <!-- новый код chat: уведомление снизу как в сотрудниках -->
        <section class="border rounded-3 bg-white mt-3 overflow-hidden">
            <div v-if="loading" class="p-4 text-secondary" role="status">Загрузка контактов…</div>
            <div v-else-if="!contacts.length" class="p-4 text-secondary">{{ error ? 'Не удалось загрузить список.' : 'Контактов пока нет. Добавьте первого представителя контрагента.' }}</div>
            <div v-else-if="!filteredContacts.length" class="p-4 text-secondary" role="status">По вашему запросу контакты не найдены.</div> <!-- новый код chat -->
            <div v-else class="table-responsive">
                <table class="table contacts-table align-middle mb-0">
                    <thead><tr><th class="contact-number">№</th><th>ФИО</th><th>Должность</th><th>Телефоны</th><th>Email</th><th>Комментарий</th><th><span class="visually-hidden">Действия</span></th></tr></thead> <!-- новый код chat: номер строки -->
                    <tbody>
                        <tr v-for="(contact, index) in filteredContacts" :key="contact.ID"> <!-- новый код chat -->
                            <td class="contact-number">{{ index + 1 }}</td> <!-- новый код chat: нумерация видимых контактов -->
                            <td class="fw-semibold">{{ contact.full_name }}</td>
                            <td>{{ contact.position || '—' }}</td>
                            <td><button v-for="phone in contact.phones" :key="phone" type="button" class="contact-copy" :title="`Скопировать номер ${phone}`" @click="copyContactValue(phone)">{{ phone }}<i class="bi bi-copy ms-1" aria-hidden="true"></i></button><span v-if="!contact.phones?.length">—</span></td> <!-- новый код chat -->
                            <td><button v-for="email in contact.emails" :key="email" type="button" class="contact-copy" :title="`Скопировать email ${email}`" @click="copyContactValue(email)">{{ email }}<i class="bi bi-copy ms-1" aria-hidden="true"></i></button><span v-if="!contact.emails?.length">—</span></td> <!-- новый код chat -->
                            <td class="contact-comment">{{ contact.comment || '—' }}</td>
                            <td><div class="dropdown d-flex justify-content-end"> <!-- новый код chat: меню как в расходах -->
                                <button type="button" class="btn p-0 border-0" data-bs-toggle="dropdown" data-bs-config='{"popperConfig":{"strategy":"fixed"}}' aria-expanded="false" :aria-label="`Действия с контактом ${contact.full_name}`"><i class="bi bi-three-dots-vertical" aria-hidden="true"></i></button>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li><button type="button" class="dropdown-item" :disabled="deleting !== null" @click="contactModal?.open(contact)">Изменить</button></li>
                                    <li><button type="button" class="dropdown-item text-danger" :disabled="deleting !== null" @click="remove(contact)">Удалить</button></li>
                                </ul>
                            </div></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
        <AgreementContactModal :key="agreementID" ref="contactModal" :agreement-id="agreementID" @saved="saved" />
    </div>
</template>

<script setup>
// --------- новый код chat: загрузка и действия только в текущем договоре
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import api from '../../../api';
import AgreementContactModal from './AgreementContactModal.vue';
const route = useRoute();
const agreementID = computed(() => String(route.params.id));
const contacts = ref([]), agreement = ref(null), contactModal = ref(null);
const loading = ref(false), error = ref(''), deleting = ref(null);
let requestVersion = 0;
const sortedContacts = computed(() => [...contacts.value].sort((a, b) => a.full_name.localeCompare(b.full_name, 'ru')));
// --------- новый код chat: слова запроса ищутся совместно в ФИО и должности
const search = ref('');
const normalizeSearch = value => String(value || '').toLocaleLowerCase('ru').replaceAll('ё', 'е');
const filteredContacts = computed(() => {
    const words = normalizeSearch(search.value).trim().split(/\s+/).filter(Boolean);
    return sortedContacts.value.filter(contact => {
        const text = normalizeSearch(`${contact.full_name} ${contact.position || ''}`);
        return words.every(word => text.includes(word));
    });
});
// --------- конец нового кода chat
// --------- новый код chat: копирование как в списке сотрудников, включая обычный HTTP
const copyMessage = ref(''), copyFailed = ref(false);
let copyTimer;
const copyContactValue = async value => {
    clearTimeout(copyTimer);
    copyFailed.value = false;
    try {
        if (window.isSecureContext && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(value);
        } else {
            const previousFocus = document.activeElement;
            const field = document.createElement('textarea');
            field.value = value;
            field.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
            document.body.appendChild(field);
            try {
                field.focus(); field.select();
                if (!document.execCommand('copy')) throw new Error('Copy failed');
            } finally { field.remove(); previousFocus?.focus(); }
        }
        copyMessage.value = `Скопировано: ${value}`;
    } catch {
        copyFailed.value = true;
        copyMessage.value = 'Не удалось скопировать. Выделите значение и скопируйте вручную.';
    }
    copyTimer = setTimeout(() => { copyMessage.value = ''; }, 3000);
};
// --------- конец нового кода chat
const errorText = err => typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось обработать контакты';
const load = async () => {
    const version = ++requestVersion, id = agreementID.value;
    loading.value = true; error.value = '';
    try {
        const [details, list] = await Promise.all([api.get(`/agreements/${id}`), api.get(`/agreements/${id}/contacts`)]);
        if (version !== requestVersion) return;
        agreement.value = details.data; contacts.value = list.data;
    } catch (err) { if (version === requestVersion) error.value = errorText(err); }
    finally { if (version === requestVersion) loading.value = false; }
};
const saved = id => { if (String(id) === agreementID.value) load(); };
const remove = async contact => {
    if (deleting.value !== null || !window.confirm(`Удалить контакт «${contact.full_name}»?`)) return;
    const id = agreementID.value;
    deleting.value = contact.ID; error.value = '';
    try {
        await api.delete(`/agreements/${id}/contacts/${contact.ID}`);
        if (id === agreementID.value) await load();
    } catch (err) { if (id === agreementID.value) error.value = errorText(err); }
    finally { deleting.value = null; }
};
watch(agreementID, () => { search.value = ''; contacts.value = []; agreement.value = null; load(); }, { immediate: true }); // новый код chat: поиск сбрасывается при смене договора
onBeforeUnmount(() => { requestVersion++; clearTimeout(copyTimer); }); // новый код chat
// --------- конец нового кода chat
</script>

<style scoped>
/* новый код chat: то же уведомление о копировании, что в списке сотрудников */
.copy-feedback { position: fixed; right: 20px; bottom: 20px; z-index: 1090; padding: 12px 16px; max-width: calc(100vw - 40px); border: 1px solid #dfe5ed; border-radius: 10px; background: #fff; color: #218259; box-shadow: 0 4px 20px #26344518; font-size: 13px; overflow-wrap: anywhere; }
/* --------- новый код chat: компактная страница в стиле деталей договора */
.agreement-contacts { font-size: 13px; color: #212529; }
.contacts-back { color: #52647a; text-decoration: none; }
.contacts-back:hover { text-decoration: underline; }
.contacts-title { font-size: 20px; font-weight: 600; margin: 0 0 5px; }
.contacts-title span { font-size: 14px; margin-left: 6px; }
.btn { font-size: 13px; }
.contacts-table { min-width: 850px; font-size: 13px; }
.contacts-table th { background: #f8f9fa; font-weight: 600; }
.contacts-table th, .contacts-table td { padding: 12px; }
.contacts-table td { max-width: 280px; overflow-wrap: anywhere; vertical-align: top; }
.contacts-table tbody tr:last-child td { border-bottom: 0; }
.contacts-table a { color: #212529; text-decoration: none; }
.contacts-table a:hover { color: var(--bs-primary); text-decoration: underline; }
.contact-comment { white-space: pre-wrap; width: 25%; }
/* новый код chat: копирование телефона и почты без оформления кнопки */
.contact-copy { display: block; padding: 0; margin-bottom: 4px; border: 0; background: transparent; color: #212529; font: inherit; text-align: left; overflow-wrap: anywhere; max-width: 100%; }
.contact-copy i { color: #6c757d; font-size: 11px; }
.contact-copy:hover { color: var(--bs-primary); }
.contact-copy:focus-visible { outline: 2px solid var(--bs-primary); outline-offset: 2px; }
.dropdown-item { font-size: 13px; }
/* новый код chat: компактное поле поиска и номер по центру */
.contacts-search { max-width: 420px; }
.contacts-search input { font-size: 13px; }
.contacts-table .contact-number { width: 48px; text-align: center; white-space: nowrap; }
/* --------- конец нового кода chat */
</style>
