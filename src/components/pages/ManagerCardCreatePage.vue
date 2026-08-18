<template>
    <div class="container-fluid">
        <div class="pt-3">
            <h3>Создать карточку менеджера</h3>
        </div>
        <form class="row g-3 pt-3" @submit.prevent="HandlerSubmitForm">
            <div class="col-md-6">
                <label for="companyName" class="form-label">ФИО</label>
                <input v-model="formData.full_name" type="text" class="form-control" id="companyName" placeholder="Мясников Михаил Александрович">
            </div>

            <div class="col-md-6">
                <label for="inputEmail4" class="form-label">Почта</label>
                <input v-model="formData.email" type="email" class="form-control" id="inputEmail4" placeholder="misha@mail.ru">
            </div>

            <div class="col-12">
                <label for="Category" class="form-label">Номер телефона</label>
                <input v-model="formData.phone_number" type="text" class="form-control" id="Category" placeholder="89149045535">
            </div>
            
            <div class="col-12">
                <button type="submit" class="btn btn-primary" :disabled="isSubmit">
                    {{isSubmit ? 'Отправка' : 'Создать'}}
                </button>
            </div>

            <div v-if="message" class="alert alert-warning" role="alert">
                {{message}}
            </div>
     </form>
    </div>
  
</template>

<script setup>

    import { onMounted, reactive, ref } from 'vue';
    import { useRoute } from 'vue-router';
    import api from '../../api';

    const route = useRoute()

    const isSubmit = ref(false);
    const message = ref('');
    const supplierId = Number(route.params.id);

    const formData = reactive({
        full_name : '',
        phone_number:'',
        email:'',
        supplier_id: supplierId
    });

    const HandlerSubmitForm = async() =>{
        try{
            console.log(formData)
            isSubmit.value = true;
            const res = await api.post(`/supplier/${supplierId}/manager/create`, formData);
              
            message.value = "Менеджер успешно создан!"
            console.log(message);     
            formData.full_name = '';
            formData.phone = '';
            formData.email = '';
        }catch(err){
            message.value = 'Ошибка при создании карточки менеджера';
            console.log(err);
        }finally{
            isSubmit.value = false;
        }
    }
</script>

<style>

</style>