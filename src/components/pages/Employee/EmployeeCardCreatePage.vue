<template>
    <!-- --------- новый код chat: форма сгруппирована по смысловым разделам -->
    <div class="container-fluid employee-create-page py-3">
        <header class="employee-create-header">
            <router-link :to="{name:'employee-cards'}" class="employee-back-link"><i class="bi bi-arrow-left" aria-hidden="true"></i> Сотрудники</router-link>
            <h1>Новая карточка сотрудника</h1>
            <p>Личные данные, документы и условия работы в одной карточке.</p>
        </header>
        <div v-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
        <form @submit.prevent="createEmployeeCardHandler">
            <fieldset :disabled="isSubmit" class="border-0 p-0 m-0">
                <div class="row g-3">
                    <div class="col-12 col-xl-8 employee-sections">
<section class="employee-form-section"><div class="employee-section-heading"><span class="employee-section-icon"><i class="bi bi-person" aria-hidden="true"></i></span><h2>Личные данные</h2></div><div class="row g-3"><div class="col-12 col-md-4"><label for="create-employee-surname" class="form-label">Фамилия</label><input id="create-employee-surname" v-model="formData.surname" type="text" class="form-control form-control-sm" placeholder="Иванов"></div><div class="col-12 col-md-4"><label for="create-employee-name" class="form-label">Имя</label><input id="create-employee-name" v-model="formData.name" type="text" class="form-control form-control-sm" placeholder="Иван"></div><div class="col-12 col-md-4"><label for="create-employee-middle_name" class="form-label">Отчество</label><input id="create-employee-middle_name" v-model="formData.middle_name" type="text" class="form-control form-control-sm" placeholder="Иванович"></div><div class="col-12 col-md-4"><label for="create-employee-date_of_birth" class="form-label">Дата рождения</label><input id="create-employee-date_of_birth" v-model="formData.date_of_birth" type="date" class="form-control form-control-sm" placeholder=""></div><div class="col-12 col-md-4"><label for="create-employee-place_of_residence" class="form-label">Город проживания</label><input id="create-employee-place_of_residence" v-model="formData.place_of_residence" type="text" class="form-control form-control-sm" placeholder="Иркутск"></div><div class="col-12 col-md-4"><label for="create-employee-marital_status" class="form-label">Семейное положение</label><input id="create-employee-marital_status" v-model="formData.marital_status" type="text" class="form-control form-control-sm" placeholder="Например, женат"></div>
</div></section><section class="employee-form-section"><div class="employee-section-heading"><span class="employee-section-icon"><i class="bi bi-telephone" aria-hidden="true"></i></span><h2>Контакты</h2></div><div class="row g-3"><div class="col-12 col-sm-6"><!-- новый код chat: список телефонов --><EmployeePhoneFields v-model="formData.phones" /></div><div class="col-12 col-sm-6"><label for="create-employee-email" class="form-label">Электронная почта</label><input id="create-employee-email" v-model="formData.email" type="text" class="form-control form-control-sm" placeholder="name@example.ru"></div></div></section><section class="employee-form-section"><div class="employee-section-heading"><span class="employee-section-icon"><i class="bi bi-person-vcard" aria-hidden="true"></i></span><h2>Документы</h2></div><div class="row g-3"><div class="col-12 col-md-4"><label for="create-employee-pasport_serial" class="form-label">Серия паспорта</label><input id="create-employee-pasport_serial" v-model="formData.pasport_serial" type="text" class="form-control form-control-sm" placeholder="2515"></div><div class="col-12 col-md-4"><label for="create-employee-pasport_number" class="form-label">Номер паспорта</label><input id="create-employee-pasport_number" v-model="formData.pasport_number" type="text" class="form-control form-control-sm" placeholder="123456"></div><div class="col-12 col-md-4"><label for="create-employee-snils" class="form-label">СНИЛС</label><input id="create-employee-snils" v-model="formData.snils" type="text" class="form-control form-control-sm" placeholder="000-000-000 00"></div></div></section><section class="employee-form-section"><div class="employee-section-heading"><span class="employee-section-icon"><i class="bi bi-mortarboard" aria-hidden="true"></i></span><h2>Образование и опыт</h2></div><div class="row g-3"><div class="col-12 col-sm-6"><label for="create-employee-education" class="form-label">Образование</label><input id="create-employee-education" v-model="formData.education" type="text" class="form-control form-control-sm" placeholder="Среднее профессиональное"></div><div class="col-12 col-sm-6"><label for="create-employee-experience" class="form-label">Опыт работы</label><input id="create-employee-experience" v-model="formData.experience" type="text" class="form-control form-control-sm" placeholder="Например, 3 года"></div></div></section>
                    <!-- новый код chat: блок размеров и ИТР -->
                    <EmployeeSizeFields v-model:clothing-size="formData.clothing_size" v-model:shoe-size="formData.shoe_size" v-model:height-c-m="formData.height_cm" />
                    </div>
                    <div class="col-12 col-xl-4">
                        <!-- --------- новый код chat: последовательные группы работы, назначения и оплаты -->
                        <section class="employee-form-section employee-work-section">
                            <div class="employee-section-heading">
                                <span class="employee-section-icon"><i class="bi bi-briefcase" aria-hidden="true"></i></span>
                                <h2>Работа и оплата</h2>
                            </div>

                            <div class="employee-work-group">
                                <div>
                                    <label for="create-employee-profession" class="form-label">Должность</label>
                                    <input id="create-employee-profession" v-model="formData.profession" type="text" class="form-control form-control-sm" placeholder="Инженер ПТО">
                                </div>
                                <EmployeeSpecializationFields v-model="formData.specialization_ids" />
                                <div class="employee-status-setting">
                                    <div>
                                        <label for="create-employee-itr" class="mb-0">Сотрудник ИТР</label>
                                        <div class="employee-field-hint">Инженерно-технический работник</div>
                                    </div>
                                    <div class="form-check form-switch mb-0">
                                        <input id="create-employee-itr" v-model="formData.is_itr" class="form-check-input" type="checkbox" role="switch">
                                    </div>
                                </div>
                            </div>

                            <div class="employee-work-group">
                                <h3>Назначение</h3>
                                <div>
                                    <label for="create-employee-agreement" class="form-label">Договор</label>
                                    <select id="create-employee-agreement" v-model="formData.agreement_id" :disabled="formData.status" class="form-select form-select-sm">
                                        <option :value="0">Не закреплён за договором</option>
                                        <option v-for="agreement in agreements" :key="agreement.ID" :value="agreement.ID">{{ agreement.name }}</option>
                                    </select>
                                </div>
                                <div>
                                    <label for="create-employee-start_date" class="form-label">Начало работы</label>
                                    <input id="create-employee-start_date" v-model="formData.start_date" type="date" class="form-control form-control-sm">
                                </div>
                            </div>

                            <div class="employee-work-group">
                                <h3>Условия оплаты</h3>
                                <div>
                                    <label for="create-employee-salary_rate" class="form-label">Ставка за смену, ₽</label>
                                    <MoneyInputComponent id="create-employee-salary_rate" v-model="formData.salary_rate" class="form-control form-control-sm" placeholder="3 000" />
                                </div>
                                <div class="employee-employment-fields">
                                    <EmployeeEmploymentFields v-model:officially-employed="formData.officially_employed" v-model:monthly-salary-kopecks="formData.monthly_salary_kopecks" v-model:employment-order-number="formData.employment_order_number" v-model:employment-order-date="formData.employment_order_date" /> <!-- новый код chat: реквизиты приказа -->
                                </div>
                                <!-- --------- новый код chat: алименты под официальной оплатой, в стиле увольнения -->
                                <div v-if="formData.officially_employed" class="employee-status-setting">
                                    <div>
                                        <label for="create-employee-alimony" class="mb-0">Алименты</label>
                                        <div id="create-employee-alimony-hint" class="employee-field-hint">Сотрудник выплачивает алименты</div>
                                    </div>
                                    <div class="form-check form-switch mb-0">
                                        <input id="create-employee-alimony" v-model="formData.has_alimony" class="form-check-input" type="checkbox" role="switch" aria-describedby="create-employee-alimony-hint">
                                    </div>
                                </div>
                                <!-- --------- конец нового кода chat -->
                            </div>

                            <div class="employee-work-group">
                                <div class="employee-status-setting">
                                    <div>
                                        <label for="create-employee-dismissed" class="mb-0">Сотрудник уволен</label>
                                        <div class="employee-field-hint">При увольнении закрепление за договором снимается</div>
                                    </div>
                                    <div class="form-check form-switch mb-0">
                                        <!-- новый код chat: дата при ручном включении увольнения -->
                                        <input id="create-employee-dismissed" v-model="formData.status" class="form-check-input" type="checkbox" role="switch" @change="setDismissalDate">
                                    </div>
                                </div>
                            </div>
                            <!-- --------- новый код chat: дата увольнения -->
                            <div v-if="formData.status" class="employee-work-group">
                                <label for="create-employee-dismissal-date" class="form-label">Дата увольнения</label>
                                <input id="create-employee-dismissal-date" v-model="formData.dismissal_date" type="date" class="form-control form-control-sm" required>
                            </div>
                            <!-- --------- конец нового кода chat -->
                        </section>
                        <!-- --------- конец нового кода chat -->
                    </div>
                </div>
                <footer class="employee-form-footer">
                    <span class="employee-footer-note"><i class="bi bi-person-plus me-1" aria-hidden="true"></i>Создание новой карточки</span>
                    <div class="d-flex gap-2"><button type="button" class="btn btn-outline-secondary btn-sm" @click="router.push({name:'employee-cards'})">Отмена</button><button type="submit" class="btn btn-primary btn-sm" :disabled="isSubmit"><span v-if="isSubmit" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span><i v-else class="bi bi-plus-lg me-1" aria-hidden="true"></i>{{ isSubmit ? 'Сохраняем…' : 'Создать карточку' }}</button></div>
                </footer>
            </fieldset>
        </form>
    </div>
    <!-- --------- конец нового кода chat -->
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import api from '../../../api';
// --------- новый код chat: специализации, телефоны и денежные поля
import EmployeePhoneFields from './EmployeePhoneFields.vue';
import EmployeeSpecializationFields from './EmployeeSpecializationFields.vue';
import MoneyInputComponent from '../../MoneyInputComponent.vue';
// --------- конец нового кода chat
import EmployeeSizeFields from './EmployeeSizeFields.vue'; // новый код chat: размеры и ИТР
import EmployeeEmploymentFields from './EmployeeEmploymentFields.vue'; // новый код chat: новые поля карточки
import { useRouter } from 'vue-router';

