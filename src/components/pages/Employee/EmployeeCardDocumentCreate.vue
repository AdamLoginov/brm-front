<template>
    <div class="container-fluid pt-3">
        <div>
            <h4>Добавить документ на сотрудника</h4>
        </div>
        <hr>
        <div class="col-6">
           <form @submit.prevent="SendEmail">

                <div class="mb-3">
                    <label for="exampleFormControlInput1" class="form-label">Наименование документа:</label>
                    <input v-model="formData.document_name" type="text" class="form-control" placeholder="Наименование документа">
                </div>

                <div class="mb-3">
                    <label for="formFile" class="form-label">Выберете файл если он есть</label>
                    <input class="form-control" type="file" id="formFile" @change="handleFileChange"/>
                </div>

                <div class="d-flex justify-content-end">
                    <button class="btn btn-primary" type="submit" :disabled="isSubmit">{{ isSubmit? 'Отправка':'Отправить' }}</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';

import { useRoute } from 'vue-router';
import api from '../../../api';

const route = useRoute();

const formData = reactive({
    document_name: ""
});

const SelectFile = ref(null);
const isSubmit = ref(false);

const handleFileChange = (event) =>{
    SelectFile.value = event.target.files[0];
};

const SendEmail = async()=>{
    try{
        isSubmit.value = true;
        
        const SendFormData = new FormData();
        SendFormData.append('document_name', formData.document_name);
        SendFormData.append('file', SelectFile.value);

        const res = await api.post(`/employeescard/${route.params.id}/document/create`, SendFormData);

        SelectFile.value = null;
        formData.document_name = "";
    }catch(err){
        console.log(err);
    }finally{
        isSubmit.value = false;
    }
};

</script>

<style>

</style>