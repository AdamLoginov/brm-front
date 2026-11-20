<!-- --------- новый код chat: единицы измерения, цеха, блоки и позиции -->
<template><WorkOrderDialog title="Справочники книги нарядов" :busy="busy" @close="$emit('close')">
    <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
    <nav class="nav nav-pills gap-1 mb-3"><button v-for="tab in tabs" :key="tab.key" type="button" class="nav-link py-1" :class="{active:kind===tab.key}" :disabled="busy" @click="kind=tab.key; reset()">{{ tab.name }}</button></nav>
    <p v-if="kind==='units'" class="text-secondary">Единицы измерения общие для всех договоров.</p>
    <form @submit.prevent="save" class="border rounded-3 p-3 mb-3"><fieldset :disabled="busy" class="border-0 p-0">
        <div class="row g-2">
            <div v-if="kind==='blocks'" class="col-md-5"><label class="form-label">Цех</label><select v-model="form.workshop_id" required class="form-select form-select-sm"><option :value="0" disabled>Выберите цех</option><option v-for="s in refs.workshops" :key="s.ID" :value="s.ID">{{ s.name }}</option></select></div>
            <div v-if="kind==='positions'" class="col-md-5"><label class="form-label">Блок · цех</label><select v-model="form.block_id" required class="form-select form-select-sm"><option :value="0" disabled>Выберите блок</option><option v-for="b in refs.blocks" :key="b.ID" :value="b.ID">{{ b.name }} · {{ shopName(b.workshop_id) }}</option></select></div>
            <div v-if="kind==='positions'" class="col-md-2"><label class="form-label">№ позиции</label><input v-model="form.number" required maxlength="50" class="form-control form-control-sm"></div>
            <div class="col"><label class="form-label">Наименование</label><input v-model="form.name" required maxlength="200" class="form-control form-control-sm"></div>
        </div>
        <div class="d-flex gap-2 mt-3"><button class="btn btn-primary btn-sm">{{ editing ? 'Сохранить' : 'Добавить' }}</button><button v-if="editing" type="button" class="btn btn-outline-secondary btn-sm" @click="reset">Отмена</button></div>
    </fieldset></form>
    <div class="list-group"><div v-for="row in refs[kind]" :key="row.ID" class="list-group-item d-flex gap-2 align-items-start"><div class="me-auto text-break"><strong>{{ kind==='positions' ? row.number+' · ' : '' }}{{ row.name }}</strong><div class="text-secondary small">{{ description(row) }}</div></div><button class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="edit(row)">Изменить</button><button class="btn btn-outline-danger btn-sm" :disabled="busy" @click="remove(row)">Удалить</button></div></div>
    <p v-if="!refs[kind].length" class="text-secondary">Записей пока нет.</p>
</WorkOrderDialog></template>
<script setup>
import { ref, reactive } from 'vue'; import api from '../../../api'; import WorkOrderDialog from './WorkOrderDialog.vue'; import { workError } from './workOrderHelpers';
const props=defineProps({agreementId:[String,Number],refs:Object}); const emit=defineEmits(['close','changed']);
const tabs=[{key:'workshops',name:'Цеха'},{key:'blocks',name:'Блоки'},{key:'positions',name:'Позиции'},{key:'units',name:'Единицы'}];
const kind=ref('workshops'),editing=ref(null),busy=ref(false),error=ref('');const form=reactive({name:'',number:'',workshop_id:0,block_id:0});
const reset=()=>{editing.value=null;Object.assign(form,{name:'',number:'',workshop_id:0,block_id:0});error.value='';};
const shopName=id=>props.refs.workshops.find(s=>s.ID===id)?.name||'—';
const description=row=>kind.value==='blocks'?`${shopName(row.workshop_id)} · Позиции: ${props.refs.positions.filter(p=>p.block_id===row.ID).map(p=>p.number).join(', ')||'нет'}`:kind.value==='positions'?props.refs.blocks.find(b=>b.ID===row.block_id)?.name:'';
const edit=row=>{editing.value=row.ID;Object.assign(form,{name:row.name,number:row.number||'',workshop_id:row.workshop_id||0,block_id:row.block_id||0});error.value='';};
const save=async()=>{if(busy.value)return;busy.value=true;error.value='';try{const url=`/agreements/${props.agreementId}/work-references/${kind.value}`;if(editing.value)await api.patch(`${url}/${editing.value}`,form);else await api.post(`${url}/create`,form);reset();emit('changed');}catch(e){error.value=workError(e);}finally{busy.value=false;}};
const remove=async row=>{if(busy.value||!confirm(`Удалить «${row.name}»? Используемые записи удалить нельзя.`))return;busy.value=true;try{await api.delete(`/agreements/${props.agreementId}/work-references/${kind.value}/${row.ID}`);if(editing.value===row.ID)reset();emit('changed');}catch(e){error.value=workError(e);}finally{busy.value=false;}};
</script>
<!-- --------- конец нового кода chat -->
