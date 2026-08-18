<template>
    <div class="container-fluid">
        <div class="pt-3">
            <h4>Создать карточку товара</h4>
            <hr>
        </div>
        <form class="col-8" @submit.prevent="createEmployeeCardHandler">
            <div class="row">
                <div class="col-4">
                    <label class="form-label">Фамилия</label>
                    <input v-model="formData.surname" type="text" class="form-control form-control-sm" placeholder="Иванов">
                </div>
                <div class="col-4">
                    <label class="form-label">Имя</label>
                    <input v-model="formData.name" type="text" class="form-control form-control-sm" placeholder="Иван">
                </div>
                <div class="col-4">
                    <label class="form-label">Отчество</label>
                    <input v-model="formData.middle_name" type="text" class="form-control form-control-sm" placeholder="Иванович">
                </div>
                <div class="col-4">
                    <label class="form-label">Номер телефона</label>
                    <input v-model="formData.phone" type="text" class="form-control form-control-sm" placeholder="+79149045535">
                </div>
                <div class="col-6">
                    <label class="form-label">Специальность</label>
                    <input v-model="formData.profession" type="text" class="form-control form-control-sm" placeholder="Инженер ПТО">
                </div>
                <div class="col-2 d-flex align-items-end justify-content-end">
                    <button type="submit" class="btn btn-primary btn-sm" :disabled="isSubmit">Создать</button>
                </div>
            </div>
        </form>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import api from '../../../api';

const isSubmit = ref(false);

const formData = reactive({
    name: "",
    surname: "",
    middle_name: "",
    phone: "",
    profession: ""
});

const createEmployeeCardHandler = async() =>{
    try{
        isSubmit.value = true;
        const res = await api.post('/employeescard/create', formData);
        
        formData.name = "";
        formData.surname = "";
        formData.middle_name = "";
        formData.phone = "";
        formData.profession = "";
    }catch(err){
        console.log('[Error] ', err);
    }finally{
        isSubmit.value = false;
    }
}
</script>

<style>

</style>