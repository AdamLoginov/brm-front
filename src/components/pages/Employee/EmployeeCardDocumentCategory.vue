<template>
    <div class="container-fluid pt-3">
        <div>
            <h4>Категории документа сотрудника</h4>
            <hr>
        </div>
        <div class="col-md-12 col-lg-10 col-xl-8">
            <div class="list-group">
                  <div class="list-group-item ">
                      <div class="d-flex align-items-end" >
                          <div class="col-10">
                              <label class="form-label">Наименование категории</label>
                              <input v-model="formData.category_name" type="text" class="form-control" placeholder="Наименование">
                          </div>
                          <div class="col-2 ms-3">
                              <button class="btn btn-primary" type="submit" @click="postCategoryEmployeeCardDocument">Создать</button>
                          </div>
                        </div>
                  </div>
                  <div v-for="(category, index) in categorys" :key="category.ID" class="list-group-item d-flex">
                      <div class="col-1">
                        {{ index + 1 }}
                      </div>
                      <div class="col-10">
                          {{ category.category_name }}
                      </div>
                      <div class="col-1">
                          <div class="dropdown">
                            <a class="text-dark" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                              <i class="bi bi-three-dots-vertical"></i>
                            </a>
                            <ul class="dropdown-menu">
                              <li><a class="dropdown-item text-danger" type="button" @click="deleteCategoryEmployeecardDocument(category.ID)">Удалить</a></li>
                            </ul>
                          </div>
                      </div>
                  </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import api from '../../../api';

const categorys = ref([]);

const formData = reactive({
    "category_name": "",
});

const getCategoryEmployeeCardDocumentHandler = async() =>{
    try{
        const res = await api.get('/employeescard/document/category');
        categorys.value = res.data.sort((a, b) =>(a.category_name || '').localeCompare(b.category_name || '', 'ru'));
        console.log("[Категории]: ", categorys.value);
    }catch(err){
        console.log(err);
    }
}

const postCategoryEmployeeCardDocument = async() =>{
    try{
        console.log()
        const res = await api.post('/employeescard/document/category/create', formData);
        categorys.value.push(res.data);
        categorys.value = categorys.value.sort((a, b) =>(a.category_name || '').localeCompare(b.category_name || '', 'ru'));
        formData.category_name = "";
    }catch(err){
        console.log(err)
    }
}

const deleteCategoryEmployeecardDocument = async(id) => {
    try{
        const res = await api.delete(`/employeescard/document/category/${id}/delete`);
        categorys.value = categorys.value.filter(item => item.ID != id);
    }catch(err){
        console.log(err)
    }
}

onMounted(getCategoryEmployeeCardDocumentHandler);
</script>

<style>

</style>