<template>
    <div class=""> 
        <form class="input-group" @submit.prevent="submitForm">
            <input 
              class="form-control" 
              type="file" 
              id="formFile" 
              @change="handleFileChange"
              ref="fileInput"
            >
            <button 
              class="btn btn-outline-primary" 
              type="submit" 
              :disabled="!selectedFile"
            >
                Отправить
            </button>
        </form>

          <div v-if="uploadStatus" class="mt-2 small" :class="statusClass">
            {{ uploadStatus }}
        </div>
  </div>

</template>

<script setup>
import { ref, computed } from 'vue';
import api from '../api'

const selectedFile = ref(null);
const uploadStatus = ref('');
const isError = ref(false);

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

  try {
    uploadStatus.value = 'Загрузка...';
    const response = await api.post('/materials/upload/excel', formData);

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