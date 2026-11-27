<!-- --------- новый код chat: категории документов в модальном окне формы документа -->
<template>
    <Teleport to="body">
        <div ref="modalElement" class="modal employee-document-category-modal" tabindex="-1" aria-labelledby="employee-document-category-title" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content rounded-3">
                    <div class="modal-header">
                        <div class="category-modal-title"><span class="category-section-icon"><i class="bi bi-folder2-open" aria-hidden="true"></i></span><div><h2 id="employee-document-category-title" class="modal-title">Категории документов</h2><p>Группы, порядок отображения и категории файлов</p></div></div>
                        <button type="button" class="btn-close" aria-label="Закрыть" :disabled="busy" @click="close"></button>
                    </div>
                    <div class="modal-body">
                        <div v-if="error" class="alert alert-danger py-2" role="alert">{{ error }}</div>
                        <!-- новый код chat: общий справочник надкатегорий -->
                        <!-- новый код chat: две самостоятельные панели справочника -->
                        <div class="category-workspace">
                        <section class="category-panel">
                            <header class="category-panel-heading"><h3>Надкатегории</h3><span class="category-count">{{ groups.length }}</span></header>
                            <form class="row g-2 category-editor" @submit.prevent="saveGroup">
                                <div class="col-8"><label for="document-group-name" class="form-label">Название</label><input id="document-group-name" v-model="groupName" required class="form-control form-control-sm" :disabled="busy || loading"></div>
                                <div class="col-4"><label for="document-group-priority" class="form-label">Приоритет</label><input id="document-group-priority" v-model.number="groupPriority" required type="number" min="1" step="1" class="form-control form-control-sm" :disabled="busy || loading"></div>
                                <div class="col-12 d-flex gap-2"><button class="btn btn-primary btn-sm" :disabled="busy || loading">{{ editingGroup ? 'Сохранить' : 'Создать надкатегорию' }}</button><button v-if="editingGroup" type="button" class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="resetGroup">Отмена</button></div>
                            </form>
                            <p class="category-hint">Приоритет задаёт место в списке. Остальные группы сдвигаются автоматически.</p>
                            <div v-for="group in groups" :key="group.ID" class="d-flex align-items-center gap-2 category-list-row" :class="{'category-row-editing':editingGroup === group.ID}">
                                <span class="badge text-bg-light">{{ group.priority }}</span><span class="category-name me-auto">{{ group.name }}</span>
                                <button type="button" class="btn btn-sm text-primary" :disabled="busy || loading" :aria-label="'Изменить ' + group.name" @click="editGroup(group)"><i class="bi bi-pencil"></i></button>
                                <button type="button" class="btn btn-sm text-danger" :disabled="busy || loading" :aria-label="'Удалить ' + group.name" @click="removeGroup(group)"><i class="bi bi-trash"></i></button>
                            </div>
                            <div v-if="!loading && !groups.length" class="category-empty">Надкатегорий пока нет</div>
                        </section>
                        <section class="category-panel">
                        <header class="category-panel-heading"><h3>Категории</h3><span class="category-count">{{ categories.length }}</span></header>
                        <form class="category-editor" @submit.prevent="save">
                            <label for="employee-document-category-name" class="form-label fw-semibold">Новая категория</label>
                            <input id="employee-document-category-name" v-model="name" class="form-control form-control-sm" placeholder="Наименование категории" required :disabled="busy || loading">
                            <label for="new-category-group" class="form-label mt-2">Надкатегория</label>
                            <select id="new-category-group" v-model="newGroupID" class="form-select form-select-sm" :disabled="busy || loading"><option :value="null">Без группы</option><option v-for="group in groups" :key="group.ID" :value="group.ID">{{ group.priority }} · {{ group.name }}</option></select>
                            <button type="submit" class="btn btn-primary btn-sm mt-2" :disabled="busy || loading || !name.trim()">{{ busy ? 'Сохранение…' : 'Создать' }}</button>
                        </form>
                        <div v-if="loading" class="text-secondary" role="status">Загрузка…</div>
                        <ul v-else-if="categories.length" class="category-list">
                            <li v-for="(category,index) in categories" :key="category.ID" class="category-list-row category-item">
                                <span class="text-secondary category-number">{{ index + 1 }}</span>
                                <span class="category-name">{{ category.category_name }}</span>
                                <select class="form-select form-select-sm category-group-select" :class="{'category-group-empty': !category.group_id}" :value="category.group_id || ''" :aria-label="'Надкатегория для ' + category.category_name" :disabled="busy || loading" @change="assignGroup(category,$event)"><option value="">Без группы</option><option v-for="group in groups" :key="group.ID" :value="group.ID">{{ group.name }}</option></select> <!-- новый код chat: подсветка категории без группы -->
                                <button type="button" class="btn btn-sm text-danger" :disabled="busy" :aria-label="'Удалить ' + category.category_name" title="Удалить" @click="remove(category)"><i class="bi bi-trash" aria-hidden="true"></i></button>
                            </li>
                        </ul>
                        <div v-else-if="!error" class="category-empty">Категорий пока нет.</div>
                        </section>
                        </div>
                    </div>
                    <div class="modal-footer py-2">
                        <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="close">Закрыть</button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
