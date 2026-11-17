<template>
    <div class="task-board">
        <!-- --------- новый код chat: компактная панель задач -->
        <div class="task-board-header">
            <div class="d-flex align-items-center gap-2"><i class="bi bi-list-task text-primary"></i><h6 class="mb-0">Задачи</h6><span class="task-count">{{ tasks?.length || 0 }}</span></div>
            <span class="task-header-summary">В работе <strong>{{ tasks?.filter(task => !task.status).length || 0 }}</strong></span>
        </div>
        <div v-if="taskError" class="alert alert-danger m-2" role="alert">{{ taskError }}</div>
        <div v-if="focusedTaskID && tasks && !tasks.some(task => task.ID === focusedTaskID)" class="alert alert-info m-2">Задача больше недоступна.</div>
        <form class="task-create-form" @submit.prevent="createTaskHandler()">
            <div class="task-create-message">
                <label for="task-new-message">Новая задача</label>
                <textarea id="task-new-message" v-model="formData.message" class="form-control form-control-sm" rows="1" placeholder="Что нужно сделать?"></textarea>
            </div>
            <div>
                <label for="task-new-user">Исполнитель</label>
                <select id="task-new-user" v-model="formData.to_user_id" class="form-select form-select-sm">
                    <option :value="0">Не назначен</option>
                    <option v-for="user in users" :key="user.ID" :value="user.ID">{{ taskUserName(user) }}</option>
                </select>
            </div>
            <div>
                <label for="task-new-priority">Приоритет</label>
                <select id="task-new-priority" v-model="formData.priority" class="form-select form-select-sm">
                    <option v-for="priority in 10" :key="priority" :value="priority">{{ priority }}</option>
                </select>
            </div>
            <button type="submit" class="btn btn-sm btn-primary" :disabled="taskBusy"><i class="bi bi-plus-lg me-1"></i>Создать</button>
        </form>
        <div class="task-list">
            <div v-if="!tasks" class="task-empty" role="status">Загружаем задачи…</div>
            <div v-else-if="!tasks.length" class="task-empty"><i class="bi bi-check2-circle me-2"></i>Задач пока нет</div>
            <article v-for="(task, index) in tasks" :key="task.ID ?? index" :id="`task-item-${task.ID}`" tabindex="-1" class="task-card" :class="{'task-card-focused':task.ID === focusedTaskID, 'task-card-completed':task.status}">
                <span class="task-number">{{ index + 1 }}</span>
                <div class="task-card-content">
                    <div class="task-message">{{ task.message || 'Без описания' }}</div>
                    <div class="task-meta">
                        <span title="Исполнитель"><i class="bi bi-person me-1" aria-hidden="true"></i>{{ taskUserName(task.to_user_card) }}</span>
                        <span class="task-author">От: {{ taskUserName(task.from_user_card) }}</span>
                        <time :datetime="task.CreatedAt">Создана: {{ getCreateDate(task.CreatedAt) }} · {{ getCreateTime(task.CreatedAt) }}</time> <!-- новый код chat: различаем даты создания и выполнения -->
                        <template v-if="task.status"> <!-- новый код chat: фактическое время выполнения -->
                            <time v-if="task.completed_at" :datetime="task.completed_at" class="text-success">Выполнена: {{ getCreateDate(task.completed_at) }} · {{ getCreateTime(task.completed_at) }}</time>
                            <span v-else>Дата выполнения не указана</span>
                        </template>
                    </div>
                </div>
                <div class="task-card-controls">
                    <span class="task-status" :class="task.status ? 'task-status-done' : 'task-status-open'"><i :class="task.status ? 'bi bi-check2' : 'bi bi-clock'" aria-hidden="true"></i>{{ task.status ? 'Выполнено' : 'В работе' }}</span>
                    <span class="task-priority" :title="`Приоритет: ${task.priority}`">П{{ task.priority }}</span>
                    <div class="task-actions">
                        <button v-if="!task.status" type="button" class="task-action task-action-complete" title="Отметить выполненной" aria-label="Отметить задачу выполненной" :disabled="taskBusy" @click="updateSuccessTaskHanlder(task.ID)"><i class="bi bi-check2" aria-hidden="true"></i></button>
                        <button type="button" class="task-action" title="Изменить" aria-label="Изменить задачу" :disabled="taskBusy" data-bs-toggle="modal" data-bs-target="#change" @click="fillFormDataChange(task.ID)"><i class="bi bi-pencil" aria-hidden="true"></i></button>
                        <button type="button" class="task-action task-action-delete" title="Удалить" aria-label="Удалить задачу" :disabled="taskBusy" @click="deleteTaskHandler(task.ID)"><i class="bi bi-trash3" aria-hidden="true"></i></button>
                    </div>
                </div>
            </article>
        </div>
        <!-- --------- конец нового кода chat -->

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
                                <option v-for="user in users" :key="user.ID" :value="user.ID">{{ taskUserName(user) }} </option>
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
                    <button type="button" class="btn btn-primary btn-sm" @click="updateTaskHandler()" :disabled="taskBusy">Сохранить</button>
                </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed, watch, nextTick } from 'vue'; // новый код chat
