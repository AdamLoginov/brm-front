<template>
  <div class="container-fluid pt-3">
    <div>
        <h4>Выбор счета</h4>
        <hr>
    </div>

    <div>
        <form @submit.prevent="postOrderCheckHandler">
            <div class="row px-3 text-list">
                <div class="col-4">
                    <ul class="list-group">
                        <li v-for="attachment in attachments" :key="attachment.ID" class="list-group-item">
                            <div class="row align-items-center">
                                
                                <div class="col-9">
                                    <a :href="`${apiBaseurl}/attachment/${attachment.ID}`" target="_blank" class="d-block fw-semibold">
                                        {{ attachment.file_name }}
                                    </a>
                                    <span class="text-muted small">{{ formatDate(attachment.CreatedAt) }}</span>
                                </div>
    
                                <div class="col-3 text-end"> 
                                    <button type="button" class="btn btn-primary btn-sm" @click="selectAttachmentFunc(attachment.ID, attachment.file_name)">
                                        Выбрать
                                    </button>
                                </div>
    
                            </div>
                        </li>
                    </ul>
                </div>
    
                <div class="col-8">
                    <ul class="list-group">
                        <li class="list-group-item">
                            <input v-model="check" class="form-control form-control-sm" type="text" placeholder="Выберите файл со счетом" disabled>
                        </li>
                        <li class="list-group-item">
                            <input v-model="formData.comment" class="form-control form-control-sm" type="text" placeholder="Комментарий к заказу">
                        </li>
                    </ul>
                </div>
            </div>
    
            <div>
                <ul class="list-group p-3">
                    <li class="list-group-item">
                        <div class="row">
                            <div class="col-2 fw-bold">Cмета | № по смете</div>
                            <div class="col-5 fw-bold">Название</div>
                            <div class="col-1 fw-bold">кол-во</div>
                            <div class="col-1 fw-bold ">цена ед.</div>
                            <div class="col-3 fw-bold">Комментарий</div>
                        </div>
                    </li>
    
                    <li v-for="material in materials" :key="material.ID" class="list-group-item">
                        <div class="row text-list">
                            <div class="col-2">
                               {{ material.materials.Estimate.name }} | {{ material.materials.IdSmeta }}
                            </div>
                            <div class="col-5">
                                {{ material.materials.Name}}
                            </div>
                            <div class="col-1">
                                {{ material.quantity }} {{ material.materials.TypeUnit }}
                            </div>
                            <div class="col-1">
                                <input v-model="material.price_order" class="form-control form-control-sm" type="number" placeholder="цена">
                            </div>
                            <div class="col-3">
                                <input v-model="material.comment" class="form-control form-control-sm" type="text" placeholder="Комментарий">
                            </div>
                        </div>
                    </li>
                </ul>
            </div>

            <div class="d-flex justify-content-end px-3">
                <button type="submit" class="btn btn-primary btn-sm" :disabled="isSubmit">Отправить</button>
            </div>
        </form>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import api from '../../api';
import { onMounted, reactive, ref } from 'vue';
import { formatDate } from '../../utils/date';

const route = useRoute();
const apiBaseurl = api.defaults.baseURL

const materials = ref({});
const attachments = ref([]);
const check = ref("");
const isSubmit = ref(false);

const formData = reactive({
    attachement_id: 0,
    materials: [],
    comment:""
});

const selectAttachmentFunc = (id, file_name) =>{
    check.value = file_name;
    formData.attachement_id = id;
};

const postOrderCheckHandler = async()=>{
    try{
        isSubmit.value = true
        formData.materials = materials.value.map(item=>({
            materials_order_id : item.ID,
            comment: item.comment,
            price_order: item.price_order
        }))
        console.log("[FormData]", formData)

        const res = await api.post(`/agreements/orders/${route.params.id}/update`, formData);
    }catch(err){
        console.log(err)
    }finally{
        isSubmit.value = false
    }
}

const getOrderDetailHandler = async()=>{
    try{
        const res = await api.get(`/agreements/orders/${route.params.id}/detail`);
        const order = res.data;

        materials.value = order.materials;
        attachments.value = order.manager_card.Dialog.emails?.flatMap(email => email.attachments || []) || [];
        
        console.log(res.data)
        console.log("[Приложения]: ", attachments.value);
        console.log("[Материалы]: ", materials.value);
    }catch(err){
        console.log(err);
    }
}



onMounted(getOrderDetailHandler);
</script>

<style>
.text-list{
    font-size: 14px;
}
</style>