// --------- новый код chat: существующий API категорий и синхронизация с формой документа
import { ref, onBeforeUnmount } from 'vue';
import { Modal } from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import api from '../../../api';
const emit = defineEmits(['changed', 'created']);
const modalElement = ref(null), categories = ref([]), name = ref('');
const busy = ref(false), loading = ref(false), error = ref('');
// --------- новый код chat: изменение справочника и привязки категорий
const groups = ref([]), groupName = ref(''), groupPriority = ref(1), editingGroup = ref(null), newGroupID = ref(null);
const resetGroup = () => { editingGroup.value = null; groupName.value = ''; groupPriority.value = Math.max(0,...groups.value.map(item => item.priority)) + 1; };
const editGroup = group => {editingGroup.value = group.ID; groupName.value = group.name; groupPriority.value = group.priority;};
const reloadGroups = async () => {
    const [groupResponse,categoryResponse] = await Promise.all([api.get('/employeescard/document/groups'),api.get('/employeescard/document/category')]);
    if (disposed) return;
    groups.value = groupResponse.data || [];
    categories.value = sortCategories(categoryResponse.data);
    emit('changed',categories.value);
};
const saveGroup = async () => {
    if (busy.value || loading.value) return;
    if (!groupName.value.trim() || !Number.isSafeInteger(groupPriority.value) || groupPriority.value < 1) {error.value = 'Укажите название и положительный целый приоритет.';return;}
    // новый код chat: занятая позиция разрешена — backend автоматически сдвигает остальные группы
    busy.value = true; error.value = '';
    try {
        const payload = {name:groupName.value.trim(),priority:groupPriority.value};
        if (editingGroup.value) await api.put('/employeescard/document/groups/' + editingGroup.value,payload);
        else await api.post('/employeescard/document/groups',payload);
        await reloadGroups(); resetGroup();
    } catch(err) {if (!disposed) error.value = errorText(err);}
    finally {busy.value = false;}
};
const removeGroup = async group => {
    if (busy.value || !window.confirm('Удалить надкатегорию «' + group.name + '»? Категории и документы сохранятся без группы.')) return;
    busy.value = true; error.value = '';
    try {
        await api.delete('/employeescard/document/groups/' + group.ID + '/delete');
        if (newGroupID.value === group.ID) newGroupID.value = null;
        await reloadGroups(); resetGroup();
    } catch(err) {if (!disposed) error.value = errorText(err);}
    finally {busy.value = false;}
};
const assignGroup = async (category,event) => {
    const groupID = event.target.value ? Number(event.target.value) : null;
    event.target.value = category.group_id || '';
    if (busy.value || loading.value) return;
    busy.value = true; error.value = '';
    try {
        const {data} = await api.put('/employeescard/document/category/' + category.ID + '/group',{group_id:groupID});
        if (disposed) return;
        categories.value = sortCategories(categories.value.map(item => item.ID === data.ID ? data : item)); // новый код chat: пересортировка после смены надкатегории
        emit('changed',categories.value);
    } catch(err) {if (!disposed) error.value = errorText(err);}
    finally {busy.value = false;}
};
// --------- конец нового кода chat
let modal, requestVersion = 0, disposed = false;
// новый код chat: порядок надкатегорий по приоритету, затем категории по алфавиту; без группы в конце
const sortCategories = list => [...(list || [])].sort((a,b) =>
    (a.group?.priority ?? Infinity) - (b.group?.priority ?? Infinity) ||
    (a.category_name || '').localeCompare(b.category_name || '', 'ru')
);
const errorText = err => typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось обработать категории документов.';
const open = async () => {
    if (busy.value) return;
    const version = ++requestVersion;
    name.value = ''; error.value = ''; loading.value = true;
    modal ||= new Modal(modalElement.value, {backdrop:'static', keyboard:false});
    modal.show();
    try {
        const [{data},groupResponse] = await Promise.all([api.get('/employeescard/document/category'),api.get('/employeescard/document/groups')]);
        if (disposed || version !== requestVersion) return;
        categories.value = sortCategories(data);
        groups.value = groupResponse.data || []; newGroupID.value = null; resetGroup(); // новый код chat
        emit('changed', categories.value);
    } catch(err) { if (!disposed && version === requestVersion) error.value = errorText(err); }
    finally { if (!disposed && version === requestVersion) loading.value = false; }
};
const close = () => { if (!busy.value) {requestVersion++; modal?.hide();} };
const save = async () => {
    if (busy.value || loading.value || !name.value.trim()) return;
    busy.value = true; error.value = '';
    try {
        const {data} = await api.post('/employeescard/document/category/create', {category_name:name.value.trim(),group_id:newGroupID.value}); // новый код chat
        if (disposed) return;
        categories.value = sortCategories([...categories.value, data]);
        emit('changed', categories.value);
        emit('created', data);
        name.value = '';
        modal?.hide();
    } catch(err) { if (!disposed) error.value = errorText(err); }
    finally { busy.value = false; }
};
const remove = async category => {
    if (busy.value || loading.value || !window.confirm('Удалить категорию документов «' + category.category_name + '»?')) return;
    busy.value = true; error.value = '';
    try {
        await api.delete(`/employeescard/document/category/${category.ID}/delete`);
        if (disposed) return;
        categories.value = categories.value.filter(item => item.ID !== category.ID);
        emit('changed', categories.value);
    } catch(err) { if (!disposed) error.value = errorText(err); }
    finally { busy.value = false; }
};
defineExpose({open});
onBeforeUnmount(() => {disposed = true; requestVersion++; modal?.hide(); modal?.dispose();});
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: компактное Bootstrap-окно категорий */
.employee-document-category-modal, .form-control, .form-select {font-size:13px;}
/* новый код chat: размер кнопок задаётся стандартным Bootstrap btn-sm */
.modal-title {font-size:15px;font-weight:600;}
.category-name {overflow-wrap:anywhere;min-width:0;}
/* новый код chat: панели справочника в стиле карточки сотрудника */
.modal-header,.modal-footer {padding:14px 18px;}
.modal-body {padding:16px;background:var(--bs-tertiary-bg);}
.category-modal-title {display:flex;align-items:center;gap:10px;}
.category-modal-title p {font-size:12px;color:var(--bs-secondary-color);margin:3px 0 0;}
.category-section-icon {display:grid;place-items:center;width:34px;height:34px;border-radius:8px;background:var(--bs-primary-bg-subtle);color:var(--bs-primary);font-size:18px;flex-shrink:0;}
.category-workspace {display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:14px;align-items:start;}
.category-panel {background:var(--bs-body-bg);border:1px solid var(--bs-border-color);border-radius:10px;padding:14px;min-width:0;}
.category-panel-heading {display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.category-panel-heading h3 {font-size:15px;font-weight:600;margin:0;}
.category-count {font-size:12px;padding:2px 8px;border-radius:20px;background:var(--bs-tertiary-bg);color:var(--bs-secondary-color);}
.category-editor {margin-bottom:14px;}
.form-label {font-weight:600;font-size:13px;margin-bottom:5px;}
.category-hint {font-size:12px;line-height:1.5;color:var(--bs-secondary-color);margin:0 0 10px;}
.category-list {list-style:none;margin:0;padding:0;}
.category-list-row {padding:8px 0;border-top:1px solid var(--bs-border-color);}
.category-row-editing {background:var(--bs-primary-bg-subtle);border-radius:6px;}
.category-item {display:grid;grid-template-columns:20px minmax(0,1fr) 30px;gap:6px 8px;align-items:center;}
.category-item .category-group-select {grid-column:2;grid-row:2;width:100%;font-size:12px;}
/* новый код chat: отсутствие надкатегории выделено красным, выбор остаётся необязательным */
.category-group-empty {border-color:var(--bs-danger);background-color:var(--bs-danger-bg-subtle);color:var(--bs-danger-text-emphasis);}
.category-group-empty:focus {border-color:var(--bs-danger);box-shadow:0 0 0 .2rem rgba(var(--bs-danger-rgb),.15);}
.category-item > button {grid-column:3;grid-row:1 / 3;align-self:center;} /* новый код chat: стандартные отступы btn-sm */
.category-empty {color:var(--bs-secondary-color);font-size:13px;padding:14px 0;text-align:center;}
@media(max-width:767px) {.category-workspace {grid-template-columns:1fr;}.modal-body {padding:12px;}.category-panel {padding:12px;}}
/* --------- конец нового кода chat */
</style>