import { useRoute } from 'vue-router';
import { refreshNotifications } from '../../../utils/notifications'; // новый код chat
import api from '../../../api';

// --------- новый код chat: автор определяется сервером, query задаёт выделенную задачу
const route = useRoute();
const focusedTaskID = computed(() => Number(route.query.task) || null);
const taskError = ref(''), taskBusy = ref(false);
const taskUserName = user => {
    if (!user?.ID) return 'Не указан';
    const card = user.employee_card;
    return card?.surname ? [card.surname,card.name?.[0] ? card.name[0]+'.' : '',card.middle_name?.[0] ? card.middle_name[0]+'.' : ''].filter(Boolean).join(' ') : user.login;
};
const focusTask = async() => {
    if (!focusedTaskID.value) return;
    await nextTick();
    const element = document.getElementById(`task-item-${focusedTaskID.value}`);
    element?.scrollIntoView({block:'nearest',behavior:'smooth'});
    element?.focus({preventScroll:true});
};
watch(focusedTaskID,focusTask);
const taskErrorText = err => typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось сохранить задачу.';
// --------- конец нового кода chat
const users = ref(null)

const tasks = ref(null)

const formData = reactive({
    message: "", 
    to_user_id: 0,
    // новый код chat: from_user_id берётся backend из авторизации
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
        await focusTask(); // новый код chat: прокрутка после загрузки списка
    }catch(err){
        taskError.value = 'Не удалось обновить список задач. ' + taskErrorText(err); // новый код chat
    }
}

// --------- новый код chat: состояние списка меняется только после успешного ответа
const runTaskAction = async action => {
    if (taskBusy.value) return;
    taskBusy.value=true; taskError.value='';
    try { await action(); await getTaskHandler(); await refreshNotifications(undefined,true); }
    catch (err) { taskError.value=taskErrorText(err); }
    finally { taskBusy.value=false; }
};
const createTaskHandler = () => runTaskAction(async() => {
    await api.post('/task/create',formData);
    formData.message=''; formData.to_user_id=0;
});
const updateSuccessTaskHanlder = id => runTaskAction(() => api.post(`/task/success/${id}`));
const updateTaskHandler = () => runTaskAction(() => api.post('/task/update',{...formDataChange}));
const deleteTaskHandler = id => {
    if (taskBusy.value || !window.confirm('Удалить задачу и все связанные уведомления?')) return;
    return runTaskAction(() => api.delete(`/task/delete/${id}`));
};
// --------- конец нового кода chat

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

