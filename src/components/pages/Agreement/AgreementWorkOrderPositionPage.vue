<!-- --------- новый код chat: работы и расход материалов по позициям месячной книги -->
<template>
    <div class="position-page">
        <header class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <RouterLink class="btn btn-outline-secondary btn-sm" :to="{name:'agreement-work-orders',params:{id:route.params.id},query:{book:route.params.bookId}}"><i class="bi bi-arrow-left me-1"></i>К книге</RouterLink>
            <h2 class="fs-5 mb-0">Работы по позициям</h2>
            <span v-if="book" class="ms-auto">{{ monthLabel }}</span>
        </header>
        <div v-if="error" class="alert alert-danger" role="alert">{{ error }} <button class="btn btn-link btn-sm" @click="load">Повторить</button></div>
        <div v-if="loading" class="p-3 text-secondary">Загрузка…</div>
        <template v-else-if="book">
            <section class="border rounded-3 bg-white p-3 mb-3">
                <div class="row g-2">
                    <div class="col-md-3"><label for="position-shop" class="form-label">Цех</label><select id="position-shop" v-model="shopID" class="form-select form-select-sm" @change="blockID=0;positionID=0"><option :value="0">Все цеха</option><option v-for="shop in refs.workshops" :key="shop.ID" :value="shop.ID">{{ shop.name }}</option></select></div>
                    <div class="col-md-3"><label for="position-block" class="form-label">Блок</label><select id="position-block" v-model="blockID" class="form-select form-select-sm" @change="positionID=0"><option :value="0">Все блоки</option><option v-for="block in blocks" :key="block.ID" :value="block.ID">{{ block.name }}</option></select></div>
                    <div class="col-md-6"><label for="position-choice" class="form-label">Позиция</label><select id="position-choice" v-model="positionID" class="form-select form-select-sm"><option :value="0">Выберите позицию</option><option v-for="position in positions" :key="position.ID" :value="position.ID">{{ position.number }} · {{ position.name }} · {{ blockName(position.block_id) }}</option></select></div>
                </div>
            </section>
            <p v-if="!positionID" class="border rounded-3 bg-white p-3">Выберите позицию для просмотра выполненных работ за {{ monthLabel }}.</p>
            <template v-else>
                <div class="d-flex flex-wrap gap-3 border rounded-3 bg-white p-3 mb-3">
                    <strong>Позиция {{ selectedPosition?.number }} · {{ selectedPosition?.name }}</strong>
                    <span class="ms-auto">Работ: <strong>{{ groupedRows.length }}</strong> · Записей: {{ rows.length }}</span>
                    <span>Всего человеко-часов: <strong :class="{'text-danger':groupedRows.some(group=>group.missingHours)}">{{ quantityDisplay(totalHours,2) }}</strong></span>
                </div>
                <div class="border rounded-3 overflow-hidden bg-white mb-3">
                    <div class="table-responsive"><table class="table table-sm align-middle mb-0">
                        <!-- новый код chat: суммарные работы и материалы в одной строке -->
                        <thead class="table-light"><tr><th class="text-center">№</th><th>Наименование работы</th><th class="text-center">Кол-во записей</th><th class="text-end">Объём</th><th>Ед.</th><th class="text-end">Чел.-ч</th><th>Материалы</th></tr></thead>
                        <tbody><tr v-for="(group,index) in groupedRows" :key="group.key">
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
        <WorkOrderDialog v-if="selectedGroup" title="Исходные записи работы" @close="selectedGroup=null">
            <h3 class="fs-6">{{ selectedGroup.name }}</h3>
            <p class="text-secondary">Записей: {{ selectedGroup.rows.length }} · Позиция {{ selectedPosition?.number }} · {{ monthLabel }}</p>
            <div class="table-responsive"><table class="table table-sm align-middle mb-0">
                <thead><tr><th>Дата</th><th>Смена</th><th>Работа</th><th class="text-end">Объём</th><th>Ед.</th><th class="text-end">Чел.-ч</th><th>Материалы</th></tr></thead>
                <tbody><tr v-for="row in selectedGroup.rows" :key="row.task.ID"><td class="text-nowrap">{{ dateLabel(row.date) }}</td><td>{{ row.shift.number }}</td><td>{{ row.task.name }}</td><td class="text-end" :class="{'text-danger':!row.task.quantity_hundredths}">{{ row.task.quantity_hundredths?quantityDisplay(row.task.quantity_hundredths,2):'—' }}</td><td>{{ unitName(row.task.unit_id) }}</td><td class="text-end" :class="{'text-danger':hoursMissing(row.task)}">{{ hoursMissing(row.task)?'—':quantityDisplay(row.task.hours_hundredths,2) }}</td><td><div v-for="usage in row.task.materials" :key="usage.ID">{{ materialName(usage.material_id) }} — {{ quantityDisplay(usage.quantity_thousandths) }} {{ materialUnit(usage.material_id) }}</div><span v-if="!row.task.materials?.length">—</span></td></tr></tbody>
                <tfoot><tr><th colspan="3">Итого</th><th class="text-end" :class="{'text-danger':selectedGroup.missingQuantity}">{{ quantityDisplay(selectedGroup.quantity,2) }}</th><td>{{ unitName(selectedGroup.unitID) }}</td><th class="text-end" :class="{'text-danger':selectedGroup.missingHours}">{{ quantityDisplay(selectedGroup.hours,2) }}</th><td></td></tr></tfoot>
            </table></div>
            <p v-if="selectedGroup.missingQuantity||selectedGroup.missingHours" class="text-danger mt-2 mb-0">Незаполненные значения приняты за 0. Итоги с пропусками выделены красным.</p>
        </WorkOrderDialog>
    </div>
