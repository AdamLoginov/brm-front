<!-- --------- новый код chat: работы и расход материалов по позициям месячной книги -->
<template>
    <div class="position-page">
        <header class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <RouterLink class="btn btn-outline-secondary btn-sm" :to="{name:'agreement-work-orders',params:{id:route.params.id},query:{book:route.params.bookId}}"><i class="bi bi-arrow-left me-1"></i>К книге</RouterLink>
            <h2 class="fs-5 mb-0">Работы по позициям</h2>
            <span v-if="book" class="ms-auto">{{ monthLabel }}</span>
            <button v-if="book" type="button" class="btn btn-outline-primary btn-sm" :disabled="statementExporting||loading" @click="exportStatement(true)">Скачать архив ведомостей</button> <!-- новый код chat -->
            <button v-if="book" type="button" class="btn btn-outline-primary btn-sm" :disabled="statementExporting||loading||!canExportStatement" @click="exportStatement">{{ statementExporting?'Выгрузка…':String(positionID).startsWith('block:')?'Выгрузить работы без позиции в шаблон':'Выгрузить выбранную позицию в шаблон' }}</button> <!-- новый код chat -->
            <button v-if="book" type="button" class="btn btn-outline-success btn-sm" :disabled="exporting||loading" @click="exportExcel">{{ exporting?'Выгрузка…':'Выгрузить все позиции в Excel' }}</button> <!-- новый код chat -->
        </header>
        <div v-if="error" class="alert alert-danger" role="alert">{{ error }} <button class="btn btn-link btn-sm" @click="load">Повторить</button></div>
        <div v-if="loading" class="p-3 text-secondary">Загрузка…</div>
        <template v-else-if="book">
            <!-- новый код chat: позиции сгруппированы по блокам без фильтров -->
            <nav class="position-pagination my-3" aria-label="Позиции книги по блокам"> <!-- новый код chat: компактные кнопки позиций -->
                <div v-for="group in positionGroups" :key="group.id" class="mb-2">
                    <div class="fw-semibold mb-1">{{ group.name }} <span class="text-secondary fw-normal">· {{ group.shop }}</span></div>
                    <div class="d-flex flex-wrap gap-1">
                        <button v-for="position in group.positions" :key="position.ID" type="button" class="btn btn-sm" :class="positionID===position.ID?'btn-primary':usedPositions.has(position.ID)?'btn-outline-success':'btn-outline-secondary'" :aria-pressed="positionID===position.ID" :title="position.name" @click="positionID=position.ID">{{ position.number }} <span v-if="usedPositions.has(position.ID)" aria-label="есть работы">•</span></button>
                    </div>
                </div>
                <!-- новый код chat: самостоятельная группа для работ без блока и позиции -->
                <button type="button" class="btn btn-sm" :class="positionID==='unassigned'?'btn-primary':usedPositions.has('unassigned')?'btn-outline-success':'btn-outline-secondary'" :aria-pressed="positionID==='unassigned'" @click="positionID='unassigned'">Без блока <span v-if="usedPositions.has('unassigned')" aria-label="есть работы">•</span></button>
            </nav>
            <p v-if="!positionID" class="border rounded-3 bg-white p-3">Выберите позицию для просмотра выполненных работ за {{ monthLabel }}.</p>
            <template v-else>
                <div class="d-flex flex-wrap gap-3 border rounded-3 bg-white p-3 mb-3">
                    <strong>{{ selectionTitle }}</strong> <!-- новый код chat -->
                    <span class="ms-auto">Работ: <strong>{{ groupedRows.length }}</strong> · Записей: {{ rows.length }}</span>
                    <span>Всего человеко-часов: <strong :class="{'text-danger':groupedRows.some(group=>group.missingHours)}">{{ quantityDisplay(totalHours,2) }}</strong></span>
                </div>
                <div class="border rounded-3 overflow-hidden bg-white mb-3">
                    <div class="table-responsive"><table class="table table-sm align-middle mb-0">
                        <!-- новый код chat: суммарные работы и материалы в одной строке -->
                        <thead class="table-light"><tr><th class="text-center">№</th><th>Наименование работы</th><th class="text-center">Кол-во записей</th><th class="text-end">Объём</th><th>Ед.</th><th class="text-end">Чел.-ч</th><th>Материалы</th></tr></thead>
                        <tbody><tr v-for="(group,index) in groupedRows" :key="group.key" :class="{'accounted-row':group.accounted}"> <!-- новый код chat -->
                            <td class="text-center">{{ index+1 }}</td><td class="work-name"><button type="button" class="work-link" @click="selectedGroup=group">{{ group.name }}</button></td><td class="text-center">{{ group.rows.length }}</td>
                            <td class="text-end" :class="{'text-danger':group.missingQuantity}" :title="group.missingQuantity?'Есть незаполненные объёмы, приняты за 0':''">{{ quantityDisplay(group.quantity,2) }}</td><td>{{ unitName(group.unitID) }}</td>
                            <td class="text-end" :class="{'text-danger':group.missingHours}" :title="group.missingHours?'Есть незаполненные часы, приняты за 0':''">{{ quantityDisplay(group.hours,2) }}</td>
                            <td class="materials-cell"><div v-for="item in group.materials" :key="item.id">{{ materialName(item.id) }} — <strong>{{ quantityDisplay(item.quantity) }} {{ materialUnit(item.id) }}</strong></div><span v-if="!group.materials.length">—</span></td>
                        </tr><tr v-if="!rows.length"><td colspan="7" class="text-center text-secondary py-4">В этой книге нет работ по выбранной позиции.</td></tr></tbody>
                    </table></div>
                </div>
                <section class="border rounded-3 overflow-hidden bg-white">
                    <h3 class="fs-6 p-3 mb-0 border-bottom">Итого использовано материалов</h3>
                    <div v-if="materialTotals.length" class="table-responsive"><table class="table table-sm mb-0"><thead class="table-light"><tr><th>Материал</th><th class="text-end">Количество</th><th>Ед.</th></tr></thead><tbody><tr v-for="item in materialTotals" :key="item.id"><td>{{ materialName(item.id) }}</td><td class="text-end">{{ quantityDisplay(item.quantity) }}</td><td>{{ materialUnit(item.id) }}</td></tr></tbody></table></div>
                    <p v-else class="text-secondary p-3 mb-0">Материалы не указаны.</p>
                </section>
            </template>
        </template>
        <!-- новый код chat: расшифровка суммы с исходными датами и сменами -->
        <WorkOrderDialog v-if="selectedGroup" title="Исходные записи работы" :busy="taskBusy" @close="closeTaskDialog">
            <div v-if="taskError" class="alert alert-danger py-2">{{ taskError }}</div> <!-- новый код chat -->
            <h3 class="fs-6">{{ selectedGroup.name }}</h3>
            <p class="text-secondary">Записей: {{ selectedGroup.rows.length }} · {{ selectionTitle }} · {{ monthLabel }}</p> <!-- новый код chat -->
            <div class="table-responsive"><table class="table table-sm align-middle mb-0">
                <thead><tr><th>Дата</th><th>Смена</th><th>Работа</th><th class="text-end">Объём</th><th>Ед.</th><th class="text-end">Чел.-ч</th><th>Материалы</th><th>Действия</th></tr></thead>
                <!-- новый код chat: ссылка открывает исходную книгу на дате выбранной работы -->
                <!-- новый код chat: SVG-действия с подсказками и доступными названиями -->
                <!-- новый код chat: действия расположены в одну строку -->
                <tbody><tr v-for="row in selectedGroup.rows" :key="row.task.ID"><td class="text-nowrap">{{ dateLabel(row.date) }}</td><td>{{ row.shift.number }}</td><td><RouterLink :to="{name:'agreement-work-orders',params:{id:route.params.id},query:{book:route.params.bookId,date:row.date}}" title="Открыть день в книге наряд-заданий">{{ row.task.name }}</RouterLink></td><td class="text-end" :class="{'text-danger':!row.task.quantity_hundredths}">{{ row.task.quantity_hundredths?quantityDisplay(row.task.quantity_hundredths,2):'—' }}</td><td>{{ unitName(row.task.unit_id) }}</td><td class="text-end" :class="{'text-danger':hoursMissing(row.task)}">{{ hoursMissing(row.task)?'—':quantityDisplay(row.task.hours_hundredths,2) }}</td><td><div v-for="usage in row.task.materials" :key="usage.ID">{{ materialName(usage.material_id) }} — {{ quantityDisplay(usage.quantity_thousandths) }} {{ materialUnit(usage.material_id) }}</div><span v-if="!row.task.materials?.length">—</span></td><td><div class="d-flex align-items-center gap-2 flex-nowrap"><label class="d-flex gap-1 align-items-center text-nowrap m-0" title="Учтён"><input type="checkbox" class="form-check-input m-0" aria-label="Учтён" :checked="row.task.accounted" :disabled="taskBusy||!!editingRow" @change="toggleAccounted(row,$event)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/></svg></label><button type="button" class="task-action flex-shrink-0" title="Изменить работу" aria-label="Изменить работу" :disabled="taskBusy||!!editingRow" @click="editingRow=row;taskError=''"><i class="bi bi-pencil" aria-hidden="true"></i></button></div></td></tr></tbody>
                <tfoot><tr><th colspan="3">Итого</th><th class="text-end" :class="{'text-danger':selectedGroup.missingQuantity}">{{ quantityDisplay(selectedGroup.quantity,2) }}</th><td>{{ unitName(selectedGroup.unitID) }}</td><th class="text-end" :class="{'text-danger':selectedGroup.missingHours}">{{ quantityDisplay(selectedGroup.hours,2) }}</th><td colspan="2"></td></tr></tfoot>
            </table></div>
            <p v-if="selectedGroup.missingQuantity||selectedGroup.missingHours" class="text-danger mt-2 mb-0">Незаполненные значения приняты за 0. Итоги с пропусками выделены красным.</p>
            <WorkOrderTaskEditComponent v-if="editingRow" :key="editingRow.task.ID" :agreement-id="route.params.id" :row="editingRow" :refs="refs" :materials="materials" @busy="taskBusy=$event" @cancel="editingRow=null" @saved="taskSaved(editingRow,$event)" /> <!-- новый код chat -->
        </WorkOrderDialog>
    </div>
