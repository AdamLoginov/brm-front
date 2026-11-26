<template>
  <div class="container-fluid pt-3">
    <div>
        <div class="d-flex justify-content-between align-items-center">
            <h4>Пользователи</h4>
            <router-link :to="{name: 'user-create'}">Создать нового пользователя</router-link>
        </div>
        <hr>
    </div>
    <div class="col-9 pt-3">
        <div class="list-group" style="font-size: 14px;">
            <div class="list-group-item d-flex fw-semibold">
                <div class="col-2 d-flex">
                    <div class="col-2"></div>
                    <div class="col-10">Логин</div>
                    </div>
                <div class="col-3">ФИО</div>
                <div class="col-6">Последняя активность <span class="text-secondary fw-normal">(МСК)</span></div> <!-- новый код chat -->
            </div>
            <div v-for="(user, index) in users" :key="user.ID" class="list-group-item d-flex">
                <div class="col-2 d-flex">
                    <div class="col-2">{{ index + 1 }}</div>
                    <div class="col-10">{{ user.login }}</div>
                    </div>
                <div class="col-3">{{ user.employee_card.surname }} {{ user.employee_card.name }} {{ user.employee_card.middle_name }}</div>
                <div class="col-6">{{ formatLastActivity(user.last_active_at) }}</div> <!-- новый код chat: дата посещения или прочерк -->
                <div class="col-1 d-flex justify-content-end">
                    <div class="dropdown">
                        <a class="text-dark" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-three-dots-vertical"></i>
                        </a>
                        <ul class="dropdown-menu">
                            <li><router-link  class="dropdown-item" type="button" :to="{name: 'user-upload', params:{id: user.ID}}">Изменить</router-link></li>
                            <li><a class="dropdown-item text-danger" type="button" @click="deleteUserHandler(user.ID)">Удалить</a></li>
                        </ul>
                    </div>
                </div>
            </div>

        </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import api from '../../../api';
import { useRoute } from 'vue-router';

const route = useRoute();

const users = ref(null);
// новый код chat: единый часовой пояс независимо от настроек компьютера
const formatLastActivity = value => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('ru-RU', {timeZone:'Europe/Moscow', day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
};


const deleteUserHandler = async(id) => {
    if (!window.confirm('Удалить пользователя?')) return; // новый код chat: подтверждение удаления
    try{
        const res = await api.delete(`/users/delete/${id}`)

        users.value = users.value.filter(item => item.ID !== id)
    }catch(err){
        console.log(err)
    }
}

const getAllUsershandler = async() =>{
    try{
        const res = await api.get('/users');
        users.value = res.data;
        console.log("[Users]: ", res.data)
    }catch(err){
        console.log(err)
    }
}

onMounted(getAllUsershandler);
</script>

<style>

</style>
