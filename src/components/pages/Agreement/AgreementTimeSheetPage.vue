<template>
  <div class="container-fluid pt-3">
    <div class="border-bottom">
        <h4>Табеля</h4>
    </div>

    <div class="col-6 " style="font-size: 14px;">
        <div class="list-group pt-3">
            <div class="list-group-item d-flex fw-semibold">
                <div class="col-1">№</div>
                <div class="col-11">Наименование</div>
            </div>
            <div v-for="(tabel, index) in timesheetMonth" :key="tabel.ID" class="list-group-item d-flex">
                <div class="col-1">{{ index + 1 }}</div>
                <div class="col-10">
                    <router-link :to="{name: 'agreement-timesheet-detail', params: {id : tabel.ID}}">
                        {{ `${monthValue[tabel.month]} ${tabel.year}` }}
                    </router-link>
                </div>
                <div class="col-1 d-flex justify-content-end">
                    <div class="dropdown">
                        <a class="text-dark" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-three-dots-vertical"></i>
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item text-danger" type="button" @click="deleteTimeSheetMonthHanlder(tabel.ID)">Удалить</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import api from '../../../api';
import { useRoute } from 'vue-router';

const route = useRoute();

const timesheetMonth = ref(null);

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

const deleteTimeSheetMonthHanlder = async(id) => {
    try{
        const res = await api.delete(`/agreements/timesheetmonth/delete/${id}`)
        timesheetMonth.value = timesheetMonth.value.filter(item => item.ID !== id)
    }catch(err){
        console.log(err)
    }
}

const getTimeSheetMonthHandler = async() =>{
    try{
        const res = await api.get(`/agreements/${route.params.id}/timesheetmonth`)
        timesheetMonth.value = res.data.reverse()
        console.log(timesheetMonth.value)
    }
    catch(err){
        console.log(err)
    }
}

onMounted(getTimeSheetMonthHandler);
</script>

<style>

</style>