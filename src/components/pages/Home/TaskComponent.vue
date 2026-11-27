<template>
    <div class="task-board">
        <!-- --------- новый код chat: компактная панель задач -->
        <!-- новый код chat: заголовок страницы и главное действие -->
        <header class="task-board-header">
            <div class="d-flex align-items-center gap-2"><span class="board-icon"><i class="bi bi-list-task" aria-hidden="true"></i></span><h1>Задачи</h1></div>
            <!-- новый код chat: фильтр рядом с заголовком задач -->
            <div class="task-filters" role="group" aria-label="Показать задачи">
                <button v-for="item in taskFilters" :key="item.value" type="button" :aria-pressed="taskFilter === item.value" :class="{ active: taskFilter === item.value }" @click="taskFilter = item.value">{{ item.label }}</button>
            </div>
            <button class="btn btn-outline-primary btn-sm" type="button" aria-label="Новая задача" title="Новая задача" data-bs-toggle="modal" data-bs-target="#change" :disabled="taskBusy" @click="openNewTask"><i class="bi bi-plus-lg" aria-hidden="true"></i></button>
        </header>
        <div v-if="taskError" class="alert alert-danger m-2" role="alert">{{ taskError }}</div>
        <div v-if="focusedTaskID && tasks && !tasks.some(task => task.ID === focusedTaskID)" class="alert alert-info m-2">Задача больше недоступна.</div>
        <div class="task-list">
            <div v-if="!tasks" class="task-empty" role="status">Загружаем задачи…</div>
            <div v-else-if="!tasks.length" class="task-empty"><i class="bi bi-check2-circle me-2"></i>Задач пока нет</div>
            <div v-else-if="!visibleTasks.length" class="task-empty" role="status">По выбранным фильтрам задач нет <button type="button" class="btn btn-link btn-sm" @click="taskFilter = 'all'">Сбросить фильтры</button></div>
            <!-- новый код chat: фон задачи по сроку выполнения -->
            <template v-for="(task, index) in visibleTasks" :key="task.ID">
            <!-- новый код chat: границы групп видны и без цветовой подсветки -->
            <h2 v-if="index === 0 || taskDeadlineRank(task) !== taskDeadlineRank(visibleTasks[index - 1])" class="task-group-heading">{{ groupTitles[taskDeadlineRank(task)] }}</h2>
            <article :id="`task-item-${task.ID}`" tabindex="-1" class="task-card" :class="{'task-card-focused':task.ID === focusedTaskID, 'task-card-completed':task.status, 'task-card-overdue':taskDeadlineRank(task) === 0, 'task-card-due-today':taskDeadlineRank(task) === 1, 'task-card-due-tomorrow':taskDeadlineRank(task) === 2}">
                <span class="task-number">{{ index + 1 }}</span>
                <div class="task-card-content">
                    <div class="task-message">{{ task.message || 'Без описания' }}</div>
                    <!-- новый код chat: доступ через защищённый просмотр -->
                    <div v-if="task.attachments?.length" class="d-flex flex-wrap gap-2">
                        <TaskAttachmentPreview v-for="file in task.attachments" :key="file.id" :file="file" />
                    </div>
                    <div class="task-meta">
                        <span title="Исполнители"><i class="bi bi-people me-1" aria-hidden="true"></i>{{ taskAssignees(task).map(taskUserName).join(', ') || 'Не назначены' }}</span>
                        <span class="task-author">От: {{ taskUserName(task.from_user_card) }}</span>
                        <time :datetime="task.CreatedAt">Создана: {{ getCreateDate(task.CreatedAt) }} · {{ getCreateTime(task.CreatedAt) }}</time> <!-- новый код chat: различаем даты создания и выполнения -->
                        <time v-if="task.due_date" :datetime="task.due_date" title="До этой даты включительно">Выполнить до: {{ task.due_date.split('-').reverse().join('.') }}</time> <!-- новый код chat -->
                        <template v-if="task.status">
                            <span class="text-success">Выполнил: {{ task.completed_by_id ? taskUserName(task.completed_by) : 'Не указан' }}</span> <!-- новый код chat --> <!-- новый код chat: фактическое время выполнения -->
                            <time v-if="task.completed_at" :datetime="task.completed_at" class="text-success">Выполнена: {{ getCreateDate(task.completed_at) }} · {{ getCreateTime(task.completed_at) }}</time>
                            <span v-else>Дата выполнения не указана</span>
                        </template>
                    </div>
                </div>
                <div class="task-card-controls">
                    <span class="task-status" :class="task.status ? 'task-status-done' : 'task-status-open'"><i :class="task.status ? 'bi bi-check2' : 'bi bi-clock'" aria-hidden="true"></i>{{ task.status ? 'Выполнено' : 'В работе' }}</span>
                    <span class="task-priority" :title="`Приоритет: ${task.priority}`">П{{ task.priority }}</span>
                    <div class="task-actions">
                        <button v-if="!task.status && canComplete(task)" type="button" class="task-action task-action-complete" title="Отметить выполненной" aria-label="Отметить задачу выполненной" :disabled="taskBusy" @click="updateSuccessTaskHanlder(task.ID)"><i class="bi bi-check2" aria-hidden="true"></i></button>
                        <span v-else class="task-action-placeholder" aria-hidden="true"></span> <!-- новый код chat: сохраняем место недоступной кнопки -->
                        <button type="button" class="task-action" title="Изменить" aria-label="Изменить задачу" :disabled="taskBusy" data-bs-toggle="modal" data-bs-target="#change" @click="fillFormDataChange(task.ID)"><i class="bi bi-pencil" aria-hidden="true"></i></button>
                        <button type="button" class="task-action task-action-delete" title="Удалить" aria-label="Удалить задачу" :disabled="taskBusy" @click="deleteTaskHandler(task.ID)"><i class="bi bi-trash3" aria-hidden="true"></i></button>
                    </div>
                </div>
            </article>
            </template>
        </div>
        <!-- --------- конец нового кода chat -->

        <!-- новый код chat: окно редактирования поверх страницы при адаптивной ширине доски -->
        <Teleport to="body">
        <div class="modal fade" id="change" aria-labelledby="task-modal-title" tabindex="-1" aria-hidden="true">
            <!-- новый код chat: общий редактор задачи -->
            <div class="modal-dialog modal-dialog-centered task-editor">
                <form class="modal-content" @submit.prevent="saveTask">
                    <div class="modal-header">
                        <i class="bi bi-list-task editor-icon" aria-hidden="true"></i>
                        <h1 class="modal-title" id="task-modal-title">{{ formDataChange.ID ? 'Изменить задачу' : 'Новая задача' }}</h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
                    </div>
                    <div class="modal-body">
                        <label class="editor-label" for="task-message">Описание задачи</label>
                        <textarea id="task-message" v-model="formDataChange.message" class="form-control editor-message" rows="3" placeholder="Что нужно сделать?" :disabled="taskBusy"></textarea>
                        <div class="editor-settings">
                            <div class="editor-assignees">
                                <label class="editor-label" for="task-edit-users">Исполнители</label>
                                <TaskAssigneeSelect id="task-edit-users" v-model="formDataChange.assignee_ids" :users="users" :user-name="taskUserName" :disabled="taskBusy" />
                            </div>
                            <div>
                                <label class="editor-label" for="task-edit-due">Срок включительно</label>
                                <input id="task-edit-due" v-model="formDataChange.due_date" type="date" max="9999-12-31" class="form-control form-control-sm" :disabled="taskBusy">
                            </div>
                            <div>
                                <label class="editor-label" for="task-priority">Приоритет</label>
                                <select id="task-priority" v-model="formDataChange.priority" class="form-select form-select-sm" :disabled="taskBusy">
                                    <option v-for="value in 10" :key="value" :value="value">{{ value }}</option>
                                </select>
                            </div>
                            <div v-if="formDataChange.ID">
                                <label class="editor-label" for="task-status">Статус</label>
                                <select id="task-status" v-model="formDataChange.status" :disabled="taskBusy || !canChangeStatus" class="form-select form-select-sm">
                                    <option :value="false">Не выполнено</option>
                                    <option :value="true">Выполнено</option>
                                </select>
                            </div>
                        </div>
                        <section class="editor-files">
                            <div class="d-flex align-items-center justify-content-between gap-2">
                                <h2>Вложения</h2>
                                <label class="btn btn-sm btn-outline-primary editor-upload">
                                    <i class="bi bi-paperclip" aria-hidden="true"></i> Добавить файлы
                                    <input class="visually-hidden" type="file" multiple :disabled="taskBusy" @change="selectFiles">
                                </label>
                            </div>
                            <div v-if="existingFiles.length || pendingFiles.length" class="d-flex flex-wrap gap-2 mt-2">
                                <div v-for="file in [...existingFiles, ...pendingFiles]" :key="file.id" class="position-relative">
                                    <TaskAttachmentPreview :file="file" />
                                    <button type="button" class="editor-remove" :title="'Убрать ' + file.name" :aria-label="'Убрать ' + file.name" :disabled="taskBusy" @click="removeFile(file)"><i class="bi bi-x" aria-hidden="true"></i></button>
                                </div>
                            </div>
                        </section>
                        <div v-if="taskError" class="alert alert-danger py-2 mt-3 mb-0" role="alert">{{ taskError }}</div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-light btn-sm" data-bs-dismiss="modal">Отмена</button>
                        <button type="submit" class="btn btn-primary btn-sm" :disabled="taskBusy">{{ formDataChange.ID ? 'Сохранить' : 'Создать задачу' }}</button>
                    </div>
                </form>
            </div>
        </div>
        </Teleport>
    </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, ref, computed, watch, nextTick } from 'vue'; // новый код chat
