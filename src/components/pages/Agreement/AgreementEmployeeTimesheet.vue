<template>
    <!-- новый код chat: общий контейнер и заголовок находятся в AgreementSalaryPage -->
    <div class="pb-3"> <!-- новый код chat: нижний отступ вкладки -->
        <!-- новый код chat: действия табеля выровнены справа -->
        <div class="d-flex justify-content-end border-bottom pb-2"> <!-- новый код chat: отступ под кнопками -->
            <!-- <router-link :to="{name: 'agreement-employee-advance'}">Авансы</router-link> -->
            <div class="d-flex gap-2 align-items-center">
                <time-sheet-create-update-component/>
                <!-- новый код chat: передача настроек смены, штрафа и суточных -->
                <TimeSheetUpdateComponent :daily_allowance_kopecks="timesheetMonth_select.daily_allowance_kopecks" :shift_hours="timesheetMonth_select.shift_hours" :absence_penalty_kopecks="timesheetMonth_select.absence_penalty_kopecks" :month="timesheetMonth_select.month" :year="timesheetMonth_select.year" :employees_id="timesheetMonth_select.employees" :timesheetMonth_id="timesheetMonth_select.ID"/>
                <div class="dropdown">
                    <a class="text-dark" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="bi bi-three-dots-vertical"></i>
                    </a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item text-danger" type="button" @click="deleteTimesheetMonthHandler()">Удалить</a></li>
                    </ul>
                </div>
            </div>
        </div>


        <!-- новый код chat: ошибка сохранения и запрет ввода во время запроса -->
        <div v-if="saveTimesheetError" class="alert alert-danger" role="alert">{{ saveTimesheetError }}</div>
        <div v-if="clipboardError" class="alert alert-warning" role="alert">{{ clipboardError }}</div> <!-- новый код chat: ошибка вставки диапазона -->
        <!-- --------- новый код chat: правила работы над табелем -->
        <div class="text-secondary mt-3"> <!-- новый код chat: шрифт пояснения как во вкладке штрафов -->
            <div>Работа с ячейками: выделяйте область мышью с зажатой левой кнопкой, Shift + щелчок или Shift + стрелки. Стрелки и Enter перемещают выбор.</div>
            <div>Ctrl+C — копировать, Ctrl+V — вставить, Delete — очистить выделение. Одно скопированное значение заполняет всю выбранную область. Можно копировать данные из Excel и обратно.</div>
            <div>В режиме «Изменить» тяните квадрат в правом нижнем углу выделения: значение или шаблон повторится в соседних ячейках. Отпустите мышь для заполнения; Escape отменяет протягивание.</div> <!-- новый код chat: правило протягивания -->
            <div>Ctrl+Z или Ctrl+Я — отменить последнее изменение. Вставка, очистка и протягивание области отменяются целиком. История действует до сохранения или смены табеля.</div> <!-- новый код chat: отмена операций -->
            <div>Для вставки и очистки нажмите «Изменить», затем «Сохранить». Допустимы 0–24, П, Б, Д, В и пустые ячейки. Блок с ошибками или за границами табеля не вставляется.</div>
        </div>
        <!-- --------- конец нового кода chat -->
        <fieldset :disabled="savingTimesheet" class="border-0 p-0 m-0">
        <div class="list-group pt-3 ">
            <div class="list-group-item d-grid timesheet-month-navigation"> <!-- новый код chat: Bootstrap d-grid сохраняет расположение в одну строку -->
                <div class="">
                    <button v-if="previousTable" type="button" class="btn btn-outline-secondary btn-sm" @click="previousMonth()"> <!-- новый код chat: только существующий соседний табель -->
                        <i class="bi bi-caret-left-fill"></i>
                        {{ monthValue[previousTable.month] }} {{ previousTable.year }}
                    </button>
                </div>
                <div class="d-flex gap-2">
                   
                    <select v-model="table_select" class="form-select form-select-sm" aria-label=".form-select-sm example" style="width: 250px;">
                        <option v-for="table in timesheetMonth" :key="table.ID" :value="table.ID">{{ `${monthValue[table.month]} ${table.year}` }}</option>
                    </select>
                    <button type="button" class="btn btn-primary btn-sm" @click="changeMonth()">Применить</button>
                </div>
                <div class="">
                    <button v-if="nextTable" type="button" class="btn btn-outline-secondary btn-sm" @click="nextMonth()"> <!-- новый код chat: месяц и год соседнего табеля -->
                        {{ monthValue[nextTable.month] }} {{ nextTable.year }}
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
            <!-- --------- новый код chat: шапка закрепляется в пределах строк табеля -->
            <div ref="timesheetTableArea">
            <div ref="timesheetStickyHeader" class="timesheet-sticky-header" :style="{transform: `translateY(${headerOffset}px)`}">
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
                    <div v-for="day in daysInMonth" :key="day" class="day-cell d-flex justify-content-center align-items-center fw-semibold" :class="{'bg-primary-subtle': displayRange && day - 1 >= displayRange.left && day - 1 <= displayRange.right}" style="font-size: 12px;"> <!-- новый код chat: все даты выбранного диапазона -->
                        {{ day }}
                    </div>
                </div>
            </div>
            <!-- --------- новый код chat: выделение и буфер обмена только в области ячеек -->
            </div>
            <div @copy="copySelectedCells" @paste="pasteSelectedCells">
            <div v-for="(employee, index) in timesheetMonth_select.employees" :key="employee.ID" class="list-group-item d-flex p-0">
                <div class="col-3 px-2 d-flex" :class="{'bg-primary-subtle': displayRange && index >= displayRange.top && index <= displayRange.bottom}" style="font-size: 14px;"> <!-- новый код chat: все сотрудники выбранного диапазона -->
                    <div class="col-1 border-end d-flex justify-content-center me-1 fw-semibold">{{ index + 1 }}</div>
                    <div class="col-11">{{ employee.surname }} {{ employee.name }} {{ employee.middle_name }}</div>
                </div>
                <div class="col-9 days-grid" :style="{ '--days-count': daysInMonth }">
                    <!-- ????? ??? chat: ?????? ?????? ????? ?????? ???? ?????????? ????? ??? -->
                    <div v-for="day in daysInMonth" :key="day" class="day-cell timesheet-value-cell d-flex justify-content-center align-items-center fw-semibold" :class="selectionClasses(index, day - 1)" :tabindex="isChange ? -1 : 0" :id="`view-cell-${employee.ID}-${getDate(day, month, year)}`" :aria-label="`${employee.surname || employee.name}, ${day}: ${timesheet[employee.ID][getDate(day, month, year)].status || 'пусто'}`" @mousedown="startCellSelection($event, index, day - 1)" @mouseenter="extendCellSelection($event, index, day - 1)" @focus.self="inputFocus(index, day)" @blur.self="inputBlur(index, day)" @keydown="handleCellKeydown($event, employee.ID, day)" style="font-size: 12px;" :style="{ backgroundColor: timesheet_color[timesheet[employee.ID][getDate(day, month, year)].status ?? ''] ?? '#fff' }">
                        <input v-if="isChange" class="text-center" :value="timesheet[employee.ID][getDate(day, month, year)]['status']" type="text" maxlength="2"
                        @input="validateTimesheetInput(employee.ID, getDate(day, month, year), $event)" @focus="inputFocus(index, day)" @blur="inputBlur(index, day)"
                        :aria-label="`${employee.surname || employee.name}, ${day}`" :id="`cell-${employee.ID}-${getDate(day, month, year)}`">
                        <div v-else class="text-center">{{ timesheet[employee.ID][getDate(day, month, year)]['status'] }}</div>
                        <span v-if="isChange && !savingTimesheet && selectedRange && index === selectedRange.bottom && day - 1 === selectedRange.right" class="timesheet-fill-handle" title="Потяните для повторения выделенного шаблона" aria-label="Протянуть шаблон" @mousedown.stop.prevent="startPatternFill($event)"></span> <!-- новый код chat: маркер протягивания -->
                    </div>
                </div>
            </div>
            </div>
            <!-- --------- конец нового кода chat -->
            </div>
            <!-- --------- конец нового кода chat: область закрепления шапки -->
        </div>
        </fieldset>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, onBeforeUnmount, nextTick } from 'vue'; // новый код chat: фокус после включения редактирования
