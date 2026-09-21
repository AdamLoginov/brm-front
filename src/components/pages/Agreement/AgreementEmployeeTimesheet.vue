<template>
    <div class="container-fluid pt-3">
        <div class="d-flex justify-content-between border-bottom">    
            <h4>Табель договора:</h4>
            <!-- <router-link :to="{name: 'agreement-employee-advance'}">Авансы</router-link> -->
            <div class="d-flex gap-2">
                <time-sheet-create-update-component/>
                <TimeSheetUpdateComponent :month="timesheetMonth_select.month" :year="timesheetMonth_select.year" :employees_id="timesheetMonth_select.employees" :timesheetMonth_id="timesheetMonth_select.ID"/>
            </div>
        </div>


        <div class="list-group pt-3 ">
            <div class="list-group-item d-flex gap-1 justify-content-between">
                <div class="">
                    <button type="button" class="btn btn-outline-secondary btn-sm" @click="previousMonth()" :disabled="timesheetMonth.findIndex(item => item.ID === table_select) === timesheetMonth.length - 1">
                        <i class="bi bi-caret-left-fill"></i>
                        Предыдущий
                    </button>
                </div>
                <div class="d-flex gap-2">
                   
                    <select v-model="table_select" class="form-select form-select-sm" aria-label=".form-select-sm example" style="width: 250px;">
                        <option v-for="table in timesheetMonth" :key="table.ID" :value="table.ID">{{ `${monthValue[table.month]} ${table.year}` }}</option>
                    </select>
                    <button type="button" class="btn btn-primary btn-sm" @click="changeMonth()">Применить</button>
                </div>
                <div class="">
                    <button type="button" class="btn btn-outline-secondary btn-sm" @click="nextMonth()" :disabled="timesheetMonth.findIndex(item => item.ID === table_select) === 0">
                        Следующий
                        <i class="bi bi-caret-right-fill"></i>
                    </button>
                </div>
            </div>
            <div class="list-group-item d-flex">
                <div class="col-5 d-flex align-items-center" style="font-size: 12px;">
                    <div class="fw-semibold">Правила заполнения:</div>
                    <div class="ms-1"> <span class="bg-success fw-semibold px-1 rounded-1">0-24</span> - Часы;</div>
                    <div class="ms-1"> <span class="bg-danger fw-semibold px-1 rounded-1">П</span> - Прогул;</div>
                    <div class="ms-1"> <span class="fw-semibold px-1 rounded-1" style="background: #e97c17;">Б</span> - Болен;</div>
                    <div class="ms-1"> <span class="fw-semibold px-1 rounded-1" style="background: #fff200;">В</span> - Выходной;</div>
                    <div class="ms-1"> <span class="fw-semibold px-1 rounded-1" style="background: #c07ff1;">Д</span> - В дороге;</div>
                </div>
                <div class="col-3"></div>
                <div class="col-2"></div>
                <div class="col-1"></div>
                <div class="col-1 ps-2 d-flex justify-content-end">
                    <button type="button" class="btn  btn-sm" :class="isChange ? 'btn-success' : 'btn-primary'" @click="isChange ? postTimesheetHandler() : changeTimesheet()">{{ isChange ? 'Сохранить' : 'Изменить' }}</button>
                </div>
            </div>
            <div class="list-group-item d-flex p-0">
                <div class="col-3 px-2" style="font-size: 14px;"></div>
                <div class="col-9 days-grid" :style="{ '--days-count': daysInMonth }" >
                    <div v-for="day in daysInMonth" :key="day" class="day-cell d-flex justify-content-center align-items-center text-lowercase" :class="ifHollyday(getWeekDay(day, month, year)) ? 'bg-warning-subtle': ''"  style="font-size: 12px;">
                        {{ getWeekDay(day, month, year) }}
                    </div>
                </div>
            </div>  
            <div class="list-group-item d-flex p-0">
                <div class="col-3 px-2 fw-semibold" style="font-size: 14px;">Сотрудник:</div>
                <div class="col-9 days-grid" :style="{ '--days-count': daysInMonth }" >
                    <div v-for="day in daysInMonth" :key="day" class="day-cell d-flex justify-content-center align-items-center fw-semibold" :class="activeDay === day? 'bg-primary-subtle': '' " style="font-size: 12px;">
                        {{ day }}
                    </div>
                </div>
            </div>
            <div v-for="(employee, index) in timesheetMonth_select.employees" :key="employee.ID" class="list-group-item d-flex p-0">
                <div class="col-3 px-2 d-flex" :class="employee.input_active? 'bg-primary-subtle' : ''" style="font-size: 14px;">
                    <div class="col-1 border-end d-flex justify-content-center me-1 fw-semibold">{{ index + 1 }}</div>
                    <div class="col-11">{{ employee.surname }} {{ employee.name }} {{ employee.middle_name }}</div>
                </div>
                <div class="col-9 days-grid" :style="{ '--days-count': daysInMonth }">
                    <div v-for="day in daysInMonth" :key="day" class="day-cell d-flex justify-content-center align-items-center fw-semibold" style="font-size: 12px;" :style="`background-color: ${timesheet_color[timesheet[employee.ID][getDate(day, month, year)]['status']]};`">
                        <input v-if="isChange" class="text-center" v-model="timesheet[employee.ID][getDate(day, month, year)]['status']" type="text" maxlength="2" 
                        @input="validateTimesheetInput(employee.ID, getDate(day, month, year))" @focus="inputFocus(index, day)"  @blur="inputBlur(index, day)" 
                        :id="`cell-${employee.ID}-${getDate(day, month, year)}`" @keydown="handleCellKeydown($event, employee.ID,day)">
                        <div v-else class="text-center">{{ timesheet[employee.ID][getDate(day, month, year)]['status'] }}</div>
                    </div>
                </div>
            </div>
        </div>
    
    </div>
