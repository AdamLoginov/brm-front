<!-- --------- новый код chat: редактирование одной смены с общим атомарным сохранением -->
<template><form class="border rounded-3 p-3 bg-light mt-3" @submit.prevent="save">
    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3"><h3 class="fs-6 m-0">{{ date }} · {{ shift ? 'Изменить смену' : 'Новая смена' }}</h3><button type="button" class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="cancel">Закрыть</button></div>
    <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
    <fieldset :disabled="busy" class="border-0 p-0">
        <div class="row g-2 mb-3"><div class="col-md-6"><label class="form-label">Цех</label><select v-model="form.workshop_id" :disabled="!!shift" required class="form-select form-select-sm"><option :value="0" disabled>Выберите цех</option><option v-for="s in refs.workshops" :key="s.ID" :value="s.ID">{{ s.name }}</option></select></div><div class="col-md-3"><label class="form-label">Смена</label><select v-model="form.number" :disabled="!!shift" class="form-select form-select-sm"><option :value="1">1 смена</option><option :value="2">2 смена</option></select></div></div>
        <!-- --------- новый код chat: выбираем сразу несколько сотрудников, часы редактируем в компактной таблице -->
        <section class="shift-employees border rounded-3 p-3 bg-white">
            <div class="d-flex flex-wrap gap-2 align-items-center mb-2">
                <strong id="shift-employees-label">Сотрудники <span class="text-secondary">{{ form.employees.length }}</span></strong>
                <button type="button" class="btn btn-outline-primary btn-sm ms-auto" :disabled="!form.employees.length" @click="fillEmployeeHours">Всем по 11 часов</button>
            </div>
            <MultiSelect v-model="selectedEmployeeIDs" :options="employeeOptions" label-key="label" plain-selection placeholder="Выберите сотрудников" search-placeholder="Поиск по ФИО" aria-labelledby="shift-employees-label" />
            <div v-if="form.employees.length" class="shift-employees-table table-responsive mt-3">
                <table class="table table-sm align-middle mb-0">
                    <thead><tr><th class="text-center" style="width:40px">№</th><th>Сотрудник</th><th style="width:110px">Часы</th><th style="width:40px"></th></tr></thead>
                    <tbody><tr v-for="(row,i) in form.employees" :key="row.employee_card_id">
                        <td class="text-center text-secondary">{{ i+1 }}</td>
                        <td>{{ employeeOptions.find(e=>e.ID===row.employee_card_id)?.label || 'Сотрудник' }}</td>
                        <td><QuantityInputComponent v-model="row.hours" required class="form-control form-control-sm" :aria-label="`Часы: ${employeeOptions.find(e=>e.ID===row.employee_card_id)?.label || row.employee_card_id}`" /></td>
                        <td><button type="button" class="btn btn-sm border-0 text-danger" aria-label="Убрать сотрудника из смены" @click="removeEmployee(i)"><i class="bi bi-x-lg"></i></button></td>
                    </tr></tbody>
                </table>
            </div>
            <div v-else class="text-secondary mt-2">Отметьте сотрудников в списке или нажмите «Выбрать все».</div>
        </section>
        <!-- --------- конец нового кода chat -->
        <div class="d-flex flex-wrap gap-3 border-top pt-3 mt-3"><span>Сотрудники: <strong>{{ quantityDisplay(employeeHours,2) }} ч</strong></span><span>Работы: <strong>{{ quantityDisplay(taskHours,2) }} ч</strong></span><span :class="taskHours>employeeHours?'text-danger':'text-warning-emphasis'">{{ hoursMessage }}</span></div>
        <WorkOrderTaskComponent v-for="(task,i) in form.tasks" :key="i" :task="task" :index="i" :refs="refs" :workshop-id="form.workshop_id" :materials="availableMaterials" @remove="form.tasks.splice(i,1)" />
        <!-- новый код chat: предупреждение о часах не блокирует сохранение -->
        <div class="d-flex flex-wrap gap-2 mt-3"><button type="button" class="btn btn-outline-primary btn-sm" :disabled="!form.workshop_id" @click="addTask">Добавить работу</button><button class="btn btn-primary btn-sm ms-auto">{{ busy?'Сохранение…':'Сохранить смену' }}</button></div>
    </fieldset>
</form></template>
<script setup>
import {reactive,ref,computed} from 'vue';import api from '../../../api';import MultiSelect from '../../MultiSelect.vue';import QuantityInputComponent from '../../QuantityInputComponent.vue';import WorkOrderTaskComponent from './WorkOrderTaskComponent.vue';import {workError,quantityText,quantityDisplay,scaledQuantity,employeeName} from './workOrderHelpers';
const props=defineProps({agreementId:[String,Number],dayId:Number,date:String,shift:Object,refs:Object,materials:Array});const emit=defineEmits(['saved','close']);const busy=ref(false),error=ref('');
const form=reactive({day_id:props.dayId,workshop_id:props.shift?.workshop_id||0,number:props.shift?.number||1,version:props.shift?.version||0,employees:(props.shift?.employees||[]).map(e=>({employee_card_id:e.employee_card_id,hours:quantityText(e.hours_hundredths,2)})),tasks:(props.shift?.tasks||[]).map(t=>({position_id:t.position_id,name:t.name,unit_id:t.unit_id,quantity:t.quantity_hundredths?quantityText(t.quantity_hundredths,2):'',hours:quantityText(t.hours_hundredths,2),materials:t.materials.map(m=>({material_id:m.material_id,quantity:quantityText(m.quantity_thousandths)}))}))}); // новый код chat: пустой объём остаётся пустым при редактировании
const initial=JSON.stringify(form);const cancel=()=>{if(JSON.stringify(form)===initial||confirm('Закрыть форму без сохранения изменений?'))emit('close');};
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
const addTask=()=>form.tasks.push({position_id:0,name:'',unit_id:0,quantity:'',hours:'',materials:[]});
const removeEmployee=i=>{if(confirm('Убрать сотрудника из смены?'))form.employees.splice(i,1);};
const save=async()=>{if(busy.value)return;busy.value=true;error.value='';try{const url=`/agreements/${props.agreementId}/work-orders/shifts`;const res=props.shift?await api.patch(`${url}/${props.shift.ID}`,form):await api.post(`${url}/create`,form);emit('saved',res.data.warning);}catch(e){error.value=workError(e);}finally{busy.value=false;}};
</script>
<style scoped>
/* --------- новый код chat: компактный список и защита формы во время сохранения */
.shift-employees-table { max-height: 360px; }
.shift-employees-table th { position: sticky; top: 0; background: #f8f9fa; z-index: 1; }
.shift-employees-table td { padding: 4px 8px; }
fieldset:disabled { pointer-events: none; }
/* --------- конец нового кода chat */
</style>
<!-- --------- конец нового кода chat -->
