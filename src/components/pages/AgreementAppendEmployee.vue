<template>
  <div class="container-fluid pt-3">
    <div>
        <h4>Добавить сотрудников</h4>
        <hr>
    </div>

    <div class="list-group">
        <div v-for="card in cards" :key="card.ID" class="list-group-item d-flex">
            <div class="col-1">
                <input v-mode="card.check" class="form-check-input" type="checkbox" @change="putAgreementId(card.ID)">
            </div>
            <div class="col-4">{{ card.name }} {{ card.surname }} {{ card.middle_name }}</div>
            <div class="col-4">{{ card.profession }}</div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import api from '../../api';
import { useRoute } from 'vue-router';

const route = useRoute();
const agreementId = route.params.id;
const cards = ref(null);

const putAgreementId= async(id) => {
    try{
        console.log('agreement id')
        console.log(agreementId)
        const answer = reactive(
            {"agreement_id" : parseInt(agreementId, 10)}
        );
        console.log(answer)
        const res = await api.post(`/agreements/employee/${id}/update`, answer)
        console.log(cards.value[id])
    }catch(err){
        console.log(err)
    }
}

const getEmployeeCardHandler = async() =>{
    try{
        const res = await api.get('/employeecards');
        cards.value = res.data;
        cards.value.forEach(item => item.check = item.agreement_id !== agreementId ? false : true);
        console.log('[Employee] ', res.data);
    }catch(err){
        console.log('[Error] ', err);
    }
};

onMounted(getEmployeeCardHandler);

</script>

<style>

</style>