<template>
    <div  class="container-fluid pt-3">
        <div class="">
            <h4>Создать удостоверение высоты</h4>
            <hr>
        </div>
        <div class="d-flex border-bottom py-2">
            <div class="col-4 px-2">
                <select v-model="select_employee_id" class="form-select form-select-sm" aria-label="Small select example">
                    <option  v-for="(employee, index) in employees" :key="employee.ID" :value="index">{{ employee.name }} {{ employee.surname }} {{ employee.middle_name }}</option>
                </select>
            </div>
            <div class="col-4 px-2">
                <input class="form-control form-control-sm" type="text">
            </div>
            <div class="col-4 px-2"></div>
        </div>
        <div class="d-flex pt-3">
            
            <div class="border border-1 border-dark position-relative" style="width: 475px; height: 300px; font-family: 'Times New Roman', Times, serif;">
                <div class="position-absolute" style="padding-top: 2px; padding-left: 10px;">
                    <img src="../../../public/document/logo карьера.png" alt="" style="width: 110px; padding-top: 10px;">
                </div>
                <div class="position-absolute bottom-0 left" style="padding-bottom: 10px; padding-left: 10px;">
                    <img src="../../../public/document/Panov.png" alt="" style="width: 130px; padding-top: 10px;">
                </div>
                <div class="col-12 d-flex justify-content-center" style="font-size: 13.5px; font-style: italic; padding-top: 5px;">
                    ЧОУ ДПО “Карьера”
                </div>
            <div class="col-12 d-flex justify-content-center fw-bold" style="font-size: 15.5px; padding-top: 10px; padding-left: 63px;">
                УДОСТОВЕРЕНИЕ № РВ-08/26-21
            </div>

            <div class="d-flex" style="padding-top: 10px;">
                <div class="col-4"></div>
                <div class="col-8 d-flex justify-content-center">
                    <div class="col-2 align-content-end" style="font-size: 12.65px;">Фамилия</div>
                    <div class="col-10 border-bottom border-black border-1 d-flex justify-content-center align-content-end fw-bold" style="font-size: 16.9px;">{{ select_employee?.surname }}</div>
                </div>
            </div>
            <div class="d-flex">
                <div class="col-4"></div>
                <div class="col-8 d-flex justify-content-center">
                    <div class="col-2 align-content-end" style="font-size: 12.65px;">Имя</div>
                    <div class="col-10 border-bottom border-black border-1 d-flex justify-content-center align-content-end fw-bold" style="font-size: 16.9px;">{{ select_employee?.name }}</div>
                </div>
            </div>
            <div class="d-flex">
                <div class="col-4"></div>
                <div class="col-8 d-flex justify-content-center">
                    <div class="col-2 align-content-end" style="font-size: 12.65px;">Отчество</div>
                    <div class="col-10 border-bottom border-black border-1 d-flex justify-content-center align-content-end fw-bold" style="font-size: 16.9px;">{{ select_employee?.middle_name }}</div>
                </div>
            </div>

            <div class="col-12 d-flex pt-1" >
                <div class="col-4"></div>
                <div class="col-8 border-bottom border-black border-1 d-flex justify-content-center align-content-end fw-bold" style="font-size: 16.9px;">{{ select_employee?.profession }}</div>
            </div>
            <div class="col-12 d-flex" >
                <div class="col-4"></div>
                <div class="col-8 d-flex justify-content-center align-content-start " style="font-size: 10px;">(профессия, должность)</div>
            </div>
            
            <div class="col-12 d-flex">
                <div class="col-4"></div>
                <div class="col-8 border-bottom border-black border-1 d-flex justify-content-center align-content-end fw-bold" style="font-size: 16.9px;">ООО «БРМ»</div>
            </div>
            <div class="col-12 d-flex" >
                <div class="col-4"></div>
                <div class="col-8 d-flex justify-content-center align-content-start " style="font-size: 10px;">(организация)</div>
            </div>
            
            <div class="col-12 d-flex" style="font-size: 12.65px;">
                <div class="col-4"></div>
                <div class="col-4" style="padding-left: 50px;">Дата выдачи</div>
                <div class="col-4" style="padding-left: 23px;">Действительно до</div>
            </div>
            <div class="col-12 d-flex fw-bold" style="font-size: 12.65px;">
                <div class="col-4"></div>
                <div class="col-4" style="padding-left: 50px;">10.08.2026 г.</div>
                <div class="col-4" style="padding-left: 33px;">09.08.2029 г.</div>
            </div>
            <div class="col-12 d-flex" style="font-size: 12.65px; padding-top: 10px;">
                <div class="lh-1" style="padding-left: 217px;">Личная подпись</div>
                <div class="border-bottom border-black" style="width: 90px;"></div>
            </div>
        </div>

        <div class="border border-1 border-dark position-relative" style="width: 475px; height: 300px; margin-left: 10px; padding-left: 15px; padding-top: 10px; font-family: 'Times New Roman', Times, serif;">
            <div class="lh-1" style="font-size: 13.5px;">Прошел (ла):</div>
            <div class="" style="font-size: 13.5px;">- обучение безопасным методам и приемам выполнения работ на высоте;</div>
            <div class="lh-1" style="font-size: 13.5px;">- практическое обучение продолжительностью 10 часов.</div>
            <div class="fw-bold" style="font-size: 17px; padding-left: 70px; padding-top: 26px;">Решение аттестационной комиссии</div>
            <div class="lh-1"  style="font-size: 13.5px;">может быть допущен (а) к работам на высоте в составе бригады или под непосредственным контролем работника, назначенного приказом работодателя, лицо ответственное за организацию и безопасное <br>проведение работ на высоте за проведение инструктажей</div>
            <div class="fw-bold lh-1" style="font-size: 13.5px; text-decoration: underline 1.3px;">присвоена 2 группа по безопасности работ на высоте</div>
            <div style="font-size: 16.9px; padding-top: 13px;">Основание протокол № РВ 10/26-21 от 10.08.2026 г.</div>
            <div class="d-flex" style="font-size: 16.9px; padding-top: 26px;">
                <div class="col-8">Директор</div>
                <div class="col-4">А.В. Канаева</div>
            </div>
            <div style="font-size: 13.5px; padding-top: 15px;">М.П.</div>

        </div>
    </div>

    </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import api from '../../api';

const employees = ref(null);
const select_employee_id = ref(null);
const select_employee = ref(null);




const getEmployeeCardHandler = async() =>{
    try{
        const res = await api.get('/employeecards');
        employees.value = res.data.sort((a, b) =>(a.surname || '').localeCompare(b.surname || '', 'ru'))
        console.log('[Employee] ', res.data);
    }catch(err){
        console.log('[Error] ', err);
    }
};

watch(select_employee_id, (newValue, oldValue) => {
    console.log(newValue)
    select_employee.value = employees.value[parseInt(newValue, 10)]
    console.log(select_employee.value)
})


onMounted(getEmployeeCardHandler);
</script>

<style>

</style>