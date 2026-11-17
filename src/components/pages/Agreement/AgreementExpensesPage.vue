<template>
    <div> <!-- новый код chat: общая панель и контейнер находятся в AgreementSalaryPage -->
        <div v-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div> <!-- новый код chat -->

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
                            <option v-for="managerCard in managerCards" :key="managerCard.ID" :value="managerCard.ID"> {{ managerCard.surname }} {{ managerCard.name?.at(0) || '' }}.{{ managerCard.middle_name?.at(0) || '' }}.</option>
                        </select>
                    </div>

                    <div class="col-md-1">
                        <label class="form-label">Цена</label>
                        <MoneyInputComponent v-model="formData.price" required class="form-control form-control-sm" placeholder="Цена" /> <!-- новый код chat: денежное поле с разделением разрядов -->
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
                    <div class="col-2">Статус</div> <!-- новый код chat -->
                    <div class="col-4">Наименование</div>
                </div>

                <div v-for="(item, index) in expenses" :key="item.ID" class="list-group-item d-flex">
                    <div class="col-1 d-flex">
                        <div class="col-2">
                            {{ index + 1  }}
                        </div>
                        <div class="col-10 d-flex justify-content-center">
                            {{ onlyDate(item.CreatedAt) }} <!-- новый код chat: дата расхода не меняется при возмещении -->
                        </div>
                    </div>
                    <div class="col-1 d-flex justify-content-center" style="font-size: 10px;">
                        <div class="border rounded-5 lh-1 align-content-center px-2" 
                        :class="{'company': 'border-success text-success', 'employee': 'border-primary text-primary', 'none': 'border-danger text-danger'}[item.account]">
                            {{ item.account === "company"? "Компании" : item.account === "employee" ? "Личный" : "Не указан" }}
                        </div>
                    </div>
                    <div class="col-1">{{ item.price }}</div>
                    <div class="col-2">{{ item.employee_card.surname }} {{ item.employee_card.name?.at(0) || '' }}.{{ item.employee_card.middle_name?.at(0) || '' }}.</div>
                    <!-- новый код chat: статус только у личных расходов -->
                    <div class="col-2"><span v-if="item.account === 'employee'" class="badge border rounded-5 bg-white fw-normal" :class="item.is_reimbursed ? 'text-success border-success' : 'text-warning border-warning'">{{ item.is_reimbursed ? 'Возмещён' : 'Не возмещён' }}</span><span v-else>—</span></div>
                    <div class="col-4">{{ item.name }}</div>
                    <div class="col-1 d-flex justify-content-end">
                        <div class="btn-group">
                            <button class="btn p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li v-if="item.account === 'employee'"><button class="dropdown-item" :disabled="statusBusy" @click="changeReimbursement(item)">{{ item.is_reimbursed ? 'Отметить как не возмещённый' : 'Отметить как возмещённый' }}</button></li> <!-- новый код chat -->
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
import { onMounted, reactive, ref, computed, watch } from 'vue'; // новый код chat: обновление при смене договора
import api from '../../../api';
import MoneyInputComponent from '../../MoneyInputComponent.vue'; // новый код chat: общее денежное поле
import { useRoute } from 'vue-router';
import { formatDate } from '../../../utils/date';

const route = useRoute();
const agreement_id = computed(() => route.params.id); // новый код chat
const errorMessage = ref(''), statusBusy = ref(false); // новый код chat
const isSubmit = ref(false);

const expenses = ref(null);
const managerCards = ref(null);
const formData = reactive({
    agreement_id: Number(agreement_id.value), // новый код chat
    name: "",
    price: "",
    account: "none",
    employee_card_id: parseInt(localStorage.getItem('employee-card-id'))|| ''
});

const onlyDate = (date) =>{
    return formatDate(date).split(" ")[1];
}

const postExpensesHandler = async()=>{
    // --------- новый код chat: сохраняем проверки прежнего number-поля и числовой формат API
    const price = String(formData.price).trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(price) || !Number.isFinite(Number(price))) {
        errorMessage.value = 'Введите неотрицательную сумму расхода с точностью до копеек.';
        return;
    }
    // --------- конец нового кода chat
    try{
        isSubmit.value = true;
        errorMessage.value = ''; // новый код chat
        formData.agreement_id = Number(agreement_id.value); // новый код chat
        console.log(formData)
        const res = await api.post(`/agreements/${agreement_id.value}/expenses/create`, {...formData, price:Number(price)}) // новый код chat: backend ожидает число;
        formData.name = "";
        formData.price = "";
        formData.manager_card_id = 0;
        getExpensesHandler();
    }catch(err){
        errorMessage.value = typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось обработать расходы'; // новый код chat
        console.log(err);
    }finally{
        isSubmit.value = false;
    }
};

const getExpensesHandler = async()=>{
    const agreementID = agreement_id.value; // новый код chat: защита от ответа предыдущего договора
    try{
        // console.log("LocalStorage",localStorage.getItem('name') || '')
        const res = await api.get(`/agreements/${agreementID}/expenses`); // новый код chat
        if (agreementID !== agreement_id.value) return; // новый код chat
        expenses.value = (res.data.expenses || []).slice().reverse() // новый код chat: пустой список расходов
        console.log(res.data);
    }catch(err){
        errorMessage.value = typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось обработать расходы'; // новый код chat
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

// --------- новый код chat: ручное возмещение и отмена возмещения
const changeReimbursement = async(item) => {
    if (statusBusy.value) return;
    const agreementID = agreement_id.value;
    statusBusy.value = true; errorMessage.value = '';
    try {
        const res = await api.patch(`/agreements/${agreementID}/expenses/${item.ID}/status`, {is_reimbursed: !item.is_reimbursed});
        if (agreementID === agreement_id.value) expenses.value = expenses.value.map(row => row.ID === item.ID ? res.data : row);
    } catch (err) {
        if (agreementID === agreement_id.value) errorMessage.value = typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось изменить статус';
    } finally { statusBusy.value = false; }
};
// --------- конец нового кода chat

// новый код chat: отдельные расходы для текущего договора
watch(agreement_id, () => { expenses.value = []; errorMessage.value = ''; getExpensesHandler(); }, {immediate:true});
onMounted(getAllManagerCardHandler);
</script>

<style>

</style>
