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
                    <select v-model="formData.category_employee_document_id" class="form-select " aria-label="Default select example">
                        <option value="no">Выберете категорию</option>
                        <option v-for="category in categorys" :key="category.ID" :value="category.ID">{{ category.category_name }}</option>
                    </select>
                    <router-link :to="{name:'employee-document-category'}">Создать новую категорию</router-link>
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
import { ref, computed, reactive, onMounted } from 'vue';

import { useRoute } from 'vue-router';
import api from '../../../api';

const route = useRoute();

const formData = reactive({
    category_employee_document_id: "no"
});

const categorys = ref([]);

const SelectFile = ref(null);
const isSubmit = ref(false);

const handleFileChange = (event) =>{
    SelectFile.value = event.target.files[0];
};

const getCategoryEmployeeCardDocumentHandler = async() =>{
    try{
        const res = await api.get('/employeescard/document/category');
        categorys.value = res.data.sort((a, b) =>(a.category_name || '').localeCompare(b.category_name || '', 'ru'));
        console.log("[Категории]: ", categorys.value);
    }catch(err){
        console.log(err);
    }
}

const SendEmail = async()=>{
    try{
        isSubmit.value = true;
        
        const SendFormData = new FormData();
        SendFormData.append('category_employee_document_id', formData.category_employee_document_id);
        SendFormData.append('file', SelectFile.value);

        const res = await api.post(`/employeescard/${route.params.id}/document/create`, SendFormData);

        SelectFile.value = null;
        formData.category_employee_document_id = "no";
    }catch(err){
        console.log(err);
    }finally{
        isSubmit.value = false;
    }
};
onMounted(getCategoryEmployeeCardDocumentHandler);
</script>

<style>

</style>