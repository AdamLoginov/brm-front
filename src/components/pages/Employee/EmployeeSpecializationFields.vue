<!-- --------- новый код chat: выбор специализаций и управление общим справочником -->
<template>
    <div>
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            <span class="form-label fw-medium mb-0">Специализации</span> <!-- новый код chat: жирность 500, как у остальных подписей -->
            <button type="button" class="btn btn-link btn-sm p-0" @click="openManager">Настроить специализации</button>
        </div>
        <div v-if="error" class="alert alert-danger py-2 small" role="alert">{{ error }}</div>
        <div v-if="loading" class="small text-secondary">Загрузка специализаций…</div>
        <div v-else class="specialization-options">
            <label v-for="item in items" :key="item.ID" class="specialization-option">
                <input v-model="selected" type="checkbox" class="form-check-input m-0" :value="item.ID">
                <span>{{ item.name }}</span>
            </label>
            <span v-if="!items.length" class="text-secondary small">Добавьте специализации в справочник.</span>
        </div>
        <Teleport to="body">
            <div ref="modalElement" class="modal" tabindex="-1" aria-labelledby="specialization-title" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable"><div class="modal-content">
                    <div class="modal-header"><h5 id="specialization-title" class="modal-title fs-6">Специализации сотрудников</h5><button type="button" class="btn-close" aria-label="Закрыть" data-bs-dismiss="modal"></button></div>
                    <div class="modal-body">
                        <div v-if="managerError" class="alert alert-danger py-2 small" role="alert">{{ managerError }}</div>
                        <form class="d-flex gap-2 mb-3" @submit.prevent="saveSpecialization()">
                            <input v-model="newName" maxlength="100" required class="form-control form-control-sm" placeholder="Новая специализация" aria-label="Новая специализация" :disabled="busy">
                            <button class="btn btn-primary btn-sm" :disabled="busy || !newName.trim()">Добавить</button>
                        </form>
                        <form v-for="item in items" :key="item.ID" class="d-flex gap-2 mb-2" @submit.prevent="saveSpecialization(item.ID)">
                            <input v-model="names[item.ID]" maxlength="100" required class="form-control form-control-sm" :aria-label="'Название специализации ' + item.name" :disabled="busy">
                            <button class="btn btn-outline-primary btn-sm" :disabled="busy || !names[item.ID]?.trim()" title="Сохранить название" aria-label="Сохранить название"><i class="bi bi-check-lg"></i></button>
                            <button type="button" class="btn btn-outline-danger btn-sm" :disabled="busy" @click="removeSpecialization(item)" title="Удалить специализацию" aria-label="Удалить специализацию"><i class="bi bi-trash"></i></button>
                        </form>
                        <p class="small text-secondary mb-0">Переименование применяется ко всем сотрудникам. Используемую специализацию удалить нельзя.</p>
                    </div>
                    <div class="modal-footer"><button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Закрыть</button></div>
                </div></div>
            </div>
        </Teleport>
    </div>
</template>
<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { Modal } from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import api from '../../../api';
const selected = defineModel({type: Array, default: () => []});
const items = ref([]), names = ref({}), newName = ref('');
const loading = ref(false), busy = ref(false), error = ref(''), managerError = ref('');
const modalElement = ref(null);
let modal;
const message = err => typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось выполнить действие.';
const load = async () => {
    loading.value = true;
    try {
        const {data} = await api.get('/employee-specializations');
        items.value = data;
        names.value = Object.fromEntries(data.map(item => [item.ID, item.name]));
        error.value = '';
    } catch (err) { error.value = message(err); }
    finally { loading.value = false; }
};
const openManager = async () => {
    managerError.value = '';
    modal ||= new Modal(modalElement.value);
    modal.show();
    await load();
};
const saveSpecialization = async id => {
    if (busy.value) return;
    busy.value = true; managerError.value = '';
    try {
        await api.post('/employee-specializations' + (id ? '/' + id : ''), {name: id ? names.value[id] : newName.value});
        if (!id) newName.value = '';
        await load();
    } catch (err) { managerError.value = message(err); }
    finally { busy.value = false; }
};
const removeSpecialization = async item => {
    if (busy.value || !window.confirm('Удалить специализацию «' + item.name + '» из справочника?')) return;
    busy.value = true; managerError.value = '';
    try {
        await api.delete('/employee-specializations/' + item.ID);
        selected.value = selected.value.filter(id => id !== item.ID);
        await load();
    } catch (err) { managerError.value = message(err); }
    finally { busy.value = false; }
};
onMounted(load);
onBeforeUnmount(() => { modal?.hide(); modal?.dispose(); });
</script>
<style scoped>
.specialization-options { display: flex; flex-wrap: wrap; gap: 8px; }
.specialization-option { display: inline-flex; align-items: center; gap: 7px; border: 1px solid var(--bs-border-color); border-radius: 6px; padding: 6px 9px; font-size: 12px; cursor: pointer; }
.specialization-option:has(input:checked) { border-color: var(--bs-primary); background: var(--bs-primary-bg-subtle); }
</style>
<!-- --------- конец нового кода chat -->