</template>
<script setup>
// --------- новый код chat: только чтение сохранённой книги, без отдельного хранения итогов
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import api from '../../../api';
import WorkOrderTaskEditComponent from './WorkOrderTaskEditComponent.vue'; // новый код chat
import WorkOrderDialog from './WorkOrderDialog.vue'; // новый код chat
import { emptyWorkReferences, quantityDisplay, workError } from './workOrderHelpers';
const route=useRoute();
const book=ref(null),refs=ref(emptyWorkReferences()),materials=ref([]),loading=ref(false),error=ref('');
const positionID=ref(0); // новый код chat: выбор только через кнопки позиций
const selectedGroup=ref(null); // новый код chat
// --------- новый код chat: адресное сохранение без перезагрузки смены
const editingRow=ref(null),taskBusy=ref(false),taskError=ref('');
const closeTaskDialog=()=>{if(taskBusy.value)return;if(editingRow.value&&!confirm('Закрыть окно без сохранения изменений работы?'))return;editingRow.value=null;taskError.value='';selectedGroup.value=null;};
const taskSaved=(row,data)=>{
    for(const usage of row.task.materials||[]){const material=materials.value.find(m=>m.ID===usage.material_id);if(material)material.balance+=usage.quantity_thousandths;}
    for(const usage of data.task.materials||[]){const material=materials.value.find(m=>m.ID===usage.material_id);if(material)material.balance-=usage.quantity_thousandths;}
    Object.assign(row.task,data.task);row.shift.version=data.version;
    editingRow.value=null;
    // После смены позиции окно закрывается, чтобы не показывать данные другого раздела.
    if(taskSelection(row.task)!==positionID.value){selectedGroup.value=null;return;}
    selectedGroup.value=groupedRows.value.find(group=>group.rows.some(item=>item.task.ID===data.task.ID))||null;
};
const toggleAccounted=async(row,event)=>{
    const value=event.target.checked;event.target.checked=!!row.task.accounted;
    if(taskBusy.value)return;taskBusy.value=true;taskError.value='';
    try{const {data}=await api.patch(`/agreements/${route.params.id}/work-orders/tasks/${row.task.ID}`,{version:row.shift.version,accounted:value});taskSaved(row,data);}
    catch(e){taskError.value=workError(e);}finally{taskBusy.value=false;}
};
// --------- конец нового кода chat
// --------- новый код chat: выгрузка всей книги независимо от выбранных фильтров
const exporting=ref(false);
// --------- новый код chat: ведомость выбранной позиции, виртуальные группы недоступны
const statementExporting=ref(false);
const canExportStatement=computed(()=>typeof positionID.value==='number'?positionID.value>0:/^block:[1-9]\d*$/.test(String(positionID.value))); // новый код chat
const exportStatement=async(all=false)=>{
    all=all===true; // новый код chat: событие клика одиночной кнопки не включает общую выгрузку
    if(statementExporting.value||!book.value||(!all&&!canExportStatement.value))return;
    const id=route.params.id,bookId=route.params.bookId,position=positionID.value;
    const block=String(position).startsWith('block:')?String(position).slice(6):''; // новый код chat
    const name=String(block?selectedPosition.value?.name||block:selectedPosition.value?.number||position).replace(/[\\/:*?"<>|]/g,'_');
    const period=`${String(book.value.month).padStart(2,'0')}_${book.value.year}`;
    statementExporting.value=true;error.value='';
    try{
        const path=all?`/agreements/${id}/work-orders/books/${bookId}/statements/all`:block?`/agreements/${id}/work-orders/books/${bookId}/blocks/${block}/statement`:`/agreements/${id}/work-orders/books/${bookId}/positions/${position}/statement`; // новый код chat
        const {data}=await api.get(path,{responseType:'blob'});
        const url=URL.createObjectURL(data),link=document.createElement('a');link.href=url;link.download=all?`Ведомости_все_позиции_${period}.zip`:`Ведомость_поз_${name}_${period}.xlsx`; // новый код chat
        document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(e){if(String(route.params.id)===String(id)&&String(route.params.bookId)===String(bookId))error.value=e.response?.data instanceof Blob?await e.response.data.text():workError(e);}
    finally{statementExporting.value=false;}
};
// --------- конец нового кода chat
const exportExcel=async()=>{
    if(exporting.value||!book.value)return;
    const id=route.params.id,bookId=route.params.bookId,month=book.value.month,year=book.value.year;
    exporting.value=true;error.value='';
    try{
        const response=await api.get(`/agreements/${id}/work-orders/books/${bookId}/positions/excel`,{responseType:'blob'});
        const url=URL.createObjectURL(response.data),link=document.createElement('a');
        link.href=url;link.download=`Работы_по_позициям_${String(month).padStart(2,'0')}_${year}.xlsx`;
        document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(e){if(String(route.params.id)===String(id)&&String(route.params.bookId)===String(bookId))error.value=e.response?.data instanceof Blob?await e.response.data.text():workError(e);}
    finally{exporting.value=false;}
};
// --------- конец нового кода chat
let version=0;
const monthLabel=computed(()=>book.value?new Date(book.value.year,book.value.month-1,1).toLocaleDateString('ru-RU',{month:'long',year:'numeric'}):'');
// --------- новый код chat: естественная сортировка блоков и номеров позиций
const positionGroups=computed(()=>refs.value.blocks.map(block=>({
    id:block.ID,name:block.name,shop:refs.value.workshops.find(shop=>shop.ID===block.workshop_id)?.name||'Цех',
    // новый код chat: «Нет» принадлежит конкретному блоку, включая блоки без позиций
    positions:[...refs.value.positions.filter(position=>position.block_id===block.ID).slice().sort((a,b)=>a.number.localeCompare(b.number,'ru',{numeric:true})),{ID:`block:${block.ID}`,number:'Нет',name:`Без позиции · ${block.name}`,block_id:block.ID}]
})).sort((a,b)=>a.name.localeCompare(b.name,'ru',{numeric:true})||a.shop.localeCompare(b.shop,'ru',{numeric:true})||a.id-b.id));
const positions=computed(()=>[...positionGroups.value.flatMap(group=>group.positions),{ID:'unassigned',number:'',name:'Без блока и позиции'}]); // новый код chat
// --------- конец нового кода chat
const selectedPosition=computed(()=>positions.value.find(position=>position.ID===positionID.value));
// --------- новый код chat: классификация без смешивания блоков и обычных позиций
const taskSelection=task=>task.position_id|| (task.block_id?`block:${task.block_id}`:'unassigned');
const selectionTitle=computed(()=>{
    if(positionID.value==='unassigned')return 'Без блока и позиции';
    if(String(positionID.value).startsWith('block:')){
        const group=positionGroups.value.find(group=>`block:${group.id}`===positionID.value);
        return `Без позиции · ${group?.name||'Блок'} · ${group?.shop||'Цех'}`;
    }
    return `Позиция ${selectedPosition.value?.number||''} · ${selectedPosition.value?.name||''}`;
});
// --------- конец нового кода chat
// новый код chat: отмечаем позиции с работами и открываем первую доступную позицию
const usedPositions=computed(()=>new Set((book.value?.shifts||[]).flatMap(shift=>(shift.tasks||[]).map(taskSelection)))); // новый код chat
// --------- новый код chat: последняя позиция сохраняется отдельно для договора и книги
const positionStorageKey=()=>`work-order-position:${route.params.id}:${route.params.bookId}`;
watch([positions,positionID],()=>{
    if(loading.value||!book.value)return;
    if(!positions.value.some(position=>position.ID===positionID.value))positionID.value=positions.value[0]?.ID||0;
    try{
        if(positionID.value)localStorage.setItem(positionStorageKey(),String(positionID.value));
        else localStorage.removeItem(positionStorageKey());
    }catch{/* Недоступное хранилище не мешает переключению позиций. */}
});
// --------- конец нового кода chat
const unitName=id=>refs.value.units.find(unit=>unit.ID===id)?.name||'—';
const materialName=id=>materials.value.find(material=>material.ID===id)?.name||`Материал № ${id}`;
const materialUnit=id=>unitName(materials.value.find(material=>material.ID===id)?.unit_id);
const dateLabel=date=>date?date.split('-').reverse().join('.'):'—';
const rows=computed(()=>{
    const days=new Map((book.value?.days||[]).map(day=>[day.ID,day.date]));
    return (book.value?.shifts||[]).flatMap(shift=>(shift.tasks||[]).filter(task=>positionID.value&&taskSelection(task)===positionID.value).map(task=>({task,shift,date:days.get(shift.day_id)||''}))).sort((a,b)=>a.date.localeCompare(b.date)||a.shift.number-b.shift.number||a.task.ID-b.task.ID); // новый код chat
});
// --------- новый код chat: суммы в целых сотых/тысячных, без сложения разных единиц
const hoursMissing=task=>task.hours_not_specified||task.hours_hundredths==null;
const sumMaterials=source=>{
    const totals=new Map();
    for(const row of source)for(const usage of row.task.materials||[])totals.set(usage.material_id,(totals.get(usage.material_id)||0)+usage.quantity_thousandths);
    return [...totals].map(([id,quantity])=>({id,quantity})).sort((a,b)=>materialName(a.id).localeCompare(materialName(b.id),'ru'));
};
const groupedRows=computed(()=>{
    const groups=new Map();
    for(const row of rows.value){
        const task=row.task,key=task.accounted?`accounted:${task.ID}`:JSON.stringify([task.name.trim().replace(/\s+/g,' ').toLocaleLowerCase('ru-RU'),task.unit_id||0]); // новый код chat: учтённые записи никогда не объединяются
        if(!groups.has(key))groups.set(key,{key,accounted:!!task.accounted,name:task.name,unitID:task.unit_id,rows:[],quantity:0,hours:0,missingQuantity:false,missingHours:false});
        const group=groups.get(key);
        group.rows.push(row);
        group.quantity+=task.quantity_hundredths||0;
        group.hours+=hoursMissing(task)?0:task.hours_hundredths;
        group.missingQuantity||=!task.quantity_hundredths;
        group.missingHours||=hoursMissing(task);
    }
    return [...groups.values()].map(group=>({...group,materials:sumMaterials(group.rows)})).sort((a,b)=>Number(a.accounted)-Number(b.accounted)); // новый код chat
});
const totalHours=computed(()=>groupedRows.value.filter(group=>!group.accounted).reduce((sum,group)=>sum+group.hours,0)); // новый код chat
const materialTotals=computed(()=>sumMaterials(rows.value.filter(row=>!row.task.accounted))); // новый код chat: списания склада остаются неизменными
watch([positionID,book],()=>{selectedGroup.value=null;});
// --------- конец нового кода chat
const load=async()=>{
    const current=++version,id=route.params.id,bookId=route.params.bookId;
    loading.value=true;error.value='';book.value=null;positionID.value=0; // новый код chat
    try{
        const [detail,references,stock]=await Promise.all([api.get(`/agreements/${id}/work-orders/books/${bookId}`),api.get(`/agreements/${id}/work-references`),api.get(`/agreements/${id}/warehouse`)]);
        if(current!==version)return;
        book.value=detail.data;refs.value=references.data;materials.value=stock.data;
        // новый код chat: восстанавливаем позицию после загрузки актуальных справочников
        let savedPosition=0;
        try{const saved=localStorage.getItem(positionStorageKey());savedPosition=positions.value.find(position=>String(position.ID)===saved)?.ID||0;}catch{/* Используем первую позицию. */} // новый код chat: сохраняем также «Нет» и «Без блока»
        positionID.value=positions.value.some(position=>position.ID===savedPosition)?savedPosition:positions.value[0]?.ID||0;
    }catch(e){if(current===version)error.value=workError(e);}finally{if(current===version)loading.value=false;}
};
watch(()=>[route.params.id,route.params.bookId],load,{immediate:true});
onBeforeUnmount(()=>version++);
// --------- конец нового кода chat
</script>
<style scoped>
/* новый код chat: кнопка изменения как в заданиях */
.task-action{display:inline-flex;align-items:center;justify-content:center;width:27px;height:27px;border:0;border-radius:5px;background:transparent;color:#000;}
.task-action:hover{background:var(--bs-secondary-bg);color:var(--bs-primary);}
.task-action:focus-visible{outline:2px solid var(--bs-primary);outline-offset:1px;}
.task-action:disabled{opacity:.45;cursor:default;}
.position-page{font-size:13px;color:#000;}
.position-page .btn,.position-page .form-select{font-size:13px;}
/* новый код chat: компактная пагинация без изменения остальных кнопок */
.position-pagination .btn{font-size:11px;padding:2px 6px;line-height:1.3;border-radius:4px;}
.position-pagination .gap-1{gap:3px!important;}
.form-label{font-weight:500;}
.table th,.table td{padding:8px 10px;}
.table th{font-weight:600;white-space:nowrap;}
.work-name{min-width:250px;white-space:pre-wrap;overflow-wrap:anywhere;}
/* новый код chat: название работы открывает расшифровку */
.work-link{border:0;background:none;padding:0;text-align:left;color:inherit;white-space:pre-wrap;font:inherit;cursor:pointer;}
.work-link:hover{text-decoration:underline;color:#0d6efd;}
.work-link:focus-visible{outline:2px solid #86b7fe;outline-offset:3px;}
.materials-cell{min-width:180px;font-size:12px;}
/* новый код chat: учтённые работы показаны отдельно и исключены из общих итогов */
.accounted-row>td{background:#fce8e8;}
</style>
<!-- --------- конец нового кода chat -->