import { useRoute } from 'vue-router';
import { refreshNotifications } from '../../../utils/notifications'; // новый код chat
import api from '../../../api';
// --------- новый код chat: отправка задачи и файлов одним запросом
import TaskAttachmentPreview from './TaskAttachmentPreview.vue'; // новый код chat
// новый код chat: выбранные файлы остаются локальными до сохранения задачи
const pendingFiles = ref([]);
let nextFileID = 0;
const selectFiles = event => {
    for (const source of event.target.files) {
        pendingFiles.value.push({ id: 'local-' + ++nextFileID, name: source.name, mime: source.type, source });
    }
    event.target.value = '';
};
const existingFiles = ref([]), removedFiles = ref([]);
const removeFile = file => {
    if (!window.confirm('Убрать файл из задачи?')) return;
    if (file.source) {
        pendingFiles.value = pendingFiles.value.filter(item => item.id !== file.id);
        return;
    }
    removedFiles.value.push(file.id);
    existingFiles.value = existingFiles.value.filter(item => item.id !== file.id);
};
const taskPayload = (task, files, removed = []) => {
    if (!files.length && !removed.length) return task;
    const data = new FormData();
    data.append('task', JSON.stringify(task));
    data.append('removed', JSON.stringify(removed));
    for (const file of files) data.append('files', file.source);
    return data;
};
// --------- конец нового кода chat
import { refreshTaskCount } from '../../../utils/tasks'; // новый код chat: счётчик sidebar
import TaskAssigneeSelect from './TaskAssigneeSelect.vue'; // новый код chat

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
    // новый код chat: переход из уведомления должен открыть задачу даже при другом фильтре
    if (tasks.value?.some(task => task.ID === focusedTaskID.value) && !visibleTasks.value.some(task => task.ID === focusedTaskID.value)) {
        taskFilter.value = 'all';
        
    }
    await nextTick();
    const element = document.getElementById(`task-item-${focusedTaskID.value}`);
    element?.scrollIntoView({block:'nearest',behavior:'smooth'});
    element?.focus({preventScroll:true});
};
watch(focusedTaskID,focusTask);
const taskErrorText = err => typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось сохранить задачу.';
// --------- конец нового кода chat
// --------- новый код chat: совместимость старых задач и доступ к завершению
const taskAssignees = task => task.assignees?.length ? task.assignees : (task.to_user_card?.ID ? [task.to_user_card] : []);
const canComplete = task => {
    const userID = Number(localStorage.getItem('user-id'));
    return userID > 0 && (task.from_user_id === userID || taskAssignees(task).some(user => user.ID === userID));
};
const canChangeStatus = computed(() => {
    const task = tasks.value?.find(item => item.ID === formDataChange.ID);
    return task ? canComplete(task) : false;
});
// --------- конец нового кода chat
const users = ref(null)

