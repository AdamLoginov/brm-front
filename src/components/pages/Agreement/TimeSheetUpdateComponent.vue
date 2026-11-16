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
                    <!-- --------- новый код chat: настройки смены и автоматических штрафов -->
                    <div v-if="settingsError" class="alert alert-danger" role="alert">{{ settingsError }}</div>
                    <div class="row g-2 mb-3">
                        <div class="col-6">
                            <label class="form-label" for="update-shift-hours">Часов в смене</label>
                            <input id="update-shift-hours" v-model="formDataCreateTimeSheetMonth.shift_hours" type="text" inputmode="decimal" class="form-control form-control-sm" placeholder="12">
                        </div>
                        <div class="col-6">
                            <label class="form-label" for="update-absence-penalty">Штраф за прогул, ₽</label>
                            <input id="update-absence-penalty" v-model="formDataCreateTimeSheetMonth.absence_penalty" type="text" inputmode="decimal" class="form-control form-control-sm" placeholder="0,00">
                        </div>
                    </div>
                    <!-- новый код chat: суточные сохраняются в настройках табеля -->
                    <div class="mb-3">
                        <label class="form-label" for="update-daily-allowance">Суточные, ₽</label>
                        <input id="update-daily-allowance" v-model="formDataCreateTimeSheetMonth.daily_allowance" type="text" inputmode="decimal" class="form-control form-control-sm" placeholder="0,00">
                    </div>
                    <!-- --------- конец нового кода chat -->
                    <MultiSelect v-model="formDataCreateTimeSheetMonth.employee_card_id" :options="employees" :label-key="employee =>`${employee.surname} ${employee.name.at(0)}.${employee.middle_name.at(0)}.`" placeholder="Выбрать сотрудников"/>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Закрыть</button>
                    <button type="button" class="btn btn-primary btn-sm"  :disabled="settingsSaving" @click="updateTimeSheetMonthHandler()">Сохранить</button>
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
// --------- новый код chat: проверка настроек перед отправкой
const settingsError = ref('');
const settingsSaving = ref(false);
const validateSettings = () => {
    settingsError.value = '';
    const hours = String(formDataCreateTimeSheetMonth.shift_hours).trim().replace(',', '.');
    const penalty = String(formDataCreateTimeSheetMonth.absence_penalty).trim().replace(',', '.');
    const dailyAllowance = String(formDataCreateTimeSheetMonth.daily_allowance).trim().replace(',', '.'); // новый код chat
    const decimal = /^\d+(?:\.\d{1,2})?$/;
    if (!decimal.test(hours) || Number(hours) <= 0 || Number(hours) > 24 || !decimal.test(penalty) || !decimal.test(dailyAllowance)) {
        settingsError.value = 'Часы: больше 0 и не больше 24. Штраф и суточные: не меньше 0. До двух знаков после запятой.';
        return false;
    }
    formDataCreateTimeSheetMonth.shift_hours = hours;
    formDataCreateTimeSheetMonth.absence_penalty = penalty;
    formDataCreateTimeSheetMonth.daily_allowance = dailyAllowance; // новый код chat
    return true;
};
// --------- конец нового кода chat


const formDataCreateTimeSheetMonth = reactive({
    month: 1,
    year: 2026,
    timesheet_month_id: 0,
    employee_card_id: [],
    shift_hours: '12', // новый код chat
    absence_penalty: '0', // новый код chat
    daily_allowance: '0', // новый код chat: суточные
})

const props = defineProps({
    daily_allowance_kopecks: {type: Number, default: 0}, // новый код chat
    // --------- новый код chat: настройки выбранного табеля
    shift_hours: {type: String, default: '12'},
    absence_penalty_kopecks: {type: Number, default: 0},
    // --------- конец нового кода chat
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
    if (settingsSaving.value || !validateSettings()) return; // новый код chat
    settingsSaving.value = true; // новый код chat
    try{
        console.log("[Form Data ]", formDataCreateTimeSheetMonth)
        const res = await api.post('/agreements/timesheetmonth/update', formDataCreateTimeSheetMonth)
        window.location.reload()
    }catch(err){
        console.log(err)
        settingsError.value = typeof err.response?.data === 'string' ? err.response.data : 'Не удалось сохранить табель.'; // новый код chat
    } finally { settingsSaving.value = false; } // новый код chat
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

// --------- новый код chat: подстановка настроек в форму изменения
watch(() => props.shift_hours, value => { formDataCreateTimeSheetMonth.shift_hours = value || '12'; }, {immediate:true});
watch(() => props.absence_penalty_kopecks, value => {
    const cents = BigInt(value || 0);
    formDataCreateTimeSheetMonth.absence_penalty = `${cents / 100n}.${String(cents % 100n).padStart(2,'0')}`;
}, {immediate:true});
// --------- конец нового кода chat
// --------- новый код chat: показать сохранённые суточные в рублях
watch(() => props.daily_allowance_kopecks, value => {
    const cents = BigInt(value || 0);
    formDataCreateTimeSheetMonth.daily_allowance = `${cents / 100n}.${String(cents % 100n).padStart(2,'0')}`;
}, {immediate:true});
// --------- конец нового кода chat
onMounted(getEmployeeCardHandler);
</script>

<style>

</style>