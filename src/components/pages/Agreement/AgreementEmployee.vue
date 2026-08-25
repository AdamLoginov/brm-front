<template>
    <div class="container-fluid pt-3">
        <div>
            <h4>Табель договора:</h4>
            <!-- <router-link :to="{name: 'agreement-employee-append'}">Добавить сотрудников</router-link> -->
            <hr>
        </div>


        <div class="list-group">
            <div class="list-group-item d-flex">
                <div class="col-8"> </div>
                <div class="col-2">
                    <select v-model="month" class="form-select form-select-sm" aria-label=".form-select-sm example">
                        <option value="1">Январь</option>
                        <option value="2">Февраль</option>
                        <option value="3">Март</option>
                        <option value="4">Апрель</option>
                        <option value="5">Май</option>
                        <option value="6">Июнь</option>
                        <option value="7">Июль</option>
                        <option value="8">Август</option>
                        <option value="9">Сентябрь</option>
                        <option value="10">Октябрь</option>
                        <option value="11">Ноябрь</option>
                        <option value="12">Декабрь</option>
                    </select>
                </div>
                <div class="col-1 ps-2">
                    <button type="button" class="btn btn-primary btn-sm">Применить</button>
                </div>
                <div class="col-1 ps-2">
                    <button type="button" class="btn  btn-sm" :class="isChange ? 'btn-success' : 'btn-primary'" @click="isChange ? postTimesheetHandler() : changeTimesheet()">{{ isChange ? 'Сохранить' : 'Изменить' }}</button>
                </div>
            </div>
            <div class="list-group-item d-flex p-0">
                <div class="col-3 px-2 fw-semibold" style="font-size: 14px;">Сотрудник:</div>
                <div class="col-9 days-grid" :style="{ '--days-count': daysInMonth }" >
                    <div v-for="day in daysInMonth" :key="day" class="day-cell d-flex justify-content-center align-items-center fw-semibold" style="font-size: 12px;">
                        {{ day }}
                    </div>
                </div>
            </div>
            <div v-for="(employee, index) in employees" :key="employee.ID" class="list-group-item d-flex p-0">
                <div class="col-3 px-2 d-flex" style="font-size: 14px;">
                    <div class="col-1 border-end d-flex justify-content-center me-1 fw-semibold">{{ index + 1 }}</div>
                    <div class="col-11">{{ employee.surname }} {{ employee.name }} {{ employee.middle_name }}</div>
                </div>
                <div class="col-9 days-grid" :style="{ '--days-count': daysInMonth }">
                    <div v-for="day in daysInMonth" :key="day" class="day-cell d-flex justify-content-center align-items-center fw-semibold" style="font-size: 12px;" :style="`background-color: ${timesheet_color[timesheet[employee.ID][getDate(day, month, year)]['status']]};`">
                        <input v-if="isChange" class="text-center" v-model="timesheet[employee.ID][getDate(day, month, year)]['status']" type="text" maxlength="2" @input="validateTimesheetInput(employee.ID, getDate(day, month, year))">
                        <div v-else class="text-center">{{ timesheet[employee.ID][getDate(day, month, year)]['status'] }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, toRaw, onBeforeUnmount } from 'vue';
import api from '../../../api';
import { useRoute, onBeforeRouteLeave } from 'vue-router';

const route = useRoute();

const month = ref(new Date().getMonth() + 1);
const year = ref(new Date().getFullYear());
const isChange = ref(false);

const employees = ref(null);
const timesheet = ref({});

const timesheet_color = {
    'П': '#dd4433',
    'Б': '#fff200',
    '0': '#fff200',
    '1':  '#B8F0B5',
    '2':  '#A9EBAA',
    '3':  '#9AE69E',
    '4':  '#8BE193',
    '5':  '#7CDC87',
    '6':  '#6DD77B',
    '7':  '#5ED26F',
    '8':  '#4FCD63',
    '9':  '#40C857',
    '10': '#31C34B',
    '11': '#28BE3F',
    '12': '#20B936',
    '13': '#A8D8FF',
    '14': '#94D0FF',
    '15': '#80C8FF',
    '16': '#6BC0FF',
    '17': '#57B8FF',
    '18': '#43B0FF',
    '19': '#2FA8FF',
    '20': '#1B9FFF',
    '21': '#1293F0',
    '22': '#0987E0',
    '23': '#047BD0',
    '24': '#006FC0',
}

const createTimesheetHandler = async(timesheet) => {
    if (timesheet.length > 0){
        try{
            const res = await api.post('/agreements/timesheet/create', timesheet)
            console.log('[Server create Timesheet handler]: ', res.data)
        }catch(err){
            console.log("[Error create Timesheet handler]: ", err)
        }
    }
}
const updateTimesheetHandler = async(timesheet) => {
    if (timesheet.length > 0){
        try{
            const res = await api.post('/agreements/timesheet/update', timesheet)
            console.log('[Server update Timesheet handler]: ', res.data)
        }catch(err){
            console.log("[Error create Timesheet handler]: ", err)
        }
    }
}

