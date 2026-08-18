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
                <div v-for="agreement in agreements" :key="agreement.ID" class="card-group">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">{{agreement.name}}</h5>
                            <p class="card-text">Номер договора: <span class="fw-semibold">{{ agreement.number }}</span></p>
                            <p class="card-text">Заказчик: <span class="fw-semibold">{{ agreement.customer }}</span></p>
                            <p class="card-text">Адрес: <span class="fw-semibold">{{ agreement.address }}</span></p>
                            <p class="card-text">Цена договора: <span class="fw-semibold">{{ agreement.price }}</span></p>
                            <p class="card-text">Срок выполнения:  <span class="fw-semibold">{{ formatDate(agreement.due_date)}}</span></p>
                        </div>
                        <div class="card-footer">
                            <router-link :to="{name:'agreement', params:{id:agreement.ID}}" class="card-link">Подробнее</router-link>
                            <a href="#" class="card-link" @click="DeleteConstructionSiteHandler(agreement.ID)">Удалить</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import api from '../../api';

const agreements = ref([]);

const DeleteConstructionSiteHandler = async (id)=>{
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

const formatDate = (date) =>{
    return new Intl.DateTimeFormat('ru-RU').format(new Date(date));
};
onMounted(GetAllAgreementsHandler);
</script>

<style>

</style>