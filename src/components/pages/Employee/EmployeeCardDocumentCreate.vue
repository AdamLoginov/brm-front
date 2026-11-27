<!-- --------- новый код chat: форма документа в стиле карточки сотрудника -->
<template>
    <div class="container-fluid document-create-page py-3">
        <router-link :to="{name:'employee-card-detail',params:{id:route.params.id}}" class="document-back"><i class="bi bi-arrow-left" aria-hidden="true"></i> Карточка сотрудника</router-link> <!-- новый код chat: корректное имя маршрута -->
        <header class="document-page-heading">
            <span class="document-section-icon"><i class="bi bi-file-earmark-plus" aria-hidden="true"></i></span>
            <div><h1>Добавить документ</h1><p>Выберите категорию и прикрепите документы сотрудника.</p></div>
        </header>
        <form class="document-form" @submit.prevent="SendEmail">
            <section class="document-form-body">
                <div class="document-block-heading">
                    <h2>Данные документа</h2>
                    <button type="button" class="btn btn-outline-primary btn-sm" :disabled="isSubmit" @click="categoryModal?.open()"><i class="bi bi-folder-plus me-1" aria-hidden="true"></i>Категории документов</button>
                </div>
                <label for="employee-document-category" class="form-label">Категория документа</label>
                <select id="employee-document-category" v-model="formData.category_employee_document_id" class="form-select form-select-sm" :disabled="isSubmit">
                    <option value="no">Выберите категорию</option>
                    <optgroup v-for="group in categoryGroups" :key="group.id" :label="group.name">
                        <option v-for="category in group.items" :key="category.ID" :value="category.ID">{{ category.category_name }}</option>
                    </optgroup>
                </select>
                <div class="document-file-block">
                    <!-- новый код chat: выбор и предварительный просмотр файлов как в задачах -->
                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                        <!-- новый код chat: заголовок блока выбора документа -->
                        <div class="d-flex align-items-center gap-2">
                            <span class="document-file-icon" aria-hidden="true">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="m8 13 7-7a2.5 2.5 0 0 1 3.5 3.5l-9 9a4.5 4.5 0 0 1-6.4-6.4l10-10" />
                                </svg>
                            </span>
                            <div><h2>Файл документа</h2><p class="mt-1 mb-0 text-body-secondary">Выберите файл на компьютере</p></div>
                        </div>
                        <label class="btn btn-outline-primary btn-sm document-upload">
                            <i class="bi bi-paperclip" aria-hidden="true"></i> Добавить файлы
                            <input class="visually-hidden" type="file" multiple :disabled="isSubmit" @change="handleFileChange">
                        </label>
                    </div>
                    <div v-if="files.length" class="d-flex flex-wrap gap-2 mt-2">
                        <div v-for="file in files" :key="file.id" class="position-relative">
                            <TaskAttachmentPreview :file="file" />
                            <button type="button" class="document-remove" :disabled="isSubmit" :aria-label="'Убрать ' + file.name" :title="'Убрать ' + file.name" @click="files = files.filter(item => item.id !== file.id)"><i class="bi bi-x" aria-hidden="true"></i></button>
                        </div>
                    </div>
                </div>
                <div v-if="uploadError" class="alert alert-danger py-2 mt-2 mb-0" role="alert">{{ uploadError }}</div>
            </section>
            <footer class="document-form-footer">
                <router-link :to="{name:'employee-card-detail',params:{id:route.params.id}}" class="btn btn-outline-secondary btn-sm">К карточке</router-link> <!-- новый код chat: корректное имя маршрута -->
                <button class="btn btn-primary btn-sm" type="submit" :disabled="isSubmit || !files.length || formData.category_employee_document_id === 'no'"><span v-if="isSubmit" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span><i v-else class="bi bi-cloud-arrow-up me-1" aria-hidden="true"></i>{{ isSubmit ? 'Загрузка…' : 'Загрузить' }}</button>
            </footer>
        </form>
        <EmployeeCardDocumentCategory ref="categoryModal" @changed="updateCategories" @created="selectCreatedCategory" />
    </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import EmployeeCardDocumentCategory from './EmployeeCardDocumentCategory.vue'; // новый код chat
import TaskAttachmentPreview from '../Home/TaskAttachmentPreview.vue'; // новый код chat

import { useRoute } from 'vue-router';
import api from '../../../api';

const route = useRoute();

const formData = reactive({
    category_employee_document_id: "no"
});

