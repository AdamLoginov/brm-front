<template>
  <div class="d-flex flex-column flex-shrink-0 p-3 bg-body-tertiary"> 
    <div class="d-flex">

      <div v-if="!isColapsed" class="col-10">
        <router-link to="/" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-body-emphasis text-decoration-none"> 
          <i class="bi bi-cpu-fill me-2 fs-3"></i>
          <span  class="fs-5">ООО БРМ</span> 
        </router-link> 
      </div>

      <div class="d-flex align-items-center" :class="isColapsed ? ' col-12 justify-content-center' : 'col-2 justify-content-end'">
        <button type="button" class="btn py-1 px-2" @click="closeSidebar">
          <i v-if="!isColapsed" class="bi bi-caret-left-fill"></i>
          <i v-if="isColapsed" class="bi bi-caret-right-fill"></i>
        </button>
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
    
    <div class="dropdown"> 
      <a href="#" class="d-flex align-items-center link-body-emphasis text-decoration-none dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false"> 
        <img v-if="!isColapsed" src="https://github.com/mdo.png" alt="" width="32" height="32" class="rounded-circle me-2"> 
        <strong>mdo</strong> 
      </a> 
      <ul class="dropdown-menu text-small shadow"> 
        <li><a class="dropdown-item" href="#">Настройки</a></li> 
        <li><a class="dropdown-item" href="#">Профиль</a></li> 
        <li><hr class="dropdown-divider"></li> 
        <li>
          <!-- Обязательно .prevent и href="#" -->
          <a class="dropdown-item text-danger" href="#" @click.prevent="handleLogout">
            <i class="bi bi-box-arrow-right me-2"></i>Выйти
          </a>
        </li> 
      </ul> 
    </div> 
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const emit = defineEmits(['isColapsed'])
const isColapsed = ref(false);

const closeSidebar = () =>{
  if (isColapsed.value) {
    isColapsed.value = false;
    emit('isColapsed', false)
  }else{
    isColapsed.value = true;
    emit('isColapsed',true)
  }
}

const handleLogout = () => {
  localStorage.removeItem('user-token');
  router.push('/login'); 
};
</script>

<style scoped>
.nav-link {
  transition: 0.2s;
}

.nav-link:hover:not(.active) {
  background-color: rgba(0,0,0,0.05);
}
</style>