</template>

<script setup>
import { computed, onMounted, ref, onBeforeUnmount } from 'vue';
import api from '../../../api';
import { useRoute, onBeforeRouteLeave } from 'vue-router';
import TimeSheetCreateUpdateComponent from './TimeSheetCreateUpdateComponent.vue';
import TimeSheetUpdateComponent from './TimeSheetUpdateComponent.vue';

const route = useRoute();

const isChange = ref(false);

const activeDay = ref(0);
const month = ref(9);
const year = ref(2026);
const table_select = ref(null);

const employees = ref(null);
const timesheet = ref({});
const timesheetMonth = ref([]);
const timesheetMonth_select = ref({});

const monthValue = {
    "1": "Январь",
    "2": "Февраль",
    "3": "Март",
    "4": "Апрель",
    "5": "Май",
    "6": "Июнь",
    "7": "Июль",
    "8": "Август",
    "9": "Сентябрь",
    "10": "Октябрь",
    "11": "Ноябрь",
    "12": "Декабрь",
}

const timesheet_color = {
    '':   '#fff',
    'Д':  '#c07ff1',
    'В':  '#fff200',
    'П':  '#dd4433',
    'Б':  '#e97c17',
    '0':  '#fff200',
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

const getTimeSheetMonthHandler = async() =>{
    try{
        const res = await api.get(`/agreements/${route.params.id}/timesheetmonth`)
        timesheetMonth.value = res.data.sort((a, b) => b.month - a.month).sort((a, b) => b.year - a.year)
        table_select.value = timesheetMonth.value.at(0).ID
        month.value = timesheetMonth.value.at(0).month
        year.value = timesheetMonth.value.at(0).year
        console.log("[TimeSheet Month]", timesheetMonth.value)
        console.log("[Month Year]",month.value, year.value)
        getDetailTimeSheetMonthHandler();
    }
    catch(err){
        console.log(err)
    }
}

const getDetailTimeSheetMonthHandler = async() =>{
    try{
        const res  = await api.get(`/agreements/timesheetmonth/detail/${table_select.value}`)
        timesheetMonth_select.value = res.data
        timesheetMonth_select.value.employees.forEach((employee, index) => {timesheetMonth_select.value.employees[index]['input_active'] = false})
        month.value = timesheetMonth_select.value.month
        year.value = timesheetMonth_select.value.year   

        timesheetMonth_select.value.employees.forEach(employee => {
            timesheet.value[employee.ID]={}
            for (let day = 1; day <= daysInMonth.value; day++){
                timesheet.value[employee.ID][getDate(day, month.value, year.value)] = {}
            }
        })
        timesheetMonth_select.value.time_sheets.forEach(item => {

            if (!timesheet.value[item.employee_card_id]) {
                timesheet.value[item.employee_card_id] = {}
            }

            if (!timesheet.value[item.employee_card_id][item.date]) {
                timesheet.value[item.employee_card_id][item.date] = {}
            }

            timesheet.value[item.employee_card_id][item.date] = {
                id: item.ID,
                status: item.status,
                state: 'Server',
                time_sheet_month_id: timesheetMonth_select.value.ID
            }
        })

        timesheetMonth_select.value.employees = timesheetMonth_select.value.employees.sort((a, b) =>(a.surname || '').localeCompare(b.surname || '', 'ru'))
        console.log("[Detail TimeSheetMonth]", timesheetMonth_select.value)
        console.log("[1 Time Sheet ]", timesheet.value)
    }catch(err){
        console.log(err)
    }
}

const changeMonth = () =>{
    const timesheet_month = timesheetMonth.value.find(item => item.ID === table_select.value)
    employees.value = []
    timesheet.value = {}
    timesheetMonth_select.value = {}
    month.value = timesheet_month.month
    year.value = timesheet_month.year
    console.log(month.value, year.value)
    getDetailTimeSheetMonthHandler()
}

const previousMonth = () => {
    const index = timesheetMonth.value.findIndex(item => item.ID === table_select.value)
    if (index != -1) {
        table_select.value = timesheetMonth.value[index + 1].ID
        changeMonth()
    }
}

const nextMonth = () => {
    const index = timesheetMonth.value.findIndex(item => item.ID === table_select.value)
    if (index != -1) {
        table_select.value = timesheetMonth.value[index - 1].ID
        changeMonth()
    }
}

const handleCellKeydown = (event, employeeId, day) => {
    const key = event.key

    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'].includes(key)) {
        return
    }

    event.preventDefault()

    const employeeIndex = timesheetMonth_select.value.employees.findIndex(
        employee => employee.ID === employeeId
    )

    let targetEmployeeIndex = employeeIndex
    let targetDay = day

    if (key === 'ArrowLeft') {
        targetDay--
    }

    if (key === 'ArrowRight') {
        targetDay++
    }

    if (key === 'ArrowUp') {
        targetEmployeeIndex--
    }

    if (key === 'ArrowDown' || key === 'Enter') {
        targetEmployeeIndex++
    }

    // Влево/вправо вышли за границы месяца
    if (targetDay < 1 || targetDay > daysInMonth.value) {
        return
    }

    // Вверх/вниз вышли за границы сотрудников
    if (
        targetEmployeeIndex < 0 ||
        targetEmployeeIndex >= timesheetMonth_select.value.employees.length
    ) {
        return
    }

    const targetEmployee = timesheetMonth_select.value.employees[targetEmployeeIndex]

    const date = getDate(
        targetDay,
        month.value,
        year.value
    )

    const targetInput = document.getElementById(
        `cell-${targetEmployee.ID}-${date}`
    )

    targetInput?.focus()
}

