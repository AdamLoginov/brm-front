<!-- --------- новый код chat: общая навигация МТР и разделов договора -->
<template>
    <div class="container-fluid pt-4 mtr-page">
        <h4>МТР</h4>
        <nav class="nav nav-tabs mb-3" aria-label="Разделы МТР">
            <router-link v-if="!isGlobal" :to="{name:'agreement', params:{id:route.params.id}}" class="nav-link" title="Вернуться к договору" aria-label="Вернуться к договору"><i class="bi bi-arrow-left" aria-hidden="true"></i></router-link>
            <router-link v-for="tab in tabs" :key="tab.label" :to="{name:isGlobal ? tab.global : tab.agreement, params:isGlobal ? {} : {id:route.params.id}}" class="nav-link" exact-active-class="active">{{ tab.label }}</router-link>
        </nav>
        <div class="mtr-content"><router-view /></div>
    </div>
</template>
<script setup>
// --------- новый код chat: ссылки сохраняют контекст общего списка или договора
import { computed } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();
const isGlobal = computed(() => route.meta.mtrGlobal === true);
const tabs = [
    {label:'Инструменты', global:'mtr', agreement:'agreement-tools'},
    {label:'СИЗ', global:'mtr-ppe', agreement:'agreement-ppe'},
    {label:'Расходники', global:'mtr-consumables', agreement:'agreement-consumables'},
];
// --------- конец нового кода chat
</script>
<style scoped>
/* новый код chat: панель в стиле табеля, стабильная высота содержимого */
.mtr-page { font-size: 14px; }
.mtr-content { min-height: 60vh; }
</style>
<!-- --------- конец нового кода chat -->