import { normalizeTimesheetValue, timesheetRange, planTimesheetPaste, copyTimesheetRange, planTimesheetEdit, timesheetFillRange, planTimesheetFill } from '../../../utils/timesheetClipboard'; // новый код chat: операции с историей отмены
import api from '../../../api';
import { rememberSalaryMonth, restoreSalaryMonth } from '../../../utils/salaryMonthStorage'; // новый код chat: память выбранного табеля
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
// --------- новый код chat: соседние табели из доступного списка
const selectedTableIndex = computed(() => timesheetMonth.value.findIndex(item => item.ID === table_select.value));
const previousTable = computed(() => selectedTableIndex.value < 0 ? null : timesheetMonth.value[selectedTableIndex.value + 1] || null);
const nextTable = computed(() => selectedTableIndex.value < 0 ? null : timesheetMonth.value[selectedTableIndex.value - 1] || null);
// --------- конец нового кода chat
const timesheetMonth_select = ref({});

// --------- новый код chat: закрепление шапки при прокрутке окна и вложенных контейнеров
const timesheetTableArea = ref(null), timesheetStickyHeader = ref(null), headerOffset = ref(0);
let headerFrame = 0, headerResizeObserver = null;
const updateTimesheetHeader = () => {
    headerFrame = 0;
    if (!timesheetTableArea.value || !timesheetStickyHeader.value) return;
    const area = timesheetTableArea.value.getBoundingClientRect();
    const height = timesheetStickyHeader.value.offsetHeight;
    headerOffset.value = Math.max(0, Math.min(-area.top, area.height - height));
};
const scheduleTimesheetHeader = () => {
    if (!headerFrame) headerFrame = requestAnimationFrame(updateTimesheetHeader);
};
onMounted(() => {
    window.addEventListener('scroll', scheduleTimesheetHeader, {capture:true, passive:true});
    window.addEventListener('resize', scheduleTimesheetHeader);
    headerResizeObserver = new ResizeObserver(scheduleTimesheetHeader);
    if (timesheetTableArea.value) headerResizeObserver.observe(timesheetTableArea.value);
    if (timesheetStickyHeader.value) headerResizeObserver.observe(timesheetStickyHeader.value);
    scheduleTimesheetHeader();
});
onBeforeUnmount(() => {
    window.removeEventListener('scroll', scheduleTimesheetHeader, true);
    window.removeEventListener('resize', scheduleTimesheetHeader);
    headerResizeObserver?.disconnect();
    if (headerFrame) cancelAnimationFrame(headerFrame);
});
// --------- конец нового кода chat

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
        // --------- новый код chat: восстанавливаем табель этого договора
        table_select.value = restoreSalaryMonth(route.params.id, 'timesheet', timesheetMonth.value)
        if (!table_select.value) return
        const selected = timesheetMonth.value.find(item => item.ID === table_select.value)
        month.value = selected.month
        year.value = selected.year
        // --------- конец нового кода chat
        console.log("[TimeSheet Month]", timesheetMonth.value)
        console.log("[Month Year]",month.value, year.value)
        getDetailTimeSheetMonthHandler();
    }
    catch(err){
        console.log(err)
    }
}

