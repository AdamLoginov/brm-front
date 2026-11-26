<!-- --------- новый код chat: общая оболочка разделов зарплаты договора -->
<template>
    <div class="container-fluid pt-4" style="font-size: 14px;">
        <h4>Данные по выплатам</h4>
        <nav class="nav nav-tabs mb-3" aria-label="Разделы зарплаты договора">
            <!-- новый код chat: стрелка возврата к договору -->
            <router-link :to="{name:'agreement', params:{id:route.params.id}}" class="nav-link" title="Вернуться к договору" aria-label="Вернуться к договору">
                <i class="bi bi-arrow-left" aria-hidden="true"></i>
            </router-link>
            <!-- новый код chat: табель в общей оболочке -->
            <router-link :to="{name:'agreement-timesheet-detail', params:{id:route.params.id}}" class="nav-link" exact-active-class="active">Табель</router-link>
            <router-link :to="{name:'agreement-daily-allowance', params:{id:route.params.id}}" class="nav-link" exact-active-class="active">Суточные</router-link> <!-- новый код chat: после табеля -->
            <router-link :to="{name:'agreement-salary-accruals', params:{id:route.params.id}}" class="nav-link" exact-active-class="active">Начисления</router-link>
            <router-link :to="{name:'agreement-salary-advances', params:{id:route.params.id}}" class="nav-link" exact-active-class="active">Авансы</router-link>
            <router-link :to="{name:'agreement-salary-alimony', params:{id:route.params.id}}" class="nav-link" exact-active-class="active">Алименты</router-link> <!-- новый код chat -->
            <router-link :to="{name:'agreement-salary-penalties', params:{id:route.params.id}}" class="nav-link" exact-active-class="active">Штрафы</router-link>
            <router-link :to="{name:'expenses', params:{id:route.params.id}}" class="nav-link" exact-active-class="active">Расходы</router-link> <!-- новый код chat -->
            <router-link :to="{name:'agreement-salary-bonuses', params:{id:route.params.id}}" class="nav-link" exact-active-class="active">Премии</router-link> <!-- новый код chat -->
            <router-link :to="{name:'agreement-salary-debts', params:{id:route.params.id}}" class="nav-link" exact-active-class="active">Долги</router-link> <!-- новый код chat -->
            <!-- новый код chat: книга наряд-заданий и склад в конце панели -->
            <router-link :to="{name:'agreement-work-orders', params:{id:route.params.id}}" class="nav-link" exact-active-class="active">Книга наряд-заданий</router-link>
            <router-link :to="{name:'agreement-warehouse', params:{id:route.params.id}}" class="nav-link" exact-active-class="active">Склад</router-link>
        </nav>
        <!-- новый код chat: премии подключены к общей навигации -->
        <div class="salary-content">
            <router-view />
        </div>
    </div>
</template>
<!-- --------- конец нового кода chat -->

<script setup>
// --------- новый код chat: общий контекст договора для ссылок
import { useRoute } from 'vue-router';

const route = useRoute();
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: область содержимого сохраняет высоту при загрузке */
.salary-content {
    min-height: 60vh;
}
/* --------- конец нового кода chat */
</style>
