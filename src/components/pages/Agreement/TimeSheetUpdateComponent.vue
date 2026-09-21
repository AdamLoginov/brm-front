<template>
    <div>
        <button class="btn btn-sm btn-primary" type="button" data-bs-toggle="modal" data-bs-target="#change">изменить</button>


        <div class="modal fade" id="change" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="exampleModalLabel">Изменить табель</h1>
                    <button type="button" class="btn-close btn-sm" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="d-flex mb-3">
                        <div class="col-8">
                            <select v-model="formDataCreateTimeSheetMonth.month" class="form-select form-select-sm" aria-label="Small select example">
                                <option :value="0">Выберете месяц</option>
                                <option :value="1">Январь</option>
                                <option :value="2">Февраль</option>
                                <option :value="3">Март</option>
                                <option :value="4">Апрель</option>
                                <option :value="5">Май</option>
                                <option :value="6">Июнь</option> 
                                <option :value="7">Июль</option>
                                <option :value="8">Август</option>
                                <option :value="9">Сентябрь</option>
                                <option :value="10">Октябрь</option>
                                <option :value="11">Ноябрь</option>
                                <option :value="12">Декабрь</option>
                            </select>
                        </div>
                        <div class="col-4 ps-3">
                            <select v-model="formDataCreateTimeSheetMonth.year" class="form-select form-select-sm" aria-label="Small select example">
                                <option selected>год</option>
                                <option :value="2025">2025</option>
                                <option :value="2026">2026</option>
                                <option :value="2027">2027</option>
                                <option :value="2028">2028</option>
                                <option :value="2029">2029</option>
                                <option :value="2030">2030</option>
                            </select>
                        </div>
                    </div>
                    <MultiSelect v-model="formDataCreateTimeSheetMonth.employee_card_id" :options="employees" :label-key="employee =>`${employee.surname} ${employee.name.at(0)}.${employee.middle_name.at(0)}.`" placeholder="Выбрать сотрудников"/>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Закрыть</button>
                    <button type="button" class="btn btn-primary btn-sm" @click="updateTimeSheetMonthHandler()">Сохранить</button>
                </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch, watchEffect } from 'vue';
import api from '../../../api.js';
import MultiSelect from '../../MultiSelect.vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const employees = ref([])

const formDataCreateTimeSheetMonth = reactive({
    month: 1,
    year: 2026,
    timesheet_month_id: 0,
    employee_card_id: []
})

const props = defineProps({
    employees_id: {
        type: Array,
        default: []
    },
    month: {
        type: Number,
        default: 1
    },
    year: {
        type: Number,
        default: 2026
    },
    timesheetMonth_id: {
        type:Number,
        default: 0
    }
})

const getEmployeeCardHandler = async() =>{
    try{
        const res = await api.get(`/agreements/${route.params.id}/employee`)
        employees.value = res.data
        console.log("[Employee component]", employees.value)
    }catch(err){
        console.log(err)
    }
}

const updateTimeSheetMonthHandler = async() => {
    try{
        console.log("[Form Data ]", formDataCreateTimeSheetMonth)
        const res = await api.post('/agreements/timesheetmonth/update', formDataCreateTimeSheetMonth)
        window.location.reload()
    }catch(err){
        console.log(err)
    }
}

watch(() => props.employees_id, (employees_id) => {
    formDataCreateTimeSheetMonth.employee_card_id = employees_id.map(item => item.ID)
}, {immediate:true})

watch(() => props.month, (month) => {
    formDataCreateTimeSheetMonth.month = month
}, {immediate:true})

watch(() => props.year, (year) => {
    formDataCreateTimeSheetMonth.year = year
}, {immediate:true})

watch(() => props.timesheetMonth_id, (id) => {
    formDataCreateTimeSheetMonth.timesheet_month_id = id
}, {immediate:true})

onMounted(getEmployeeCardHandler);
</script>

<style>

</style>