const getDetailTimeSheetMonthHandler = async() =>{
    rememberSalaryMonth(route.params.id, 'timesheet', table_select.value) // новый код chat: сохраняем выбор из списка и стрелок
    try{
        const res  = await api.get(`/agreements/timesheetmonth/detail/${table_select.value}`)
        undoHistory.length = 0; // новый код chat: история относится к загруженной версии табеля
        clearCellSelection(); // новый код chat: новый состав сотрудников сбрасывает диапазон
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
    undoHistory.length = 0; // новый код chat: не переносим отмену между табелями
    clearCellSelection(); // новый код chat: выделение не переходит в другой табель
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
    if (previousTable.value) { // новый код chat: защита от отсутствующего табеля
        table_select.value = previousTable.value.ID
        changeMonth()
    }
}

const nextMonth = () => {
    if (nextTable.value) { // новый код chat: защита от отсутствующего табеля
        table_select.value = nextTable.value.ID
        changeMonth()
    }
}

// --------- новый код chat: прямоугольное выделение и операции с ячейками
const selectionAnchor = ref(null), selectionEnd = ref(null), clipboardError = ref('');
const selectedRange = computed(() => timesheetRange(selectionAnchor.value, selectionEnd.value));
const undoHistory = []; // новый код chat: до 100 последних операций текущего редактирования
// --------- новый код chat: предварительная область протягивания без изменения данных
const fillSource = ref(null), fillTarget = ref(null);
const displayRange = computed(() => fillSource.value && fillTarget.value ? timesheetFillRange(fillSource.value,fillTarget.value) : selectedRange.value);
const cancelPatternFill = () => { fillSource.value = null; fillTarget.value = null; };
const startPatternFill = event => {
    if (event.button !== 0 || !isChange.value || savingTimesheet.value || !selectedRange.value) return;
    fillSource.value = {...selectedRange.value};
    fillTarget.value = {row:fillSource.value.bottom,col:fillSource.value.right};
    draggingCells = false;
    clipboardError.value = '';
};
// --------- конец нового кода chat
let draggingCells = false, movingCellFocus = false;
const clearCellSelection = () => { cancelPatternFill(); selectionAnchor.value = null; selectionEnd.value = null; draggingCells = false; clipboardError.value = ''; }; // новый код chat: сброс протягивания
const selectionClasses = (row, col) => {
    const area = displayRange.value; // новый код chat: рамка показывает область будущего заполнения
    if (!area || row < area.top || row > area.bottom || col < area.left || col > area.right) return {};
    return {'sheet-selected':true, 'sheet-top':row === area.top, 'sheet-bottom':row === area.bottom, 'sheet-left':col === area.left, 'sheet-right':col === area.right};
};
const focusSheetCell = (row, col) => {
    const employee = timesheetMonth_select.value.employees?.[row];
    if (!employee) return;
    const prefix = isChange.value ? 'cell' : 'view-cell';
    const element = document.getElementById(`${prefix}-${employee.ID}-${getDate(col + 1, month.value, year.value)}`);
    movingCellFocus = true;
    element?.focus({preventScroll:true});
    if (isChange.value) element?.select();
    movingCellFocus = false;
};
const startCellSelection = (event, row, col) => {
    if (event.button !== 0 || savingTimesheet.value) return;
    event.preventDefault();
    clipboardError.value = '';
    if (!event.shiftKey || !selectionAnchor.value) selectionAnchor.value = {row,col};
    selectionEnd.value = {row,col};
    draggingCells = true;
    focusSheetCell(row,col);
};
const extendCellSelection = (event,row,col) => {
    if (fillSource.value && (event.buttons & 1) && !savingTimesheet.value) { fillTarget.value = {row,col}; return; } // новый код chat: предварительное протягивание
    if (!draggingCells || !(event.buttons & 1) || savingTimesheet.value) return;
    selectionEnd.value = {row,col};
};
// --------- новый код chat: шаблон записывается только после отпускания мыши
const stopCellSelection = event => {
    draggingCells = false;
    if (!fillSource.value) return;
    if (event?.type !== 'mouseup' || event.button !== 0 || !isChange.value || savingTimesheet.value) { cancelPatternFill(); return; }
    try {
        const plan = planTimesheetFill(fillSource.value,fillTarget.value,timesheetMonth_select.value.employees.length,daysInMonth.value,(row,col) => cellAt(row,col).item?.status);
        applyCellChanges(plan.changes); // новый код chat: одно протягивание — одна отмена
        selectionAnchor.value = {row:plan.range.top,col:plan.range.left};
        selectionEnd.value = {row:plan.range.bottom,col:plan.range.right};
        nextTick(() => focusSheetCell(plan.range.top,plan.range.left));
    } catch (err) { clipboardError.value = err.message; }
    finally { cancelPatternFill(); }
};
// --------- конец нового кода chat
const cellAt = (row,col) => {
    const employee = timesheetMonth_select.value.employees[row];
    const date = getDate(col + 1, month.value, year.value);
    return {employeeID:employee.ID,date,item:timesheet.value[employee.ID][date]};
};
// --------- новый код chat: применение и отмена операций с сохранением состояний БД
const applyCellChanges = changes => {
    const operation = planTimesheetEdit(changes,(row,col) => cellAt(row,col).item);
    if (!operation.length) return;
    undoHistory.push({cells:operation,anchor:selectionAnchor.value ? {...selectionAnchor.value} : null,end:selectionEnd.value ? {...selectionEnd.value} : null});
    if (undoHistory.length > 100) undoHistory.shift();
    for (const change of operation) {
        const cell = cellAt(change.row,change.col);
        timesheet.value[cell.employeeID][cell.date] = change.after;
    }
};
const undoCellChanges = () => {
    if (!isChange.value || savingTimesheet.value) return;
    if (fillSource.value) { cancelPatternFill(); return; }
    const operation = undoHistory.pop();
    if (!operation) return;
    draggingCells = false;
    for (const change of operation.cells) {
        const cell = cellAt(change.row,change.col);
        timesheet.value[cell.employeeID][cell.date] = {...change.before};
    }
    selectionAnchor.value = operation.anchor || {row:operation.cells[0].row,col:operation.cells[0].col};
    selectionEnd.value = operation.end || {...selectionAnchor.value};
    clipboardError.value = '';
    const {row,col} = selectionAnchor.value;
    nextTick(() => focusSheetCell(row,col));
};
// --------- конец нового кода chat
const copySelectedCells = event => {
    if (!selectedRange.value || !event.target.closest('.timesheet-value-cell')) return;
    event.preventDefault();
    if (!event.clipboardData) { clipboardError.value = 'Браузер не предоставил доступ к буферу обмена.'; return; }
    event.clipboardData.setData('text/plain',copyTimesheetRange(selectedRange.value,(row,col) => cellAt(row,col).item?.status));
};
const pasteSelectedCells = event => {
    if (!event.target.closest('.timesheet-value-cell')) return;
    event.preventDefault();
    if (savingTimesheet.value) return;
    if (!isChange.value) { clipboardError.value = 'Для вставки нажмите «Изменить».'; return; }
    if (!event.clipboardData) { clipboardError.value = 'Браузер не предоставил доступ к буферу обмена.'; return; }
    try {
        const plan = planTimesheetPaste(event.clipboardData.getData('text/plain'),selectedRange.value,timesheetMonth_select.value.employees.length,daysInMonth.value);
        applyCellChanges(plan.changes); // новый код chat: вставка отменяется целым блоком
        selectionAnchor.value = {row:plan.range.top,col:plan.range.left};
        selectionEnd.value = {row:plan.range.bottom,col:plan.range.right};
        clipboardError.value = '';
        nextTick(() => focusSheetCell(plan.range.top,plan.range.left));
    } catch (err) { clipboardError.value = err.message; }
};
const clearSelectedCells = () => {
    const area = selectedRange.value;
    if (!area || !isChange.value || savingTimesheet.value) return;
    const changes = []; // новый код chat: единая операция очистки
    for (let row = area.top; row <= area.bottom; row++) {
        for (let col = area.left; col <= area.right; col++) changes.push({row,col,value:''});
    }
    applyCellChanges(changes); // новый код chat
    clipboardError.value = '';
};
const handleCellKeydown = (event, employeeId, day) => {
    // новый код chat: физическая клавиша Z и обе раскладки, без нативной отмены input
    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && (event.code === 'KeyZ' || ['z','я'].includes(event.key.toLowerCase()))) { event.preventDefault(); if (!event.isComposing) undoCellChanges(); return; }
    if (event.isComposing || savingTimesheet.value) return;
    if (fillSource.value) { event.preventDefault(); if (event.key === 'Escape') cancelPatternFill(); return; } // новый код chat: Escape отменяет только протягивание
    const employeeIndex = timesheetMonth_select.value.employees.findIndex(employee => employee.ID === employeeId);
    if (employeeIndex < 0) return;
    if (event.key === 'Escape') { clearCellSelection(); return; }
    if (!selectionAnchor.value) selectionAnchor.value = selectionEnd.value = {row:employeeIndex,col:day - 1};
    if (event.key === 'Delete') { event.preventDefault(); clearSelectedCells(); return; }
    if (event.ctrlKey || event.metaKey || event.altKey || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter'].includes(event.key)) return;
    event.preventDefault();
    let {row,col} = selectionEnd.value || {row:employeeIndex,col:day - 1};
    if (event.key === 'ArrowLeft') col--;
    if (event.key === 'ArrowRight') col++;
    if (event.key === 'ArrowUp') row--;
    if (event.key === 'ArrowDown') row++;
    if (event.key === 'Enter') row += event.shiftKey ? -1 : 1;
    if (row < 0 || row >= timesheetMonth_select.value.employees.length || col < 0 || col >= daysInMonth.value) return;
    if (!event.shiftKey || event.key === 'Enter') selectionAnchor.value = {row,col};
    selectionEnd.value = {row,col};
    focusSheetCell(row,col);
    document.getElementById(`${isChange.value ? 'cell' : 'view-cell'}-${timesheetMonth_select.value.employees[row].ID}-${getDate(col + 1, month.value, year.value)}`)?.scrollIntoView({block:'nearest',inline:'nearest'});
};
// --------- конец нового кода chat
const inputFocus = (index, day) =>{
    if (!movingCellFocus) { selectionAnchor.value = {row:index,col:day - 1}; selectionEnd.value = {row:index,col:day - 1}; } // новый код chat: выбор при переходе Tab
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
            // новый код chat: обновляем табель один раз после всех запросов
        }catch(err){
            console.log("[Error create Timesheet handler]: ", err)
            throw err; // новый код chat: сохранить режим редактирования при ошибке
        }
    }
}

