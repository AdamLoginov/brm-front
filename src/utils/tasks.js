// --------- новый код chat: общий счётчик назначенных незавершённых задач
import { reactive } from 'vue';
import api from '../api';
export const tasksState = reactive({count:0,error:''});
let subscribers = 0, timer, version = 0, owner = '', pending = false;
const identity = () => (localStorage.getItem('user-token') || '') + ':' + (localStorage.getItem('user-id') || '');
const reset = () => {version++; owner = ''; pending = false; tasksState.count = 0; tasksState.error = '';};
export const refreshTaskCount = async(force = false) => {
    const token = localStorage.getItem('user-token'), userID = Number(localStorage.getItem('user-id'));
    if (!token || !userID) {reset();return;}
    const currentOwner = identity();
    if (owner !== currentOwner) {reset();owner = currentOwner;}
    if (pending && !force) return;
    pending = true;
    const request = ++version;
    try {
        const {data} = await api.get('/task');
        if (request !== version || identity() !== currentOwner) return;
        tasksState.count = (data || []).filter(task => !task.status && (task.assignees?.length
            ? task.assignees.some(user => Number(user.ID) === userID)
            : Number(task.to_user_id || task.to_user_card?.ID) === userID)).length;
        tasksState.error = '';
    } catch {
        if (request === version && identity() === currentOwner) tasksState.error = 'Не удалось обновить задачи';
    } finally {if (request === version) pending = false;}
};
const refreshVisible = () => {if (!document.hidden) refreshTaskCount();};
const storageChanged = event => {if (event.key === 'user-token' || event.key === 'user-id' || event.key === null) refreshTaskCount(true);};
export const startTaskCount = () => {
    if (++subscribers !== 1) return;
    refreshTaskCount();
    timer = window.setInterval(refreshVisible,30000);
    document.addEventListener('visibilitychange',refreshVisible);
    window.addEventListener('focus',refreshVisible);
    window.addEventListener('storage',storageChanged);
};
export const stopTaskCount = () => {
    subscribers = Math.max(0,subscribers - 1);
    if (subscribers) return;
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange',refreshVisible);
    window.removeEventListener('focus',refreshVisible);
    window.removeEventListener('storage',storageChanged);
    reset();
};
// --------- конец нового кода chat
