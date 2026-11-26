<template>
    <div>
        <button class="btn btn-sm btn-primary" type="button" data-bs-toggle="modal" data-bs-target="#create">Создать</button> <!-- новый код chat: заглавная буква -->


        <div class="modal fade" id="create" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="exampleModalLabel">Создать табель</h1>
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
                            <label class="form-label" for="create-shift-hours">Часов в смене</label>
                            <input id="create-shift-hours" v-model="formDataCreateTimeSheetMonth.shift_hours" type="text" inputmode="decimal" class="form-control form-control-sm" placeholder="12">
                        </div>
                        <div class="col-6">
                            <label class="form-label" for="create-absence-penalty">Штраф за прогул, ₽</label>
                            <input id="create-absence-penalty" v-model="formDataCreateTimeSheetMonth.absence_penalty" type="text" inputmode="decimal" class="form-control form-control-sm" placeholder="0,00">
                        </div>
                    </div>
                    <!-- новый код chat: суточные сохраняются в настройках табеля -->
                    <div class="mb-3">
                        <label class="form-label" for="create-daily-allowance">Суточные, ₽</label>
                        <input id="create-daily-allowance" v-model="formDataCreateTimeSheetMonth.daily_allowance" type="text" inputmode="decimal" class="form-control form-control-sm" placeholder="0,00">
                    </div>
                    <!-- --------- конец нового кода chat -->
                    <!-- новый код chat: копирование только видимых сотрудников предыдущего календарного месяца -->
                    <button type="button" class="btn btn-outline-primary btn-sm mb-2" :disabled="copyingEmployees || settingsSaving || !formDataCreateTimeSheetMonth.month" @click="copyPreviousEmployees">{{ copyingEmployees ? 'Копируем…' : 'Сотрудники с предыдущего месяца' }}</button>
                    <div v-if="copyMessage" class="small text-secondary mb-2" role="status">{{ copyMessage }}</div>
                    <fieldset :disabled="copyingEmployees || settingsSaving" :inert="copyingEmployees || settingsSaving" class="border-0 p-0 m-0">
                    <MultiSelect v-model="formDataCreateTimeSheetMonth.employee_card_id" :options="eligibleEmployees" :label-key="employee => [employee.surname, employee.name?.[0] ? employee.name[0] + '.' : '', employee.middle_name?.[0] ? employee.middle_name[0] + '.' : ''].filter(Boolean).join(' ')" placeholder="Выбрать сотрудников"/> <!-- новый код chat: список с учётом месяца увольнения -->
                    </fieldset>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Закрыть</button>
                    <button type="button" class="btn btn-primary btn-sm"  :disabled="settingsSaving || copyingEmployees" @click="createTimeSheetMonthHandler()">Сохранить</button> <!-- новый код chat: ждём завершения копирования -->
                </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed, watch } from 'vue'; // новый код chat: фильтр сотрудников по месяцу
import api from '../../../api';
import MultiSelect from '../../MultiSelect.vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const year = ref(new Date().getFullYear());

