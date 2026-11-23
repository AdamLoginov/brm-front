<!-- --------- новый код chat: редактирование одной смены с общим атомарным сохранением -->
<!-- --------- новый код chat: компактный журнал смены — люди слева, работы справа -->
<template><form ref="editorElement" class="shift-editor mt-3" @submit.prevent="save">
    <div class="shift-editor-heading">
        <h3 class="fs-6 mb-0">{{ date.split('-').reverse().join('.') }} · {{ shift ? 'Изменить смену' : 'Новая смена' }}</h3> <!-- новый код chat: привычный формат даты -->
        <button type="button" class="btn btn-outline-secondary btn-sm ms-auto" :disabled="busy||copyingEmployees" @click="cancel">Закрыть</button>
    </div>
    <div v-if="error" class="alert alert-danger m-2" role="alert">{{ error }}</div>
    <fieldset :disabled="busy||copyingEmployees" class="border-0 p-0">
        <div class="shift-editor-settings">
            <label class="form-label mb-0" for="work-editor-shop">Цех</label><select id="work-editor-shop" v-model="form.workshop_id" :disabled="!!shift" required class="form-select form-select-sm"><option :value="0" disabled>Выберите цех</option><option v-for="s in refs.workshops" :key="s.ID" :value="s.ID">{{ s.name }}</option></select>
            <label class="form-label mb-0" for="work-editor-number">Смена</label><select id="work-editor-number" v-model="form.number" :disabled="!!shift" class="form-select form-select-sm"><option :value="1">1 смена</option><option :value="2">2 смена</option></select>
            <small class="text-secondary">Tab — следующее поле · Объём, единица, часы работы, блок и позиция необязательны</small>
        </div>
        <div class="shift-editor-columns">
            <section class="shift-employees">
                <!-- --------- новый код chat: компактные действия рядом с заголовком сотрудников -->
                <div class="shift-section-heading employee-heading">
                    <strong id="shift-employees-label">Сотрудники · {{ form.employees.length }}</strong>
                    <div class="employee-heading-actions">
                        <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="!form.workshop_id" title="Добавить сотрудников и их часы за предыдущий календарный день для этого цеха и номера смены" @click="copyPreviousEmployees">{{ copyingEmployees ? 'Загрузка…' : 'С прошлого дня' }}</button>
                        <button type="button" class="btn btn-outline-primary btn-sm" :disabled="!form.employees.length" @click="fillEmployeeHours">Всем 11 ч</button>
                    </div>
                </div>
                <small v-if="copyNotice" class="d-block px-2 pb-2 text-secondary" role="status">{{ copyNotice }}</small>
                <!-- --------- конец нового кода chat -->
                <div class="px-2 pb-2"><MultiSelect v-model="selectedEmployeeIDs" :options="employeeOptions" :label-key="option=>shortEmployeeName(option.ID)" search-key="label" plain-selection placeholder="Выберите сотрудников" search-placeholder="Поиск по ФИО" aria-labelledby="shift-employees-label" /></div> <!-- новый код chat: фамилия и инициалы, поиск по полному ФИО -->
                <div v-if="form.employees.length" class="shift-employees-table">
                    <table class="table table-sm align-middle mb-0">
                        <thead><tr><th class="text-center" style="width:28px">№</th><th>Сотрудник</th><th style="width:66px">Часы</th><th style="width:28px"></th></tr></thead>
                        <tbody><tr v-for="(row,i) in form.employees" :key="row.employee_card_id">
                            <td class="text-center text-secondary">{{ i+1 }}</td>
                            <td :title="employeeOptions.find(e=>e.ID===row.employee_card_id)?.label">{{ shortEmployeeName(row.employee_card_id) }}</td>
                            <td><QuantityInputComponent v-model="row.hours" required class="form-control form-control-sm" :aria-label="`Часы: ${employeeOptions.find(e=>e.ID===row.employee_card_id)?.label || row.employee_card_id}`" /></td>
                            <td><button type="button" class="btn btn-sm border-0 text-danger p-1" aria-label="Убрать сотрудника из смены" @click="removeEmployee(i)"><i class="bi bi-x-lg"></i></button></td>
                        </tr></tbody>
                    </table>
                </div>
                <p v-else class="text-secondary px-2 mb-2">Выберите сотрудников для этой смены.</p>
            </section>
            <section class="shift-works">
                <div class="shift-section-heading"><strong>Работы · {{ form.tasks.length }}</strong></div> <!-- новый код chat: добавление строки только снизу -->
                <div class="shift-works-scroll">
                    <table class="shift-works-table">
                        <!-- новый код chat: позиция перед блоком, часы по центру -->
                        <colgroup><col style="width:32px"><col><col style="width:72px"><col style="width:78px"><col style="width:78px"><col style="width:150px"><col style="width:80px"><col style="width:150px"></colgroup> <!-- новый код chat: действия в одну строку за счёт ширины названия -->
                        <thead><tr><th>№</th><th>Наименование работы</th><th>Ед.</th><th>Объём</th><th class="text-center" title="Человеко-часы">Чел.-ч</th><th>Позиция</th><th>Блок</th><th>Действия</th></tr></thead>
                        <tbody><WorkOrderTaskComponent v-for="(task,i) in form.tasks" :key="taskKey(task)" :task="task" :index="i" :refs="refs" :workshop-id="form.workshop_id" :materials="availableMaterials" @remove="form.tasks.splice(i,1)" @duplicate="duplicateTask(i)" /></tbody>
                    </table>
                </div>
                <p v-if="!form.tasks.length" class="text-secondary p-3 mb-0">Добавьте строку и введите работу. Материалы добавляются кнопкой <i class="bi bi-box-seam" aria-hidden="true"></i> в её строке.</p>
                <button type="button" class="btn btn-link btn-sm text-decoration-none m-1" :disabled="!form.workshop_id" @click="addTask">+ Добавить строку</button> <!-- новый код chat: видна и при пустом списке работ -->
            </section>
        </div>
        <footer class="shift-save-bar">
            <div class="shift-hours-totals"><span>Сотрудники <strong>{{ quantityDisplay(employeeHours,2) }} ч</strong></span><span>Работы <strong>{{ quantityDisplay(taskHours,2) }} чел.-ч</strong></span><small :class="taskHours>employeeHours?'text-danger':taskHours<employeeHours?'text-warning-emphasis':'text-success'">{{ hoursMessage }}</small></div>
            <button class="btn btn-primary btn-sm ms-auto">{{ busy?'Сохранение…':'Сохранить смену' }}</button>
        </footer>
    </fieldset>
