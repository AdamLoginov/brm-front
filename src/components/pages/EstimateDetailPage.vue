<template>
    <div class="container-fluid">
        <div class="pt-3">
            <h5>Сметы</h5>
            <hr>
        </div>
        <template v-if="estimate">
            <div class="pt-3">
                <div class="card p-3">
                    <div class="d-flex">
                        <div class="col-4 fw-semibold">
                            {{ estimate.name }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="pt-3">
                <div class="list-group">
                    <div class="list-group-item d-flex">
                        <div class="col-1 fw-semibold">
                            <div class="d-flex">
                                <div class="col-6">#</div>
                                <div class="col-6"># см</div>
                            </div>
                        </div>
                        <div class="col-md-1 fw-semibold text-center">Статус</div>
                        <div class="col-md-5 fw-semibold">Наименование</div>
                        <div class="col-md-1 fw-semibold text-center">Ед. изм</div>
                        <div class="col-md-1 fw-semibold text-center">Кол-во</div>
                        <div class="col-md-1 fw-semibold text-center">Цена см</div>
                        <div class="col-md-1 fw-semibold text-center">Цена сум</div>
                        <div class="col-md-1 fw-semibold text-center">Цена счет</div>
                    </div>
                    <div v-for="(material, index) in estimate.materials" :key="material.ID" class="list-group-item d-flex text-list">
                        <div class="col-md-1">
                            <div class="d-flex">
                                <div class="col-6">{{ index + 1 }}</div>
                                <div class="col-6">{{ material.IdSmeta }}</div>
                            </div>
                        </div>
                        <div class="col-md-1 text-center px-2">
                            <div :class="['d-inline-block border rounded-4 px-2 pb-1', !material.order_materials.length ? 'border-danger text-danger' :!checkStatusMaterial(material.order_materials) ? 'border-success text-success' : 'border-warning text-warning']" style="font-size:12px; line-height: 1;">
                                <div class="d-flex align-items-center">
                                    {{ !material.order_materials.length ? 'нет' : !checkStatusMaterial(material.order_materials) ? 'да' : 'ожидаю' }}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-5">{{ material.Name }}</div>
                        <div class="col-md-1 text-center">{{ material.TypeUnit }}</div>
                        <div class="col-md-1 text-center">{{ material.Quantity }}</div>
                        <div class="col-md-1 text-center">{{ material.PriceSmeta }}</div>
                        <div class="col-md-1 text-center">{{ (material.PriceSmeta * material.Quantity).toFixed(2) }}</div>
                        <div class="col-md-1 text-center">{{ getMinPriceMaterial(material.order_materials) }}</div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import api from '../../api';
import { useRoute } from 'vue-router';

const route = useRoute();
const estimate = ref(null);

const checkStatusMaterial = (orders) =>{
    try{
        for (const order of orders){
            if (!order.order.status){
                return false;
            }
        }
        return true;
    }catch(err){
        console.log("[Error] ", err)
    }
};

const getMinPriceMaterial = (orders) =>{
    try{
        if (orders.length){
            var min_price = orders[0].price_order;
            if (orders.length > 1){
                for (const order of orders){
                    if (order.price_order < min_price){
                        min_price = order.price_order;
                    }
                };
            };
            return min_price;
        };
        return 0;
    }catch(err){
        console.log("[Error] ", err);
    }
}

const getEstimateHandler = async()=>{
    try{
        const res = await api.get(`/estimates/${route.params.id}`)
        estimate.value = res.data;
        console.log(estimate.value);
    }catch(err){
        console.log(err);
    }
}

onMounted(getEstimateHandler);
</script>

<style>


.text-list{
    font-size: 14px;
}
</style>