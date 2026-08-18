<template>

    <div class="container-fluid">
        <div class="pt-3">
            <h5>Все сообщения</h5>
            <hr>
        </div>

        <div class="list-group">
            <router-link v-for="email in emails" :key="email.ID" :to="{name:'email', params:{id: email.ID}}" class="list-group-item list-group-item-action d-flex">
                <div class="col-3">{{ email.email_to }}</div>
                <div class="col-2 text-truncate">{{ email.title }}</div>
                <div class="col-5 text-truncate">{{email.message }}</div>
                <div class="col-2 text-center">{{ formatDate(email.CreatedAt) }}</div>
            </router-link>
        </div>
        
    </div>
  
</template>

<script setup>
import { onMounted, ref } from "vue";
import api from "../../api";
import { formatDate } from "../../utils/date";

    const emails = ref([]);

    const getEmailsHandler = async() =>{
        try{
            const res = await api.get('/emails');
            emails.value = res.data;
            console.log("[Все сообщения] ",res.data);
        }catch(err){
            console.log(err);
        }
    };

    onMounted(getEmailsHandler);
</script>

<style>

</style>