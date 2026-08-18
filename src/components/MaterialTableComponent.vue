<template>
    <div class="container-fluid pt-4">
        <h4 class="mb-3">Таблица материалов</h4>
        <table class="table table-hover">
            <thead>
                <tr>
                    <th scope="col">ID см</th>
                    <th scope="col">Наименование</th>
                    <th scope="col">ед изм</th>
                    <th scope="col">кол-во</th>
                    <th scope="col">Цена см</th>
                    <th scope="col">Цена см сум</th>
                    <th scope="col">Удалить</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in materials" :key="item.id">
                    <th scope="item">{{item.IdSmeta}}</th>
                    <td>{{item.Name}}</td>
                    <td>{{item.TypeUnit}}</td>
                    <td>{{item.Quantity}}</td>
                    <td>{{item.PriceSmeta}}</td>
                    <td>{{(item.PriceSmeta*item.Quantity).toFixed(2)}}</td>
                    <td><delete-button-component :id="item.ID" :url="'/materials/delete'" @delete-me="handleDelete"/></td>
                </tr>
            </tbody>
        </table>
        
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import api from '../api';
import DeleteButtonComponent from './DeleteButtonComponent.vue';

    const materials = ref([]);
    const error = ref(null);

    const getMaterials = async() =>{
        try{
            const res = await api.get('/materials');
            materials.value = res.data;
            console.log(materials.value);
        }catch(err){
            error.value = err.message;
            console.log('Error', err);
        }
    };

    const handleDelete = (idFromChild) => {
        materials.value = materials.value.filter(m => m.ID !== idFromChild);
        console.log(`Материал с id ${idFromChild} удален из списка на экране`);
    };

    onMounted(getMaterials);
</script>

<style>

</style>