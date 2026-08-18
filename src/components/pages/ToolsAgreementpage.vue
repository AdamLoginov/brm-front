<template>
  <div class="container-fluid">
    <div class=" pt-3">
        <h5>Инструменты</h5>
        <hr>
    </div>

    <div class="pt-3">
        <div class="col-12">
            <form @submit.prevent="postCreateToolsHandler">
                <div class="row d-flex align-items-end">
                    <div class="col-md-4">
                        <label class="form-label">Наименование</label>
                        <input v-model="formData.name" type="text" class="form-control" placeholder="Наименование">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Инвентарный номер</label>
                        <input v-model="formData.inv_number" type="text" class="form-control" placeholder="Инвентарный номер">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Серийный номер</label>
                        <input v-model="formData.serial_number" type="text" class="form-control" placeholder="Серийный номер">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Статус</label>
                        <select v-model="formData.status" class="form-select" aria-label="Default select example">
                            <option value="new">Новое</option>
                            <option value="good">Хорошее</option>
                            <option value="satisfactory">Удовлетворительное</option>
                            <option value="broken">Сломано</option>
                        </select>
                    </div>
                    <div class="col-md-1">
                        <button class="btn btn-primary" type="submit" :disabled="isSubmit">Добавить</button>
                    </div>
                </div>
            </form>
        </div>

        <div class="pt-3 col-md-10">
            <div class="list-group">
                <div class="list-group-item d-flex">
                    <div class="col-10">
                        <input v-model="filterData.searchQuery" type="text" class="form-control" placeholder="Введи наименование элемента">
                    </div>
                    <div class="col-2 fw-semibold d-flex justify-content-center">
                        <select v-model="filterData.status" class="form-select-sm" aria-label="Default select example">
                            <option value="" selected>Выберете статус</option>
                            <option value="new">Новое</option>
                            <option value="good">Хорошее</option>
                            <option value="satisfactory">Удовлетворительное</option>
                            <option value="broken">Сломано</option>
                        </select>
                    </div>

                </div>

                <div class="list-group-item d-flex">
                    <div class="col-1 fw-semibold">#</div>
                    <div class="col-1 fw-semibold d-flex justify-content-center">Статус</div>
                    <div class="col-4 fw-semibold">Наименование</div>
                    <div class="col-3 fw-semibold">Инвентарный номер</div>
                    <div class="col-3 fw-semibold">Серийный номер</div>
                </div>
                
                <div v-for="tool, index in filter" :key="tool.ID" class="list-group-item d-flex">
                    <div class="col-1">{{ index + 1 }}</div>
                    <div class="col-1 d-flex justify-content-center">
                        <div class="d-inline-block border rounded-4 d-flex align-items-center py-1 px-1" :class="{new:'text-success border-success', 
                            good:'text-success border-success', satisfactory:'text-warning border-warning', broken:'text-danger border-danger'}[tool.status]" 
                            style="font-size: 10px; line-height: 1;">
                            {{ {new:'новое', good:'хорошее', satisfactory:'удовлетв.', broken:'сломано'}[tool.status] }}
                        </div>
                    </div>
                    <div class="col-4">{{ tool.name }}</div>
                    <div class="col-3">{{ tool.inv_number }}</div>
                    <div class="col-2">{{ tool.serial_number }}</div>
                    <div class="col-1 d-flex justify-content-end">
                        <div class="dropdown">
                            <a class="text-dark" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-three-dots-vertical"></i>
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item text-danger" type="button" @click="deleteToolHandler(tool.ID)">Удалить</a></li>
                            </ul>
                        </div>
                    </div>
                </div>  
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import api from '../../api';

const route = useRoute();

const filterData = ref({
    status: "",
    searchQuery: ""
});

const formData = reactive({
    agreement_id: parseInt(route.params.id, 10),
    name: "",
    inv_number: "",
    serial_number: "",
    status: "new"
});
const isSubmit = ref(false);

const tools = ref(null);

const postCreateToolsHandler = async() =>{
    try{
        const res = await api.post("/tools/create", formData);
        formData.name = "";

        getAgreementToolsHandler();
    }catch(err){
        console.log("[Ошибка] ", err);
    }
}

const deleteToolHandler = async(id) =>{
    try{
        const res = await api.delete(`/tools/delete/${id}`)
        tools.value = tools.value.filter(item => item.ID != id);
    }catch(err){
        console.log("[Ошибка при удалении]", err);
    }
}

const getAgreementToolsHandler = async()=>{
    try{
        const res = await api.get(`/agreements/${route.params.id}/tools/create`);
        tools.value = res.data.reverse();
        console.log("[Инстументы]", res.data);
    }catch(err){
        console.log("[Ошибка] ", err);
    }
}

const filter = computed(() => {
    if (!tools.value) {
        return [];
    }
    console.log(filterData.value)
    const query = filterData.value.searchQuery.toLowerCase().trim();
    return tools.value.filter(item => {
        const matchesTools = !filterData.value.status || item.status === filterData.value.status;
        const matchesQuery = !query || item.name.toLowerCase().includes(query);
        return matchesTools && matchesQuery
    })
}); 

onMounted(getAgreementToolsHandler);
</script>

<style>

</style>