<template>
    <div class="container-fluid pt-3">
        <div>
            <h2>Письмо</h2>
            <hr>
        </div>
        <div v-if="email" class="p-2">
            <div class="fs-5 fw-medium">{{ email.title }}</div>
            <div class="smal"><span class="fw-semibold">Кто: </span>{{ email.email_from }} {{ formatDate(email.CreatedAt) }}</div>
            <div class="smal"> <span class="fw-semibold">Кому: </span>{{ email.email_to }}</div>
            <div class="py-2">
                <div>Файлы:</div>
                <a v-for="att in email.attachments" :key="att.ID" :href="`${apiBaseurl}/attachment/${att.ID}`" target="_blank" class="mx-2">
                    {{ att.file_name }}
                </a>
            </div>
            <div class="mt-3" style="white-space: pre-line;">{{ email.message }}</div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import api from '../../api';
import { useRoute } from 'vue-router';
import { formatDate } from '../../utils/date';

const apiBaseurl = api.defaults.baseURL

const route = useRoute();

const email = ref({});

const GetDetailEmailHandler = async() =>{
    try{
        const res = await api.get(`/emails/${route.params.id}`);
        email.value = res.data;
        console.log(res.data);

        if (!res.data.isRead){
            const readRes = await api.get(`/emails/read/${res.data.ID}`)
        };
    }catch(err){
        console.log(err)
    }
};

onMounted(
    GetDetailEmailHandler
);
</script>

<style>

</style>