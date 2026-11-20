<!-- --------- новый код chat: книга с заранее созданными днями месяца -->
<template><WorkOrderDialog title="Создать книгу наряд-заданий" :busy="busy" @close="$emit('close')"><form @submit.prevent="save"><div v-if="error" class="alert alert-danger">{{ error }}</div><label class="form-label" for="work-book-month">Месяц</label><input id="work-book-month" v-model="month" type="month" min="1900-01" max="2200-12" required class="form-control form-control-sm" :disabled="busy"><button class="btn btn-primary btn-sm mt-3" :disabled="busy">Создать</button></form></WorkOrderDialog></template>
<script setup>
import {ref} from 'vue';import api from '../../../api';import WorkOrderDialog from './WorkOrderDialog.vue';import {localDate,workError} from './workOrderHelpers';
const props=defineProps({agreementId:[String,Number]});const emit=defineEmits(['close','created']);const month=ref(localDate().slice(0,7)),busy=ref(false),error=ref('');
const save=async()=>{if(busy.value)return;busy.value=true;try{const [year,m]=month.value.split('-').map(Number);const res=await api.post(`/agreements/${props.agreementId}/work-orders/books/create`,{year,month:m});emit('created',res.data);}catch(e){error.value=workError(e);}finally{busy.value=false;}};
</script>
<!-- --------- конец нового кода chat -->
