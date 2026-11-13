<template>
    <div class="container-fluid pt-3">
        <div>
            <h4>Выплаты:</h4>
            <hr>
        </div>

        <div>

            <div class="list-group">
                <div class="list-group-item d-flex gap-2">
                    <div style="width: 10%;">
                        <input class="form-control form-control-sm" type="number" placeholder="1000">
                    </div>
                    <div style="width: 20%;">
                        <select v-model="formData.flag" class="form-select form-select-sm">
                            <option value="advance">Аванс</option>
                            <option value="fine">Штраф</option>
                            <option value="bonus">Премия</option>
                        </select>
                    </div>
                    <div style="width: 20%;">
                        <select v-model="formData.employee_card_id" class="form-select form-select-sm">
                            <option v-for="employee in employees" :key="employee.ID" :value="employee.ID">{{ `${employee.surname}` }}</option>
                        </select>
                    </div>
                    <div style="width: 10%;">
                        <input class="form-control form-control-sm" type="date">
                    </div>
                    <div style="width: 30%;">
                        <input class="form-control form-control-sm" type="text" placeholder="Комментраний">
                    </div>
                </div>
                <div class="list-group-item d-flex fw-semibold" style="font-size: 14px;">
                    <div style="width: 3%;">№</div>
                    <div style="width: 7%;">Дата</div>
                    <div class="d-flex justify-content-center" style="width: 5%;">Флаг</div>
                    <div style="width: 5%;">Сумма</div>
                    <div style="width: 10%;">ФИО</div>
                    <div style="width: 65%;">Комментарий</div>
                </div>
                <div v-for="(payment, index) in payments" :key="payment.ID" class="list-group-item d-flex" style="font-size: 14px;">
                    <div style="width: 3%;">{{ index + 1 }}</div>
                    <div style="width: 7%;">{{formatDateStr(payment.date)}}</div>
                    <div class="d-flex align-items-center justify-content-center" style="width: 5%; font-size: 10px;">
                        <div class="border rounded-4 px-2 py-1 lh-1" :class="{'advance':'text-primary border-primary', 'bonus': 'text-success border-success','fine': 'text-danger border-danger'}[payment.flag]">
                            {{ {'advance': 'Аванс', 'bonus':'Премия', 'fine':'штраф'}[payment.flag] }}
                        </div>
                    </div>
                    <div style="width: 5%;">{{payment.summ}}</div>
                    <div style="width: 10%;">{{ `${payment.employee_card.surname} ${payment.employee_card.name[0]}. ${payment.employee_card.middle_name[0]}.` }}</div>
                    <div style="width: 65%;">{{ payment.message }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import api from '../../../../api';
import { onMounted, reactive, ref } from 'vue';
import { formatDateStr } from '../../../../utils/date';

const route = useRoute();

const payments = ref();
const employees = ref();

const formData = reactive({
    summ: 1000,
    employee_card_id: 165,
    agreement_id: parseInt(route.params.id,10),
    date: "2026-09-25",
    flag: "fine",
    message: "На продукты"
})

const getAllAgreementEmployeeHandler = async() =>{
    try{
        const res = await api.get(`/agreements/${route.params.id}/employee`)
        employees.value = res.data.sort((a, b) => a.surname.localeCompare(b.surname))
        console.log("[Employee agreement]: ", res.data)
    }catch(err){
        console.log(err)
    }
}

const getAllPaymentsHandler = async() =>{
    try{
        const res = await api.get(`/agreements/${route.params.id}/payment`)
        payments.value = res.data.sort((a, b) => b.ID - a.ID).sort((a, b) => new Date(b.date) - new Date(a.date))
        console.log("[Payments]: ", res.data)
    }catch(err){
        console.log(err)
    }
}

const createPaymentHandler = async() => {
    try{
        const res = await api.post(`/agreements/payments/create`, formData)
        console.log('[Успешно создан]')
        // getAllPayments();
    }catch(err){
        console.log(err)
    }
}

onMounted(getAllPaymentsHandler)
onMounted(getAllAgreementEmployeeHandler)
// onMounted(createPaymentHandler)
</script>

<style>

</style>