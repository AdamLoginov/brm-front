<template>
    <div class="container-fluid pt-3">
        <div class="">
            <h2>Поставщики</h2>
        </div>

        <div class="pt-3">
            <router-link :to="{name :'suplerCreate'}">
                Создать нового
            </router-link>
        </div>

            <div class="list-group">
                <div v-for="supplier in suppliers" :key="supplier.ID" class="list-group-item d-flex align-items-center px-4">
                    <div class="col-md-1">
                        #{{ supplier.ID }}
                    </div>

                    <div class="col-md-3">
                        <router-link :to="{name:'supplier-detail', params:{id:supplier.ID}}" class="text-decoration-none">{{ supplier.Name }}</router-link>
                    </div>

                    <div class="col-md-2">
                    <a :href="supplier.link">{{ supplier.link }}</a> 
                    </div>

                    <div class="col-md-4 text-sm">
                        <span v-for="category in supplier.category_suppliers" :key="category.ID">
                            {{ category.name }},
                        </span>
                    </div>
                    <div class="col-md-2 d-flex justify-content-end">
                        <div class="dropdown">
                            <a class="text-dark" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-three-dots-vertical"></i>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#">Изменить</a></li>
                                <li><a class="dropdown-item text-danger" type="button" @click="deleteSupplierHandler(supplier.ID)">Удалить</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
    </div>
</template>

<script setup>
    import { onMounted, ref } from 'vue';
    import api from '../../api';
    import DeleteButtonComponent from '../DeleteButtonComponent.vue';


    const suppliers = ref([]);
    
    const getSuppliers = async() =>{
        try{
            const res = await api.get('/suppliers');
            suppliers.value = res.data;
            console.log(res.data)
        }catch(err){
            console.log("Ошибка в загрузке поставщиков", err);
        }
    }

    const deleteSupplierHandler = async(id) =>{
        try{
            const res = await api.delete(`/supplier/delete/${id}`);
            suppliers.value = suppliers.value.filter(item => item.ID !== id)
        }catch(err){
            console.log(err);
        }
    }

    const handleDelete = (idFromChild) => {
        suppliers.value = suppliers.value.filter(m => m.ID !== idFromChild);
        console.log(`Материал с id ${idFromChild} удален из списка на экране`);
    };

    onMounted(getSuppliers);
</script>

<style>

</style>