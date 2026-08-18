<template>
    <div class="container-fluid">
        <div class="col-md-8 m-5">
            <div class="row">
                <div class="col-md-12 mb-5">
                    <div class="card rounded-4">
                        <div v-if="agreement" class="card-body">
                            <p>Наименование договора: <span class="fw-semibold">{{ agreement.name }}</span></p>
                            <p>Заказчик: <span class="fw-semibold">{{ agreement.customer }}</span></p>
                            <p>Адрес: <span class="fw-semibold">{{ agreement.address }}</span></p>
                            <p>Цена договора: <span class="fw-semibold">{{ agreement.price }}</span></p>
                            <p class="m-0">Срок выполнения: <span class="fw-semibold">{{ formatDate(agreement.due_date) }}</span></p>
                        </div>
                    </div>
                </div>
    
                <div class="mb-2">
                    <h5>Данные по договору</h5>
                </div>
    
    
    
                <div class="col-md-12 px-2 ">
                    <div class="list-group rounded-4">
                        <div class="list-group-item d-flex justify-content-between">
                            Заказы
                            <router-link v-if="agreement" :to="{name:'orders', params:{id:agreement.ID}}">подробнее</router-link>
                        </div>
                        <template v-if="agreement">
                            <div v-for="order in agreement.orders" :key="order.ID" class="list-group-item d-flex">
                                <div class="col-1 d-flex">{{ order.ID }}</div>
                                <div class="col-1">
                                    <div :class="['d-inline-block border rounded-4 py-1 px-1', order.is_paid ? 'border-success text-success' : 
                                    order.status ? 'border-danger text-danger' : 'border-warning text-warning']" style="font-size: 10px; line-height: 1;">
                                        <div class="d-flex align-items-center">
                                            {{ order.is_paid? 'Оплачено' : order.status ? 'Счет нет' : 'Ожидание' }}
                                        </div>
                                    </div>
                                </div>
                                <div class="col-2 d-flex justify-content-center">{{ getOnlyDate(order.CreatedAt) }}</div>
                                <div class="col-2 text-truncate">{{ order.manager_card.suppliers.Name }}</div>
                                <div class="col-4">{{ order.manager_card.email }}</div>
                            </div>
                        </template>
                    </div>
                </div>
    
                <div class="col-md-6 pt-3 px-2 ">
                    <div class="list-group rounded-4">
                        <div class="list-group-item d-flex justify-content-between">
                            Инструменты
                            <router-link v-if="agreement" :to="{name:'agreement-tools', params:{id:agreement.ID}}">подробнее</router-link>
                        </div>
                        <template v-if="agreement">
                            <div v-for="tool in agreement.tools" :key="tool.ID" class="list-group-item d-flex">
                                <div class="col-1">{{ tool.ID }}</div>
                                <div class="col-11">{{ tool.name }}</div>
    
                            </div>
                        </template>
                    </div>
                </div>
    
                <div class="col-md-6 pt-3 px-2">
                    <div class="list-group rounded-4">
                        <div class="list-group-item d-flex justify-content-between">
                            Сметы
                            <router-link v-if="agreement" :to="{name:'estimates'}">подробнее</router-link>
                        </div>
                        <template v-if="agreement">
                            <div v-for="estimate in agreement.estimate" :key="estimate.ID" class="list-group-item d-flex">
                                <div class="col-1">{{ estimate.ID }}</div>
                                <div class="col-11">
                                    <router-link :to="{name: 'estimate-detail', params:{id:estimate.ID}}">{{ estimate.name }}</router-link>
        
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
    
                <div class="col-md-12 pt-3 px-2 ">
                    <div class="list-group rounded-4">
                        <div class="list-group-item d-flex justify-content-between">
                            Расходы
                            <router-link v-if="agreement" :to="{name:'expenses', params:{id:agreement.ID}}">подробнее</router-link>
                        </div>
                        <template v-if="agreement">
                            <div v-for="expens in agreement.expenses" :key="expens.ID" class="list-group-item d-flex">
                                <div class="col-1">{{ expens.ID }}</div>
                                <div class="col-2">{{ getOnlyDate(expens.CreatedAt) }}</div>
                                <div class="col-3 fw-semibold">{{ expens.employee_card.surname }} {{ expens.employee_card.name }}</div>
                                <div class="col-5">{{ expens.name }}</div>
                                <div class="col-1 d-flex justify-content-center">{{ expens.price }}</div>
                            </div>
                        </template>
                    </div>
                </div>

                <div class="col-md-12 pt-3 px-2">
                    <div class="list-group rounded-4">
                        <div class="list-group-item d-flex justify-content-between">
                            Сотрудники на объекте
                            <router-link v-if="agreement" :to="{name:'agreement-employee', params:{id:agreement.ID}}">подробнее</router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { onMounted, ref } from 'vue';
    import api from '../../api';
    import { useRoute } from 'vue-router';
import { formatDate } from '../../utils/date';

    const agreement = ref(null);
    const route = useRoute();
    const GetAgreementHandler = async()=>{
        try{
            const res = await api.get(`/agreements/${route.params.id}`)
            agreement.value = res.data;
            agreement.value.expenses = res.data.expenses.reverse().slice(0,5);
            agreement.value.tools = res.data.tools.reverse().slice(0,5);
            agreement.value.estimate = res.data.estimate.reverse().slice(0,5);
            agreement.value.orders = res.data.orders.reverse().slice(0,5);
            console.log(agreement.value)
        }catch(err){
            console.log(err)
        }
    };

    const getOnlyDate = (time) =>{
        try{
            const dateTime = formatDate(time);
            return dateTime.split(" ")[1];
        }catch(err){
            console.log("[Error] ", err);
        }
    };

    onMounted(GetAgreementHandler);
</script>

<style>
.text-list{
    font-size: 18px;
}
</style>