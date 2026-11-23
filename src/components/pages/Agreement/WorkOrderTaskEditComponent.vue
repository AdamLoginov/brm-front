<!-- --------- новый код chat: редактирование одной работы внутри окна расшифровки -->
<template>
    <form class="border rounded-3 p-3 mt-3 bg-light" @submit.prevent="save">
        <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
        <fieldset :disabled="busy" class="border-0 p-0">
            <h3 class="fs-6">Изменить работу</h3>
            <div class="row g-2">
                <div class="col-12"><label class="form-label">Наименование работы</label><textarea v-model="form.name" required maxlength="500" class="form-control form-control-sm" rows="2"></textarea></div>
                <div class="col-sm-4"><label class="form-label">Единица</label><select v-model="form.unit_id" class="form-select form-select-sm"><option :value="0">—</option><option v-for="unit in refs.units" :key="unit.ID" :value="unit.ID">{{ unit.name }}</option></select></div>
                <div class="col-sm-4"><label class="form-label">Объём</label><QuantityInputComponent v-model="form.quantity" :precision="form.quantity_precision" class="form-control form-control-sm" placeholder="—" /></div>
                <div class="col-sm-4"><label class="form-label">Чел.-ч</label><QuantityInputComponent v-model="form.hours" class="form-control form-control-sm" placeholder="—" /></div>
                <div class="col-sm-6"><label class="form-label">Позиция</label><select v-model="form.position_id" class="form-select form-select-sm" @change="selectPosition"><option :value="0">—</option><option v-for="position in positions" :key="position.ID" :value="position.ID">{{ position.number }} · {{ position.name }}</option></select></div>
                <div class="col-sm-6"><label class="form-label">Блок</label><select v-model="form.block_id" class="form-select form-select-sm" @change="form.position_id=0"><option :value="0">—</option><option v-for="block in blocks" :key="block.ID" :value="block.ID">{{ block.name }}</option></select></div>
                <div class="col-12"><label class="d-flex gap-2 align-items-center"><input v-model="form.accounted" type="checkbox" class="form-check-input m-0">Учтён</label></div>
            </div>
            <h4 class="fs-6 mt-3">Материалы</h4>
            <div v-for="(usage,index) in form.materials" :key="index" class="d-flex gap-2 mb-2">
                <select v-model="usage.material_id" required class="form-select form-select-sm" aria-label="Материал"><option :value="0" disabled>Выберите материал</option><option v-for="material in availableMaterials" :key="material.ID" :value="material.ID">{{ material.name }} · доступно {{ quantityDisplay(material.available) }} {{ unitName(material.unit_id) }}</option></select>
                <QuantityInputComponent v-model="usage.quantity" :precision="3" required class="form-control form-control-sm material-quantity" aria-label="Количество материала" />
                <button type="button" class="btn btn-outline-danger btn-sm" aria-label="Убрать материал" @click="removeMaterial(index)">×</button>
            </div>
            <button type="button" class="btn btn-link btn-sm p-0" @click="form.materials.push({material_id:0,quantity:''})">+ Материал</button>
            <div class="d-flex gap-2 mt-3"><button type="submit" class="btn btn-primary btn-sm">{{ busy?'Сохранение…':'Сохранить' }}</button><button type="button" class="btn btn-outline-secondary btn-sm" @click="$emit('cancel')">Отмена</button></div>
        </fieldset>
    </form>
</template>
<script setup>
import {reactive,ref,computed} from 'vue';
import api from '../../../api';
import QuantityInputComponent from '../../QuantityInputComponent.vue';
import {quantityText,quantityDisplay,workError,workQuantity} from './workOrderHelpers'; // новый код chat: объёмы до тысячных
const props=defineProps({agreementId:[String,Number],row:Object,refs:Object,materials:Array});
const emit=defineEmits(['saved','cancel','busy']);
const busy=ref(false),error=ref('');
const task=props.row.task;
const form=reactive({name:task.name,accounted:!!task.accounted,unit_id:task.unit_id,quantity_precision:workQuantity(task)%10 ? 3 : 2,quantity:workQuantity(task)?quantityText(workQuantity(task),3):'',hours:task.hours_not_specified?'':quantityText(task.hours_hundredths,2),block_id:task.block_id||props.refs.positions.find(p=>p.ID===task.position_id)?.block_id||0,position_id:task.position_id,materials:(task.materials||[]).map(m=>({material_id:m.material_id,quantity:quantityText(m.quantity_thousandths)}))});
const version=props.row.shift.version;
const blocks=computed(()=>props.refs.blocks.filter(b=>b.workshop_id===props.row.shift.workshop_id));
const positions=computed(()=>props.refs.positions.filter(p=>blocks.value.some(b=>b.ID===p.block_id)));
const selectPosition=()=>{if(form.position_id)form.block_id=positions.value.find(p=>p.ID===form.position_id)?.block_id||0;};
const unitName=id=>props.refs.units.find(u=>u.ID===id)?.name||'—';
const availableMaterials=computed(()=>props.materials.filter(m=>m.workshop_id===props.row.shift.workshop_id).map(m=>({...m,available:m.balance+(task.materials||[]).filter(u=>u.material_id===m.ID).reduce((sum,u)=>sum+u.quantity_thousandths,0)})));
const removeMaterial=index=>{if(confirm('Убрать материал из работы? Изменение применится после сохранения.'))form.materials.splice(index,1);};
const save=async()=>{
    if(busy.value)return;busy.value=true;emit('busy',true);error.value='';
    // --------- новый код chat: исключаем служебную точность без изменения формы и объёма
    try{
        const {quantity_precision,...payload}=form;
        const {data}=await api.patch(`/agreements/${props.agreementId}/work-orders/tasks/${task.ID}`,{version,task:payload});
        emit('saved',data);
    }
    // --------- конец нового кода chat
    catch(e){error.value=workError(e);}finally{busy.value=false;emit('busy',false);}
};
</script>
<style scoped>.material-quantity{max-width:110px;}.form-label{margin-bottom:4px;}</style>
<!-- --------- конец нового кода chat -->
