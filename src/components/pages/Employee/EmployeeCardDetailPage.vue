<template>
  <div class="container-fluid pt-3">
  <router-link :to="{name: 'employee-card-document-create', params:{id:route.params.id}}">Добавить документ</router-link>
  <div v-if="employeeCard" class="list-group">
    <div class="list-group-item d-flex">
      <div class="col-4">

      </div>
      <div  class="col-8">
        <div class="d-flex">
          <div class="col-4 pe-3">ФИО:</div>
          <div class="col-8">{{ employeeCard.surname }} {{ employeeCard.name }} {{ employeeCard.middle_name }}</div>
        </div>
        <div class="d-flex">
          <div class="col-4 pe-3">Должность:</div>
          <div class="col-8">{{ employeeCard.profession }}</div>
        </div>
        <div class="d-flex">
          <div class="col-4 pe-3">Номер телефона:</div>
          <div class="col-8">{{ employeeCard.phone }}</div>
        </div>
      </div>
    </div>
    <div v-for="document in employeeCard.employee_documents" :key="document.ID" class="list-group-item d-flex">
      <div class="col-6">
        {{ document.document_name }}
      </div>
      <div class="col-5"></div>
      <div class="col-1"></div>
    </div>
    
  </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import api from '../../../api';
import { onMounted, ref } from 'vue';

const route = useRoute();

const employeeCard = ref(null);

const getEmployeeCardDetailHandler = async() =>{
  try{
    const res = await api.get(`/employeescard/${route.params.id}/detail`);
    employeeCard.value = res.data;
    console.log(employeeCard.value)
  }catch(err){
    console.log(err);
  }
}

onMounted(getEmployeeCardDetailHandler);
</script>

<style>

</style>