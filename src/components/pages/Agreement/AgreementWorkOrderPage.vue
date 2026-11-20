<!-- --------- новый код chat: месячная книга, календарные дни и смены по цехам -->
<template><div class="work-order-page">
    <header class="d-flex flex-wrap gap-2 align-items-center mb-3"><h2 class="fs-5 me-auto mb-0">Книга наряд-заданий</h2><button class="btn btn-outline-secondary btn-sm" :disabled="!!editor" @click="referencesOpen=true">Цеха, блоки, позиции, единицы</button><button class="btn btn-primary btn-sm" :disabled="!!editor" @click="createOpen=true">Создать книгу</button></header>
    <div v-if="error" class="alert alert-danger" role="alert">{{ error }} <button class="btn btn-link btn-sm" @click="load">Повторить загрузку</button></div><div v-if="notice" class="alert alert-warning">{{ notice }}</div>
    <div class="border rounded-3 p-3 bg-white"><label class="form-label">Месячная книга</label><select v-model="bookID" :disabled="loading||!!editor" class="form-select form-select-sm" style="max-width:300px" @change="loadBook"><option :value="0" disabled>Выберите месяц</option><option v-for="b in books" :key="b.ID" :value="b.ID">{{ bookLabel(b) }}</option></select><div v-if="!books.length&&!loading" class="text-secondary mt-2">Создайте книгу для нужного месяца.</div></div>
    <div v-if="loading" class="p-3 text-secondary">Загрузка…</div>
    <template v-else-if="book">
        <div class="d-flex flex-wrap gap-1 my-3" aria-label="Дни книги"><button v-for="day in book.days" :key="day.ID" class="btn btn-sm" :class="dayID===day.ID?'btn-primary':hasEntries(day.ID)?'btn-outline-success':'btn-outline-secondary'" :disabled="!!editor" @click="dayID=day.ID">{{ Number(day.date.slice(-2)) }} <span v-if="hasEntries(day.ID)" aria-label="есть записи">•</span></button></div>
        <div class="d-flex align-items-center justify-content-between"><h3 class="fs-6 mb-0">{{ selectedDay?.date.split('-').reverse().join('.') }}</h3><button class="btn btn-outline-primary btn-sm" :disabled="!!editor||!selectedDay" @click="editor={shift:null,key:Date.now()}">Добавить цех / смену</button></div>
        <div v-if="!dayShifts.length&&!editor" class="text-secondary p-3 border rounded-3 mt-3">Записей за этот день нет.</div>
        <!-- --------- новый код chat: все данные сохранённой смены доступны без открытия формы -->
        <article v-for="shift in dayShifts" :key="shift.ID" class="shift-summary mt-3">
            <header class="shift-summary-header">
                <div class="shift-summary-title">
                    <span class="shift-summary-icon"><i class="bi bi-journal-text" aria-hidden="true"></i></span>
                    <div class="shift-title-line"><h4>{{ shopName(shift.workshop_id) }}</h4><span class="text-secondary">Смена № {{ shift.number }} · {{ selectedDay?.date.split('-').reverse().join('.') }}</span></div> <!-- новый код chat: компактная строка заголовка -->
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
                <span v-else class="shift-hours-complete"><i class="bi bi-check2 me-1" aria-hidden="true"></i>Часы распределены</span>
            </div>
            <div class="shift-summary-content">
                <section class="shift-summary-employees">
                    <h5><i class="bi bi-people me-2" aria-hidden="true"></i>Сотрудники и часы</h5>
                    <table v-if="shift.employees.length" class="shift-employee-table">
                        <thead><tr><th scope="col">Сотрудник</th><th scope="col">Часы</th></tr></thead>
                        <tbody><tr v-for="employee in shift.employees" :key="employee.ID"><td>{{ employee.employee_name }}<small v-if="!refs.employees.some(e=>e.ID===employee.employee_card_id)" class="d-block text-secondary">Больше не закреплён за договором</small></td><td>{{ quantityDisplay(employee.hours_hundredths,2) }}</td></tr></tbody>
                    </table>
                    <p v-else class="text-secondary mb-0">Сотрудники не указаны.</p>
                </section>
                <section class="shift-summary-works">
                    <h5><i class="bi bi-list-check me-2" aria-hidden="true"></i>Выполненные работы</h5>
                    <p v-if="!shift.tasks.length" class="text-secondary mb-0">Работы пока не добавлены.</p>
                    <article v-for="(task,index) in shift.tasks" :key="task.ID" class="shift-task-summary">
                        <div class="shift-task-heading">
                            <span class="shift-task-number">{{ index+1 }}</span>
                            <h6>{{ task.name }}</h6>
                            <div class="shift-task-metric"><span>Объём</span><strong>{{ quantityDisplay(task.quantity_hundredths,2) }} {{ unitName(task.unit_id) }}</strong></div>
                            <div class="shift-task-metric"><span>Человеко-часы</span><strong>{{ quantityDisplay(task.hours_hundredths,2) }}</strong></div>
                        </div>
                        <dl class="shift-task-location">
                            <div><dt>Блок</dt><dd>{{ taskBlockName(task.position_id) }}</dd></div>
                            <div><dt>Позиция</dt><dd>{{ taskPositionName(task.position_id) }}</dd></div>
                        </dl>
                        <div class="shift-task-materials">
                            <div class="shift-materials-title">Материалы <span>{{ task.materials.length }}</span></div> <!-- новый код chat: короткая подпись -->
                            <ul v-if="task.materials.length" class="shift-material-list">
                                <li v-for="usage in task.materials" :key="usage.ID"><span>{{ materialName(usage.material_id) }}</span><strong>{{ quantityDisplay(usage.quantity_thousandths) }} {{ materialUnitName(usage.material_id) }}</strong></li>
                            </ul>
                            <span v-else class="text-secondary">Материалы не использовались.</span>
                        </div>
                    </article>
                </section>
            </div>
        </article>
        <!-- --------- конец нового кода chat -->
        <WorkOrderShiftComponent v-if="editor&&selectedDay" :key="editor.key" :agreement-id="agreementID" :day-id="dayID" :date="selectedDay.date" :shift="editor.shift" :refs="refs" :materials="materials" @close="editor=null" @saved="saved" />
    </template>
    <WorkOrderBookModal v-if="createOpen" :agreement-id="agreementID" @close="createOpen=false" @created="created" />
    <WorkOrderReferenceModal v-if="referencesOpen" :agreement-id="agreementID" :refs="refs" @close="referencesOpen=false" @changed="loadReferences" />
