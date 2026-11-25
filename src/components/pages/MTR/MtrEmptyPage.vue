<!-- --------- новый код chat: временная страница будущих разделов МТР -->
<template>
    <section class="border rounded-3 bg-white p-4 text-center">
        <h5 class="mb-2">{{ title }}</h5>
        <p class="mb-0 text-secondary">Раздел пока пуст. Учёт добавим позже.</p>
    </section>
</template>
<script setup>
// новый код chat: название передаётся маршрутом
defineProps({title:{type:String,required:true}});
</script>
<style scoped>
/* новый код chat: компактный заголовок пустого раздела */
h5 { font-size: 15px; }
</style>
<!-- --------- конец нового кода chat -->
