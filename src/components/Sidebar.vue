<template>
  <div class="d-flex flex-column flex-shrink-0 p-3 bg-body-tertiary"> 
    <div class="d-flex">
      <div class="d-flex align-items-center" :class="isColapsed ? ' col-12 justify-content-center' : 'col-2 justify-content-end'">
        <button type="button" class="btn py-1 px-2" @click="closeSidebar">
          <i v-if="!isColapsed" class="bi bi-caret-left-fill"></i>
          <i v-if="isColapsed" class="bi bi-caret-right-fill"></i>
        </button>
      </div>

      <div v-if="!isColapsed" class="col-10">
        <router-link to="/" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-body-emphasis text-decoration-none"> 
          <!-- <link rel="icon" type="image/svg+xml" href="../../public/BRM-logo.svg" /> -->
          <i class="bi bi-cpu-fill me-2 fs-3"></i>
          <span  class="fs-5">ООО БРМ</span> 
        </router-link> 
      </div>

    </div>
    
    <hr> 
    
    <ul class="nav nav-pills flex-column mb-auto"> 
      <li class="nav-item"> 
        <router-link to="/" v-slot="{ isActive }" custom> 
          <a class="nav-link text-decoration-none" 
             :class="[isActive ? 'active' : 'link-body-emphasis', isColapsed ? 'd-flex justify-content-center' : '']"
            
             @click="$router.push('/')"
             style="cursor: pointer;">
              <i class="bi bi-house-door" :class="[!isColapsed ? 'me-2' : '']"></i>
              {{ !isColapsed ? 'Главная ': '' }}
          </a>
        </router-link> 
      </li> 

      <li> 
        <router-link :to="{name: 'agreements'}" v-slot="{ isActive, navigate }" custom> 
          <a class="nav-link text-decoration-none" 
             :class="isActive ? 'active' : 'link-body-emphasis'"
             @click="navigate"
             style="cursor: pointer;">
            <i class="bi bi-building" :class="[!isColapsed ? 'me-2' : '']"></i>
            {{ !isColapsed ? 'Договоры ': '' }}
          </a>
        </router-link> 
      </li>

      <li> 
        <router-link :to="{name: 'employee-cards'}" v-slot="{ isActive, navigate }" custom>
          <a class="nav-link text-decoration-none" 
             :class="isActive ? 'active' : 'link-body-emphasis'"
             @click="navigate"
             style="cursor: pointer;">
            <i class="bi bi-people" :class="[!isColapsed ? 'me-2' : '']"></i>
            {{ !isColapsed ? 'Сотрудники ': '' }}
          </a> 
        </router-link>
      </li>

      <li> 
        <router-link :to="{name: 'suplers'}" v-slot="{ isActive, navigate }" custom>
          <a class="nav-link text-decoration-none" 
             :class="isActive ? 'active' : 'link-body-emphasis'"
             @click="navigate"
             style="cursor: pointer;">
            <i class="bi bi-diagram-3" :class="[!isColapsed ? 'me-2' : '']"></i>
            {{ !isColapsed ? 'Поставщики ': '' }}
          </a> 
        </router-link>
      </li> 

      <li> 
        <router-link :to="{name: 'dialogs'}" v-slot="{ isActive, navigate }" custom>
          <a class="nav-link text-decoration-none" 
             :class="isActive ? 'active' : 'link-body-emphasis'"
             @click="navigate"
             style="cursor: pointer;">
             <i class="bi bi-envelope-at" :class="[!isColapsed ? 'me-2' : '']"></i>
             {{ !isColapsed ? 'Сообщения ': '' }}
          </a> 
        </router-link>
      </li> 
    </ul> 
    
    <hr>
    
    <!-- --------- новый код chat: колокольчик рядом с логином внизу sidebar -->
    <div class="d-flex align-items-center justify-content-between gap-2" :class="{'flex-column':isColapsed}">
    <div class="dropdown"> 
      <a href="#" class="d-flex align-items-center link-body-emphasis text-decoration-none dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false"> 
        <strong v-if="user && !isColapsed">{{ user.login }}</strong><i v-else class="bi bi-person-circle" :title="user?.login || 'Пользователь'"></i> <!-- новый код chat: свёрнутая панель --> 
      </a> 
      <ul class="dropdown-menu text-small shadow"> 
        <li><router-link :to="{name: 'users-all'}" class="dropdown-item"> Пользователи</router-link></li> 
        <li><hr class="dropdown-divider"></li> 
        <li>
          <!-- Обязательно .prevent и href="#" -->
          <a class="dropdown-item text-danger" href="#" @click.prevent="handleLogout">
            <i class="bi bi-box-arrow-right me-2"></i>Выйти
          </a>
        </li> 
      </ul> 
    </div>
    <router-link :to="{name:'notifications'}" class="btn btn-outline-secondary btn-sm position-relative flex-shrink-0" :title="notificationsState.error || 'Уведомления'" :aria-label="`Уведомления, непрочитанных: ${notificationsState.unread}`">
        <i class="bi bi-bell"></i>
        <span v-if="notificationsState.unread" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size: 10px;">{{ notificationsState.unread > 99 ? '99+' : notificationsState.unread }}</span>
    </router-link>
    </div>
    <!-- --------- конец нового кода chat -->
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'; // новый код chat: жизненный цикл проверки уведомлений
import { useRouter, useRoute } from 'vue-router';
import api from '../api';
import { notificationsState, startNotifications, stopNotifications, refreshNotifications } from '../utils/notifications'; // новый код chat
import { clearFileAccess } from '../utils/fileAccess'; // новый код chat: удаление файловой cookie

const router = useRouter();

const emit = defineEmits(['isColapsed'])
const isColapsed = ref(false);

const route = useRoute(); // новый код chat: смена пользователя без перезагрузки
let currentUserToken = '';
const user = ref(null);

const getUserHandler = async() =>{
  try{
    const res = await api.get(`/users/${userId}`)
    if (requestToken === localStorage.getItem('user-token')) user.value = res.data; // новый код chat: не показываем ответ прошлого пользователя
    console.log("[User] ", res.data)
  }catch(err){
    console.log(err)
  }
}

const closeSidebar = () =>{
  if (isColapsed.value) {
    isColapsed.value = false;
    emit('isColapsed', false)
  }else{
    isColapsed.value = true;
    emit('isColapsed',true)
  }
}

const handleLogout = async () => {
  // --------- новый код chat: сначала завершаем доступ к файлам на сервере
  try { await clearFileAccess(); }
  catch (error) { window.alert(error.message || 'Не удалось выйти. Повторите попытку.'); return; }
  localStorage.removeItem('user-token');
  localStorage.removeItem('user-id');
  localStorage.removeItem('employee-card-id');
  refreshNotifications(); // новый код chat: сразу очищаем счётчик после выхода
  router.push('/login');
  // --------- конец нового кода chat
};

// --------- новый код chat: sidebar остаётся смонтированным даже на странице входа
watch(() => route.fullPath, () => {
  const token = localStorage.getItem('user-token') || '';
  if (token !== currentUserToken) { currentUserToken=token; user.value=null; getUserHandler(); refreshNotifications(1,true); }
}, {immediate:true});
// --------- конец нового кода chat
onMounted(startNotifications); // новый код chat
onBeforeUnmount(stopNotifications); // новый код chat
</script>

<style scoped>
.nav-link {
  transition: 0.2s;
}

.nav-link:hover:not(.active) {
  background-color: rgba(0,0,0,0.05);
}
</style>