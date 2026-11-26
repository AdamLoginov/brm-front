<!-- --------- новый код chat: годовая и месячная статистика сотрудника -->
<template>
    <section class="employee-statistics">
        <header class="statistics-heading">
            <!-- новый код chat: заголовок и иконка в стиле соседних разделов карточки -->
            <div class="statistics-title"><span class="statistics-section-icon"><i class="bi bi-bar-chart" aria-hidden="true"></i></span><h2>Статистика работы</h2></div>
        </header>
        <div v-if="loading" class="text-secondary py-3" role="status">Загружаем статистику…</div>
        <div v-else-if="error" class="alert alert-danger mb-0">{{ error }} <button class="btn btn-sm btn-outline-danger" @click="load">Повторить</button></div>
        <template v-else-if="statistics">
            <!-- --------- новый код chat: календарь активности по неделям выбранного года -->
            <section class="activity-calendar" aria-label="Календарь активности за год">
                <div class="activity-heading"><span>{{ activeDays }} рабочих дней</span></div> <!-- новый код chat: убран заголовок активности -->
                <div class="activity-scroll">
                    <div class="activity-grid" :style="{'--weeks': calendar.weeks}">
                        <span v-for="label in calendar.months" :key="label.name" class="activity-month" :style="{gridColumn:label.column + 2,gridRow:1}">{{ label.name }}</span>
                        <span v-for="(label,index) in ['Пн','','Ср','','Пт','','Вс']" :key="'weekday'+index" class="activity-weekday" :style="{gridColumn:1,gridRow:index + 2}">{{ label }}</span>
                        <span v-for="day in calendar.days" :key="day.date" v-activity-tooltip="day.tooltip" class="activity-day" tabindex="0" :aria-label="day.tooltip"
                            :style="{gridColumn:day.column + 2,gridRow:day.row + 2,backgroundColor:day.color}"></span>
                    </div>
                </div>
                <div class="activity-legend">
                    <!-- новый код chat: две шкалы часов, как в рабочем табеле -->
                    <span class="activity-legend-scale">1–12 ч <i v-for="index in [0,3,7,11]" :key="index" :style="{backgroundColor:activityHourColors[index]}"></i></span>
                    <span class="activity-legend-scale">13–24 ч <i v-for="index in [12,15,19,23]" :key="index" :style="{backgroundColor:activityHourColors[index]}"></i></span>
                    <span v-for="mark in activityLetters" :key="mark.letter"><i :style="{backgroundColor:mark.color}"></i>{{ mark.label }}</span>
                    <span><i style="background:#eef1f4"></i>Нет часов</span>
                </div>
            </section>
            <!-- --------- конец нового кода chat -->
            <div class="statistics-panels">
                <article v-for="panel in panels" :key="panel.key" class="statistics-panel">
                    <!-- новый код chat: период отдельно от основных показателей -->
                    <!-- новый код chat: выбор месяца на месте подписи периода в месячной карточке -->
                    <header class="statistics-panel-heading">
                        <h3><i :class="panel.key === 'year' ? 'bi bi-calendar3' : 'bi bi-calendar-month'" aria-hidden="true"></i>{{ panel.title }}</h3>
                        <select v-if="panel.key === 'month'" v-model.number="selectedMonth" class="form-select form-select-sm statistics-month-select" aria-label="Месяц статистики">
                            <option v-for="(name,index) in monthNames" :key="index" :value="index + 1">{{ name }}</option> <!-- новый код chat: только название месяца -->
                        </select>
                        <!-- новый код chat: выбор года в заголовке годовой карточки -->
                        <!-- новый код chat: только годы с фактически отработанными часами -->
                        <select v-else v-model.number="year" class="form-select form-select-sm statistics-year-input" aria-label="Год статистики" :disabled="!statistics.years.length" @change="load">
                            <option v-if="!statistics.years.length" :value="year">Нет данных</option>
                            <option v-for="value in statistics.years" :key="value" :value="value">{{ value }}</option>
                        </select>
                    </header>
                    <div class="statistics-totals">
                        <div class="statistics-total"><span>Отработано дней</span><strong>{{ number(panel.data.shifts) }}</strong></div> <!-- новый код chat: название показателя по дням -->
                        <div class="statistics-total"><span>Отработано часов</span><strong>{{ number(panel.data.hours) }}</strong></div>
                    </div>
                    <div class="statistics-marks">
                        <div v-for="mark in marks" :key="mark.field" class="statistics-mark">
                            <span class="statistics-mark-name">{{ mark.label }}</span> <!-- новый код chat: названия без буквенных значков -->
                            <strong :class="{'statistics-mark-empty': !panel.data[mark.field], 'statistics-mark-warning': mark.field === 'absences' && panel.data[mark.field] > 0}">{{ panel.data[mark.field] || 0 }} <small>дн.</small></strong>
                        </div>
                    </div>
                </article>
            </div>

        </template>
    </section>