const updateTimesheetHandler = async(timesheet) => {
    if (timesheet.length > 0){
        try{
            const res = await api.post('/agreements/timesheet/update', timesheet)
            console.log('[Server update Timesheet handler]: ', res.data)
            // новый код chat: обновляем табель один раз после всех запросов
        }catch(err){
            console.log("[Error create Timesheet handler]: ", err)
            throw err; // новый код chat: сохранить режим редактирования при ошибке
        }
    }
}

const deleteTimesheetHandler = async(timesheet) => {
    if (timesheet.length > 0){
        try{
            const res = await api.delete('/agreements/timesheet/delete', {data: timesheet})
            console.log('[Server delete Timesheet handler]: ', res.data)
            // новый код chat: обновляем табель один раз после всех запросов
        }catch(err){
            console.log("[Error create Timesheet handler]: ", err)
            throw err; // новый код chat: сохранить режим редактирования при ошибке
        }
    }
}

const deleteTimesheetMonthHandler = async(id) => {
    if (!window.confirm('Удалить выбранный месячный табель?')) return; // новый код chat: подтверждение удаления
    try{
        const res = await api.delete(`/agreements/timesheetmonth/delete/${timesheetMonth_select.value.ID}` )
        console.log("[Delete TimeSheet Month ID]",timesheetMonth_select.value.ID)
        getTimeSheetMonthHandler()
    }catch(err){
        console.log("[Error delete TimesheetMonth handler]: ", err)
    }
}