const router = useRouter();

const isSubmit = ref(false);
const errorMessage = ref(''); // новый код chat: видимая ошибка формы

const formData = reactive({
    // --------- новый код chat: размеры и категория сотрудника
    phones: [""], // новый код chat: все номера сотрудника
    specialization_ids: [], // новый код chat: связи со справочником
    clothing_size: "",
    shoe_size: "",
    height_cm: null,
    is_itr: false,
    has_alimony: false, // новый код chat: алименты по умолчанию отключены
    // --------- конец нового кода chat
    name: "",
    surname: "",
    middle_name: "",
    date_of_birth: "",
    place_of_residence: "",
    marital_status: "",
    start_date: "",
    salary_rate: "",
    officially_employed: false, // новый код chat: по умолчанию не устроен официально
    employment_order_number: '', // новый код chat: необязательные реквизиты приказа
    employment_order_date: '', // новый код chat
    monthly_salary_kopecks: 0, // новый код chat: месячная зарплата в копейках
    experience: "",
    education: "",
    pasport_serial: "",
    pasport_number: "",
    snils: "",
    phone: "",
    email: "",
    profession: "",
    agreement_id: 0,
    status: false,
    dismissal_date: "", // новый код chat: дата увольнения
});

// --------- новый код chat: увольнение снимает текущее закрепление
watch(() => formData.status, dismissed => {
    if (dismissed) formData.agreement_id = 0;
    else formData.dismissal_date = ''; // новый код chat: работающему дата не нужна
}, {flush: 'sync'});
// --------- новый код chat: локальная сегодняшняя дата только при включении переключателя
function setDismissalDate() {
    if (!formData.status || formData.dismissal_date) return;
    const today = new Date();
    formData.dismissal_date = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
}
// --------- конец нового кода chat
// --------- конец нового кода chat

