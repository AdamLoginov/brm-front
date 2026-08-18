<template>
    <div class="">
        <button type="button" class="btn btn-outline-danger" @click="deleteMaterials(props.url, props.id)">
            <i class="bi bi-trash3"></i>
        </button>
    </div>
</template>

<script setup>
    import { ref } from 'vue';
    import api from '../api';
    const error = ref(null);

    const props = defineProps({
        id: String,
        url: String
    });
    const emit = defineEmits(['delete-me']);


    const deleteMaterials = async(url,id) =>{
        try{
            const res = await api.delete(`${url}/${id}`);
            emit('delete-me', props.id);
        }catch(err){
            error.value = err.message;
            console.log("Ошибка удаления элемента", err);
        }
        
    };
</script>

<style>

</style>