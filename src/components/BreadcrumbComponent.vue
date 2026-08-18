<template>
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li v-for="(breadcrumb) in breadcrumbs" :key="breadcrumb.name" class="breadcrumb-item">
                <router-link :to="{name: breadcrumb.name, params: route.params}" class="disabled">{{ breadcrumb.title }}</router-link>
            </li>
        </ol>
    </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const breadcrumbs = computed(() => {
    console.log('[route]', route.meta.breadcrumb)
  return route.meta.breadcrumb || [];
});

</script>

<style>

</style>