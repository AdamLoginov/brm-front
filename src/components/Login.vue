<template>
    <div class="block-sign d-flex align-items-center py-4">
        <div class="form-signin w-100 m-auto"> 
            <form @submit.prevent="submitForm"> 
                <h1 class="h3 mb-3 fw-normal">Войти</h1> 
                <div class="form-floating"> 
                    <input v-model="fromData.login" type="text" class="form-control" id="floatingInput" placeholder="name@example.com"> 
                    <label class="text-secondary" >Логин</label> 
                </div> 
                <div class="form-floating mb-3"> 
                    <input v-model="fromData.password" type="password" class="form-control" id="floatingPassword" placeholder="Password"> 
                    <label class="text-secondary" for="floatingPassword">Пароль</label> 
                </div>
                <div>
                    <p v-if="error" class="error-msg">{{ error }}</p>
                    <p v-if="success" class="success-msg">Вход успешен !</p>
                </div>

                <button class="btn btn-primary w-100 py-2" type="submit" :disabled="loading">
                    {{loading ? 'Ожидание...' : 'Войти'}}
                </button> 
            </form> 
        </div>
    </div>
</template>

<script setup>
    import {reactive, ref} from 'vue';
    import api from '../api';
    import router from '../router/index';
    const fromData = reactive({
        login: '',
        password: ''
    });

    const loading = ref(false);
    const success = ref(false);
    const error = ref(null);

    const submitForm = async () =>{
        try{
            loading.value = true;

            const res = await api.post('/login', fromData);
            localStorage.setItem('user-token', res.data.token);
            localStorage.setItem('user-id', res.data.user_id)
            router.push('home')
            success.value = true;
        }catch(err){
            error.value = err.message;
        }finally{
            loading.value = false;
        }
    }


</script>

<style scoped>
.form-signin {
    max-width: 330px;
    padding: 1rem;
}
.block-sign{
    height: 85vh
}
</style>