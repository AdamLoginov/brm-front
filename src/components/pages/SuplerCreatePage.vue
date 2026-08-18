<template>
  <div class="container-fluid">
    <div class="pt-3">
        <h3>Создать нового поставщика</h3>
    </div>
    <form class="row g-3 pt-3" @submit.prevent="postCreateSupplierHandler">
        <div class="col-md-6">
            <label for="companyName" class="form-label">Наименование компании</label>
            <input v-model="formData.name" type="text" class="form-control" id="companyName" placeholder="ООО'БРМ'">
        </div>

        <div class="col-md-6">
            <label for="inputEmail4" class="form-label">Ссылка на сайт</label>
            <input v-model="formData.link" type="text" class="form-control" id="inputEmail4" placeholder="BRM.ru">
        </div>

        <div class="col-12">
            <div class="row">
                <label for="form-label">Категории товаров</label>
                <div class="col-4">
                    <div class="input-group">
                        <input v-model="categoryFormData.name" type="text" class="form-control" placeholder="Наименование">
                        <button class="btn btn-outline-secondary" type="button" @click="postCategorySupplierHandler">Добавить</button>
                    </div>
                </div>
                
                <div class="col-4">
                    <div class="border rounded-3 overflow-hidden">
                        <div class="list-group list-group-flush overflow-auto"  style="max-height: 265px; min-height: 40px;">
                            <div v-for="category in checkCategoryes" :key="category.ID" class="list-group-item d-flex">
                                <div class="col-1">
                                    <input v-model="category.check" class="form-check-input me-1" type="checkbox">
                                </div>
    
                                <div class="col-9">
                                   {{ category.name }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-4">
                    <div class="border rounded-3 overflow-hidden">
                        <div class="list-group list-group-flush overflow-auto"   style="max-height: 265px; min-height: 40px;">
                            <div v-for="category in categoryes" :key="category.ID" class="list-group-item d-flex">
                                <div class="col-1">
                                    <input v-model="category.check" class="form-check-input me-1" type="checkbox">
                                </div>
    
                                <div class="col-9">
                                   {{ category.name }}
                                </div>
    
                                <div class="col-2">
                                    <button class="btn p-0 text-danger" type="button" @click="deleteCategorySupplierHandler(category.ID)">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
    import { computed, onMounted, reactive, ref } from 'vue';
    import api from '../../api';

    const formData = reactive({
        name: '',
        link: ''
    });
    const categoryFormData = reactive({
        name: ''
    });

    const categoryes = ref([]);

    const isSubmit = ref(false);
    const message = ref(''); 

    const getCategoryesSupplierHandler = async() =>{
        try{
            const res = await api.get("/suppliers/categoryes");
            categoryes.value = res.data
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(item => ({
                ...item,
                check: false
            }));
            console.log(categoryes.value);
        }catch(err){
            console.log(err);
        }
    };

    const postCategorySupplierHandler = async() =>{
        try{
            console.log(categoryFormData)
            const res = await api.post("/suppliers/categoryes/create", categoryFormData);
            categoryFormData.name = "";
            getCategoryesSupplierHandler();
        }catch(err){
            console.log(err);
        }
    };
    
    const postCreateSupplierHandler = async() =>{
        try{
            isSubmit.value = true;
            const res = await api.post('/supplier/create', {
                name: formData.name, 
                link: formData.link,
                category_id: categoryes.value.filter(item => item.check === true).map(item => item.ID)
            });
            message.value = `Успешно добавлен поставщик ${formData.name}`;
            

            formData.name = '';
            formData.link = '';
            formData.category = [];
            getCategoryesSupplierHandler();
        }catch(err){
            message.value = 'Ошибка при отправке!';
            console.log(err);
        }finally{
            isSubmit.value = false;
        }
    };

    const deleteCategorySupplierHandler = async(id) =>{
        try{
            const res = await api.delete(`/suppliers/categoryes/${id}`);
            categoryes.value = categoryes.value.filter(item => item.ID !== id)
        }catch(err){
            console.log(err);
        }
    }
    

    const checkCategoryes = computed(()=>{
        return categoryes.value.filter(item => item.check === true)
    })

    onMounted(getCategoryesSupplierHandler);
</script>

<style>

</style>