const deleteTimesheetHandler = async(timesheet) => {
    if (timesheet.length > 0){
        try{
            const res = await api.delete('/agreements/timesheet/delete', {data: timesheet})
            console.log('[Server delete Timesheet handler]: ', res.data)
        }catch(err){
            console.log("[Error create Timesheet handler]: ", err)
        }
    }
}

const changeTimesheet = () =>{
    isChange.value = true;
}

const postTimesheetHandler = async()=>{
    try{
        const timesheet_send = Object.entries(timesheet.value).flatMap(([employeeID, dates]) => Object.entries(dates).filter(([date, item]) => item?.state && item.state !== "Server").map(([date, item]) => {
            return{
                employee_card_id: Number(employeeID),
                agreement_id: Number(route.params.id),
                date,
                ...item
            }
        }));
        const timesheet_create = timesheet_send.filter(item => item.state === "Create");
        const timesheet_update = timesheet_send.filter(item => item.state === "Update");
        const timesheet_delete = timesheet_send.filter(item => item.state === "Delete");

        createTimesheetHandler(timesheet_create);
        updateTimesheetHandler(timesheet_update);
        deleteTimesheetHandler(timesheet_delete);
        isChange.value = false;
        window.location.reload();
    }catch(err){
        console.log(err);
    }
}

const validateTimesheetInput = (employeeId, day) => { 
    let value = timesheet.value[employeeId][day]['status']
    let state = timesheet.value[employeeId][day]['state']
    value = value.toUpperCase() 

    if (!timesheet.value[employeeId][day]?.state){
        timesheet.value[employeeId][day]['state'] = "Create" 
    }else if (state === "Create" && value === ''){
        timesheet.value[employeeId][day]['state'] = ""
    }else if ((state === "Server" || state === "Delete") && value !== ''){
        timesheet.value[employeeId][day]['state'] = "Update"
    }else if ((state === "Server" || state === "Update") && value === ''){
        timesheet.value[employeeId][day]['state'] = "Delete"
    }

    if (value === 'П' || value === 'Б') { 
        timesheet.value[employeeId][day]['status'] = value 
        return 
    } 

    if (/^\d+$/.test(value)) { 
        const number = Number(value) 
        if (number >= 0 && number <= 24) { 
            timesheet.value[employeeId][day]['status'] = value 
            return 
        } 
    } 

    timesheet.value[employeeId][day]['status'] = ''
}

const getAgreementEmployeeHandler = async() =>{
    try{
        const res = await api.get(`/agreements/${route.params.id}/employee`)
        employees.value = res.data
        res.data.forEach(employee => {
            timesheet.value[employee.ID]={}
            for (let day = 1; day <= daysInMonth.value; day++){
                timesheet.value[employee.ID][getDate(day, month.value, year.value)] = {}
            }
        })
        getTimesheetHandler();
    }catch(err){
        console.log(err)
    }
}



const getTimesheetHandler = async() =>{
    try{
        const res = await api.get(`/agreements/${route.params.id}/timesheet`)
        res.data.forEach(item => {
            timesheet.value[item.employee_card_id][item.date]['id'] = item.ID
            timesheet.value[item.employee_card_id][item.date]['status'] = item.status
            timesheet.value[item.employee_card_id][item.date]['state'] = "Server"
        })
    }catch(err){
        console.log(err)
    }
}

function getDate(day, month, year) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
} 

const daysInMonth = computed(() => {
  return new Date(
    new Date().getFullYear(),
    month.value,
    0
  ).getDate()
})

// Обновление / закрытие вкладки
const handleBeforeUnload = (event) => {
    if (!isChange.value) return;

    event.preventDefault();
    event.returnValue = '';
};

onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
});


// Переход на другую страницу
onBeforeRouteLeave(() => {
    if (isChange.value) {
        const answer = window.confirm(
            'Есть несохранённые изменения. Вы действительно хотите покинуть страницу?'
        );

        if (!answer) {
            return false;
        }
    }

    return true;
});

onMounted(getAgreementEmployeeHandler);
</script>

<style>
.days-grid {
    display: grid;
    grid-template-columns: repeat(var(--days-count), 1fr);
}

.day-cell {
    border-left: 1px solid #dd4433;
    border-left: 1px solid #dee2e6;
    text-align: center;
    font-size: 10px;
    min-width: 0;
}
.day-cell input {
    width: 100%;
    height: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 0;
    margin: 0;
    border: none;
    outline: none;
    background: transparent;
    box-shadow: none;
}
</style>