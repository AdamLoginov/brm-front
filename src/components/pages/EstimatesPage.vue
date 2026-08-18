<template>
    <div class="container-fluid pt-3">
        <div>
            <h4>Сметы</h4>
                <router-link :to="{name:'estimate-create'}">Создать новую смету</router-link>
            <hr>
        </div>
        <div class="col-8">
            <div class="list-group">
                <div class="list-group-item d-flex">
                    <div class="col-1 fw-semibold">#</div>
                    <div class="col-10 fw-semibold">Наименование</div>
                    <div class="col-1"></div>
                </div>

                <div v-for="(estimate, index) in estimates" :key="estimate.ID" class="list-group-item d-flex">
                    <div class="col-1">{{ index + 1 }}</div>
                    <div class="col-10">
                        <router-link :to="{name: 'estimate-detail', params:{id:estimate.ID}}">{{ estimate.name }}</router-link>
                    </div>
                    <div class="col-1 d-flex justify-content-end">
                        <div class="dropdown">
                            <a class="text-dark" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-three-dots-vertical"></i>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item text-danger" type="button" @click="deleteEstimateHandler(estimate.ID)">Удалить</a></li>
                            </ul>
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
import { useRoute } from 'vue-router';

import DeleteButtonComponent from '../DeleteButtonComponent.vue';

const route = useRoute();
const estimates = ref([]);

const GetEstimates = async()=>{
    try{
        const res = await api.get(`/agreements/${route.params.id}/estimates`);
        estimates.value = res.data;
        console.log(res.data);
    }catch(err){
        console.log(err);
    }
};

const deleteEstimateHandler = (idFromChild) => {
    estimates.value = estimates.value.filter(m => m.ID !== idFromChild);
    console.log(`Материал с id ${idFromChild} удален из списка на экране`);
};

onMounted(GetEstimates);
</script>

<style>

</style>