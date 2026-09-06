<template>
    <div class="list-group" style="font-size: 14px;">
        <div class="list-group-item">
            <div>
                Задачи
            </div>
        </div>
        <div class="list-group-item d-flex gap-2">
            <div class="col-6">
                <label>Текст задачи</label>
                <textarea v-model="formData.message" class="form-control" rows="1" style="font-size: 14px;"></textarea>
            </div>
            <div class="col-4 align-content-end">
                <label>Выбрать сотрудника</label>
                <select v-model="formData.to_employee_id" class="form-select form-select-sm">
                    <option :value="0">Сотрудник не выбран</option>
                    <option v-for="user in users" :key="user.ID" :value="user.ID">{{ user.employee_card.surname? `${user.employee_card.surname} ${user.employee_card.name.at(0)}.${user.employee_card.middle_name.at(0)}.` : user.login }} </option>
                </select>
            </div>
            <div class="col-2 align-content-end">
                <button class="btn btn-sm btn-primary" @click="createTaskHandler()">Создать</button>
            </div>
        </div>

        <div v-for="(task, index) in tasks" :key="task.ID ?? index" class="list-group-item d-flex gap-1">
            <div class="col-2 d-flex">
                <div class="col-2 d-flex flex-column ju">
                    <span>{{ index + 1 }}.</span>                    
                </div>
                <div class="col-8 d-flex flex-column" style="font-size: 12px;">
                    <span>{{ getCreateTime(task.CreatedAt) }}</span>
                    <span>{{ getCreateDate(task.CreatedAt) }}</span>
                </div>

                <div class="col-2">
                    <div
                        class="d-flex align-items-center justify-content-center"
                        style="height: 36px;"
                    >
                        <i v-if="task.status" class="bi bi-check-circle text-success"></i>
                        <i v-else class="bi bi-x-circle text-danger"></i>
                    </div>
                </div>

            </div>

            <div class="col-2 fw-semibold" style=" font-size: 12px;">

                <div>
                    Кому: {{ task.to_employee_card.ID !== 0 ?  `${task.to_employee_card.surname} ${task.to_employee_card.name.at(0)}.${task.to_employee_card.middle_name.at(0)}` : 'Не указан'}}
                </div>
                <div>
                    Кто: {{ task.from_employee_card.ID !== 0 ?  `${task.from_employee_card.surname} ${task.from_employee_card.name.at(0)}.${task.from_employee_card.middle_name.at(0)}` : 'Не указан'}}
                </div>
            </div>

            <div class="col-8 d-flex">
                <div class="col-11">
                    {{ task.message }}
                </div>
                <div class="col-1 d-flex justify-content-end">
                    <div class="dropdown">
                        <a class="text-dark" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-three-dots-vertical"></i>
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" type="button"  @click="updateSuccessTaskHanlder(task.ID)">Выполнено</a></li>
                            <li><a class="dropdown-item" type="button" >Изменить</a></li>
                            <li><a class="dropdown-item text-danger" type="button"  @click="deleteTaskHandler(task.ID)">Удалить</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import api from '../../../api';

const userId = localStorage.getItem('user-id')
const users = ref(null)

const tasks = ref(null)

const formData = reactive({
    message: "", 
    to_employee_id: 0,
    from_employee_id: parseInt(userId, 10)
});

const getUsersHandler = async() => {
    try{
        const res = await api.get('/users')
        users.value = res.data
        console.log("[Users]", res.data)
    }catch(err){
        console.log(err)
    }
}

const getTaskHandler = async() => {
    try{
        const res = await api.get('/task')
        tasks.value = res.data
        console.log("[Tasks]", tasks.value)
    }catch(err){
        console.log(err)
    }
}

const createTaskHandler = async()=>{
    try{
        const res = await api.post('/task/create', formData)
        formData.message = ""
        formData.to_employee_id = 0
        tasks.value.push(res.data)
        console.log("[New Task succses created]", res.data)
        console.log("[new tasks value]", tasks.value)
    }catch(err){
        console.log(err)
    }
}

const updateSuccessTaskHanlder = async(id) =>{
    try{
        const res = await api.get(`/task/success/${id}`)
        const task = tasks.value.find(item => item.ID === id)
        if (task) task.status = true
    }catch(err){
        console.log(err)
    }
}

const deleteTaskHandler = async(id) => {
    try{
        const res = await api.delete(`/task/delete/${id}`)
        tasks.value = tasks.value.filter(item => item.ID !== id)
    }catch(err){
        console.log(err)
    }
}

const getCreateTime = (dateString) => {
    const date = new Date(dateString)

    return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    })
}
const getCreateDate = (dateString) => {
    const date = new Date(dateString)

    return date.toLocaleDateString('ru-RU')
}

onMounted(getTaskHandler);
onMounted(getUsersHandler);
</script>

<style>

</style>