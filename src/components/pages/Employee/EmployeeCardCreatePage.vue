<template>
    <div class="container-fluid">
        <div class="pt-3">
            <h4>Создать карточку сотрудника</h4>
            <hr>
        </div>
        <form class="col-8" @submit.prevent="createEmployeeCardHandler">
            <div class="row fw-semibold" style="font-size: 12px;">
                <div class="col-4">
                    <label class="form-label">Фамилия</label>
                    <input v-model="formData.surname" type="text" class="form-control form-control-sm" placeholder="Иванов">
                </div>
                <div class="col-4">
                    <label class="form-label">Имя</label>
                    <input v-model="formData.name" type="text" class="form-control form-control-sm" placeholder="Иван">
                </div>
                <div class="col-4">
                    <label class="form-label">Отчество</label>
                    <input v-model="formData.middle_name" type="text" class="form-control form-control-sm" placeholder="Иванович">
                </div>

                <div class="col-2 pt-3">
                    <label class="form-label">Дата рождения</label>
                    <input v-model="formData.date_of_birth" type="date" class="form-control form-control-sm">
                </div>
                <div class="col-5 pt-3">
                    <label class="form-label">Город проживания</label>
                    <input v-model="formData.place_of_residence" type="text" class="form-control form-control-sm" placeholder="Иркутск">
                </div>
                <div class="col-5 pt-3">
                    <label class="form-label">Семейное положение</label>
                    <input v-model="formData.marital_status" type="text" class="form-control form-control-sm" placeholder="Женат/Не женат">
                </div>

                <div class="col-3 pt-3">
                    <label class="form-label">Образование</label>
                    <input v-model="formData.education" type="text" class="form-control form-control-sm" placeholder="Среднеспециальное">
                </div>
                <div class="col-9 pt-3">
                    <label class="form-label">Опыт:</label>
                    <input v-model="formData.experience" type="text" class="form-control form-control-sm" placeholder="Без оптыа">
                </div>

                <div class="col-2 pt-3">
                    <label class="form-label">Дата начала работы</label>
                    <input v-model="formData.start_date" type="date" class="form-control form-control-sm">
                </div>
                <div class="col-2 pt-3">
                    <label class="form-label">Ставка ЗП:</label>
                    <input v-model="formData.salary_rate" type="text" class="form-control form-control-sm" placeholder="3000">
                </div>
                <div class="col-8 pt-3">
                    <label class="form-label">Должность</label>
                    <input v-model="formData.profession" type="text" class="form-control form-control-sm" placeholder="Инженер ПТО">
                </div>

                <div class="col-4 pt-3">
                    <label class="form-label">Серия паспорта</label>
                    <input v-model="formData.pasport_serial" type="text" class="form-control form-control-sm" placeholder="2515">
                </div>
                <div class="col-4 pt-3">
                    <label class="form-label">Номер паспорта</label>
                    <input v-model="formData.pasport_number" type="text" class="form-control form-control-sm" placeholder="432344">
                </div>
                <div class="col-4 pt-3">
                    <label class="form-label">Снилс</label>
                    <input v-model="formData.snils" type="text" class="form-control form-control-sm" placeholder="812828828">
                </div>

                <div class="col-6 pt-3">
                    <label class="form-label">Номер телефона</label>
                    <input v-model="formData.phone" type="text" class="form-control form-control-sm" placeholder="+79149045535">
                </div>
                <div class="col-6 pt-3">
                    <label class="form-label">Email</label>
                    <input v-model="formData.email" type="text" class="form-control form-control-sm" placeholder="brmirk@mail.ru">
                </div>

                <div class="col-12 pt-3">
                    <label class="form-label">Договор к которому приписан работник </label>
                    <select v-model="formData.agreement_id" class="form-select form-select-sm">
                        <option :value="0">Не приписан ни к какому договору</option>
                        <option v-for="agreement in agreements" :key="agreement.ID" :value="agreement.ID">{{ agreement.name }}</option>
                    </select>
                </div>
                <div class="col-12 pt-3">
                    <div class="form-check" style="font-size: 16px;">
                        <input v-model="formData.status" class="form-check-input" type="checkbox" value="" id="checkDefault">
                        <label class="form-check-label" for="checkDefault" style="font-size: 12px;">Данный сотрудник уволен</label>
                    </div>
                </div>

                <div class="d-flex align-items-end pt-3">
                    <button type="submit" class="btn btn-primary btn-sm" :disabled="isSubmit">Создать</button>
                </div>
            </div>
        </form>
    </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import api from '../../../api';
import { useRouter } from 'vue-router';

const router = useRouter();

const isSubmit = ref(false);

const formData = reactive({
    name: "",
    surname: "",
    middle_name: "",
    date_of_birth: "",
    place_of_residence: "",
    marital_status: "",
    start_date: "",
    salary_rate: "",
    experience: "",
    education: "",
    pasport_serial: "",
    pasport_number: "",
    snils: "",
    phone: "",
    email: "",
    profession: "",
    agreement_id: 0,
    status: false
});

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
    try{
        isSubmit.value = true;
        const res = await api.post('/employeescard/create', formData);

        router.push({name: 'employee-cards'});

        formData.name = "",
        formData.surname = "";
        formData.middle_name = "";
        formData.date_of_birth = "";
        formData.place_of_residence = "";
        formData.marital_status = "";
        formData.start_date = "";
        formData.salary_rate = "";
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
        console.log('[Error] ', err);
    }finally{
        isSubmit.value = false;
    }
}

onMounted(getAgreementHandler);
</script>

<style>

</style>