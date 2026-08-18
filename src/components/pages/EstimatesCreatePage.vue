<template>
    <div class="container-fluid pt-3">
        <div>
            <h4>Создать новую смету</h4>
        </div>
        <hr>
        <div class="col-6">
            <form @submit.prevent="submitForm" class="row">
                <div class=" col-6 pt-3">
                    <label for="exampleFormControlInput1" class="form-label">Название сметы</label>
                    <input v-model="nameEstimate" type="text" class="form-control" id="exampleFormControlInput1" placeholder="ЛС-000-00-0000">
                </div>
                <div class="col-6 pt-3">
                    <label for="exampleFormControlInput1" class="form-label">Тип сметы</label>
                    <select v-model="type" class="form-select" aria-label="Default select example">
                        <option value="12">12 колонок</option>
                        <option value="17">17 колонок</option>
                    </select>                
                </div>
                <div class="col-12 input-group pt-3">
                    <input class="form-control" type="file" id="formFile" @change="handleFileChange" ref="fileInput" >
                </div>
                <div class="pt-3">
                    <button class="btn btn-primary" type="submit" :disabled="!selectedFile">Отправить</button>
                </div>
            </form>
            <div v-if="uploadStatus" class="mt-2 small" :class="statusClass">
                {{ uploadStatus }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import api from '../../api'
import { useRoute } from 'vue-router';

const route = useRoute();
const uploadStatus = ref('');
const isError = ref(false);

const selectedFile = ref(null);
const nameEstimate = ref('');
const type = ref(12);

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    uploadStatus.value = `Выбран файл: ${file.name}`;
    isError.value = false;
  }
};

const submitForm = async () => {
  if (!selectedFile.value) return;

  const formData = new FormData();
  formData.append('ExcelFile', selectedFile.value);
  formData.append('name', nameEstimate.value);
  formData.append('type', type.value)

  try {
    uploadStatus.value = 'Загрузка...';
    const res = await api.post(`/agreements/${route.params.id}/estimates/create`, formData);

    uploadStatus.value = 'Файл успешно отправлен!';
    isError.value = false;
    selectedFile.value = null;
  } catch (error) {
    console.error('Ошибка при загрузке:', error);
    uploadStatus.value = error.response?.data?.message || 'Ошибка при отправке файла.';
    isError.value = true;
  }
};

const statusClass = computed(() => isError.value ? 'text-danger' : 'text-success');

</script>

<style>

</style>