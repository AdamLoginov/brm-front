<template>
  <div class="container-fluid pt-3 d-flex">
    <div class="col-sm-12 col-md-12 col-lg-10 col-xl-8">
      <div v-if="employeeCard" class="list-group">
        <div class="list-group-item d-flex">
          <div class="col-4 pe-4">
            <a
              v-if="avatar && avatar.length !== 0"
              :href="`${apiBaseurl}/employeescard/document/${avatar.at(-1).ID}/detail`"
              target="_blank"
              class="d-block w-100 ratio-3x4"
            >
              <img
                :src="`${apiBaseurl}/employeescard/document/${avatar.at(-1).ID}/detail`"
                class="w-100 h-100 object-fit-cover roundedl"
                alt="Фото сотрудника"
              >
            </a>

            <div v-else class="d-flex justify-content-center align-items-center text-muted">
              Нет фото
            </div>
          </div>
          <div  class="col-8">
            <div class="d-flex">
              <div class="col-4 pe-3 fw-semibold">ФИО:</div>
              <div class="col-8 employeecard-text" >{{ employeeCard.surname }} {{ employeeCard.name }} {{ employeeCard.middle_name }}</div>
            </div>
            
            <div class="pt-3">
              <div class="d-flex">
                <div class="col-4 pe-3 fw-semibold">Дата рождения:</div>
                <div class="col-8 employeecard-text" >{{ employeeCard.date_of_birth }}</div>
              </div>
              <div class="d-flex">
                <div class="col-4 pe-3 fw-semibold">Город проживания:</div>
                <div class="col-8 employeecard-text" >{{ employeeCard.place_of_residence }}</div>
          </div>
          <div class="d-flex">
            <div class="col-4 pe-3 fw-semibold">Семейное положение:</div>
            <div class="col-8 employeecard-text" >{{ employeeCard.marital_status }}</div>
          </div>
        </div>
        
        <div class="pt-3">
          <div class="d-flex">
            <div class="col-4 pe-3 fw-semibold">Дата начала работы:</div>
            <div class="col-8 employeecard-text" >{{ employeeCard.start_date }}</div>
          </div>
          <div class="d-flex">
            <div class="col-4 pe-3 fw-semibold">Образование:</div>
            <div class="col-8 employeecard-text" >{{ employeeCard.education }}</div>
          </div>
          <div class="d-flex">
            <div class="col-4 pe-3 fw-semibold">Опыт:</div>
            <div class="col-8 employeecard-text" >{{ employeeCard.experience }}</div>
          </div>
        </div>
        
        <div class="pt-3">
          <div class="d-flex">
            <div class="col-4 pe-3 fw-semibold">Паспорт:</div>
            <div class="col-8">  {{ employeeCard.pasport_serial }} {{ employeeCard.pasport_number }}</div>
          </div>
          <div class="d-flex">
            <div class="col-4 pe-3 fw-semibold">СНИЛС:</div>
            <div class="col-8"> {{ employeeCard.snils }}</div>
          </div>
        </div>
        
        <div class="pt-3">
          <div class="d-flex">
            <div class="col-4 pe-3 fw-semibold">Номер телефона:</div>
            <div class="col-8">{{ employeeCard.phone }}</div>
          </div>
          <div class="d-flex">
            <div class="col-4 pe-3 fw-semibold">Email:</div>
            <div class="col-8">{{ employeeCard.email }}</div>
          </div>
        </div>
        
        <div class="pt-3">
          <div class="d-flex">
            <div class="col-4 pe-3 fw-semibold">Должность:</div>
            <div class="col-8">{{ employeeCard.profession }}</div>
          </div>
          <div class="d-flex">
            <div class="col-4 pe-3 fw-semibold">Договор:</div>
            <div class="col-8 employeecard-text" >
              <div v-if="employeeCard.agreement_id !== 0">
                {{ employeeCard.agreement.name }}
              </div>
              <div v-else>
                Не приписан ни к какому договору
              </div>
            </div>
          </div>
          <div class="d-flex">
            <div class="col-4 pe-3 fw-semibold">Ставка ЗП:</div>
            <div class="col-8 employeecard-text" >{{ employeeCard.salary_rate }}</div>
          </div>
          <div class="d-flex">
            <div class="col-4 pe-3 fw-semibold">Статус сотрудника:</div>
            <div class="col-8 employeecard-text" >{{ !employeeCard.status ? 'Активный': 'Уволен' }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="list-group-item fw-semibold d-flex justify-content-between" style="font-size: 16px;">
      <div>Документы:</div>
      <div>
        <router-link class="me-3" style="font-size: 14px;" :to="{name: 'employee-card-update', params:{id:route.params.id}}">Изменить</router-link>
        <router-link style="font-size: 14px;" :to="{name: 'employee-card-document-create', params:{id:route.params.id}}">Добавить документ</router-link>
      </div>
    </div>
    <div v-for="(document, index) in employeeCard.employee_documents" :key="document.ID" class="list-group-item d-flex" style="font-size: 14px;">
      <div class="col-1 fw-semibold"> {{ index + 1 }}</div>
      <div class="col-5">
        {{ document.category_document_card.category_name }}
      </div>
      <div class="col-5">
        <a :href="`${apiBaseurl}/employeescard/document/${document.ID}/detail`" target="_blank" class="mx-2 d-block text-truncate">
          <span class="">{{ document.file_name }}</span>
        </a>
      </div>
      <div class="col-1 d-flex justify-content-end">
        <div class="dropdown">
          <a class="text-dark" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-three-dots-vertical"></i>
          </a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item text-danger" type="button" @click="deleteEmployeeCardDocumentHandler(document.ID)">Удалить</a></li>
            </ul>
          </div>
        </div>
    </div>
  </div>
  </div>
</div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import api from '../../../api';
import { onMounted, ref } from 'vue';

const route = useRoute();
const apiBaseurl = api.defaults.baseURL

const employeeCard = ref(null);
const avatar = ref(null);

const getEmployeeCardDetailHandler = async() =>{
  try{
    const res = await api.get(`/employeescard/${route.params.id}/detail`);
    employeeCard.value = res.data;
    avatar.value = employeeCard.value.employee_documents.filter(item => item.category_document_card.category_name === "Фото")
    console.log(employeeCard.value)
    console.log(avatar.value)
  }catch(err){
    console.log(err);
  }
}

const deleteEmployeeCardDocumentHandler = async(id) =>{
  try{
    const res = await api.delete(`/employeescard/document/${id}/delete`)
    employeeCard.value.employee_documents = employeeCard.value.employee_documents.filter(item => item.ID != id)
  }catch(err){
    console.log(err)
  }
}

onMounted(getEmployeeCardDetailHandler);
</script>

<style>
.employee-card-text{
font-size: 14px;
}

.ratio-3x4 {
  aspect-ratio: 3 / 4;
  overflow: hidden;
}
</style>