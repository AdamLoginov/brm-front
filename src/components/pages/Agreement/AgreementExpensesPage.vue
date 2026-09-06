<template>
    <div class="container-fluid pt-4">
        <div>
            <h4>
                Расходы
            </h4>
            <hr>
        </div>

        <div>
            <form @submit.prevent="postExpensesHandler">
                <div class="row d-flex align-items-end" style="font-size: 14px;">

                    <div class="col-md-5">
                        <label class="form-label">Наименование</label>
                        <input v-model="formData.name" type="text" class="form-control form-control-sm" placeholder="Наименование">
                    </div>

                    <div class="col-md-2">
                        <label class="form-label">Сотрудник</label>
                        <select v-model="formData.employee_card_id" class="form-select form-select-sm">
                            <option selected :value=0>Выбрать сотрудника</option>
                            <option v-for="managerCard in managerCards" :key="managerCard.ID" :value="managerCard.ID"> {{ managerCard.surname }} {{ managerCard.name.at(0) }}.{{ managerCard.middle_name.at(0) }}.</option>
                        </select>
                    </div>

                    <div class="col-md-1">
                        <label class="form-label">Цена</label>
                        <input v-model="formData.price" type="number" class="form-control form-control-sm" placeholder="Цена">
                    </div>

                    <div class="col-md-2">
                        <label class="form-label">Счет</label>
                        <select v-model="formData.account" class="form-select form-select-sm">
                            <option selected value="none">Не указан</option>
                            <option  value="company">Компании</option>
                            <option  value="employee">Личный</option>
                        </select>
                    </div>
                    
                    <div class="col-md-1">
                        <button class="btn btn-primary btn-sm" type="submit" :disabled="isSubmit">Добавить</button>
                    </div>

                </div>
            </form>
        </div>

        <div class="pt-3">
            <div class="list-group col-11" style="font-size: 14px;">

                <div class="list-group-item d-flex fw-semibold">
                    <div class="col-1 d-flex">
                        <div class="col-2">
                            №
                        </div>
                        <div class="col-10 d-flex justify-content-center">
                            Дата
                        </div>
                    </div>
                    <div class="col-1 d-flex justify-content-center">Счет</div> 
                    <div class="col-1">Цена</div>
                    <div class="col-2">Сотрудник</div>
                    <div class="col-6">Наименование</div>
                </div>

                <div v-for="(item, index) in expenses" :key="item.ID" class="list-group-item d-flex">
                    <div class="col-1 d-flex">
                        <div class="col-2">
                            {{ index + 1  }}
                        </div>
                        <div class="col-10 d-flex justify-content-center">
                            {{ onlyDate(item.UpdatedAt) }}
                        </div>
                    </div>
                    <div class="col-1 d-flex justify-content-center" style="font-size: 10px;">
                        <div class="border rounded-5 lh-1 align-content-center px-2" 
                        :class="{'company': 'border-success text-success', 'employee': 'border-primary text-primary', 'none': 'border-danger text-danger'}[item.account]">
                            {{ item.account === "company"? "Компании" : item.account === "employee" ? "Личный" : "Не указан" }}
                        </div>
                    </div>
                    <div class="col-1">{{ item.price }}</div>
                    <div class="col-2">{{ item.employee_card.surname }} {{ item.employee_card.name.at(0) }}.{{ item.employee_card.middle_name.at(0) }}.</div>
                    <div class="col-6">{{ item.name }}</div>
                    <div class="col-1 d-flex justify-content-end">
                        <div class="btn-group">
                            <button class="btn p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a href="" class="dropdown-item">Изменить</a></li>
                                <li><a class="dropdown-item text-danger" @click.prevent="deleteExpensesHandler(item.ID)">Удалить</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>

</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import api from '../../../api';
import { useRoute } from 'vue-router';
import { formatDate } from '../../../utils/date';

const route = useRoute();
const agreement_id = route.params.id
const isSubmit = ref(false);

const expenses = ref(null);
const managerCards = ref(null);
const formData = reactive({
    agreement_id: Number(agreement_id),
    name: "",
    price: "",
    account: "none",
    employee_card_id: parseInt(localStorage.getItem('employee-card-id'))|| ''
});

const onlyDate = (date) =>{
    return formatDate(date).split(" ")[1];
}

const postExpensesHandler = async()=>{
    try{
        isSubmit.value = true;
        console.log(formData)
        const res = await api.post(`/agreements/${agreement_id}/expenses/create`, formData);
        formData.name = "";
        formData.price = "";
        formData.manager_card_id = 0;
        getExpensesHandler();
    }catch(err){
        console.log(err);
    }finally{
        isSubmit.value = false;
    }
};

const getExpensesHandler = async()=>{
    try{
        // console.log("LocalStorage",localStorage.getItem('name') || '')
        const res = await api.get(`/agreements/${agreement_id}/expenses`);
        expenses.value = res.data.expenses.reverse()
        console.log(res.data);
    }catch(err){
        console.log(err);
    }
};

const getAllManagerCardHandler = async() =>{
    try{
        const res = await api.get('/employeecards');
        managerCards.value = res.data;
        console.log(res.data)
    }catch(err){
        console.log('[Error] ', err);
    }
};

const deleteExpensesHandler = async(id)=>{
    try{
        const res = await api.delete(`/expenses/delete/${id}`)
        expenses.value = expenses.value.filter(item => item.ID !== id)
    }catch(err){
        console.log(err)
    }
};

onMounted(getExpensesHandler);
onMounted(getAllManagerCardHandler);
</script>

<style>

</style>