<!-- --------- новый код chat: месячная книга, календарные дни и смены по цехам -->
<template><div class="work-order-page">
    <header class="d-flex flex-wrap gap-2 align-items-center mb-3"><h2 class="fs-5 me-auto mb-0">Книга наряд-заданий</h2><button class="btn btn-outline-secondary btn-sm" :disabled="!!editor" @click="referencesOpen=true">Цеха, блоки, позиции, единицы</button><button class="btn btn-primary btn-sm" :disabled="!!editor" @click="createOpen=true">Создать книгу</button></header>
    <div v-if="error" class="alert alert-danger" role="alert">{{ error }} <button class="btn btn-link btn-sm" @click="load">Повторить загрузку</button></div><div v-if="notice" class="alert alert-warning">{{ notice }}</div>
    <div class="border rounded-3 p-3 bg-white"><label class="form-label">Месячная книга</label><select v-model="bookID" :disabled="loading||!!editor" class="form-select form-select-sm" style="max-width:300px" @change="loadBook"><option :value="0" disabled>Выберите месяц</option><option v-for="b in books" :key="b.ID" :value="b.ID">{{ bookLabel(b) }}</option></select><div v-if="!books.length&&!loading" class="text-secondary mt-2">Создайте книгу для нужного месяца.</div></div>
    <div v-if="loading" class="p-3 text-secondary">Загрузка…</div>
    <template v-else-if="book">
        <!-- новый код chat: поиск по работам всей месячной книги -->
        <div class="mt-3"><label for="work-book-search" class="form-label">Поиск работы по всей книге</label><input id="work-book-search" v-model="workSearch" :disabled="!!editor" type="search" class="form-control form-control-sm" placeholder="Наименование работы"></div>
        <div v-if="workSearch.trim()" class="border rounded-3 mt-2 overflow-auto" style="max-height:320px">
            <table class="table table-sm mb-0"><thead><tr><th>Дата</th><th>Цех / смена</th><th>Работа</th></tr></thead><tbody><tr v-for="result in searchResults" :key="result.task.ID" :class="{'accounted-row':result.task.accounted}"><td>{{ result.date.split('-').reverse().join('.') }}</td><td>{{ shopName(result.shift.workshop_id) }} / {{ result.shift.number }}</td><td><button type="button" class="btn btn-link btn-sm p-0 text-start" :disabled="!!editor" @click="dayID=result.shift.day_id;workSearch=''">{{ result.task.name }}</button></td></tr><tr v-if="!searchResults.length"><td colspan="3">Совпадений нет.</td></tr></tbody></table>
        </div>
        <!-- --------- новый код chat: шаблон, выгрузка и импорт выбранного месяца -->
        <div class="d-flex flex-wrap gap-2 mt-3">
            <!-- новый код chat: просмотр работ по позициям выбранной книги -->
            <RouterLink v-if="!editor" class="btn btn-outline-secondary btn-sm" :to="{name:'agreement-work-order-positions',params:{id:agreementID,bookId:book.ID}}">Работы по позициям</RouterLink>
            <button class="btn btn-outline-primary btn-sm" :disabled="!!editor" @click="importOpen=true">Загрузить из Excel</button>
        </div>
        <!-- --------- конец нового кода chat -->
        <div class="d-flex flex-wrap gap-1 my-3" aria-label="Дни книги"><button v-for="day in book.days" :key="day.ID" class="btn btn-sm" :class="dayID===day.ID?'btn-primary':hasEntries(day.ID)?'btn-outline-success':'btn-outline-secondary'" :disabled="!!editor" @click="dayID=day.ID">{{ Number(day.date.slice(-2)) }} <span v-if="hasEntries(day.ID)" aria-label="есть записи">•</span></button></div>
        <div class="d-flex align-items-center justify-content-between"><h3 class="fs-6 mb-0">{{ selectedDay?.date.split('-').reverse().join('.') }}</h3><button class="btn btn-outline-primary btn-sm" :disabled="!!editor||!selectedDay" @click="editor={shift:null,key:Date.now()}">Добавить цех / смену</button></div>
        <div v-if="!dayShifts.length&&!editor" class="text-secondary p-3 border rounded-3 mt-3">Записей за этот день нет.</div>
        <!-- --------- новый код chat: все данные сохранённой смены доступны без открытия формы -->
        <article v-for="shift in (editor ? [] : dayShifts)" :key="shift.ID" class="shift-summary mt-3">
            <header class="shift-summary-header">
                <div class="shift-summary-title">
                    <span class="shift-summary-icon"><i class="bi bi-journal-text" aria-hidden="true"></i></span>
                    <div class="shift-title-line"><h4>{{ shopName(shift.workshop_id) }}</h4><span class="text-black">Смена № {{ shift.number }} · {{ selectedDay?.date.split('-').reverse().join('.') }}</span></div> <!-- новый код chat: чёрный текст смены и даты -->
                </div>
                <div class="shift-summary-actions">
                    <button class="btn btn-outline-primary btn-sm" :disabled="!!editor" @click="editor={shift,key:shift.ID}"><i class="bi bi-pencil me-1" aria-hidden="true"></i>Изменить</button>
                    <button class="btn btn-outline-danger btn-sm" :disabled="!!editor||deleting" @click="removeShift(shift)">Удалить</button>
                </div>
            </header>
            <div class="shift-summary-totals">
                <span>Сотрудники <strong>{{ shift.employees.length }}</strong></span>
                <span>Отработано <strong>{{ quantityDisplay(sumHours(shift.employees,'hours_hundredths'),2) }} ч</strong></span>
                <span>Работы <strong>{{ shift.tasks.length }}</strong></span>
                <span>Распределено <strong>{{ quantityDisplay(sumHours(shift.tasks,'hours_hundredths'),2) }} чел.-ч</strong></span>
                <span v-if="sumHours(shift.employees,'hours_hundredths')>sumHours(shift.tasks,'hours_hundredths')" class="shift-hours-warning">Не распределено: {{ quantityDisplay(sumHours(shift.employees,'hours_hundredths')-sumHours(shift.tasks,'hours_hundredths'),2) }} ч</span>
                <span v-else-if="sumHours(shift.tasks,'hours_hundredths')>sumHours(shift.employees,'hours_hundredths')" class="shift-hours-warning">Превышение: {{ quantityDisplay(sumHours(shift.tasks,'hours_hundredths')-sumHours(shift.employees,'hours_hundredths'),2) }} ч</span> <!-- новый код chat -->
                <span v-else class="shift-hours-complete"><i class="bi bi-check2 me-1" aria-hidden="true"></i>Часы распределены</span>
            </div>
            <div class="shift-summary-content">
                <section class="shift-summary-employees">
                    <h5><i class="bi bi-people me-2" aria-hidden="true"></i>Сотрудники и часы</h5>
                    <table v-if="shift.employees.length" class="shift-employee-table">
                        <thead><tr><th scope="col">Сотрудник</th><th scope="col">Часы</th></tr></thead>
                        <tbody><tr v-for="employee in shift.employees" :key="employee.ID"><td :title="employee.employee_name">{{ compactEmployeeName(employee.employee_name) }}<small v-if="!refs.employees.some(e=>e.ID===employee.employee_card_id)" class="d-block text-secondary">Больше не закреплён за договором</small></td><td>{{ quantityDisplay(employee.hours_hundredths,2) }}</td></tr></tbody>
                    </table>
                    <p v-else class="text-secondary mb-0">Сотрудники не указаны.</p>
                </section>
                <section class="shift-summary-works">
                    <h5><i class="bi bi-list-check me-2" aria-hidden="true"></i>Выполненные работы</h5>
                    <p v-if="!shift.tasks.length" class="text-secondary mb-0">Работы пока не добавлены.</p>
                    <!-- --------- новый код chat: работы и материалы в компактной таблице -->
                    <div v-if="shift.tasks.length" class="saved-works-scroll">
                        <table class="saved-works-table">
                            <colgroup><col style="width:30px"><col><col style="width:50px"><col style="width:85px"><col style="width:75px"><col style="width:160px"><col style="width:120px"></colgroup>
                            <thead><tr><th>№</th><th>Наименование работы</th><th class="text-center">Ед.</th><th>Объём</th><th class="text-center">Чел.-ч</th><th class="text-center">Позиция</th><th class="text-center">Блок</th></tr></thead> <!-- новый код chat: отдельная узкая колонка единиц -->
                            <tbody><template v-for="(task,index) in shift.tasks" :key="task.ID">
                                <tr class="saved-work-row" :class="{'accounted-row':task.accounted}"> <!-- новый код chat -->
                                    <td class="text-secondary text-center">{{ index+1 }}</td>
                                    <td class="saved-work-name">{{ task.name }} <span v-if="task.accounted" class="small ms-1">· Учтён</span></td> <!-- новый код chat -->
                                    <td class="text-center">{{ task.unit_id ? unitName(task.unit_id) : '—' }}</td> <!-- новый код chat: единица отдельно от объёма -->
                                    <td>{{ task.quantity_hundredths ? quantityDisplay(task.quantity_hundredths,2) : '—' }}</td>
                                    <td class="text-center">{{ task.hours_not_specified ? '—' : quantityDisplay(task.hours_hundredths,2) }}</td> <!-- новый код chat -->
                                    <td class="text-center">{{ taskPositionName(task.position_id) }}</td><td class="text-center">{{ taskBlockName(task) }}</td> <!-- новый код chat: значения позиции и блока по центру -->
                                </tr>
                                <tr v-if="task.materials.length" class="saved-material-row"><td></td><td colspan="6"><div class="saved-materials"><span class="text-secondary">Материалы:</span><span v-for="usage in task.materials" :key="usage.ID">{{ materialName(usage.material_id) }} <strong>{{ quantityDisplay(usage.quantity_thousandths) }} {{ materialUnitName(usage.material_id) }}</strong></span></div></td></tr> <!-- новый код chat: учитываем новую колонку -->
                            </template></tbody>
                        </table>
                    </div>
                    <!-- --------- конец нового кода chat -->
                </section>
            </div>
        </article>
        <!-- --------- конец нового кода chat -->
        <WorkOrderShiftComponent v-if="editor&&selectedDay" :key="editor.key" :agreement-id="agreementID" :day-id="dayID" :date="selectedDay.date" :shift="editor.shift" :refs="refs" :materials="materials" @close="editor=null" @saved="saved" />
    </template>
    <WorkOrderBookModal v-if="createOpen" :agreement-id="agreementID" @close="createOpen=false" @created="created" />
    <WorkOrderImportModal v-if="importOpen&&book" :agreement-id="agreementID" :book="book" @close="importOpen=false" @saved="importSaved" /> <!-- новый код chat -->
    <WorkOrderReferenceModal v-if="referencesOpen" :agreement-id="agreementID" :refs="refs" @close="referencesOpen=false" @changed="loadReferences" />
