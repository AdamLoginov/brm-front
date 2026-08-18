<template>
    <div>
        <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
            Написать письмо
        </button>

        <div class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 class="modal-title fs-5" id="staticBackdropLabel">Новое письмо</h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>

                    <div class="modal-body">
                        <form @submit.prevent="SendEmail">
                            <div class="mb-3">
                                <label for="exampleFormControlInput1" class="form-label">Кому: </label>
                                <input v-model="formData.email_to" type="email" class="form-control" disabled readonly>
                            </div>

                            <div class="mb-3">
                                <label for="exampleFormControlInput1" class="form-label">Тема:</label>
                                <input v-model="formData.title" type="text" class="form-control" id="exampleFormControlInput1" placeholder="Тема письма">
                            </div>

                            <div class="mb-3">
                                <label for="formFile" class="form-label">Выберете файл если он есть</label>
                                <input class="form-control" type="file" id="formFile" @change="handleFileChange"/>
                            </div>

                            <div class="mb-3">
                                <label for="exampleFormControlTextarea1" class="form-label">Текст письма</label>
                                <textarea v-model="formData.message" class="form-control" id="exampleFormControlTextarea1" rows="15" placeholder="Тело письма"></textarea>
                            </div>
                            <div class="d-flex justify-content-end">
                                <button class="btn btn-primary" type="submit" :disabled="isSubmit">{{ isSubmit? 'Отправка':'Отправить' }}</button>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    </div>  
</template>

<script setup>
import { reactive, ref } from 'vue';
import api from '../api';


const props = defineProps({
    id: Number,
    email: String
});


const formData = reactive({
    email_to: props.email,
    dialog_id: props.id,
    title: "",
    message: ""
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
        SendFormData.append('email_to', formData.email_to);
        SendFormData.append('dialog_id', formData.dialog_id);
        SendFormData.append('title', formData.title);
        SendFormData.append('message', formData.message);
        SendFormData.append('file', SelectFile.value);

        const res = await api.post('/emails/create', SendFormData);
        SelectFile.value = null;
        formData.title = "";
        formData.message = "";

    }catch(err){
        console.log(err);
    }finally{
        isSubmit.value = false;
    }
};

</script>

<style>

</style>