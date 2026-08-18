<template>
    <div>
        <div class="row" style="padding-bottom:10px;">
            <a href="/employee/create">Создать нового сотрудника</a>
        </div>
        <div v-if="error" style="color: red">{{ error }}</div>
        <div v-if="employeeCard.length" class="row">
            <div v-for="item in employeeCard" :key="item.ID" class="col-2">
                <div class="card">
                    <div class="row card-body">
                        {{item.Name}}, {{item.ID}}
                    </div>

                    <button @click="deleteEmployee(item.ID)">Удалить</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { ref, onMounted } from 'vue'

    const employeeCard = ref([]);
    const error = ref(null);

    const getEmployees = async() =>{
        const token = localStorage.getItem("user-token");

        try {
            const res = await fetch("http://127.0.0.1:8080/employees", {
                headers:{
                    "Authorization": `Bearer ${token}` 
                }
            });

            if (!res.ok) {
                if (res.status === 401) throw new Error("Не авторизован");
                throw new Error("Ошибка при получении данных");
            }
            employeeCard.value = await res.json();
        } catch(err) {
            error.value = err.message;
            console.error("Fetch error:", err);
        }
    };

    const deleteEmployee = async(id) =>{
        const token = localStorage.getItem("user-token");
        try {
            const res = await fetch(`http://127.0.0.1:8080/employees/delete/${id}`, {
                headers:{
                    "Authorization": `Bearer ${token}` 
                }
            });

            if (!res.ok) throw new Error("Не удалось удалить элемент на сервере");

            employeeCard.value = employeeCard.value.filter(item => item.ID !== id);
        }catch(err){
            error.value = err.message;
            console.error("Fetch error:", err);
        }
    };

    onMounted(getEmployees);
</script>

<style scoped>
.card{
    border:1px solid rgb(126, 126, 126);
    border-radius: 7px;
}
</style>