// --------- новый код chat: продление по активности, без фонового продления уведомлениями
import axios from 'axios';
import router from '../router/index';

const client = axios.create({baseURL: import.meta.env.VITE_API_BASE_URL || '/api/'});
const tokenKey = 'user-token';
let started = false, pending = false, expiryTimer = null, lastToken = '', lastAttempt = 0;
const getToken = () => localStorage.getItem(tokenKey) || '';
const expiresAt = token => {
    try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const exp = JSON.parse(atob(payload)).exp;
        return typeof exp === 'number' ? exp * 1000 : 0;
    } catch { return 0; }
};
const expire = token => {
    if (!token || getToken() !== token) return;
    localStorage.removeItem(tokenKey);
    localStorage.removeItem('user-id');
    localStorage.removeItem('employee-card-id');
    void client.post('/files/logout').catch(() => {});
    void router.replace('/login');
};
const scheduleExpiry = () => {
    window.clearTimeout(expiryTimer);
    const token = getToken();
    if (!token) return;
    const delay = expiresAt(token) - Date.now();
    if (delay <= 0) { expire(token); return; }
    expiryTimer = window.setTimeout(scheduleExpiry, Math.min(delay + 100, 2147483647));
};
export const renewSessionOnActivity = async () => {
    if (!started || document.hidden) return;
    const token = getToken();
    if (!token) return;
    if (expiresAt(token) <= Date.now()) { expire(token); return; }
    // Ограничиваем частоту при вводе и прокрутке; таймер сам сессию не продлевает.
    if (pending || (lastToken === token && Date.now() - lastAttempt < 30000)) return;
    pending = true;
    lastToken = token;
    lastAttempt = Date.now();
    try {
        const {data} = await client.post('/session/refresh', null, {headers:{Authorization:`Bearer ${token}`}});
        // Ответ старого запроса не возвращает сессию после выхода или смены пользователя.
        if (!started || getToken() !== token) return;
        if (typeof data.token !== 'string' || expiresAt(data.token) <= Date.now()) return;
        localStorage.setItem(tokenKey, data.token);
        lastToken = data.token;
        scheduleExpiry();
    } catch (error) {
        if (error.response?.status === 401) expire(token);
        // Сбой сети не считается выходом; повторяем при следующей активности.
    } finally { pending = false; }
};
const activity = event => { if (event.isTrusted) void renewSessionOnActivity(); };
const visibility = () => { scheduleExpiry(); if (!document.hidden) void renewSessionOnActivity(); };
const storage = event => {
    if (event.key !== tokenKey && event.key !== null) return;
    scheduleExpiry();
    if (!getToken() && router.currentRoute.value.path !== '/login') void router.replace('/login');
};
const activityEvents = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
export const startSessionActivity = () => {
    if (started) return;
    started = true;
    activityEvents.forEach(name => document.addEventListener(name, activity, {capture:true, passive:true}));
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('focus', activity);
    window.addEventListener('storage', storage);
    scheduleExpiry();
    void renewSessionOnActivity();
};
export const stopSessionActivity = () => {
    started = false;
    window.clearTimeout(expiryTimer);
    activityEvents.forEach(name => document.removeEventListener(name, activity, true));
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('focus', activity);
    window.removeEventListener('storage', storage);
};
// --------- конец нового кода chat