</form></template>
<script setup>
import {reactive,ref,computed,nextTick} from 'vue';import api from '../../../api';import MultiSelect from '../../MultiSelect.vue';import QuantityInputComponent from '../../QuantityInputComponent.vue';import WorkOrderTaskComponent from './WorkOrderTaskComponent.vue';import {workError,quantityText,quantityDisplay,scaledQuantity,employeeName,workQuantity} from './workOrderHelpers'; // новый код chat: объёмы до тысячных
const props=defineProps({agreementId:[String,Number],dayId:Number,date:String,shift:Object,refs:Object,materials:Array});const emit=defineEmits(['saved','close']);const busy=ref(false),error=ref('');
const form=reactive({day_id:props.dayId,workshop_id:props.shift?.workshop_id||0,number:props.shift?.number||1,version:props.shift?.version||0,employees:(props.shift?.employees||[]).map(e=>({employee_card_id:e.employee_card_id,hours:quantityText(e.hours_hundredths,2)})),tasks:(props.shift?.tasks||[]).map(t=>({block_id:t.block_id||props.refs.positions.find(p=>p.ID===t.position_id)?.block_id||0,position_id:t.position_id,accounted:!!t.accounted,name:t.name,unit_id:t.unit_id,quantity_precision:workQuantity(t)%10 ? 3 : 2,quantity:workQuantity(t)?quantityText(workQuantity(t),3):'',hours:t.hours_not_specified?'':quantityText(t.hours_hundredths,2),materials:t.materials.map(m=>({material_id:m.material_id,quantity:quantityText(m.quantity_thousandths)}))}))}); // новый код chat: пустой объём остаётся пустым при редактировании
const initial=JSON.stringify(form);const cancel=()=>{if(JSON.stringify(form)===initial||confirm('Закрыть форму без сохранения изменений?'))emit('close');};
// --------- новый код chat: копирование работает и через границу месяца, без дублей и потери введённых часов
const copyingEmployees=ref(false),copyNotice=ref('');
const copyPreviousEmployees=async()=>{
    if(busy.value||copyingEmployees.value||!form.workshop_id)return;
    copyingEmployees.value=true;copyNotice.value='';error.value='';
    try{
        const [year,month,day]=props.date.split('-').map(Number);
        const previous=new Date(Date.UTC(year,month-1,day-1));
        const previousDate=previous.toISOString().slice(0,10);
        const label=previousDate.split('-').reverse().join('.');
        const response=await api.get(`/agreements/${props.agreementId}/work-orders`);
        const previousBook=response.data.find(book=>book.year===previous.getUTCFullYear()&&book.month===previous.getUTCMonth()+1);
        if(!previousBook){copyNotice.value=`Нет книги за месяц предыдущего дня (${label}).`;return;}
        const {data:detail}=await api.get(`/agreements/${props.agreementId}/work-orders/books/${previousBook.ID}`);
        const previousDay=detail.days.find(row=>row.date===previousDate);
        const source=detail.shifts.find(row=>row.day_id===previousDay?.ID&&row.workshop_id===form.workshop_id&&row.number===form.number);
        if(!source?.employees.length){copyNotice.value=`За ${label} нет сотрудников в этом цехе и смене № ${form.number}.`;return;}
        const current=new Set(props.refs.employees.map(row=>row.ID));
        const existing=new Set(form.employees.map(row=>row.employee_card_id));
        let added=0,skipped=0;
        for(const employee of source.employees){
            if(existing.has(employee.employee_card_id))continue;
            if(!current.has(employee.employee_card_id)){skipped++;continue;}
            form.employees.push({employee_card_id:employee.employee_card_id,hours:quantityText(employee.hours_hundredths,2)});
            existing.add(employee.employee_card_id);added++;
        }
        copyNotice.value=`За ${label} добавлено сотрудников: ${added}. Их часы можно изменить. Ранее введённые строки сохранены.${skipped?` Пропущено больше не закреплённых за договором: ${skipped}.`:''}`;
    }catch(e){error.value=workError(e);}finally{copyingEmployees.value=false;}
};
// --------- конец нового кода chat
const employeeOptions=computed(()=>{const rows=new Map(props.refs.employees.map(e=>[e.ID,{ID:e.ID,label:employeeName(e)}]));for(const e of props.shift?.employees||[])if(!rows.has(e.employee_card_id))rows.set(e.employee_card_id,{ID:e.employee_card_id,label:e.employee_name+' (переведён)'});return [...rows.values()].sort((a,b)=>a.label.localeCompare(b.label,'ru'));});
// --------- новый код chat: смена выбора сохраняет часы оставшихся сотрудников
const selectedEmployeeIDs = computed({
    get: () => form.employees.map(row => row.employee_card_id),
    set: ids => {
        if (busy.value) return;
        const existing = new Map(form.employees.map(row => [row.employee_card_id, row]));
        const selected = new Set(ids);
        form.employees = employeeOptions.value.filter(option => selected.has(option.ID)).map(option => existing.get(option.ID) || { employee_card_id: option.ID, hours: '' });
    }
});
const fillEmployeeHours = () => { form.employees.forEach(row => { row.hours = '11'; }); };
// --------- конец нового кода chat
const employeeHours=computed(()=>form.employees.reduce((sum,e)=>sum+(scaledQuantity(e.hours)||0),0));const taskHours=computed(()=>form.tasks.reduce((sum,t)=>sum+(scaledQuantity(t.hours)||0),0));
const hoursMessage=computed(()=>taskHours.value>employeeHours.value?'Часы работ превышают часы сотрудников. Можно сохранить.':taskHours.value<employeeHours.value?'Распределены не все часы. Можно сохранить.':'Часы распределены полностью'); // новый код chat
const availableMaterials=computed(()=>props.materials.filter(m=>m.workshop_id===form.workshop_id).map(m=>({...m,available:m.balance+(props.shift?.tasks||[]).flatMap(t=>t.materials).filter(u=>u.material_id===m.ID).reduce((s,u)=>s+u.quantity_thousandths,0)})));
// --------- новый код chat: независимые копии строк и устойчивые ключи при удалении
const editorElement=ref(null),taskKeys=new WeakMap();let nextTaskKey=0;
const taskKey=task=>{if(!taskKeys.has(task))taskKeys.set(task,++nextTaskKey);return taskKeys.get(task);};
const focusTask=async index=>{await nextTick();editorElement.value?.querySelectorAll('.work-task-name-input')[index]?.focus();};
const addTask=()=>{form.tasks.push({block_id:0,position_id:0,accounted:false,name:'',unit_id:0,quantity:'',hours:'',materials:[]});focusTask(form.tasks.length-1);};
const duplicateTask=index=>{const source=form.tasks[index];form.tasks.splice(index+1,0,{...source,materials:source.materials.map(row=>({...row}))});focusTask(index+1);};
const shortEmployeeName=id=>{
    const label=employeeOptions.value.find(e=>e.ID===id)?.label||'Сотрудник';
    const suffix=label.includes(' (переведён)')?' (переведён)':'';
    const parts=label.replace(' (переведён)','').trim().split(/\s+/);
    return [parts[0],...parts.slice(1).map(part=>part[0]+'.')].join(' ')+suffix;
};
// --------- конец нового кода chat
const removeEmployee=i=>{if(confirm('Убрать сотрудника из смены?'))form.employees.splice(i,1);};
const save=async()=>{if(busy.value)return;busy.value=true;error.value='';try{const url=`/agreements/${props.agreementId}/work-orders/shifts`;const res=props.shift?await api.patch(`${url}/${props.shift.ID}`,form):await api.post(`${url}/create`,form);emit('saved',res.data.warning);}catch(e){error.value=workError(e);}finally{busy.value=false;}};
</script>
<style scoped>
/* --------- новый код chat: плотная таблица ввода и закреплённое сохранение */
.shift-editor { border:1px solid #dfe5ed; border-radius:10px; background:#fff; font-size:13px; }
.shift-editor-heading,.shift-editor-settings,.shift-section-heading { display:flex; align-items:center; gap:8px; padding:10px; }
.shift-editor-settings { flex-wrap:wrap; border-top:1px solid #edf0f4; border-bottom:1px solid #edf0f4; background:#f8fafc; }
.shift-editor-settings select { width:auto; max-width:230px; }
.shift-editor-settings small { margin-left:auto; }
.shift-editor-columns { display:grid; grid-template-columns:285px minmax(0,1fr); align-items:start; }
.shift-employees { border-right:1px solid #e5e9ef; min-width:0; }
/* --------- новый код chat: открытый список занимает место в блоке и не обрезается областью страницы */
.shift-employees :deep(.multi-select-dropdown) { position:relative; top:auto; left:auto; margin-top:6px; max-height:min(300px, 50vh); z-index:1; }
/* --------- конец нового кода chat */
.shift-works { min-width:0; }
.shift-section-heading { padding:8px; min-height:48px; border-bottom:1px solid #edf0f4; margin-bottom:6px; }
/* --------- новый код chat: обе кнопки помещаются в узкой колонке сотрудников */
.employee-heading { gap:4px; flex-wrap:wrap; min-height:40px; }
.employee-heading strong { font-size:12px; white-space:nowrap; }
.employee-heading-actions { display:flex; gap:4px; margin-left:auto; }
.employee-heading-actions .btn { font-size:11px; padding:3px 5px; line-height:1.3; white-space:nowrap; }
/* --------- конец нового кода chat */
.shift-employees-table { max-height:65vh; overflow:auto; }
.shift-employees-table th { position:sticky; top:0; background:#f8fafc; z-index:1; font-size:12px; font-weight:500; }
.shift-employees-table td { padding:4px; }
.shift-employees-table tr:focus-within td { background:#f0f6ff; }
.shift-employees-table :deep(.form-control) { padding:4px; font-size:13px; min-height:32px; }
.shift-works-scroll { overflow:auto; max-height:65vh; }
.shift-works-table { width:100%; min-width:820px; table-layout:fixed; border-collapse:collapse; } /* новый код chat: уменьшаем минимальную ширину формы */
.shift-works-table th { position:sticky; top:0; z-index:2; text-align:left; padding:7px 4px; font-size:12px; font-weight:500; background:#f1f4f8; box-shadow:0 1px #dfe5ed; }
.shift-save-bar { position:sticky; bottom:0; z-index:5; display:flex; flex-wrap:wrap; align-items:center; gap:10px; padding:10px 12px; background:#fff; border-top:1px solid #dfe5ed; border-radius:0 0 10px 10px; box-shadow:0 -3px 12px #172a4610; }
.shift-hours-totals { display:flex; flex-wrap:wrap; gap:5px 16px; align-items:center; }
.shift-hours-totals small { flex-basis:100%; font-size:12px; }
fieldset:disabled { pointer-events:none; }
@media (max-width:1199px) {
    .shift-editor-columns { grid-template-columns:minmax(0,1fr); }
    .shift-employees { border-right:0; border-bottom:1px solid #e5e9ef; }
    .shift-employees-table { max-height:260px; }
    .shift-editor-settings small { width:100%; margin-left:0; }
}
/* --------- конец нового кода chat */
</style>
<!-- --------- конец нового кода chat -->
