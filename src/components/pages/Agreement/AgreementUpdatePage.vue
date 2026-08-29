<template>
    <div class="container-fluid">
        <div>
            <h4>Редактировать договор</h4>
            <hr>
        </div>
        <div class="pt-3">
            <div class="col-6" style="font-size: 14px;">
                <div class="">
                    <label for="name" class="form-label">Полное наименование договора</label>
                    <input v-model="formData.name" type="text" class="form-control form-control-sm" placeholder="Текущий ремонт оборудования">
                </div>
                <div class="pt-3">
                    <label for="name" class="form-label">Краткое наименование договора</label>
                    <input v-model="formData.short_name" type="text" class="form-control form-control-sm" placeholder="ГМЗ (Краснокаменск)">
                </div>
                <div class="pt-3">
                    <label for="number" class="form-label">Номер договора</label>
                    <input  v-model="formData.number" type="text" class="form-control form-control-sm" id="number" placeholder="30-1168-33-77 от 31.12.2024г.">
                </div>
                <div class="pt-3">
                    <label for="customer" class="form-label">Заказчик</label>
                    <input v-model="formData.customer" type="text" class="form-control form-control-sm" id="customer" placeholder="ПАО 'ППГХО'">
                </div>
                <div class="pt-3">
                    <label for="address" class="form-label">Месторасположение объекта</label>
                    <input v-model="formData.address" type="text" class="form-control form-control-sm" id="address" placeholder="Каширское шоссе 51 ">
                 </div>
                <div class="row pt-3">
                    <div class="col-4">
                        <label for="price" class="form-label">Цена договора</label>
                        <input  v-model="formData.price" type="number" class="form-control form-control-sm" id="price" placeholder="1000000">
                    </div>
                    <div class="col-4">
                        <label for="date" class="form-label">Срок выполнения работ</label>
                        <input v-model="formData.date_end"  type="date" class="form-control form-control-sm" id="date">
                    </div>
                    <div class="col-4">
                        <label for="date" class="form-label">Статус</label>
                        <select v-model="formData.status" class="form-select form-select-sm" aria-label="Small select example">
                            <option value="Активный">Активный</option>
                            <option value="Закончен">Закончен</option>
                        </select>
                    </div>
                </div>

                <div class="pt-3 d-flex justify-content-end">
                    <button type="submit" class="btn btn-primary btn-sm px-3" :disabled="isSubmit" @click="updateAgreementHandler()">
                        {{isSubmit ? 'Отправка' : 'Сохранить'}}
                    </button>
                </div>
            </div>     
        </div>
    </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import api from '../../../api';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const isSubmit = ref(false);

const formData = reactive({
    id:         "",
    name:       "",
    short_name: "",
    number:     "",
    customer:   "",
    address:    "",
    price:      0,
    date_end:   "",
    status:     "Активный"
});

const getAgreementHandler = async() =>{
    try{
        const res = await api.get(`/agreements/${route.params.id}`)

        formData.id = res.data.ID
        formData.name = res.data.name
        formData.short_name = res.data.short_name
        formData.number = res.data.number
        formData.customer = res.data.customer
        formData.address = res.data.address
        formData.price = res.data.price
        formData.date_end = res.data.date_end
        formData.status = res.data.status

        console.log("[Agreement Data]", res.data)
    }catch(err){
        console.log(err)
    }
}

const updateAgreementHandler = async() =>{
    try{
        const res = await api.post(`/agreements/update/${route.params.id}`, formData)
        console.log(formData)
        router.push({name: 'agreements', params:{id: route.params.id}})
    }catch(err){
        console.log(err)
    }
}



onMounted(getAgreementHandler);
</script>

<style>

</style>