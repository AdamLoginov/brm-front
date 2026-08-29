<template>
    <div class="container-fluid">
       <div class="pt-3">
            <h4>Создать Договор</h4>
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
                    <button type="submit" class="btn btn-primary btn-sm px-3" :disabled="isSubmit" @click="HandlerSubmitForm()">
                        {{isSubmit ? 'Отправка' : 'Создать'}}
                    </button>
                </div>
            </div>
       </div>
    </div>
</template>

<script setup>
    import { onMounted, reactive, ref } from 'vue';
    import api from '../../../api';
    import { useRouter } from 'vue-router';

    const router = useRouter();

    const isSubmit = ref(false);

    const formData = reactive({
        name:       "",
        short_name: "",
        number:     "",
        customer:   "",
        address:    "",
        price:      0,
        date_end:   "",
        status:     "Активный"
    });

    const HandlerSubmitForm = async()=>{
        try{
            isSubmit.value = false;
            console.log(formData);

            const res = await api.post('/agreements/create', formData);
            router.push({name: 'agreements'})
        }catch(err){
            console.log(err);
        }finally{
            isSubmit.value = false;
        }
    };
    
</script>

<style>

</style>