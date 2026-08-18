<template>

    <div class="container-fluid pt-3">
        <h4>Компания поставщик</h4>
        <div v-if="supplier" class="pt-4">
            <div>
                <p>Название: {{supplier.Name}}</p>
                <p>Специализация: {{supplier.Specialization}}</p>
            </div>
            <div>
                <router-link :to="{name: 'create-manager'}">Создать карточку менеджера</router-link>
            </div>
            <hr>
            <h5>Карточки менеджеров</h5>
            <div class="pt-3">
                <div class="row row-cols-1 row-cols-md-3 g-4">
                    <div v-for="manager in managers" :key="manager.id" class="col">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">{{manager.full_name}}</h5>
                                <p class="card-text">Номер телефона: {{manager.phone_number}}</p>
                                <p class="card-text">Email: {{manager.email}}</p>
                            </div>
                            <div class="card-footer">
                                <a href="#" class="card-link">Card link</a>
                                <a href="#" class="card-link" @click="deleteManagerCard(manager.ID)">Удалить</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  
</template>

<script setup>
    import { onMounted, ref } from 'vue';
    import { useRoute } from 'vue-router';
    import api from '../../api';

    const route = useRoute();
    const supplier = ref(null);
    const managers = ref([]);
    const idSupplier = route.params.id;

    const getSupplier = async()=>{

        try{
            const res = await api.get(`/suppliers/detail/${idSupplier}`);
            supplier.value = res.data;
            managers.value = res.data.manager_cards;
            console.log(res.data);
        }catch(err){
            console.log(err);
        }
    };

    const deleteManagerCard = async(idManager) =>{
        try{
            const res = await api.delete(`/supplier/manager/delete/${idManager}`);
            managers.value = managers.value.filter(m => m.ID !== idManager);
        }catch(err){
            console.log(err);
        }
    }

    onMounted(getSupplier);
</script>

<style>

</style>