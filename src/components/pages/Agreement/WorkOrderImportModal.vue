<!-- --------- новый код chat: загрузка Excel и подтверждение подробного плана изменений -->
<template>
    <WorkOrderDialog title="Загрузка книги из Excel" :busy="busy" @close="$emit('close')">
        <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
        <fieldset :disabled="busy" class="border-0 p-0">
            <!-- --------- новый код chat: отдельный формат общего журнала без служебных ключей -->
            <p class="alert alert-info py-2">Будут заменены только смены, представленные в журнале. Сотрудники сопоставляются по ФИО, справочники — по названиям и номерам. Часы сотрудников и цех обязательны. Поступления склада не меняются. Все изменения и удаления появятся перед подтверждением.</p>
            <!-- --------- конец нового кода chat -->
            <label class="form-label" for="work-import-file">Файл XLSX · до 10 МБ</label>
            <input id="work-import-file" type="file" accept=".xlsx" class="form-control form-control-sm mb-3" @change="chooseFile">
            <button type="button" class="btn btn-primary btn-sm" :disabled="!file" @click="preview">{{ busy ? 'Проверка…' : 'Проверить файл' }}</button>
        </fieldset>

        <section v-if="report" class="mt-3 border-top pt-3" aria-live="polite">
            <!-- новый код chat: количество замечаний в списке ошибок импорта -->
            <div v-if="report.errors.length" class="alert alert-danger"><strong>Импорт заблокирован · Замечаний: {{ report.errors.length }}</strong><ul class="mb-0 mt-1"><li v-for="(message,i) in report.errors" :key="i">{{ message }}</li></ul></div>
            <div v-if="report.warnings.length" class="alert alert-warning"><strong>Предупреждения — сохранение разрешено</strong><ul class="mb-0 mt-1"><li v-for="(message,i) in report.warnings" :key="i">{{ message }}</li></ul></div>
            <div class="d-flex flex-wrap gap-2 mb-3">
                <span class="badge text-bg-success">Новые: {{ count('create') }}</span><span class="badge text-bg-primary">Изменяемые: {{ count('update') }}</span><span class="badge text-bg-danger">Удаляемые: {{ count('delete') }}</span>
            </div>
            <p v-if="!report.changes.length&&!report.errors.length" class="mb-2">Изменений нет. Данные уже совпадают с файлом.</p>
            <div v-if="report.changes.length" class="import-changes">
                <article v-for="(change,index) in report.changes" :key="index" class="border rounded-3 mb-2 overflow-hidden">
                    <header class="d-flex gap-2 align-items-center bg-light p-2"><span class="badge" :class="actionClass(change.action)">{{ actionLabel(change.action) }}</span><strong>{{ change.sheet }}</strong><span class="ms-auto text-secondary">{{ change.key }}</span></header>
                    <div class="px-2 py-1 border-bottom text-secondary">{{ change.context }}</div>
                    <table class="table table-sm mb-0"><thead><tr><th>Поле</th><th>Было</th><th>Будет</th></tr></thead><tbody>
                        <tr v-for="(column,i) in change.columns" :key="i" :class="change.before[i]!==change.after[i]?'table-warning':''"><td>{{ column }}</td><td>{{ change.before[i] ?? '—' }}</td><td>{{ change.after[i] ?? '—' }}</td></tr>
                    </tbody></table>
                </article>
            </div>
            <div v-if="report.stock.length" class="mt-3"><h3 class="fs-6">Остатки материалов</h3><div class="table-responsive"><table class="table table-sm"><thead><tr><th>Материал / цех / единица</th><th>Было</th><th>Будет</th></tr></thead><tbody><tr v-for="row in report.stock" :key="row.name"><td>{{ row.name }}</td><td>{{ row.before }}</td><td>{{ row.after }}</td></tr></tbody></table></div></div>
            <p v-if="report.token" class="text-secondary mt-3 mb-2">Пока ничего не сохранено. Подтверждение применит весь показанный список, включая удаления.</p>
            <button v-if="report.token&&report.changes.length&&!report.errors.length" type="button" class="btn btn-primary btn-sm" :disabled="busy" @click="confirmImport">{{ busy ? 'Сохранение…' : 'Подтвердить импорт' }}</button>
        </section>
    </WorkOrderDialog>
</template>
<script setup>
import { ref } from 'vue';
import api from '../../../api';
import WorkOrderDialog from './WorkOrderDialog.vue';
import { workError } from './workOrderHelpers';
const props=defineProps({ agreementId:[String,Number], book:Object });
const emit=defineEmits(['close','saved']);
const file=ref(null),busy=ref(false),error=ref(''),report=ref(null); // новый код chat: общий журнал
const reset=()=>{report.value=null;error.value='';};
const chooseFile=event=>{reset();file.value=event.target.files?.[0]||null;if(file.value&&file.value.size>10*1024*1024){error.value='Максимальный размер файла — 10 МБ';file.value=null;}};
const count=action=>report.value?.changes.filter(c=>c.action===action).length||0;
const actionLabel=action=>({create:'Добавить',update:'Изменить',delete:'Удалить'}[action]);
const actionClass=action=>({create:'text-bg-success',update:'text-bg-primary',delete:'text-bg-danger'}[action]);
const request=async(action,token='')=>{
    const form=new FormData();form.append('file',file.value);form.append('token',token); // новый код chat
    return api.post(`/agreements/${props.agreementId}/work-orders/books/${props.book.ID}/excel/${action}`,form);
};
const preview=async()=>{if(busy.value||!file.value)return;busy.value=true;reset();try{report.value=(await request('preview')).data;}catch(e){error.value=workError(e);}finally{busy.value=false;}};
const confirmImport=async()=>{
    if(busy.value||!report.value?.token)return;busy.value=true;error.value='';
    try{const result=(await request('confirm',report.value.token)).data;if(result.applied){emit('saved',result.warnings.join('; '));}else{report.value=result;}}
    catch(e){error.value=workError(e);report.value=null;}finally{busy.value=false;}
};
</script>
<style scoped>
.import-changes{max-height:440px;overflow:auto;}
.import-changes table{table-layout:fixed;font-size:12px;}
.import-changes th:first-child{width:24%;}
.import-changes td{overflow-wrap:anywhere;white-space:pre-wrap;}
.badge{font-size:12px;font-weight:500;}
</style>
<!-- --------- конец нового кода chat -->
