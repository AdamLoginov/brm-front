<template>
  <div>
    <h2>Пользователи</h2>
    <div v-if="error" style="color: red">{{ error }}</div>
    
    <ul v-if="users.length">
      <li v-for="u in users" :key="u.ID">
        <b>{{ u.Login }}</b>: {{ u.EmployeeCard?.Name || 'Нет карточки' }}
      </li>
    </ul>
    <p v-else-if="!error">Загрузка пользователей...</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// Аналог data() — создаем реактивные переменные
const users = ref([]);
const error = ref(null);

// Аналог mounted()
onMounted(async () => {
  const token = localStorage.getItem('user-token');

  try {
    const res = await fetch("http://192.168.0.180:8080/users", {
      headers: { 
        "Authorization": `Bearer ${token}` 
      }
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error("Не авторизован");
      throw new Error("Ошибка при получении данных");
    }

    users.value = await res.json();
        } catch (err) {
    error.value = err.message;
    console.error("Fetch error:", err);
  }
});
</script>