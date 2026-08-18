<template>
    <div class="container-fluid pt-3">
        <div>
            <h2>Диалоги</h2>
            <router-link :to="{name:'emails'}" class="pt-2">Все сообщения</router-link>
            <hr>
        </div>
        <div class="list-group">
            <router-link v-for="dialog in dialogs" :key="dialog.ID" :to="{name:'dialog', params:{id: dialog.ID}}" class="list-group-item list-group-item-action" >
                <div class="row">
                    <div class="col-3 d-flex">
                        <div class="col-2">
                            <div v-if="!dialog.email.isRead">
                                <span class="d-inline-block bg-primary rounded-circle" style="width: 10px; height: 10px;"></span>
                            </div>
                        </div>
                        <div class="col-10">{{ dialog.email_to }}</div>
                    </div>
                    <div class="col-2 text-truncate">{{ dialog.email.title }}</div>
                    <div class="col-5 text-truncate">{{dialog.email.message }}</div>
                    <div class="col-2 d-flex justify-content-between">{{ formatDate(dialog.email.CreatedAt) }} <span class="badge text-bg-secondary rounded-pill">{{ dialog.count_emails }}</span></div>
                </div>
            </router-link>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import api from '../../api';
import { formatDate } from '../../utils/date';


const dialogs = ref([]);

const GetDialogs = async()=>{
    try{
        const res = await api.get('/dialogs');
        const data = res.data;

        for(let i=0; i < data.length; i++){
            if (data[i].emails.length !== 0){
                dialogs.value.push({
                    ID: data[i].ID,
                    email_to: data[i].email_to,
                    email: data[i].emails.at(-1),
                    count_emails: data[i].emails.length
                });
            };
        };

        dialogs.value = dialogs.value.toSorted((a, b) => a.email.CreatedAt - b.email.CreatedAt)
        console.log(dialogs.value);
    }catch(err){
        console.log(err);
    }
}


onMounted(
    GetDialogs
);
</script>