const agreements = ref(null);

const getAgreementHandler = async()=>{
    try{
        const res = await api.get('/agreements');
        agreements.value = res.data;
        console.log("[Договоры]:", agreements.value)
    }catch(err){
        console.log(err);
    }
}

const createEmployeeCardHandler = async() =>{
    if (isSubmit.value) return; // новый код chat: защита повторного нажатия
    errorMessage.value = '';
    try{
        isSubmit.value = true;
        const res = await api.post('/employeescard/create', formData);

        router.push({name: 'employee-cards'});

        // --------- новый код chat: сброс размеров и ИТР
        formData.phones = [""]; // новый код chat
        formData.specialization_ids = []; // новый код chat
        formData.clothing_size = "";
        formData.shoe_size = "";
        formData.height_cm = null;
        formData.is_itr = false;
        formData.has_alimony = false; // новый код chat: сброс отметки после создания
        // --------- конец нового кода chat
        formData.name = "",
        formData.surname = "";
        formData.middle_name = "";
        formData.date_of_birth = "";
        formData.place_of_residence = "";
        formData.marital_status = "";
        formData.start_date = "";
        formData.salary_rate = "";
        formData.officially_employed = false; // новый код chat
        formData.employment_order_number = ''; // новый код chat: очистка после создания карточки
        formData.employment_order_date = ''; // новый код chat
        formData.monthly_salary_kopecks = 0; // новый код chat
        formData.education = "";
        formData.experience = "";
        formData.pasport_serial = "";
        formData.pasport_number = "";
        formData.snils = "";
        formData.phone = "";
        formData.email = "";
        formData.profession = "";
        formData.agreement_id = 0;
        formData.status = false;
    }catch(err){
        errorMessage.value = typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось создать карточку. Попробуйте ещё раз.'; // новый код chat: ошибка остаётся рядом с формой
    }finally{
        isSubmit.value = false;
    }
}

