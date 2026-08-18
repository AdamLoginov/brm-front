<template>
    <div class="container-fluid">
       <div class="pt-3">
            <h4>Создать объект</h4>
       </div>
       <div class="pt-3">
        <form @submit.prevent="HandlerSubmitForm">
            <div class="row col-md-6">
                <label for="name" class="form-label">Предмет договора</label>
                <input v-model="formData.name" type="text" class="form-control" id="name" placeholder="Капитальный ремонт дымовых труб на см 'Приобской'">
            </div>
            <div class="row col-md-6 pt-2">
                <label for="number" class="form-label">Номер договора</label>
                <input  v-model="formData.number" type="text" class="form-control" id="number" placeholder="30-1168-33-77 от 31.12.2024г.">
            </div>
            <div class="row col-md-6 pt-2">
                <label for="customer" class="form-label">Заказчик</label>
                <input v-model="formData.customer" type="text" class="form-control" id="customer" placeholder="ПАО 'ППГХО'">
            </div>
            <div class="row col-md-6 pt-2">
                <label for="address" class="form-label">Месторасположение объекта</label>
                <input v-model="formData.address" type="text" class="form-control" id="address" placeholder="Каширское шоссе 51 ">
            </div>
            <div class="row col-md-6 pt-2">
                <label for="price" class="form-label">Цена договора</label>
                <input  v-model="formData.price" type="number" class="form-control" id="price" placeholder="100000">
            </div>
            <div class="row col-md-6 pt-2">
                <label for="date" class="form-label">Срок выполнения работ</label>
                <input v-model="formData.due_date"  type="date" class="form-control" id="date">
            </div>
            
            <div class="col-md-6 pt-3">
                <button type="submit" class="btn btn-primary" :disabled="isSubmit">
                    {{isSubmit ? 'Отправка' : 'Создать'}}
                </button>
            </div>
            <div v-if="message" class="alert alert-warning" role="alert">
                {{message}}
            </div>
        </form>
       </div>
    </div>
</template>

<script setup>
    import { onMounted, reactive, ref } from 'vue';
    import api from '../../api';

    const isSubmit = ref(false);
    const message = ref(''); 

    const formData = reactive({
        name:       "",
        number:     "",
        customer:   "",
        address:    "",
        price:      0,
        due_date:   "2026-05-16"
    });

    const HandlerSubmitForm = async()=>{
        try{
            isSubmit.value = false;
            console.log(formData);

            const res = await api.post('/agreements/create', formData);

            formData.name = "";
            formData.number = "";
            formData.customer = "";
            formData.address = "";
            formData.price = 0;
            formData.due_date = "2026-05-16";

        }catch(err){
            console.log(err);
        }finally{
            isSubmit.value = false;
        }
    };
</script>

<style>

</style>