</div></template>
<script setup>
import {ref,computed,watch,onBeforeUnmount} from 'vue';import {useRoute,onBeforeRouteLeave,onBeforeRouteUpdate} from 'vue-router';import api from '../../../api';import WorkOrderBookModal from './WorkOrderBookModal.vue';import WorkOrderReferenceModal from './WorkOrderReferenceModal.vue';import WorkOrderShiftComponent from './WorkOrderShiftComponent.vue';import {emptyWorkReferences,quantityDisplay,workError} from './workOrderHelpers';
const route=useRoute(),agreementID=computed(()=>String(route.params.id));const refs=ref(emptyWorkReferences()),books=ref([]),materials=ref([]),book=ref(null),bookID=ref(0),dayID=ref(0),editor=ref(null),error=ref(''),notice=ref(''),loading=ref(false),deleting=ref(false),createOpen=ref(false),referencesOpen=ref(false);let version=0;
const bookLabel=b=>new Date(b.year,b.month-1,1).toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
const selectedDay=computed(()=>book.value?.days.find(d=>d.ID===dayID.value));const dayShifts=computed(()=>book.value?.shifts.filter(s=>s.day_id===dayID.value)||[]);
const hasEntries=id=>book.value?.shifts.some(s=>s.day_id===id);const shopName=id=>refs.value.workshops.find(s=>s.ID===id)?.name||'Цех';const sumHours=(rows,key)=>rows.reduce((s,r)=>s+r[key],0);
// --------- новый код chat: названия справочников для подробного просмотра смены
const unitName = id => refs.value.units.find(unit => unit.ID === id)?.name || '—';
const taskBlockName = positionID => {
    const position = refs.value.positions.find(row => row.ID === positionID);
    return refs.value.blocks.find(block => block.ID === position?.block_id)?.name || '—';
};
const taskPositionName = id => {
    const position = refs.value.positions.find(row => row.ID === id);
    return position ? `№ ${position.number} · ${position.name}` : '—';
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
watch(()=>route.fullPath,()=>{editor.value=null;book.value=null;dayID.value=0;bookID.value=0;createOpen.value=false;referencesOpen.value=false;notice.value='';load();},{immediate:true});onBeforeUnmount(()=>version++);
</script>
<style scoped>
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
.shift-summary-content { display: grid; grid-template-columns: minmax(220px, .7fr) minmax(0, 2.3fr); } /* новый код chat: больше места работам */
.shift-summary-employees, .shift-summary-works { min-width: 0; padding: 10px 12px; }
.shift-summary-employees { border-right: 1px solid #edf0f4; }
.shift-summary-content h5 { font-size: 13px; font-weight: 600; margin: 0 0 8px; }
.shift-employee-table { width: 100%; border-collapse: collapse; }
.shift-employee-table th { color: #526174; font-size: 12px; font-weight: 500; padding-bottom: 6px; }
.shift-employee-table td { padding: 5px 0; border-top: 1px solid #edf0f4; vertical-align: top; overflow-wrap: anywhere; } /* новый код chat */
.shift-employee-table th:last-child, .shift-employee-table td:last-child { text-align: right; white-space: nowrap; padding-left: 12px; }
.shift-employee-table td:last-child { font-weight: 600; }
.shift-task-summary { border: 1px solid #e5e9ef; border-radius: 8px; padding: 8px 10px; } /* новый код chat: плотная карточка работы */
.shift-task-summary + .shift-task-summary { margin-top: 8px; }
.shift-task-heading { display: grid; grid-template-columns: 24px minmax(0, 1fr) auto auto; align-items: baseline; gap: 10px; }
.shift-task-number { display: grid; place-items: center; height: 25px; border-radius: 6px; background: #f1f4f8; font-size: 12px; }
.shift-task-heading h6 { margin: 0; font-size: 13px; line-height: 1.4; font-weight: 600; overflow-wrap: anywhere; white-space: pre-wrap; }
.shift-task-metric { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: baseline; gap: 4px 6px; text-align: right; } /* новый код chat: подпись рядом со значением */
.shift-task-metric span { font-size: 11px; color: #526174; }
.shift-task-metric strong { font-weight: 600; overflow-wrap: anywhere; }
.shift-task-location { display: flex; flex-wrap: wrap; gap: 4px 18px; margin: 6px 0; padding: 5px 8px; border-radius: 5px; background: #f8f9fb; font-size: 12px; } /* новый код chat */
.shift-task-location > div { display: flex; align-items: baseline; gap: 7px; min-width: 0; }
.shift-task-location dt { font-size: 12px; font-weight: 400; color: #526174; flex-shrink: 0; }
.shift-task-location dd { margin: 0; overflow-wrap: anywhere; }
.shift-task-materials { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 6px 12px; border-top: 1px solid #edf0f4; padding-top: 6px; font-size: 12px; } /* новый код chat: материалы рядом с подписью */
.shift-materials-title { font-weight: 500; }
.shift-materials-title span { color: #65738a; margin-left: 5px; }
.shift-material-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 4px 18px; } /* новый код chat: две колонки при достаточной ширине */
.shift-material-list li { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
.shift-material-list li > span { overflow-wrap: anywhere; }
.shift-material-list strong { font-weight: 500; text-align: right; flex-shrink: 0; }
@media (max-width: 991px) {
    .shift-summary-content { grid-template-columns: minmax(0, 1fr); }
    .shift-summary-employees { border-right: 0; border-bottom: 1px solid #edf0f4; }
}
@media (max-width: 575px) {
    .shift-summary-header, .shift-summary-employees, .shift-summary-works { padding: 10px; } /* новый код chat */
    .shift-summary-totals { padding: 6px 10px; gap: 6px 12px; }
    .shift-task-materials { grid-template-columns: minmax(0, 1fr); }
    .shift-hours-warning, .shift-hours-complete { margin-left: 0; }
    .shift-task-heading { grid-template-columns: 26px minmax(0, 1fr); gap: 8px; }
    .shift-task-metric { grid-column: 2; display: flex; justify-content: space-between; gap: 10px; text-align: left; }
    .shift-task-metric span { margin: 0; }
}
/* --------- конец нового кода chat */
</style>
<!-- --------- конец нового кода chat -->
