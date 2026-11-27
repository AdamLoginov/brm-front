<!-- --------- новый код chat: отдельная страница задач -->
<template>
    <div class="container-fluid py-3 tasks-page"><TaskComponent /></div>
</template>
<script setup>
import TaskComponent from './TaskComponent.vue';
</script>
<style scoped>
/* новый код chat: список использует высоту отдельной страницы */
.tasks-page {max-width:1160px;margin-inline:0 auto;} /* новый код chat: выравнивание рядом с sidebar */
.tasks-page :deep(.task-list) {max-height:none;}
</style>
