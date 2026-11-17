// --------- новый код chat: общая лента, счётчик и проверка без перезагрузки страницы
import { reactive } from 'vue';
import api from '../api';
export const notificationsState = reactive({items:[],unread:0,total:0,page:1,pageSize:50,loading:false,busy:false,error:''});
let subscribers = 0, timer = null, version = 0, owner = '';
const token = () => localStorage.getItem('user-token') || '';
const errorText = error => typeof error.response?.data === 'string' ? error.response.data.trim() : 'Не удалось обновить уведомления.';
const reset = () => { version++; owner=''; Object.assign(notificationsState,{items:[],unread:0,total:0,page:1,loading:false,busy:false,error:''}); };
export const refreshNotifications = async(page = notificationsState.page, force = false) => {
    const currentToken = token();
    if (!currentToken) { reset(); return; }
    if (currentToken !== owner) { reset(); owner = currentToken; page = 1; }
    if (notificationsState.loading && !force) return;
    const request = ++version;
    notificationsState.loading = true;
    try {
        const {data} = await api.get('/notifications',{params:{page}});
        if (request !== version || token() !== currentToken) return;
        Object.assign(notificationsState,{items:data.items || [],unread:data.unread,total:data.total,page:data.page,pageSize:data.page_size,error:''});
    } catch (error) { if (request === version && token() === currentToken) notificationsState.error = errorText(error); }
    finally { if (request === version) notificationsState.loading = false; }
};
const refreshVisible = () => { if (!document.hidden) refreshNotifications(); };
export const startNotifications = () => {
    subscribers++;
    if (subscribers > 1) return;
    refreshNotifications();
    timer = window.setInterval(refreshVisible,30000);
    document.addEventListener('visibilitychange',refreshVisible);
    window.addEventListener('focus',refreshVisible);
};
export const stopNotifications = () => {
    subscribers = Math.max(0,subscribers-1);
    if (subscribers) return;
    window.clearInterval(timer); timer=null;
    document.removeEventListener('visibilitychange',refreshVisible);
    window.removeEventListener('focus',refreshVisible);
    reset();
};
export const readNotifications = async(id = null) => {
    if (notificationsState.busy) return;
    const currentToken = token();
    notificationsState.busy=true; notificationsState.error='';
    try {
        await api.post(id === null ? '/notifications/read-all' : `/notifications/${id}/read`);
        if (token() === currentToken) await refreshNotifications(notificationsState.page,true);
    } catch (error) { if (token() === currentToken) notificationsState.error=errorText(error); }
    finally { if (token() === currentToken) notificationsState.busy=false; }
};
// --------- конец нового кода chat