const changeTimesheet = () =>{
    isChange.value = true;
    if (selectionAnchor.value) nextTick(() => focusSheetCell(selectionAnchor.value.row, selectionAnchor.value.col)); // новый код chat
}

// --------- новый код chat: ожидание запросов и сообщение об ошибке сохранения
const savingTimesheet = ref(false);
const saveTimesheetError = ref('');
// --------- конец нового кода chat
const postTimesheetHandler = async()=>{
    if (savingTimesheet.value) return; // новый код chat
    undoHistory.length = 0; // новый код chat: после начала записи нельзя восстановить устаревшие ID и состояния
    savingTimesheet.value = true;
    saveTimesheetError.value = '';
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

        // --------- новый код chat: дождаться всех изменений до перечитывания табеля
        await createTimesheetHandler(timesheet_create);
        await updateTimesheetHandler(timesheet_update);
        await deleteTimesheetHandler(timesheet_delete);
        isChange.value = false;
        changeMonth();
        // --------- конец нового кода chat
    }catch(err){
        console.log(err);
        saveTimesheetError.value = 'Не удалось сохранить табель полностью. Повторите сохранение.'; // новый код chat
    } finally { savingTimesheet.value = false; } // новый код chat
}

// --------- новый код chat: сначала проверяем значение, затем назначаем состояние сохранения
const validateTimesheetInput = (employeeId, date, event) => {
    if (!isChange.value || savingTimesheet.value) return;
    const value = normalizeTimesheetValue(event.target.value) ?? '';
    event.target.value = value;
    const row = timesheetMonth_select.value.employees.findIndex(employee => employee.ID === employeeId);
    const col = Number(date.slice(-2)) - 1;
    applyCellChanges([{row,col,value}]); // новый код chat: ручной ввод тоже попадает в историю
    selectionAnchor.value = {row,col}; selectionEnd.value = {row,col};
};
// --------- конец нового кода chat
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
    window.addEventListener('mouseup', stopCellSelection); // новый код chat
    window.addEventListener('blur', stopCellSelection); // новый код chat
});

onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('mouseup', stopCellSelection); // новый код chat
    window.removeEventListener('blur', stopCellSelection); // новый код chat
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
/* --------- новый код chat: центр не зависит от длины и наличия соседних кнопок */
.list-group-item.timesheet-month-navigation { grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 8px; } /* новый код chat: повышен приоритет относительно стилей Bootstrap */
.timesheet-month-navigation > :last-child { text-align: right; }
/* --------- конец нового кода chat */
/* новый код chat: непрозрачная шапка над выделением ячеек */
.timesheet-sticky-header { position: relative; z-index: 5; background: #fff; } /* новый код chat: убрана тень, утолщавшая границу */
.timesheet-sticky-header > .list-group-item { border-radius: 0; } /* новый код chat: единая рамка без скруглений между строками */
.timesheet-sticky-header > .list-group-item:first-child { border-top: 0; } /* новый код chat: не дублируем нижнюю границу предыдущей строки */
.timesheet-sticky-header > .list-group-item:last-child { border-bottom: 0; } /* новый код chat: нижнюю границу задаёт первая строка сотрудников */
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
/* --------- новый код chat: рамка диапазона сохраняет исходные цвета отметок */
.timesheet-value-cell { position: relative; user-select: none; cursor: cell; }
.timesheet-value-cell:focus { outline: none; }
.timesheet-value-cell.sheet-selected::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: rgba(13,110,253,.12); border: 0 solid #0d6efd; z-index: 1; }
.timesheet-value-cell.sheet-top::after { border-top-width: 2px; }
.timesheet-value-cell.sheet-bottom::after { border-bottom-width: 2px; }
.timesheet-value-cell.sheet-left::after { border-left-width: 2px; }
.timesheet-value-cell.sheet-right::after { border-right-width: 2px; }
.timesheet-fill-handle { position: absolute; width: 8px; height: 8px; right: 0; bottom: 0; background: #0d6efd; border: 1px solid #fff; cursor: crosshair; z-index: 3; } /* новый код chat: маркер заполнения шаблоном */
/* --------- конец нового кода chat */
</style>
