<template>
    <div class="container-fluid">
        <div class="pt-3">
            <h4>Создать нового пользователя</h4>
            <hr>
        </div>
        <div class="pt-3" style="font-size: 14px;">
            <div class="col-6">
                <div class="d-flex">
                    <div class="col-6 px-1">
                        <label class="form-label">Логин</label>
                        <input v-model="formData.login" class="form-control form-control-sm" type="text">
                    </div>
                    <div class="col-6 px-1">
                        <label class="form-label">Пароль</label>
                        <input v-model="formData.password" class="form-control form-control-sm" type="text">
                    </div>
                </div>
                <div class="d-flex">
                    <div class="col-10 px-1 pt-3">
                        <label class="form-label">Сотрудник</label>
                        <select v-model="formData.employee_card_id" class="form-select form-select-sm" >
                            <option value="0">Сотрудник не выбран</option>
                            <option v-for="employee in employees" :key="employee.ID" :value="employee.ID">{{ employee.surname }} {{ employee.name }} {{ employee.middle_name }}</option>
                        </select>
                    </div>
                    <div class="col-2 px-1 pt-3 d-flex align-items-end justify-content-end">
                        <button type="button" class="btn btn-sm btn-primary px-3" @click="postUserHanlder()">Создать</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import api from '../../../api';

const formData = reactive({
    login: "",
    password: "",
    employee_card_id: 0
});

const employees = ref(null);

const postUserHanlder = async() =>{
    try{
        const res = await api.post('/users/create', formData)

        formData.login = ""
        formData.password = ""
        formData.employee_card_id = 0
    }catch(err){
        console.log(err)
    }
}

const getAllEmployeeCardhandler = async()=>{
    try{
        const res = await api.get('/employeecards')
        employees.value = res.data

        console.log(res.data)
    }catch(err){
        console.log(err)
    }
}

onMounted(getAllEmployeeCardhandler);
</script>

<style>

</style>