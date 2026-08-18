<template>
    <div class="container-fluid pt-3">

        <div>
            <div>
                <h4>Заказы</h4>
            </div>

            <div>
                <router-link :to="{name:'order-create', params:{id: route.params.id}}">Сделать новый заказ</router-link>
            </div>
            <hr>
        </div>

        <div class="pt-3">
            <div class="list-group">
                <div class="list-group-item d-flex">

                    <div class="col-md-1 d-flex align-items-center fw-semibold">
                            <div class="col-md-3">#</div>
                            <div class="col-md-9 d-flex justify-content-center ">Статус</div>
                    </div>

                    <div class="col-md-1 d-flex align-items-center fw-semibold">Дата</div>
                    <div class="col-md-1 d-flex align-items-center fw-semibold">Компания</div>
                    <div class="col-md-2 d-flex align-items-center fw-semibold">Email</div>
                    <div class="col-md-5 d-flex align-items-center fw-semibold">Тект сообщения</div>
                </div>

                <div v-for="order, index in orders" :key="order.ID" class="list-group-item text-list">
                    <div class="d-flex">
                        <div class="col-md-1 d-flex">
                            <div class="col-md-2 d-flex align-items-center">{{ index + 1 }}</div>
                            <div class="col-md-10 d-flex align-items-center justify-content-center  ">
                                <div :class="['d-inline-block border rounded-4 py-1 px-1', order.is_paid ? 'border-success text-success' : 
                                order.status ? 'border-danger text-danger' : 'border-warning text-warning']" style="font-size: 10px; line-height: 1;">
                                    <div class="d-flex align-items-center">
                                        {{ order.is_paid? 'Оплачено' : order.status ? 'Счет нет' : 'Ожидание' }}
                                    </div>
                                </div>
                            </div>
                        </div>
                        

                        <div class="col-md-1 d-flex align-items-center">{{ getOnlyDate(order.CreatedAt) }}</div>
                        <div class="col-md-1 d-flex align-items-center">{{ order.manager_card.suppliers.Name }}</div>
                        <div class="col-md-2 d-flex align-items-center text-truncate">{{ order.manager_card.email }}</div>
                        <div class="col-md-5 d-flex align-items-center">{{ order.message }}</div>
                        
                        <div class="col-md-1">
                            <button class="btn btn-primary btn-sm" type="button" data-bs-toggle="collapse" 
                                :data-bs-target="`#collapse-${order.ID}`" aria-expanded="false"  style="font-size: 12px;">
                                Материалы
                            </button>
                        </div>

                        <div class="col-1 d-flex align-items-center justify-content-center">
                                <a class="text-dark" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="bi bi-three-dots-vertical"></i>
                                </a>
                                <ul class="dropdown-menu">
                                    <li v-if="!order.is_paid && !order.status"><a class="dropdown-item" type="button" @click="postPaidOrderHandler(index, order.ID)">Оплачено</a></li>
                                    <li v-if="order.status"><router-link :to="{name: 'order-check', params:{id:order.ID}}" class="dropdown-item">Добавить счет</router-link></li>
                                    <li class="border-top"><a class="dropdown-item" type="button">Редактировать</a></li>
                                </ul>
                        </div>

                    </div>

                    <div class="collapse" :id="`collapse-${order.ID}`">
                        <hr>
                        <div v-for="material, index in order.materials" :key="material.ID" class="row mb-1 px-3">
                            <div class="col-md-1 d-flex justify-content-end">{{ index+1 }}</div>
                            <div class="col-md-6">{{ material.materials.Name }}</div>
                            <div class="col-md-1">{{ material.quantity }} {{ material.materials.TypeUnit }}</div>
                            <div class="col-md-1 d-flex justify-content-center">{{ material.price_order ? material.price_order : '-' }}</div>
                            <div class="col-md-3">{{ material.comment }}</div>
                        </div>
                        <div v-if="order.comment" class="px-4 pt-3">
                            <div class="alert alert-success">
                                <div class="fw-semibold">Коментарий: <span class="fw-normal fst-italic">{{ order.comment }}</span></div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>   
        </div>

    </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import api from '../../api';
import { onMounted, ref } from 'vue';
import { formatDate } from '../../utils/date';

const route = useRoute();
const orders = ref([]);

const getOnlyDate = (time) =>{
    try{
        const dateTime = formatDate(time);
        return dateTime.split(" ")[1];
    }catch(err){
        console.log("[Error] ", err);
    }
}

const postPaidOrderHandler = async(index, id) =>{
    try{
        const res = await api.get(`/order/${id}`)
        orders.value[index].is_paid = true;
        console.log(index);
    }catch(err){
        console.log('[Error] ', err);
    }
}

const GetOrdersHandler = async()=>{
    try{
        const res = await api.get(`/agreements/${route.params.id}/orders`);
        orders.value = res.data.reverse();
        console.log(res.data);
    }catch(err){
        console.log(err);
    }
}

onMounted(GetOrdersHandler);
</script>

<style>
.text-list{
    font-size: 16px;
}
</style>