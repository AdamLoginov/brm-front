<template>
  <div>
    <h3>Создать карточку сотрудника </h3>
    <form @submit.prevent="submitForm">
        <div class="form-group">
            <label for="name">Имя сотрудника</label>
            <input type="text" id="name" v-model="formData.Name" placeholder="Введите имя" required/>
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <p v-if="success" class="success-msg">Карточка успешно создана!</p>
        <button type="submit" :disabled="loading">
            {{loading ? 'Отправка...' : 'Создать'}}
        </button>
    </form>
  </div>
</template>

<script setup>
    import {ref, reactive} from 'vue';
    import api from "../api";

    const formData = reactive ({
        Name: ''
    });
    const loading = ref(false);
    const success = ref(false);
    const error = ref(null);

    const submitForm = async () =>{
        try {
            const res = await api.post('/employees/create', formData);

            success.value = true;
            formData.Name = '';
        }catch(err){
            error.value = err.message;
        }finally{
            loading.value = false;
        }
    }


</script>

