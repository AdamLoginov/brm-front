<template>
    <div class="container-fluid pt-3">
        <div>
            <div v-if="dialog" class="d-flex justify-content-between align-items-center">
                <div  class="fs-2">Сообщения диалога <span class="fs-5 fw-semibold">{{ dialog.email_to }}</span></div>
                <EmailCreateComponent :email="dialog.email_to" :id="dialog.ID"/>
            </div>
            <hr>
        </div>
        <div v-if="dialog" class="list-group">
            <router-link :to="{name:'email', params:{id:email.ID}}" class="list-group-item list-group-item-action" v-for="email in dialog.emails" :key="email.ID">
                <div class="row">
                    <div class="col-1 text-truncate d-flex">
                        <div class="col-3">
                            <div v-if="!email.isRead">
                                <span class="d-inline-block bg-primary rounded-circle" style="width: 10px; height: 10px;"></span>
                            </div>
                        </div>
                        <div class="col-9">{{ email.email_from? 'Вам:': 'Вы:' }}</div>
                    </div>
                    <div class="col-2 text-truncate">{{ email.title }}</div>
                    <div class="col-7 text-truncate">{{ email.message}}</div>
                    <div class="col-2">{{ formatDate(email.CreatedAt) }}</div>
                </div>
            </router-link>
        </div>
    </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { onMounted, ref } from 'vue';
import api from '../../api';
import { formatDate } from '../../utils/date';
import EmailCreateComponent from '../EmailCreateComponent.vue';


const route = useRoute();

const dialog = ref(null);

const GetDialogHandler = async()=>{
    try{
        const res = await api.get(`/dialogs/${route.params.id}`);
        dialog.value = res.data;
        dialog.value.emails = dialog.value.emails.toReversed();

        console.log.apply(res.data);
    }catch(err){
        console.log(err);
    }
};




onMounted(GetDialogHandler);
</script>

<style>

</style>