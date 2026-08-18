<template>
    <div class="container-fluid pt-3">
        <div>
            <h5>Сотрудники</h5>
            <router-link :to="{name: 'employee-card-create'}">Создать карточку сотрудника</router-link>
            <hr>
        </div> 
        <div class="list-group">
            <div class="list-group-item d-flex">
                <div class="col-1 fw-semibold">#</div>  
                <div class="col-4 fw-semibold">ФИО</div>  
                <div class="col-3 fw-semibold">Номер телефона</div>  
                <div class="col-3 fw-semibold">Специализация</div>  
            </div>

            <div v-for="(card, index) in cards" :key="card.ID" class="list-group-item d-flex">
                <div class="col-1">{{ index + 1 }}</div>
                <div class="col-4">
                    <router-link :to="{name: 'employee-card-detail', params: {id:card.ID}}">{{ card.surname }} {{ card.name }} {{ card.middle_name }}</router-link>
                </div>
                <div class="col-3">{{ card.phone }}</div>
                <div class="col-3">{{ card.profession }}</div>
                <div class="col-1 d-flex justify-content-end">
                    <div class="dropdown">
                        <a class="text-dark" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-three-dots-vertical"></i>
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item text-danger" type="button" @click="deleteEmployeeCardHandler(card.ID)">Удалить</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import api from '../../api';

const cards = ref(null);

const deleteEmployeeCardHandler = async(id) =>{
    try{
        const res = await api.delete(`/employeescard/delete/${id}`);
        cards.value = cards.value.filter(item => item.ID !=id);
    }catch(err){
        console.log('[Error] ', err);
    }
}

const getEmployeeCardHandler = async() =>{
    try{
        const res = await api.get('/employeecards');
        cards.value = res.data;
        console.log('[Employee] ', res.data);
    }catch(err){
        console.log('[Error] ', err);
    }
};

onMounted(getEmployeeCardHandler);
</script>

<style>

</style>