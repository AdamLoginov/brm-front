<template>
    <div class="container-fluid pt-3">
        <div>
            <h4>Табель договора:</h4>
            <router-link :to="{name: 'agreement-employee-advance'}">Авансы</router-link>
            <hr>
        </div>


        <div class="list-group">
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
                <div class="col-2">
                    <select v-model="month_change" class="form-select form-select-sm" aria-label=".form-select-sm example">
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
                    <button type="button" class="btn btn-primary btn-sm" @click="changeMonth()">Применить</button>
                </div>
                <div class="col-1 ps-2">
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
                    <div v-for="day in daysInMonth" :key="day" class="day-cell d-flex justify-content-center align-items-center fw-semibold" style="font-size: 12px;">
                        {{ day }}
                    </div>
                </div>
            </div>
            <div v-for="(employee, index) in employees" :key="employee.ID" class="list-group-item d-flex p-0">
                <div class="col-3 px-2 d-flex" :class="employee.input_active? 'bg-primary-subtle' : ''" style="font-size: 14px;">
                    <div class="col-1 border-end d-flex justify-content-center me-1 fw-semibold">{{ index + 1 }}</div>
                    <div class="col-11">{{ employee.surname }} {{ employee.name }} {{ employee.middle_name }}</div>
                </div>
                <div class="col-9 days-grid" :style="{ '--days-count': daysInMonth }">
                    <div v-for="day in daysInMonth" :key="day" class="day-cell d-flex justify-content-center align-items-center fw-semibold" style="font-size: 12px;" :style="`background-color: ${timesheet_color[timesheet[employee.ID][getDate(day, month, year)]['status']]};`">
                        <input v-if="isChange" class="text-center" v-model="timesheet[employee.ID][getDate(day, month, year)]['status']" type="text" maxlength="2" 
                        @input="validateTimesheetInput(employee.ID, getDate(day, month, year))" @focus="inputFocus(index)"  @blur="inputBlur(index)" 
                        :id="`cell-${employee.ID}-${getDate(day, month, year)}`"     @keydown="handleCellKeydown($event, employee.ID,day)">
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
const month_change = ref(month.value);
const year = ref(new Date().getFullYear());
const isChange = ref(false);

const employees = ref(null);
const timesheet = ref({});
const timesheet_server = ref({});

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

const handleCellKeydown = (event, employeeId, day) => {
    const key = event.key

    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'].includes(key)) {
        return
    }

    event.preventDefault()

    const employeeIndex = employees.value.findIndex(
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
        targetEmployeeIndex >= employees.value.length
    ) {
        return
    }

    const targetEmployee = employees.value[targetEmployeeIndex]

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

const inputFocus = (index) =>{
    console.log("[Открытие input]", index)
    employees.value[index]['input_active'] = true
}

const inputBlur = (index) =>{
    console.log("[Закрытие input]", index)
    employees.value[index]['input_active'] = false
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

const changeMonth = () =>{
    employees.value = []
    timesheet.value = {}
    month.value = month_change.value
    getAgreementEmployeeHandler()
}

const getAgreementEmployeeHandler = async() =>{
    try{
        const res = await api.get(`/agreements/${route.params.id}/employee`)
        employees.value = res.data
        employees.value.forEach((employee, index) => {employees.value[index]['input_active'] = false})
        res.data.forEach(employee => {
            timesheet.value[employee.ID]={}
            for (let day = 1; day <= daysInMonth.value; day++){
                timesheet.value[employee.ID][getDate(day, month.value, year.value)] = {}
            }
        })
        employees.value = employees.value.sort((a, b) =>(a.surname || '').localeCompare(b.surname || '', 'ru'))
        getTimesheetHandler();
        console.log("[getagreementEmployeehandler]", employees.value)
    }catch(err){
        console.log(err)
    }
}

const getTimesheetHandler = async() =>{
    try{
        let employee_r = employees.value.map(item => item.ID)
        const res = await api.get(`/agreements/${route.params.id}/timesheet/month?month=${month.value}`)
        res.data.forEach(item => {
            if (!employee_r.includes(item.employee_card.ID)){
                employees.value.push(item.employee_card)
                employee_r.push(item.employee_card.ID)
                timesheet.value[item.employee_card.ID] = {}
                for (let day = 1; day <= daysInMonth.value; day++){
                    timesheet.value[item.employee_card.ID][getDate(day, month.value, year.value)] = {}
                }
            }
            timesheet.value[item.employee_card_id][item.date]['id'] = item.ID
            timesheet.value[item.employee_card_id][item.date]['status'] = item.status
            timesheet.value[item.employee_card_id][item.date]['state'] = "Server"
        })
        employees.value = employees.value.sort((a, b) =>(a.surname || '').localeCompare(b.surname || '', 'ru'))
        console.log('[employe_r]', employee_r)
        console.log('[employees]', employees.value)
        console.log(res.data)
    }catch(err){
        console.log(err)
    }
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