const categorys = ref([]);
// новый код chat: категории без надкатегории идут последними
const categoryGroups = computed(() => {
    const groups = new Map();
    for (const category of categorys.value) {
        const group = category.group;
        const id = group?.ID || 0;
        if (!groups.has(id)) groups.set(id,{id,name:group?.name || 'Без группы',priority:group?.priority ?? Infinity,items:[]});
        groups.get(id).items.push(category);
    }
    return [...groups.values()].sort((a,b) => a.priority - b.priority || a.name.localeCompare(b.name,'ru'));
});
// --------- новый код chat: обновление справочника сохраняет выбранный файл
const categoryModal = ref(null);
let categoriesVersion = 0;
const updateCategories = categories => {
    categoriesVersion++;
    categorys.value = categories;
    if (!categories.some(item => item.ID == formData.category_employee_document_id)) formData.category_employee_document_id = 'no';
};
const selectCreatedCategory = category => { formData.category_employee_document_id = category.ID; };
// --------- конец нового кода chat

const files = ref([]); // новый код chat: файлы выбранной категории
const uploadError = ref('');
let nextFileID = 0;
const isSubmit = ref(false);

const handleFileChange = (event) =>{
    for (const source of event.target.files) {
        files.value.push({ id: ++nextFileID, name: source.name, mime: source.type, source });
    }
    event.target.value = '';
};

const getCategoryEmployeeCardDocumentHandler = async() =>{
    const version = categoriesVersion; // новый код chat: начальная загрузка не перезаписывает изменения из окна
    try{
        const res = await api.get('/employeescard/document/category');
        if (version !== categoriesVersion) return; // новый код chat
        categorys.value = (res.data || []).sort((a, b) =>(a.category_name || '').localeCompare(b.category_name || '', 'ru')); // новый код chat
        console.log("[Категории]: ", categorys.value);
    }catch(err){
        console.log(err);
    }
}

const SendEmail = async()=>{
    if (isSubmit.value || !files.value.length || formData.category_employee_document_id === 'no') return;
    uploadError.value = '';
    try{
        isSubmit.value = true;
        
        // новый код chat: каждый файл сохраняется как отдельный документ
        for (const file of [...files.value]) {
            const payload = new FormData();
            payload.append('category_employee_document_id', formData.category_employee_document_id);
            payload.append('file', file.source);
            await api.post(`/employeescard/${route.params.id}/document/create`, payload);
            files.value = files.value.filter(item => item.id !== file.id);
        }
        formData.category_employee_document_id = "no";
    }catch(err){
        const reason = typeof err.response?.data === 'string' ? err.response.data : 'Попробуйте ещё раз.';
        uploadError.value = `Не удалось загрузить «${files.value[0]?.name}». ${reason}`;
    }finally{
        isSubmit.value = false;
    }
};
onMounted(getCategoryEmployeeCardDocumentHandler);
</script>

<style scoped>
/* --------- новый код chat: оформление формы загрузки документа */
.document-create-page {color:var(--bs-body-color);font-size:13px;}
.document-back {display:inline-flex;gap:6px;align-items:center;color:var(--bs-secondary-color);text-decoration:none;font-size:13px;}
.document-back:hover {color:var(--bs-primary);}
.document-page-heading {display:flex;align-items:center;gap:12px;margin:18px 0;}
.document-page-heading h1 {font-size:20px;font-weight:600;margin:0 0 4px;}
.document-page-heading p {margin:0;color:var(--bs-secondary-color);}
.document-section-icon {display:grid;place-items:center;width:42px;height:42px;border-radius:10px;color:var(--bs-primary);background:var(--bs-primary-bg-subtle);font-size:21px;}
.document-form {max-width:860px;border:1px solid var(--bs-border-color);border-radius:10px;overflow:hidden;background:var(--bs-body-bg);}
.document-form-body {padding:20px;}
.document-block-heading {display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:18px;}
.document-form h2 {font-size:15px;font-weight:600;margin:0;}
.document-form .form-label {font-size:13px;font-weight:600;}
/* новый код chat: размер кнопок задаётся стандартным Bootstrap btn-sm */
.document-form .form-control,.document-form .form-select {font-size:13px;}
.document-file-block {margin-top:20px;padding:16px;border:1px dashed var(--bs-border-color);border-radius:8px;background:var(--bs-tertiary-bg);}
.document-upload:focus-within {outline:2px solid var(--bs-primary);outline-offset:2px;}
.document-file-icon {display:grid;place-items:center;width:34px;height:34px;flex-shrink:0;border-radius:8px;background:var(--bs-body-bg);color:var(--bs-primary);}
.document-remove {position:absolute;top:7px;right:3px;display:grid;place-items:center;width:22px;height:22px;padding:0;line-height:1;border:1px solid var(--bs-border-color);border-radius:50%;background:white;color:#495057;}
.document-remove i {display:grid;place-items:center;}
.document-remove:hover {color:var(--bs-danger);}
.document-form-footer {display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px;padding:12px 20px;border-top:1px solid var(--bs-border-color);}
@media(max-width:575px) {.document-form-body {padding:14px;}.document-form-footer {padding:12px 14px;}.document-file-block {padding:12px;}}
/* --------- конец нового кода chat */
</style>
