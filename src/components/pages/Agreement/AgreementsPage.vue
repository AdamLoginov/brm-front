<template>
    <div class="container-fluid">
        <div class="pt-3">
            <h4>Договоры </h4>
        </div>
        <div>
            <router-link :to="{name:'agreement-create'}">Создать договор</router-link>
        </div>
        <hr>
        
        <div class="pt-3">
            <div class="row row-cols-1 row-cols-md-3 g-4">
                    <router-link v-for="agreement in agreements" :key="agreement.ID" :to="{name:'agreement', params:{id:agreement.ID}}" class="card-group text-decoration-none text-reset">
                        <div class="card agreement-card">
                            <div class="card-body">
                                <h5 class="card-title">{{agreement.name}}</h5>
                                <p class="card-text pt-1">Короткое название: <span class="fw-semibold">{{ agreement.short_name }}</span></p>
                                <p class="card-text">Номер договора: <span class="fw-semibold">{{ agreement.number }}</span></p>
                                <p class="card-text">Заказчик: <span class="fw-semibold">{{ agreement.customer }}</span></p>
                                <p class="card-text">Адрес: <span class="fw-semibold">{{ agreement.address }}</span></p>
                                <p class="card-text">Срок выполнения:  <span class="fw-semibold">{{ formatDateStr(agreement.date_end)}}</span></p>
                                <p class="card-text">Статус:  <span class="fw-semibold">{{ agreement.status}}</span></p>
                            </div>
                        </div>
                    </router-link>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import api from '../../../api';
import { formatDateStr } from '../../../utils/date';

const agreements = ref([]);

const DeleteAgreementHandler = async (id)=>{
    try{  
        const res = await api.delete(`/agreements/delete/${id}`)
        agreements.value = agreements.value.filter(m => m.ID !== id)
        console.log(`Успешно удален эелемент ${id}`)
        }catch(err){
        console.log(err)
    }
}

const GetAllAgreementsHandler = async()=>{
    try{
        const res = await api.get('/agreements');
        agreements.value = res.data;
        console.log(agreements.value)
    }catch(err){
        console.log(err);
    }
};

onMounted(GetAllAgreementsHandler);
</script>

<style>
.agreement-card {
    transition: box-shadow .2s ease;
}

.agreement-card:hover {
    box-shadow: var(--bs-box-shadow-lg) !important;
}
</style>