const tasks = ref(null)
// --------- новый код chat: авторство и участие, включая общие задачи
const taskFilter = ref('all');
const taskFilters = [
    { value: 'all', label: 'Все' },
    { value: 'assigned', label: 'Назначены мне' },
    { value: 'created', label: 'Созданы мной' },
];
// --------- новый код chat: срок по московской дате, обновление при смене дня без перезагрузки
const taskTodayDate = () => {
    const parts = new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const value = type => parts.find(part => part.type === type).value;
    return value('year') + '-' + value('month') + '-' + value('day');
};
const taskToday = ref(taskTodayDate());
// новый код chat: следующий календарный день относительно московской даты
const taskTomorrow = computed(() => {
    const date = new Date(taskToday.value + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
});
const refreshTaskToday = () => {taskToday.value = taskTodayDate();};
let taskDateTimer;
onMounted(() => {
    taskDateTimer = window.setInterval(refreshTaskToday,30000);
    document.addEventListener('visibilitychange',refreshTaskToday);
});
onBeforeUnmount(() => {
    window.clearInterval(taskDateTimer);
    document.removeEventListener('visibilitychange',refreshTaskToday);
});
const taskDeadlineRank = task => {
    if (task.status) return 4;
    if (!task.due_date) return 3;
    if (task.due_date < taskToday.value) return 0;
    if (task.due_date === taskToday.value) return 1;
    return task.due_date === taskTomorrow.value ? 2 : 3;
};
// --------- конец нового кода chat
// новый код chat: независимые фильтры участников и сроков

const visibleTasks = computed(() => {
    const userID = Number(localStorage.getItem('user-id'));
    return (tasks.value || []).filter(task => {
        if (taskFilter.value === 'all') return true;
        if (!userID) return false;
        if (taskFilter.value === 'created') return Number(task.from_user_id) === userID;
        return taskAssignees(task).some(user => Number(user.ID) === userID);
    }).sort((a,b) => taskDeadlineRank(a) - taskDeadlineRank(b) || Number(a.priority) - Number(b.priority)); // новый код chat: срочность, затем приоритет
});
// --------- конец нового кода chat

// новый код chat: общие названия групп и значки фильтров задач
const groupTitles = ['Просроченные', 'Срок сегодня', 'Срок завтра', 'Остальные в работе', 'Выполненные'];

const formDataChange = reactive({
    ID: 0,
    due_date: "", // новый код chat: необязательная дата
    message: "",
    assignee_ids: [], // новый код chat: список исполнителей
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
    try { await action(); await getTaskHandler(); await Promise.all([refreshNotifications(undefined,true),refreshTaskCount(true)]); } // новый код chat: обновление после действия
    catch (err) { taskError.value=taskErrorText(err); }
    finally { taskBusy.value=false; }
};
const updateSuccessTaskHanlder = id => runTaskAction(() => api.post(`/task/success/${id}`));
// новый код chat: единое окно создания и редактирования
const openNewTask = () => {
    Object.assign(formDataChange, { ID: 0, due_date: '', message: '', assignee_ids: [], priority: 10, status: false });
    existingFiles.value = [];
    removedFiles.value = [];
    pendingFiles.value = [];
    taskError.value = '';
};
const saveTask = () => runTaskAction(async () => {
    const path = formDataChange.ID ? '/task/update' : '/task/create';
    await api.post(path, taskPayload({...formDataChange}, pendingFiles.value, removedFiles.value));
    pendingFiles.value = [];
    removedFiles.value = [];
    document.querySelector('#change .btn-close').click();
});
const deleteTaskHandler = id => {
    if (taskBusy.value || !window.confirm('Удалить задачу и все связанные уведомления?')) return;
    return runTaskAction(() => api.delete(`/task/delete/${id}`));
};
// --------- конец нового кода chat

const fillFormDataChange = (id) =>{
    const task = tasks.value.find(item => item.ID === id)
    existingFiles.value = [...(task.attachments || [])]; // новый код chat
    removedFiles.value = [];
    pendingFiles.value = [];
    taskError.value = '';
    formDataChange.ID = task.ID
    formDataChange.due_date = task.due_date || '' // новый код chat
    formDataChange.message = task.message
    formDataChange.assignee_ids = taskAssignees(task).map(user => user.ID) // новый код chat
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
/* новый код chat: оформление редактора задач */
.task-editor { --bs-modal-width: 620px; }
.task-editor .modal-content { border: 0; border-radius: 14px; box-shadow: 0 16px 54px #18243429; }
.task-editor .modal-header, .task-editor .modal-body, .task-editor .modal-footer { padding: 16px 20px; }
.task-editor .modal-title { font-size: 18px; font-weight: 650; }
.editor-icon { display: grid; place-items: center; width: 32px; height: 32px; margin-right: 10px; border-radius: 9px; background: #eaf2ff; color: var(--bs-primary); }
.editor-label, .editor-files h2 { display: block; margin: 0 0 5px; font-size: 13px; font-weight: 600; color: var(--bs-body-color); }
.editor-message { font-size: 14px; resize: vertical; }
.editor-settings { display: grid; grid-template-columns: repeat(auto-fit,minmax(112px,1fr)); gap: 12px; margin-top: 16px; }
.editor-settings > div { min-width: 0; }
.editor-files { margin-top: 20px; padding: 12px; border: 1px solid var(--bs-border-color); border-radius: 9px; background: var(--bs-tertiary-bg); }
.editor-files h2 { margin: 0; }
.editor-upload:focus-within { outline: 2px solid var(--bs-primary); outline-offset: 2px; }
/* новый код chat: круглая кнопка с центровкой крестика */
.editor-remove { position: absolute; top: 7px; right: 3px; display: grid; place-items: center; width: 22px; height: 22px; padding: 0; line-height: 1; border: 1px solid var(--bs-border-color); border-radius: 50%; background: white; color: #495057; }
.editor-remove i { display: grid; place-items: center; }
.editor-remove:hover { color: var(--bs-danger); }
.task-editor .modal-footer { padding-block: 10px; }
@media (max-width: 575px) {
    .editor-settings { grid-template-columns: repeat(2,minmax(0,1fr)); }
    .editor-assignees { grid-column: 1 / -1; }
}
/* --------- новый код chat: чёрный текст задач и полей для читаемости */
.task-board .form-control, .task-board .form-select, .task-board .modal-content { color: #000; }
.task-board .form-control::placeholder { color: #000; opacity: 1; }
/* --------- конец нового кода chat */
/* --------- новый код chat: компактные карточки задач и адаптивная форма */
.task-board { color:#171b22; font-size:13px; container-type:inline-size; }
.task-board-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; }
.board-icon {display:grid;place-items:center;background:var(--bs-primary-bg-subtle);color:var(--bs-primary);width:36px;height:36px;border-radius:10px;font-size:19px;}
.task-board-header {padding:0 0 16px;}
.task-board-header h1 {font-size:22px;font-weight:650;margin:0;}
/* --------- новый код chat: компактный переключатель списка задач */
.task-filters { display: flex; gap: 4px; margin-right: auto; padding: 3px; min-width: 0; overflow-x: auto; white-space: nowrap; background: #f3f5f8; border-radius: 8px; }
.task-filters button { border: 1px solid transparent; border-radius: 6px; background: transparent; color: #000; font-size: 12px; padding: 5px 10px; }
.task-filters button.active { background: #fff; border-color: #dfe5ee; box-shadow: 0 1px 3px #2634450a; }
.task-filters button:hover { background: #fff; }
.task-filters button:focus-visible { outline: 2px solid var(--bs-primary); outline-offset: 1px; }
/* --------- конец нового кода chat */
.task-list { max-height: 420px; overflow-y: auto; padding: 6px; border-radius: 0 0 10px 10px; }
/* новый код chat: компактная сводка по срокам */


.task-list {background:var(--bs-body-bg);border:1px solid var(--bs-border-color);border-radius:10px;padding:0 12px;}
.task-group-heading {margin:0;padding:12px 8px 7px;color:#424c59;font-weight:650;font-size:13px;}
.task-card + .task-group-heading {margin-top:6px;border-top:1px solid var(--bs-border-color);}
.task-card { display: flex; align-items: flex-start; gap: 10px; padding: 9px 8px; border: 1px solid transparent; border-bottom-color: var(--bs-border-color); }
.task-card:last-child { border-bottom-color: transparent; }
.task-card:hover { background: var(--bs-tertiary-bg); border-radius: 6px; }
/* новый код chat: сроки незавершённых задач, фон сохраняется при наведении */
.task-card.task-card-overdue, .task-card.task-card-overdue:hover {background:#fce8e8;}
.task-card.task-card-due-today, .task-card.task-card-due-today:hover {background:#fff5d6;}
.task-card.task-card-due-tomorrow, .task-card.task-card-due-tomorrow:hover {background:#eaf6ec;} /* новый код chat: бледно-зелёный фон завтрашних задач */
/* новый код chat: скругление цветных строк и небольшой зазор между задачами */
.task-card:is(.task-card-overdue, .task-card-due-today, .task-card-due-tomorrow) {border-radius:6px;}
.task-card + .task-card {margin-top:2px;}
/* новый код chat: увеличенный порядковый номер задачи */
.task-number { flex: 0 0 22px; padding-top: 1px; text-align: center; color: #000; font-size: 13px; }
.task-card-content { flex: 1; min-width: 0; }
.task-message { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.4; font-weight: 500; }
/* новый код chat: слегка смягчённый цвет участников и дат; выполнение выделено зелёным */
.task-meta { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 5px; color: #454545; font-size: 12px; }
.task-meta > span { overflow-wrap: anywhere; }
.task-meta time { white-space: nowrap; }
.task-card-controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 6px; flex: 0 0 auto; }
.task-status { display: inline-flex; align-items: center; justify-content:center; width:94px; flex-shrink:0; gap: 4px; border: 1px solid; border-radius: 6px; padding: 2px 6px; font-size: 11px; white-space: nowrap; } /* новый код chat: одинаковая ширина обоих статусов */
.task-status-done { color: #000; border-color: var(--bs-success-border-subtle); background: var(--bs-success-bg-subtle); }
.task-status-open { color: #000; border-color: var(--bs-primary-border-subtle); background: var(--bs-primary-bg-subtle); }
/* новый код chat: круглая метка приоритета с бледно-жёлтой заливкой */
.task-priority { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 32px; height: 32px; padding: 0; border: 1px solid #eadca5; border-radius: 50%; background: #fff8db; color: #000; font-size: 11px; line-height: 1; white-space: nowrap; }
.task-actions { display: flex; gap: 2px; }
.task-action-placeholder {width:27px;height:27px;flex:0 0 27px;} /* новый код chat: статусы и приоритеты не сдвигаются без кнопки выполнения */
.task-action { display: inline-flex; align-items: center; justify-content: center; width: 27px; height: 27px; border: 0; border-radius: 5px; background: transparent; color: #000; }
.task-action:hover { background: var(--bs-secondary-bg); color: var(--bs-primary); }
.task-action-complete:hover { color: var(--bs-success); }
.task-action-delete:hover { color: var(--bs-danger); background: var(--bs-danger-bg-subtle); }
.task-action:focus-visible, .task-card:focus-visible { outline: 2px solid var(--bs-primary); outline-offset: 1px; }
.task-action:disabled { opacity: .45; cursor: default; }
.task-card-completed .task-message { color: #000; }
.task-card.task-card-focused { border-color: var(--bs-primary); background: var(--bs-primary-bg-subtle); border-radius: 6px; }
.task-empty { padding: 24px 12px; text-align: center; color: #000; }
@container (max-width: 730px) {
    .task-card { flex-wrap: wrap; }
    .task-card-controls { flex-basis: 100%; padding-left: 32px; justify-content: flex-start; }
    .task-actions { margin-left: auto; }
}
@container (max-width: 575px) {
    .task-list {padding:0 6px;}
    .task-card { gap: 6px; }
    .task-number { flex-basis: 18px; }
    .task-card-controls { padding-left: 24px; }
}
/* --------- конец нового кода chat */
/* новый код chat: единая панель рядом с боковым меню */
.task-board {border:1px solid var(--bs-border-color);border-radius:10px;background:var(--bs-body-bg);}
.task-board-header {padding:12px 16px 8px;}
.task-board-header h1 {font-size:18px;}
.task-list {border:0;border-top:1px solid var(--bs-border-color);border-radius:0 0 10px 10px;}
</style>