onMounted(getAgreementHandler);
</script>

<style scoped>
/* --------- новый код chat: единый стиль разделов и адаптивная сетка */
.employee-create-page { max-width: 1440px; font-size: 13px; }
.employee-create-header { margin-bottom: 20px; }
.employee-back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--bs-secondary-color); text-decoration: none; margin-bottom: 12px; }
.employee-back-link:hover { color: var(--bs-primary); }
.employee-create-header h1 { font-size: 23px; font-weight: 600; margin-bottom: 6px; }
.employee-create-header p { color: var(--bs-secondary-color); margin: 0; }
.employee-sections { display: flex; flex-direction: column; gap: 16px; }
.employee-form-section { padding: 18px; border: 1px solid var(--bs-border-color); border-radius: 10px; background: var(--bs-body-bg); }
.employee-section-heading { display: flex; align-items: center; gap: 9px; margin-bottom: 18px; }
.employee-section-icon { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; color: var(--bs-primary); background: var(--bs-primary-bg-subtle); font-size: 15px; }
.employee-section-heading h2 { margin: 0; font-size: 14px; font-weight: 600; }
.employee-create-page .form-label, .employee-employment-fields :deep(.form-label) { font-size: 12px; font-weight: 500; margin-bottom: 6px; }
.employee-create-page .form-control, .employee-create-page .form-select,
.employee-employment-fields :deep(.form-control), .employee-employment-fields :deep(.form-select) { font-size: 13px; min-height: 36px; border-radius: 6px; }
.employee-create-page .form-control::placeholder { color: var(--bs-secondary-color); opacity: .7; }
.employee-employment-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; border-top: 1px solid var(--bs-border-color); padding-top: 16px; }
.employee-employment-fields :deep(.col-4) { width: 100%; padding-top: 0 !important; }
.employee-status-setting { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; background: var(--bs-tertiary-bg); }
.employee-status-setting label { font-size: 12px; font-weight: 500; cursor: pointer; }
.employee-status-setting .form-check-input { cursor: pointer; }
.employee-field-hint { margin-top: 3px; font-size: 11px; color: var(--bs-secondary-color); }
.employee-form-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 16px 0 8px; margin-top: 8px; }
.employee-footer-note { color: var(--bs-secondary-color); font-size: 12px; }
.employee-form-footer .btn { padding: 7px 14px; border-radius: 6px; font-size: 13px; }
/* --------- новый код chat: размеры текста на странице создания, включая вложенные блоки */
.employee-create-page :deep(.btn),
.employee-create-page :deep(.btn-close) { font-size: 14px; }
.employee-create-page :deep(.form-label),
.employee-create-page :deep(.form-check-label),
.employee-create-page .employee-status-setting label { font-size: 13px; }
.employee-create-page .employee-section-heading h2,
.employee-create-page :deep(.employee-size-fields h2) { font-size: 15px; }
/* --------- конец нового кода chat */
/* --------- новый код chat: группы с едиными отступами и тонкими разделителями */
.employee-work-group { display: grid; gap: 14px; min-width: 0; }
.employee-work-group + .employee-work-group { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--bs-border-color); }
.employee-work-group h3 { margin: 0; font-size: 13px; font-weight: 600; color: var(--bs-secondary-color); }
.employee-work-section .employee-employment-fields { border-top: 0; padding-top: 0; }
/* --------- конец нового кода chat */
@media (max-width: 575px) {
    .employee-form-section { padding: 14px; }
    .employee-create-header h1 { font-size: 20px; }
    .employee-employment-fields { grid-template-columns: 1fr; }
    .employee-footer-note { display: none; }
    .employee-form-footer { justify-content: flex-end; }
}
/* --------- конец нового кода chat */
</style>
