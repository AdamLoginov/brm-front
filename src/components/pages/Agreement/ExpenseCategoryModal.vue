<!-- --------- новый код chat: управление общими категориями расходов -->
<template>
    <Teleport to="body">
        <div ref="modalElement" class="modal expense-category-modal" tabindex="-1" aria-labelledby="expense-category-title" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content rounded-3">
                    <div class="modal-header">
                        <h2 id="expense-category-title" class="modal-title">Категории расходов</h2>
                        <button type="button" class="btn-close" aria-label="Закрыть" :disabled="busy" @click="close"></button>
                    </div>
                    <div class="modal-body">
                        <div v-if="error" class="alert alert-danger py-2" role="alert">{{ error }}</div>
                        <form class="mb-3" @submit.prevent="save">
                            <label for="expense-category-name" class="form-label fw-semibold">{{ editingID ? 'Изменить название' : 'Новая категория' }}</label>
                            <input id="expense-category-name" ref="nameInput" v-model="name" maxlength="100" required class="form-control form-control-sm" :disabled="busy" placeholder="Название категории">
                            <div class="d-flex gap-2 mt-2">
                                <button class="btn btn-primary btn-sm" :disabled="busy || !name.trim()">{{ busy ? 'Сохранение…' : editingID ? 'Сохранить' : 'Добавить' }}</button>
                                <button v-if="editingID" type="button" class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="reset">Отмена</button>
                            </div>
                        </form>
                        <div v-if="loading" class="text-secondary">Загрузка…</div>
                        <ul v-else-if="categories.length" class="list-group">
                            <li v-for="category in categories" :key="category.ID" class="list-group-item d-flex align-items-center gap-2">
                                <span class="category-name me-auto">{{ category.name }}</span>
                                <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="busy" :aria-label="`Изменить ${category.name}`" @click="edit(category)"><i class="bi bi-pencil" aria-hidden="true"></i></button>
                                <button type="button" class="btn btn-outline-danger btn-sm" :disabled="busy" :aria-label="`Удалить ${category.name}`" @click="remove(category)"><i class="bi bi-trash" aria-hidden="true"></i></button>
                            </li>
                        </ul>
                        <div v-else class="text-secondary">Категорий пока нет.</div>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
// --------- новый код chat: Bootstrap и API справочника
import { ref, onBeforeUnmount } from 'vue';
import { Modal } from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import api from '../../../api';

const emit = defineEmits(['changed']);
const modalElement = ref(null), nameInput = ref(null);
const categories = ref([]), name = ref(''), editingID = ref(null);
const error = ref(''), busy = ref(false), loading = ref(false);
let modal;
const errorText = err => typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось обработать категории';
const reset = () => { name.value = ''; editingID.value = null; };
const load = async () => {
    loading.value = true;
    try { categories.value = (await api.get('/expense-categories')).data; }
    finally { loading.value = false; }
};
const open = async () => {
    reset(); error.value = '';
    modal ||= new Modal(modalElement.value, { backdrop: 'static', keyboard: false });
    modal.show();
    try { await load(); } catch (err) { error.value = errorText(err); }
};
const close = () => { if (!busy.value) modal?.hide(); };
const edit = category => { editingID.value = category.ID; name.value = category.name; error.value = ''; nameInput.value?.focus(); };
const save = async () => {
    if (busy.value || !name.value.trim()) return;
    busy.value = true; error.value = '';
    try {
        const payload = { name: name.value.trim() };
        const response = editingID.value ? await api.patch(`/expense-categories/${editingID.value}`, payload) : await api.post('/expense-categories', payload);
        categories.value = [...categories.value.filter(row => row.ID !== response.data.ID), response.data].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        reset(); emit('changed', categories.value);
    } catch (err) { error.value = errorText(err); }
    finally { busy.value = false; }
};
const remove = async category => {
    if (busy.value || !window.confirm(`Удалить категорию «${category.name}»? Расходы сохранятся без категории во всех договорах.`)) return;
    busy.value = true; error.value = '';
    try {
        await api.delete(`/expense-categories/${category.ID}`);
        categories.value = categories.value.filter(row => row.ID !== category.ID);
        if (editingID.value === category.ID) reset();
        emit('changed', categories.value, category.ID);
    } catch (err) { error.value = errorText(err); }
    finally { busy.value = false; }
};
defineExpose({ open });
onBeforeUnmount(() => { modal?.hide(); modal?.dispose(); });
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: компактное окно в стиле страницы расходов */
.expense-category-modal { font-size: 13px; }
.modal-title { font-size: 15px; font-weight: 600; }
.form-control, .btn { font-size: 13px; }
.category-name { overflow-wrap: anywhere; min-width: 0; }
/* --------- конец нового кода chat */
</style>