</template>
<script setup>
// --------- новый код chat: только чтение сохранённой книги, без отдельного хранения итогов
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import api from '../../../api';
import WorkOrderDialog from './WorkOrderDialog.vue'; // новый код chat
import { emptyWorkReferences, quantityDisplay, workError } from './workOrderHelpers';
const route=useRoute();
const book=ref(null),refs=ref(emptyWorkReferences()),materials=ref([]),loading=ref(false),error=ref('');
const shopID=ref(0),blockID=ref(0),positionID=ref(0);
const selectedGroup=ref(null); // новый код chat
let version=0;
const monthLabel=computed(()=>book.value?new Date(book.value.year,book.value.month-1,1).toLocaleDateString('ru-RU',{month:'long',year:'numeric'}):'');
const blocks=computed(()=>refs.value.blocks.filter(block=>!shopID.value||block.workshop_id===shopID.value));
const positions=computed(()=>refs.value.positions.filter(position=>blocks.value.some(block=>block.ID===position.block_id)&&(!blockID.value||position.block_id===blockID.value)).slice().sort((a,b)=>a.number.localeCompare(b.number,'ru',{numeric:true})));
const selectedPosition=computed(()=>refs.value.positions.find(position=>position.ID===positionID.value));
const blockName=id=>refs.value.blocks.find(block=>block.ID===id)?.name||'—';
const unitName=id=>refs.value.units.find(unit=>unit.ID===id)?.name||'—';
const materialName=id=>materials.value.find(material=>material.ID===id)?.name||`Материал № ${id}`;
const materialUnit=id=>unitName(materials.value.find(material=>material.ID===id)?.unit_id);
const dateLabel=date=>date?date.split('-').reverse().join('.'):'—';
const rows=computed(()=>{
    const days=new Map((book.value?.days||[]).map(day=>[day.ID,day.date]));
    return (book.value?.shifts||[]).flatMap(shift=>(shift.tasks||[]).filter(task=>positionID.value&&task.position_id===positionID.value).map(task=>({task,shift,date:days.get(shift.day_id)||''}))).sort((a,b)=>a.date.localeCompare(b.date)||a.shift.number-b.shift.number||a.task.ID-b.task.ID);
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
        const task=row.task,key=JSON.stringify([task.name.trim().replace(/\s+/g,' ').toLocaleLowerCase('ru-RU'),task.unit_id||0]);
        if(!groups.has(key))groups.set(key,{key,name:task.name,unitID:task.unit_id,rows:[],quantity:0,hours:0,missingQuantity:false,missingHours:false});
        const group=groups.get(key);
        group.rows.push(row);
        group.quantity+=task.quantity_hundredths||0;
        group.hours+=hoursMissing(task)?0:task.hours_hundredths;
        group.missingQuantity||=!task.quantity_hundredths;
        group.missingHours||=hoursMissing(task);
    }
    return [...groups.values()].map(group=>({...group,materials:sumMaterials(group.rows)}));
});
const totalHours=computed(()=>groupedRows.value.reduce((sum,group)=>sum+group.hours,0));
const materialTotals=computed(()=>sumMaterials(rows.value));
watch([positionID,book],()=>{selectedGroup.value=null;});
// --------- конец нового кода chat
const load=async()=>{
    const current=++version,id=route.params.id,bookId=route.params.bookId;
    loading.value=true;error.value='';book.value=null;shopID.value=0;blockID.value=0;positionID.value=0;
    try{
        const [detail,references,stock]=await Promise.all([api.get(`/agreements/${id}/work-orders/books/${bookId}`),api.get(`/agreements/${id}/work-references`),api.get(`/agreements/${id}/warehouse`)]);
        if(current!==version)return;
        book.value=detail.data;refs.value=references.data;materials.value=stock.data;
    }catch(e){if(current===version)error.value=workError(e);}finally{if(current===version)loading.value=false;}
};
watch(()=>[route.params.id,route.params.bookId],load,{immediate:true});
onBeforeUnmount(()=>version++);
// --------- конец нового кода chat
</script>
<style scoped>
.position-page{font-size:13px;color:#000;}
.position-page .btn,.position-page .form-select{font-size:13px;}
.form-label{font-weight:500;}
.table th,.table td{padding:8px 10px;}
.table th{font-weight:600;white-space:nowrap;}
.work-name{min-width:250px;white-space:pre-wrap;overflow-wrap:anywhere;}
/* новый код chat: название работы открывает расшифровку */
.work-link{border:0;background:none;padding:0;text-align:left;color:inherit;white-space:pre-wrap;font:inherit;cursor:pointer;}
.work-link:hover{text-decoration:underline;color:#0d6efd;}
.work-link:focus-visible{outline:2px solid #86b7fe;outline-offset:3px;}
.materials-cell{min-width:180px;font-size:12px;}
</style>
<!-- --------- конец нового кода chat -->