const inputFocus = (index, day) =>{
    // console.log("[Открытие input]", index)
    activeDay.value = day
    timesheetMonth_select.value.employees[index]['input_active'] = true
}

const inputBlur = (index, day) =>{
    // console.log("[Закрытие input]", index)
    activeDay.value = 0
    timesheetMonth_select.value.employees[index]['input_active'] = false
}

const createTimesheetHandler = async(timesheet) => {
    if (timesheet.length > 0){
        try{
            const res = await api.post('/agreements/timesheet/create', timesheet)
            console.log('[Server create Timesheet handler]: ', res.data)
            changeMonth();
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
            changeMonth();
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
            changeMonth();
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
                time_sheet_month_id: timesheetMonth_select.value.ID,
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

    if (value === 'П' || value === 'Б' || value === 'Д' || value === 'В') { 
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

function getDate(day, month, year) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
} 

const ifHollyday = (week_day) => {
    if (week_day === 'СБ' || week_day === 'ВС'){
        return true
    }

    return false
}

const getWeekDay = (day, month, year) => {
    const date = new Date(year, month - 1, day)

    const weekDays = [
        'ВС',
        'ПН',
        'ВТ',
        'СР',
        'ЧТ',
        'ПТ',
        'СБ'
    ]

    return weekDays[date.getDay()]
}

const daysInMonth = computed(() => {
return new Date(
    year.value,
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


onMounted(getTimeSheetMonthHandler);
// onMounted(getAgreementEmployeeHandler);
</script>

<style>
.days-grid {
    display: grid;
    grid-template-columns: repeat(var(--days-count), 1fr);
}

.day-cell {
    border-left: 1px solid #c07ff1;
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