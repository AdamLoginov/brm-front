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
            <div class="col-3 align-content-end">
                <label>Выбрать сотрудника</label>
                <select v-model="formData.to_user_id" class="form-select form-select-sm">
                    <option :value="0">Сотрудник не выбран</option>
                    <option v-for="user in users" :key="user.ID" :value="user.ID">{{ user.employee_card.surname? `${user.employee_card.surname} ${user.employee_card.name.at(0)}.${user.employee_card.middle_name.at(0)}.` : user.login }} </option>
                </select>
            </div>
            <div class="col-1 align-content-end">
                <label>Приоритет</label>
                <select v-model="formData.priority" class="form-select form-select-sm">
                    <option :value="1">1</option>
                    <option :value="2">2</option>
                    <option :value="3">3</option>
                    <option :value="4">4</option>
                    <option :value="5">5</option>
                    <option :value="6">6</option>
                    <option :value="7">7</option>
                    <option :value="8">8</option>
                    <option :value="9">9</option>
                    <option :value="10">10</option>
                </select>
            </div>
            <div class="col-2 align-content-end">
                <button class="btn btn-sm btn-primary" @click="createTaskHandler()">Создать</button>
            </div>
        </div>
        <div class="border-bottom border-end border-start rounded-bottom-2" style="max-height: 400px;min-height: 400px;overflow-y: auto;">
            <div v-for="(task, index) in tasks" :key="task.ID ?? index" class="list-group-item d-flex gap-1">
                <div class="col-2 d-flex">
                    <div class="col-2 d-flex flex-column ">
                        <span>{{ index + 1 }}.</span>                    
                    </div>
                    <div class="col-8 d-flex flex-column" style="font-size: 12px;">
                        <span>{{ getCreateTime(task.CreatedAt) }}</span>
                        <span>{{ getCreateDate(task.CreatedAt) }}</span>
                    </div>

                    <div class="col-2">
                        <div class="d-flex flex-column align-items-center justify-content-center" style="height: 36px;">
                            <i v-if="task.status" class="bi bi-check-circle text-success"></i>
                            <i v-else class="bi bi-x-circle text-danger"></i>
                            <div class="border border-primary text-primary px-1 rounded-5" style="font-size: 10px;">{{ task.priority }}</div>
                        </div>
                    </div>
                </div>

                <div class="col-2 fw-semibold" style=" font-size: 12px;">
                    <div>
                        Кому: {{ task.to_user_card.ID !== 0 ?  `${task.to_user_card.employee_card.surname} ${task.to_user_card.employee_card.name.at(0)}.${task.to_user_card.employee_card.middle_name.at(0)}` : 'Не указан'}}
                    </div>
                    <div>
                        Кто: {{ task.from_user_card.ID !== 0 ?  `${task.from_user_card.employee_card.surname} ${task.from_user_card.employee_card.name.at(0)}.${task.from_user_card.employee_card.middle_name.at(0)}` : 'Не указан'}}
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
                                <li v-if="!task.status"><a class="dropdown-item" type="button"  @click="updateSuccessTaskHanlder(task.ID)">Выполнено</a></li>
                                <li><a class="dropdown-item" type="button" data-bs-toggle="modal" data-bs-target="#change" @click="fillFormDataChange(task.ID)">Изменить</a></li>
                                <li><a class="dropdown-item text-danger" type="button"  @click="deleteTaskHandler(task.ID)">Удалить</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>  
        </div>

        <!-- Modal -->
        <div class="modal fade" id="change" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="exampleModalLabel">Изменить данные задачи</h1>
                    <button type="button" class="btn-close btn-sm" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-5">
                            <label>Выбрать позьзователя</label>
                            <select v-model="formDataChange.to_user_id" class="form-select form-select-sm">
                                <option :value="0">Пользователь не выбран</option>
                                <option v-for="user in users" :key="user.ID" :value="user.ID">{{ user.employee_card.surname? `${user.employee_card.surname} ${user.employee_card.name.at(0)}.${user.employee_card.middle_name.at(0)}.` : user.login }} </option>
                            </select>
                        </div>
                        <div class="col-3">
                            <label>Приоритет</label>
                            <select v-model="formDataChange.priority" class="form-select form-select-sm">
                                <option :value="1">1</option>
                                <option :value="2">2</option>
                                <option :value="3">3</option>
                                <option :value="4">4</option>
                                <option :value="5">5</option>
                                <option :value="6">6</option>
                                <option :value="7">7</option>
                                <option :value="8">8</option>
                                <option :value="9">9</option>
                                <option :value="10">10</option>
                            </select>
                        </div>
                        <div class="col-4">
                            <label>Статус</label>
                            <select v-model="formDataChange.status" class="form-select form-select-sm">
                                <option :value="true">Выполнено</option>
                                <option :value="false">Не выполнено</option>
                            </select>
                        </div>
                        <div class="col-12">
                            <label>Текст задачи</label>
                            <textarea v-model="formDataChange.message" class="form-control" rows="5" style="font-size: 14px;"></textarea>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Закрыть</button>
                    <button type="button" class="btn btn-primary btn-sm" @click="updateTaskHandler()">Сохранить</button>
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
    to_user_id: 0,
    from_user_id: parseInt(userId, 10),
    priority:10
});

const formDataChange = reactive({
    ID: 0,
    message: "",
    to_user_id: 0,
    priority:0,
    status:false
})

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
        tasks.value = tasks.value.sort((a, b) => a.priority - b.priority)
        tasks.value = tasks.value.sort((a, b) => a.status - b.status)
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
        tasks.value = tasks.value.sort((a, b) => a.priority - b.priority)
        tasks.value = tasks.value.sort((a, b) => a.status - b.status)
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
        tasks.value = tasks.value.sort((a, b) => a.priority - b.priority)
        tasks.value = tasks.value.sort((a, b) => a.status - b.status)
    }catch(err){
        console.log(err)
    }
}

const updateTaskHandler = async() =>{
    try{
        let task = tasks.value.find(item => item.ID === formDataChange.ID)
        task.message = formDataChange.message
        task.to_user_id = formDataChange.to_user_id
        task.priority = formDataChange.priority
        task.status = formDataChange.status
        console.log(task)

        const res = await api.post('/task/update', task)
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

const fillFormDataChange = (id) =>{
    const task = tasks.value.find(item => item.ID === id)
    formDataChange.ID = task.ID
    formDataChange.message = task.message
    formDataChange.to_user_id = task.to_user_id
    formDataChange.priority = task.priority
    formDataChange.status = task.status
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