</div></template>
<script setup>
// --------- новый код chat: Excel использует существующий авторизованный API
import WorkOrderImportModal from './WorkOrderImportModal.vue';
const importOpen=ref(false); // новый код chat: только загрузка журнала
const importSaved=async warning=>{importOpen.value=false;notice.value=warning||'Данные из Excel сохранены.';await loadBook();};
// --------- конец нового кода chat
import {ref,computed,watch,onBeforeUnmount} from 'vue';import {useRoute,onBeforeRouteLeave,onBeforeRouteUpdate} from 'vue-router';import api from '../../../api';import WorkOrderBookModal from './WorkOrderBookModal.vue';import WorkOrderReferenceModal from './WorkOrderReferenceModal.vue';import WorkOrderShiftComponent from './WorkOrderShiftComponent.vue';import {emptyWorkReferences,quantityDisplay,workError} from './workOrderHelpers';
const route=useRoute(),agreementID=computed(()=>String(route.params.id));const refs=ref(emptyWorkReferences()),books=ref([]),materials=ref([]),book=ref(null),bookID=ref(0),dayID=ref(0),editor=ref(null),error=ref(''),notice=ref(''),loading=ref(false),deleting=ref(false),createOpen=ref(false),referencesOpen=ref(false);let version=0;
const bookLabel=b=>new Date(b.year,b.month-1,1).toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
// --------- новый код chat: поиск не ограничивается открытым днём
const workSearch=ref('');
const searchResults=computed(()=>{
    const query=workSearch.value.trim().toLocaleLowerCase('ru-RU');
    if(!query)return [];
    const dates=new Map((book.value?.days||[]).map(day=>[day.ID,day.date]));
    return (book.value?.shifts||[]).flatMap(shift=>(shift.tasks||[]).filter(task=>task.name.toLocaleLowerCase('ru-RU').includes(query)).map(task=>({task,shift,date:dates.get(shift.day_id)||''})));
});
watch(bookID,()=>{workSearch.value='';});
// --------- конец нового кода chat
const selectedDay=computed(()=>book.value?.days.find(d=>d.ID===dayID.value));const dayShifts=computed(()=>book.value?.shifts.filter(s=>s.day_id===dayID.value)||[]);
const hasEntries=id=>book.value?.shifts.some(s=>s.day_id===id);const shopName=id=>refs.value.workshops.find(s=>s.ID===id)?.name||'Цех';const sumHours=(rows,key)=>rows.reduce((s,r)=>s+r[key],0);
// --------- новый код chat: названия справочников для подробного просмотра смены
// новый код chat: компактное имя, полное ФИО доступно при наведении.
const compactEmployeeName=name=>{const parts=(name||'').trim().split(/\s+/);return [parts[0],...parts.slice(1).map(part=>part[0]+'.')].join(' ');};
const unitName = id => refs.value.units.find(unit => unit.ID === id)?.name || '—';
const taskBlockName = task => { // новый код chat: поддержка блока без позиции и старых записей
    const position = refs.value.positions.find(row => row.ID === task.position_id);
    return refs.value.blocks.find(block => block.ID === (task.block_id || position?.block_id))?.name || '—';
};
const taskPositionName = id => {
    const position = refs.value.positions.find(row => row.ID === id);
    return position ? position.number : '—'; // новый код chat: в сохранённой таблице только номер
};
const materialName = id => materials.value.find(material => material.ID === id)?.name || `Материал № ${id}`;
const materialUnitName = id => unitName(materials.value.find(material => material.ID === id)?.unit_id);
// --------- конец нового кода chat
const loadReferences=async()=>{const id=agreementID.value;try{const res=await api.get(`/agreements/${id}/work-references`);if(id===agreementID.value)refs.value=res.data;}catch(e){error.value=workError(e);}};
const loadBook=async()=>{if(!bookID.value)return;const v=++version,id=agreementID.value;loading.value=true;error.value='';try{const [detail,stock]=await Promise.all([api.get(`/agreements/${id}/work-orders/books/${bookID.value}`),api.get(`/agreements/${id}/warehouse`)]);if(v!==version)return;book.value=detail.data;materials.value=stock.data;if(!book.value.days.some(d=>d.ID===dayID.value))dayID.value=book.value.days.find(d=>d.date===route.query.date)?.ID||book.value.days[0]?.ID||0;}catch(e){if(v===version){book.value=null;error.value=workError(e);}}finally{if(v===version)loading.value=false;}};
const load=async()=>{if(editor.value&&!confirm('Обновить книгу и закрыть несохранённую форму?'))return;editor.value=null;const v=++version,id=agreementID.value;loading.value=true;error.value='';try{const [r,b]=await Promise.all([api.get(`/agreements/${id}/work-references`),api.get(`/agreements/${id}/work-orders`)]);if(v!==version)return;refs.value=r.data;books.value=b.data;const requested=Number(route.query.book)||bookID.value;bookID.value=books.value.some(b=>b.ID===requested)?requested:books.value[0]?.ID||0;await loadBook();}catch(e){if(v===version)error.value=workError(e);}finally{if(v===version)loading.value=false;}};
const created=async b=>{createOpen.value=false;books.value.unshift(b);bookID.value=b.ID;dayID.value=0;await loadBook();};
const saved=async warning=>{editor.value=null;notice.value=warning||'';await loadBook();};
const removeShift=async shift=>{if(!confirm('Удалить запись смены, сотрудников и работы? Материалы вернутся на склад.'))return;deleting.value=true;try{await api.delete(`/agreements/${agreementID.value}/work-orders/shifts/${shift.ID}`,{params:{version:shift.version}});await loadBook();}catch(e){error.value=workError(e);}finally{deleting.value=false;}};
const canLeave=()=>!editor.value||confirm('Покинуть книгу без сохранения открытой формы?');onBeforeRouteLeave(canLeave);onBeforeRouteUpdate(canLeave);
watch(()=>route.fullPath,()=>{importOpen.value=false;editor.value=null;book.value=null;dayID.value=0;bookID.value=0;createOpen.value=false;referencesOpen.value=false;notice.value='';load();},{immediate:true});onBeforeUnmount(()=>version++); // новый код chat: закрываем импорт при смене договора
</script>
<style scoped>
/* новый код chat: отметка учтённых работ в книге и поиске */
.accounted-row>td{background:#fce8e8;}
.work-order-page {font-size:13px;} :deep(.btn),:deep(.form-control),:deep(.form-select){font-size:13px;} :deep(label){font-weight:500;}
/* --------- новый код chat: подробная карточка смены, без скрытых данных */
.shift-summary { border: 1px solid #dfe5ed; border-radius: 10px; background: #fff; color: #212529; }
.shift-summary-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px; } /* новый код chat: компактная шапка */
.shift-summary-title { display: flex; align-items: center; gap: 10px; min-width: 0; }
.shift-title-line { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; } /* новый код chat */
.shift-summary-title h4 { margin: 0; font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
.shift-summary-icon { display: grid; place-items: center; flex-shrink: 0; width: 28px; height: 28px; border-radius: 7px; background: #edf4ff; color: #0d6efd; font-size: 15px; }
.shift-summary-actions { display: flex; gap: 8px; margin-left: auto; }
.shift-summary-totals { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 18px; padding: 6px 12px; border-top: 1px solid #edf0f4; border-bottom: 1px solid #edf0f4; background: #f8f9fb; font-size: 12px; } /* новый код chat */
.shift-summary-totals strong { margin-left: 5px; color: #000; font-weight: 600; }
.shift-hours-warning, .shift-hours-complete { margin-left: auto; border-radius: 20px; padding: 3px 9px; font-size: 12px; }
.shift-hours-warning { background: #fff3cd; color: #664d03; }
.shift-hours-complete { background: #edf8f1; color: #21653f; }
.shift-summary-content { display: grid; grid-template-columns: 260px minmax(0, 1fr); } /* новый код chat: больше места работам */
.shift-summary-employees, .shift-summary-works { min-width: 0; padding: 8px; }
.shift-summary-employees { border-right: 1px solid #edf0f4; }
.shift-summary-content h5 { font-size: 13px; font-weight: 600; margin: 0 0 8px; }
.shift-employee-table { width: 100%; border-collapse: collapse; }
.shift-employee-table th { color: #526174; font-size: 12px; font-weight: 500; padding-bottom: 6px; }
.shift-employee-table td { padding: 5px 0; border-top: 1px solid #edf0f4; vertical-align: top; overflow-wrap: anywhere; } /* новый код chat */
.shift-employee-table th:last-child, .shift-employee-table td:last-child { text-align: right; white-space: nowrap; padding-left: 12px; }
.shift-employee-table td:last-child { font-weight: 600; }
/* --------- новый код chat: все данные работ видны в строках, без отдельных карточек */
.saved-works-scroll { overflow:auto; max-height:65vh; }
.saved-works-table { width:100%; min-width:760px; table-layout:fixed; border-collapse:collapse; font-size:13px; }
.saved-works-table th { position:sticky; top:0; z-index:1; background:#f1f4f8; font-size:12px; font-weight:500; padding:7px 6px; box-shadow:0 1px #dfe5ed; }
.saved-works-table td { padding:7px 6px; vertical-align:top; overflow-wrap:anywhere; }
.saved-work-row td { border-top:1px solid #e5e9ef; }
.saved-work-name { white-space:pre-wrap; color:#111; }
.saved-material-row td { background:#f8fafc; padding-top:4px; padding-bottom:5px; }
.saved-materials { display:flex; flex-wrap:wrap; gap:4px 16px; font-size:12px; }
.saved-materials strong { margin-left:5px; font-weight:500; }
/* --------- конец нового кода chat */
@media (max-width: 991px) {
    .shift-summary-content { grid-template-columns: minmax(0, 1fr); }
    .shift-summary-employees { border-right: 0; border-bottom: 1px solid #edf0f4; }
}
@media (max-width: 575px) {
    .shift-summary-header, .shift-summary-employees, .shift-summary-works { padding: 10px; } /* новый код chat */
    .shift-summary-totals { padding: 6px 10px; gap: 6px 12px; }
    .shift-hours-warning, .shift-hours-complete { margin-left: 0; }
}
/* --------- конец нового кода chat */
</style>
<!-- --------- конец нового кода chat -->
