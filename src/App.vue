<template>
    <div class="pe-2">
        <div class="d-flex">
            <div class="p-0 sticky-top vh-100 flex-shrink-0" :style="isClose ? 'width: 80px;' : 'width: 200px;'">
                <Sidebar @isColapsed="getIsColapsed"/>
            </div>
            
            <div class="flex-grow-1 overflow-auto">
                <router-view />
            </div>
        </div>
    </div>
</template>
<script setup>
import { ref } from "vue";
import Sidebar from "./components/Sidebar.vue"

const isClose = ref(false);

const getIsColapsed = (payload) =>{
    isClose.value = payload;
}
</script>

<style scoped>
/* .sidebar-close{
    width: 100px;
}
.sidebar-{
    width: 100px;
} */
.sticky-top {
    z-index: 1000; 
    overflow-y: auto; 
}


.sticky-top > div {
    height: 100%;
}
</style>

