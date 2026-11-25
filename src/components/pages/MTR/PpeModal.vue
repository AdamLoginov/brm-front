<!-- --------- новый код chat: одна вещь СИЗ, размер, категория, цена и ответственный -->
<template>
    <Teleport to="body">
        <div ref="element" class="modal ppe-modal" tabindex="-1" aria-labelledby="ppe-title" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <form class="modal-content rounded-3" @submit.prevent="save">
                    <div class="modal-header"><h2 id="ppe-title" class="modal-title">{{ recordID ? 'Изменить СИЗ' : 'Добавить СИЗ' }}</h2><button type="button" class="btn-close" :disabled="busy" aria-label="Закрыть" @click="close"></button></div>
                    <div class="modal-body">
                        <div v-if="error" class="alert alert-danger py-2" role="alert">{{ error }}</div>
                        <fieldset :disabled="busy" class="border-0 p-0 m-0">
                            <div class="row g-3">
                                <div class="col-12"><label for="ppe-name" class="form-label">Наименование</label><input id="ppe-name" v-model="form.name" required maxlength="500" class="form-control form-control-sm"></div>
                                <div class="col-sm-6"><label for="ppe-size" class="form-label">Размер</label><input id="ppe-size" v-model="form.size" maxlength="100" placeholder="48–50, XL, 42" class="form-control form-control-sm"></div>
                                <div class="col-sm-6"><label for="ppe-category" class="form-label">Категория</label><select id="ppe-category" v-model="form.category" required class="form-select form-select-sm"><option value="" disabled>Выберите категорию</option><option value="summer">Летняя</option><option value="winter">Зимняя</option><option value="demiseason">Демисезонная</option></select></div>
                                <div class="col-12"><label for="ppe-price" class="form-label">Цена, ₽</label><MoneyInputComponent id="ppe-price" v-model="form.price" required class="form-control form-control-sm" /></div>
                                <div class="col-12"><label for="ppe-agreement" class="form-label">Договор</label><select id="ppe-agreement" v-model="form.agreement_id" :disabled="!!agreementId" required class="form-select form-select-sm"><option :value="null" disabled>Выберите договор</option><option v-for="agreement in agreements" :key="agreement.ID" :value="agreement.ID">{{ agreement.short_name || agreement.name || 'Договор № '+agreement.ID }}</option><option v-if="form.agreement_id && !agreements.some(item=>item.ID===form.agreement_id)" :value="form.agreement_id">Договор № {{ form.agreement_id }}</option></select></div>
                                <div class="col-12">
                                    <div class="form-label">Ответственный сотрудник</div>
                                    <div v-if="busy" class="form-control form-control-sm">{{ selectedLabel }}</div>
                                    <MultiSelect v-else v-model="selectedEmployee" :options="availableEmployees" :multiple="false" :plain-selection="true" :label-key="employeeLabel" placeholder="Не закреплён" search-placeholder="Поиск по ФИО" />
                                    <button v-if="form.employee_card_id" type="button" class="btn btn-sm btn-link p-0 mt-1" @click="form.employee_card_id=null">Снять закрепление</button>
                                </div>
                            </div>
                        </fieldset>
                    </div>
                    <div class="modal-footer"><button type="button" class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="close">Отмена</button><button type="submit" class="btn btn-primary btn-sm" :disabled="busy">{{ busy ? 'Сохранение…' : 'Сохранить' }}</button></div>
                </form>
            </div>
        </div>
    </Teleport>
</template>
<script setup>
// --------- новый код chat: денежное поле передаёт строку, без float-преобразования
import { computed, reactive, ref, onBeforeUnmount } from 'vue';
import { Modal } from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import api from '../../../api';
import MoneyInputComponent from '../../MoneyInputComponent.vue';
import MultiSelect from '../../MultiSelect.vue';
const props=defineProps({agreementId:{type:[Number,String],default:null},agreements:{type:Array,default:()=>[]},employees:{type:Array,default:()=>[]}});
const emit=defineEmits(['saved']);
const element=ref(null),recordID=ref(null),busy=ref(false),error=ref('');
const form=reactive({name:'',size:'',category:'',price:'0',agreement_id:null,employee_card_id:null});
let modal,disposed=false;
const employeeLabel=employee=>[employee.surname,employee.name,employee.middle_name].filter(Boolean).join(' ') || `Сотрудник № ${employee.ID}`;
const availableEmployees=computed(()=>props.employees.filter(row=>!row.status).sort((a,b)=>employeeLabel(a).localeCompare(employeeLabel(b),'ru')));
const selectedEmployee=computed({get:()=>form.employee_card_id?[form.employee_card_id]:[],set:ids=>{form.employee_card_id=ids[0]||null;}});
const selectedLabel=computed(()=>{const employee=props.employees.find(row=>row.ID===form.employee_card_id);return employee?employeeLabel(employee):'Не закреплён';});
const open=(row=null)=>{
    if(busy.value)return;
    recordID.value=row?.ID||null;error.value='';
    const cents=BigInt(row?.price_kopecks||0);
    Object.assign(form,{name:row?.name||'',size:row?.size||'',category:row?.category||'',price:`${cents/100n}.${String(cents%100n).padStart(2,'0')}`,agreement_id:props.agreementId?Number(props.agreementId):row?.agreement_id||null,employee_card_id:row?.employee_card_id||null});
    modal ||= new Modal(element.value,{backdrop:'static',keyboard:false});modal.show();
};
const close=()=>{if(!busy.value)modal?.hide();};
const save=async()=>{
    if(busy.value)return;
    const price=String(form.price).trim().replace(',','.');
    if(!form.name.trim() || !form.agreement_id || !form.category || !/^\d+(\.\d{1,2})?$/.test(price)){
        error.value='Укажите наименование, договор, категорию и неотрицательную цену до копеек.';return;
    }
    const [rubles,cents='']=price.split('.');
    if(BigInt(rubles)*100n+BigInt(cents.padEnd(2,'0'))>9007199254740991n){error.value='Слишком большая цена.';return;}
    busy.value=true;error.value='';
    try{
        const payload={...form,name:form.name.trim(),size:form.size.trim(),price,agreement_id:Number(form.agreement_id)};
        if(recordID.value)await api.put(`/ppe/${recordID.value}`,payload);else await api.post('/ppe',payload);
        if(disposed)return;modal?.hide();emit('saved');
    }catch(err){if(!disposed)error.value=typeof err.response?.data==='string'?err.response.data.trim():'Не удалось сохранить СИЗ.';}
    finally{busy.value=false;}
};
defineExpose({open});
onBeforeUnmount(()=>{disposed=true;modal?.hide();modal?.dispose();});
// --------- конец нового кода chat
</script>
<style scoped>
/* новый код chat: форма в стиле инструментов */
.ppe-modal { font-size:13px; color:#000; }
.modal-title { font-size:17px; font-weight:600; }
.form-label { font-size:13px; font-weight:500; margin-bottom:5px; }
.form-control, .form-select, .btn { font-size:13px; }
.modal-body { overflow:visible; }
.modal-dialog-scrollable .modal-content { overflow:visible; }
.modal-footer { background:#f8f9fa; }
</style>
<!-- --------- конец нового кода chat -->