const employees = ref([])
// --------- новый код chat: месяц увольнения включительно доступен
const eligibleEmployees = computed(() => {
    const first = `${formDataCreateTimeSheetMonth.year}-${String(formDataCreateTimeSheetMonth.month).padStart(2, '0')}-01`;
    return employees.value.filter(employee => !employee.status || (/^\d{4}-\d{2}-\d{2}$/.test(employee.dismissal_date || '') && employee.dismissal_date >= first));
});
// --------- конец нового кода chat
// --------- новый код chat: проверка настроек перед отправкой
const settingsError = ref('');
const settingsSaving = ref(false);
// --------- новый код chat: предыдущий календарный месяц, включая переход между годами
const copyingEmployees = ref(false), copyMessage = ref('');
const copyPreviousEmployees = async() => {
    if (copyingEmployees.value || settingsSaving.value) return;
    const targetMonth = Number(formDataCreateTimeSheetMonth.month), targetYear = Number(formDataCreateTimeSheetMonth.year);
    if (!targetMonth || !Number.isInteger(targetYear)) return;
    const previousMonth = targetMonth === 1 ? 12 : targetMonth - 1;
    const previousYear = targetMonth === 1 ? targetYear - 1 : targetYear;
    const agreementID = route.params.id;
    const stillCurrent = () => route.params.id === agreementID && Number(formDataCreateTimeSheetMonth.month) === targetMonth && Number(formDataCreateTimeSheetMonth.year) === targetYear;
    copyingEmployees.value = true; copyMessage.value = ''; settingsError.value = '';
    try {
        const [monthsResponse, employeesResponse] = await Promise.all([
            api.get(`/agreements/${agreementID}/timesheetmonth`),
            api.get(`/agreements/${agreementID}/employee`, {params:{timesheet_candidates:1}}),
        ]);
        if (!stillCurrent()) return;
        const previous = (monthsResponse.data || []).find(item => Number(item.month) === previousMonth && Number(item.year) === previousYear);
        if (!previous) { copyMessage.value = 'За предыдущий месяц табель не создан.'; return; }
        const {data} = await api.get(`/agreements/timesheetmonth/detail/${previous.ID}`);
        if (!stillCurrent()) return;
        employees.value = employeesResponse.data || [];
        const hidden = new Set(data.hidden_employee_ids || []);
        const active = (data.employees || []).filter(employee => !hidden.has(employee.ID));
        const allowed = new Set(eligibleEmployees.value.map(employee => employee.ID));
        const copied = active.filter(employee => allowed.has(employee.ID)).map(employee => employee.ID);
        formDataCreateTimeSheetMonth.employee_card_id = [...new Set(copied)];
        const skipped = active.length - copied.length;
        copyMessage.value = `Выбрано сотрудников: ${copied.length}.` + (skipped ? ` Недоступны для выбранного месяца или договора: ${skipped}.` : '') + ' Список можно изменить перед сохранением.';
    } catch(err) {
        if (stillCurrent()) settingsError.value = typeof err.response?.data === 'string' ? err.response.data : 'Не удалось скопировать сотрудников.';
    } finally { copyingEmployees.value = false; }
};
// --------- конец нового кода chat
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
    year: year.value,
    agreement_id: parseInt(route.params.id, 10),
    employee_card_id: [],
    shift_hours: '12', // новый код chat
    absence_penalty: '0', // новый код chat
    daily_allowance: '0', // новый код chat: суточные
})

// --------- новый код chat: снимаем недоступный выбор при смене периода
watch(() => [formDataCreateTimeSheetMonth.year, formDataCreateTimeSheetMonth.month], () => {
    copyMessage.value = ''; // новый код chat: сообщение относится только к выбранному периоду
    const excluded = new Set(employees.value.filter(employee => employee.status && !eligibleEmployees.value.some(item => item.ID === employee.ID)).map(employee => employee.ID));
    formDataCreateTimeSheetMonth.employee_card_id = formDataCreateTimeSheetMonth.employee_card_id.filter(id => !excluded.has(id));
});
// --------- конец нового кода chat
const getEmployeeCardHandler = async() =>{
    try{
        const res = await api.get(`/agreements/${route.params.id}/employee`, {params:{timesheet_candidates:1}}) // новый код chat: включая уволенных
        employees.value = res.data
        console.log("[Employee component]", employees.value)
    }catch(err){
        console.log(err)
    }
}

const createTimeSheetMonthHandler = async() => {
    if (settingsSaving.value || copyingEmployees.value || !validateSettings()) return; // новый код chat: не сохраняем незавершённый выбор
    settingsSaving.value = true; // новый код chat
    try{
        console.log("[Form Data ]", formDataCreateTimeSheetMonth)
        const res = await api.post('/agreements/timesheetmonth/create', formDataCreateTimeSheetMonth)
        window.location.reload()
    }catch(err){
        console.log(err)
        settingsError.value = typeof err.response?.data === 'string' ? err.response.data : 'Не удалось сохранить табель.'; // новый код chat
    } finally { settingsSaving.value = false; } // новый код chat
}
onMounted(getEmployeeCardHandler);
</script>

<style>

</style>