</template>
<script setup>
// --------- новый код chat: переключение месяца меняет только правый блок
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import api from '../../../api';
// --------- новый код chat: Bootstrap-подсказки календаря с очисткой при смене года
import { Tooltip } from 'bootstrap/dist/js/bootstrap.bundle.min.js';
const activityTooltips = new WeakMap();
const updateActivityTooltip = (element, binding) => {
    if (binding.value === binding.oldValue && activityTooltips.has(element)) return;
    activityTooltips.get(element)?.dispose();
    activityTooltips.set(element, new Tooltip(element, {
        title: binding.value, container: 'body', trigger: 'hover focus',
        animation: false, customClass: 'employee-activity-tooltip',
    }));
};
const vActivityTooltip = {
    mounted: updateActivityTooltip,
    updated: updateActivityTooltip,
    beforeUnmount: element => {
        activityTooltips.get(element)?.dispose();
        activityTooltips.delete(element);
    },
};
// --------- конец нового кода chat
const props = defineProps({employeeId:{type:[String,Number],required:true}});
const currentYear = Number(new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Moscow',year:'numeric'}).format(new Date()));
const currentMonth = Number(new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Moscow',month:'numeric'}).format(new Date()));
const year = ref(currentYear), selectedMonth = ref(currentMonth);
const statistics = ref(null), loading = ref(false), error = ref('');
const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const marks = [
    // новый код chat: только подписи показателей, без цветовых обозначений
    {field:'absences',label:'Прогулы'},
    {field:'sick_days',label:'Болезнь'},
    {field:'days_off',label:'Выходные'},
    {field:'travel_days',label:'В дороге'},
    {field:'off_site_days',label:'Не работает на объекте'},
];
const number = value => Number(value || 0).toLocaleString('ru-RU',{maximumFractionDigits:3});
// --------- новый код chat: понедельник — первая строка, часы имеют приоритет над буквами
// новый код chat: точные цвета 1–24 часов из рабочего табеля
const activityHourColors = [
    '#B8F0B5','#A9EBAA','#9AE69E','#8BE193','#7CDC87','#6DD77B',
    '#5ED26F','#4FCD63','#40C857','#31C34B','#28BE3F','#20B936',
    '#A8D8FF','#94D0FF','#80C8FF','#6BC0FF','#57B8FF','#43B0FF',
    '#2FA8FF','#1B9FFF','#1293F0','#0987E0','#047BD0','#006FC0',
];
const activityLetters = [
    {letter:'П',label:'Прогул',color:'#dd4433'},
    {letter:'Б',label:'Болезнь',color:'#e97c17'},
    {letter:'В',label:'Выходной',color:'#fff200'},
    {letter:'Д',label:'В дороге',color:'#c07ff1'},
    {letter:'Н',label:'Не на объекте',color:'#CED4DA'},
];
const activeDays = computed(() => (statistics.value?.days || []).filter(day => Number(day.hours) > 0).length);
const calendar = computed(() => {
    const days = statistics.value?.days || [];
    if (!days.length) return {days:[],months:[],weeks:53};
    const start = new Date(days[0].date + 'T00:00:00Z');
    const offset = (start.getUTCDay() + 6) % 7;
    const months = [];
    const shortMonths = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
    const cells = days.map((day,index) => {
        const date = new Date(day.date + 'T00:00:00Z');
        const column = Math.floor((index + offset) / 7);
        if (date.getUTCDate() === 1) months.push({name:shortMonths[date.getUTCMonth()],column});
        const hours = Number(day.hours);
        const letter = activityLetters.find(item => day.marks.includes(item.letter));
        // новый код chat: дробные часы округляем вверх только для цвета; сумма свыше 24 — самый насыщенный синий
        const color = hours > 0 ? activityHourColors[Math.min(24, Math.max(1, Math.ceil(hours))) - 1] : letter?.color || '#eef1f4';
        const details = day.marks.map(mark => {
            const meaning = activityLetters.find(item => item.letter === mark);
            return meaning ? mark + ' — ' + meaning.label : number(Number(mark.replace(',','.'))) + ' ч';
        }).join('; ');
        const tooltip = day.date.split('-').reverse().join('.') + (hours > 0 ? ' · Всего ' + number(hours) + ' ч' : '') + '\n' + (details || 'Нет отработанных часов и отметок');
        return {...day,column,row:(index + offset) % 7,color,tooltip};
    });
    return {days:cells,months,weeks:Math.ceil((days.length + offset) / 7)};
});
// --------- конец нового кода chat
const panels = computed(() => !statistics.value ? [] : [
    {key:'year',title:'За год',subtitle:String(statistics.value.year),data:statistics.value},
    {key:'month',title:'За месяц',subtitle:monthNames[selectedMonth.value - 1] + ' ' + statistics.value.year,data:statistics.value.months.find(item => item.month === selectedMonth.value) || {}},
]);
let version = 0;
const load = async() => {
    const current = ++version;
    const selectedYear = Number(year.value);
    statistics.value = null; error.value = ''; loading.value = false;
    if (!Number.isInteger(selectedYear) || selectedYear < 1 || selectedYear > 9999) {error.value = 'Укажите год от 1 до 9999.';return;}
    loading.value = true;
    try {
        let {data} = await api.get(`/employeescard/${props.employeeId}/statistics`,{params:{year:selectedYear}});
        if (current !== version) return;
        // новый код chat: если выбранный год не отработан, загружаем последний доступный
        if (data.years.length && !data.years.includes(selectedYear)) {
            year.value = data.years[0];
            ({data} = await api.get(`/employeescard/${props.employeeId}/statistics`,{params:{year:year.value}}));
        }
        if (current === version) {
            statistics.value = data;
            const worked = data.months.filter(item => Number(item.shifts) > 0);
            selectedMonth.value = worked.length ? Math.max(...worked.map(item => item.month)) : (data.year === currentYear ? currentMonth : 1);
        }
    } catch(err) { if (current === version) error.value = typeof err.response?.data === 'string' ? err.response.data : 'Не удалось загрузить статистику.'; }
    finally { if (current === version) loading.value = false; }
};
watch(() => props.employeeId,() => {year.value = currentYear; load();},{immediate:true}); // новый код chat: начальный год для новой карточки
onBeforeUnmount(() => {version++;});
// --------- конец нового кода chat
</script>
<style scoped>
/* --------- новый код chat: оформление статистики согласовано с панелями карточки сотрудника */
/* новый код chat: уменьшенные отступы и высота статистики */
.employee-statistics {background:var(--bs-body-bg);border:1px solid var(--bs-border-color);border-radius:10px;padding:12px 14px;color:var(--bs-body-color);min-width:0;}
.statistics-heading {display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:10px;}
.statistics-title {display:flex;align-items:center;gap:9px;}
.statistics-heading h2 {margin:0;font-size:16px;font-weight:600;}
.statistics-section-icon {display:inline-grid;place-items:center;width:30px;height:30px;border-radius:8px;color:var(--bs-primary);background:var(--bs-primary-bg-subtle);font-size:16px;}
/* новый код chat: самостоятельные карточки периода с компактными строками показателей */
.statistics-panels {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}
.statistics-panel {min-width:0;padding:10px 12px;border:1px solid var(--bs-border-color);border-radius:10px;background:var(--bs-body-bg);}
.statistics-panel-heading {display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;}
.statistics-panel-heading h3 {display:flex;align-items:center;gap:7px;font-size:14px;font-weight:600;margin:0;}
.statistics-panel-heading h3 i {color:var(--bs-secondary-color);font-size:14px;}
/* новый код chat: год оформлен так же, как выбор месяца */
.statistics-year-input {width:auto;min-width:86px;max-width:100%;font-size:12px;font-weight:500;padding:4px 28px 4px 9px;border-radius:20px;border-color:transparent;background-color:var(--bs-tertiary-bg);color:var(--bs-body-color);} /* новый код chat: место для стрелки селекта */
.statistics-year-input:hover {border-color:var(--bs-border-color);}
/* новый код chat: компактный селект сохраняет оформление подписи периода */
.statistics-month-select {width:118px;max-width:100%;font-size:12px;font-weight:500;padding:4px 28px 4px 9px;border-radius:20px;border-color:transparent;background-color:var(--bs-tertiary-bg);color:var(--bs-body-color);} /* новый код chat: компактная ширина выбора месяца */
.statistics-month-select:hover {border-color:var(--bs-border-color);}
.statistics-totals {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:6px;}
.statistics-total {padding:8px 10px;display:flex;flex-direction:column;gap:3px;min-width:0;background:var(--bs-tertiary-bg);border-radius:8px;}
.statistics-total span {font-size:13px;color:var(--bs-secondary-color);}
.statistics-total strong {font-size:24px;font-weight:600;line-height:1.2;letter-spacing:-.5px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}
.statistics-marks {display:grid;}
.statistics-mark {display:flex;align-items:center;justify-content:space-between;gap:12px;padding:5px 2px;font-size:13px;border-bottom:1px solid var(--bs-tertiary-bg);}
.statistics-mark:last-child {border-bottom:0;padding-bottom:0;}
.statistics-mark-name {min-width:0;}
.statistics-mark strong {white-space:nowrap;font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;}
.statistics-mark small {font-size:12px;font-weight:400;color:var(--bs-secondary-color);}
.statistics-mark-empty {color:var(--bs-secondary-color);font-weight:400 !important;}
.statistics-mark-warning {color:var(--bs-danger);}
/* --------- новый код chat: компактная годовая сетка с прокруткой на небольшом экране */
/* новый код chat: календарь над годовыми и месячными показателями */
.activity-calendar {margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--bs-border-color);}
.activity-heading {display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-bottom:10px;}
.activity-heading > span {font-size:12px;color:var(--bs-secondary-color);}
.activity-scroll {overflow-x:auto;padding:2px 2px 6px;}
.activity-grid {display:grid;grid-template-columns:26px repeat(var(--weeks),minmax(10px,1fr));grid-template-rows:18px repeat(7,12px);gap:3px;min-width:740px;}
.activity-month,.activity-weekday {font-size:10px;color:var(--bs-secondary-color);white-space:nowrap;line-height:12px;}
.activity-month {align-self:start;}
.activity-day {border-radius:2px;box-shadow:inset 0 0 0 1px #00000006;min-width:0;}
.activity-day:hover,.activity-day:focus-visible {outline:2px solid var(--bs-primary);outline-offset:1px;}
/* новый код chat: tooltip находится в body, переносы разделяют дату и отметки */
:global(.employee-activity-tooltip .tooltip-inner) {white-space:pre-line;max-width:300px;text-align:left;font-size:12px;}
.activity-legend {display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:6px 12px;margin-top:6px;font-size:11px;color:var(--bs-secondary-color);}
.activity-legend > span {display:inline-flex;align-items:center;gap:4px;}
.activity-legend i {display:inline-block;width:10px;height:10px;border-radius:2px;}
/* --------- конец нового кода chat */
@media(max-width:767px) {
    .employee-statistics {padding:12px;}
    .statistics-heading h2 {font-size:18px;}
    .statistics-panels {grid-template-columns:1fr;}
    .statistics-panel {padding:10px 12px;}
}
/* --------- конец нового кода chat */
</style>