<style scoped>
/* --------- новый код chat: компактные карточки задач и адаптивная форма */
.task-board { border: 1px solid var(--bs-border-color); border-radius: 10px; background: var(--bs-body-bg); font-size: 13px; }
.task-board-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; }
.task-count { border-radius: 6px; padding: 1px 7px; background: var(--bs-tertiary-bg); color: var(--bs-secondary-color); font-size: 12px; }
.task-header-summary { color: var(--bs-secondary-color); font-size: 12px; }
.task-header-summary strong { margin-left: 4px; color: var(--bs-body-color); }
.task-create-form { display: grid; grid-template-columns: minmax(0, 1fr) minmax(130px, 210px) 85px auto; gap: 8px; align-items: end; padding: 0 14px 12px; border-bottom: 1px solid var(--bs-border-color); }
.task-create-form > div { min-width: 0; }
.task-create-form label { display: block; margin-bottom: 4px; font-size: 11px; color: var(--bs-secondary-color); }
.task-create-form textarea { resize: vertical; min-height: 31px; max-height: 140px; }
.task-create-form .form-control, .task-create-form .form-select { font-size: 13px; }
.task-list { max-height: 420px; overflow-y: auto; padding: 6px; border-radius: 0 0 10px 10px; }
.task-card { display: flex; align-items: flex-start; gap: 10px; padding: 9px 8px; border: 1px solid transparent; border-bottom-color: var(--bs-border-color); }
.task-card:last-child { border-bottom-color: transparent; }
.task-card:hover { background: var(--bs-tertiary-bg); border-radius: 6px; }
.task-number { flex: 0 0 22px; padding-top: 1px; text-align: center; color: var(--bs-secondary-color); font-size: 11px; }
.task-card-content { flex: 1; min-width: 0; }
.task-message { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.4; font-weight: 500; }
.task-meta { display: flex; flex-wrap: wrap; gap: 3px 12px; margin-top: 5px; color: var(--bs-secondary-color); font-size: 11px; }
.task-meta > span { overflow-wrap: anywhere; }
.task-meta time { white-space: nowrap; }
.task-card-controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 6px; flex: 0 0 auto; }
.task-status { display: inline-flex; align-items: center; gap: 4px; border: 1px solid; border-radius: 6px; padding: 2px 6px; font-size: 11px; white-space: nowrap; }
.task-status-done { color: var(--bs-success); border-color: var(--bs-success-border-subtle); background: var(--bs-success-bg-subtle); }
.task-status-open { color: var(--bs-primary); border-color: var(--bs-primary-border-subtle); background: var(--bs-primary-bg-subtle); }
.task-priority { color: var(--bs-secondary-color); font-size: 11px; padding: 2px 5px; background: var(--bs-tertiary-bg); border-radius: 4px; }
.task-actions { display: flex; gap: 2px; }
.task-action { display: inline-flex; align-items: center; justify-content: center; width: 27px; height: 27px; border: 0; border-radius: 5px; background: transparent; color: var(--bs-secondary-color); }
.task-action:hover { background: var(--bs-secondary-bg); color: var(--bs-primary); }
.task-action-complete:hover { color: var(--bs-success); }
.task-action-delete:hover { color: var(--bs-danger); background: var(--bs-danger-bg-subtle); }
.task-action:focus-visible, .task-card:focus-visible { outline: 2px solid var(--bs-primary); outline-offset: 1px; }
.task-action:disabled { opacity: .45; cursor: default; }
.task-card-completed .task-message { color: var(--bs-secondary-color); }
.task-card.task-card-focused { border-color: var(--bs-primary); background: var(--bs-primary-bg-subtle); border-radius: 6px; }
.task-empty { padding: 24px 12px; text-align: center; color: var(--bs-secondary-color); }
@media (max-width: 1100px) {
    .task-card { flex-wrap: wrap; }
    .task-card-controls { flex-basis: 100%; padding-left: 32px; justify-content: flex-start; }
    .task-actions { margin-left: auto; }
    .task-create-form { grid-template-columns: minmax(0, 1fr) 85px auto; }
    .task-create-message { grid-column: 1 / -1; }
}
@media (max-width: 575px) {
    .task-create-form { grid-template-columns: minmax(0, 1fr) 85px; }
    .task-create-form > button { grid-column: 1 / -1; }
    .task-card { gap: 6px; }
    .task-number { flex-basis: 18px; }
    .task-card-controls { padding-left: 24px; }
}
/* --------- конец нового кода chat */
</style>
