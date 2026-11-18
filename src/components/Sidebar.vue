<!-- новый код chat: современная навигация и профиль -->
<template>
  <div class="sidebar" :class="{ compact: collapsed }">
    <header class="sidebar-header">
      <router-link to="/" class="brand" aria-label="ООО БРМ — главная" @click="emit('navigate')">
        <img src="/BRM-logo.svg" alt="">
        <!-- новый код chat: увеличенное название компании -->
        <span v-if="!collapsed">ООО «БРМ»</span>
      </router-link>
      <button type="button" class="toggle" :title="toggleLabel" :aria-label="toggleLabel" :aria-expanded="mobile || !collapsed" aria-controls="sidebar-navigation" @click="emit(mobile ? 'close' : 'toggle')">
        <i :class="mobile ? 'bi bi-x-lg' : collapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left'" aria-hidden="true"></i>
      </button>
    </header>
    <nav id="sidebar-navigation" aria-label="Основная навигация">
      <section v-for="group in groups" :key="group.label" :aria-label="group.label">
        <h2 v-if="!collapsed">{{ group.label }}</h2>
        <ul>
          <li v-for="item in group.items" :key="item.name">
            <!-- новый код chat: временно отключённые разделы без ссылки -->
            <span v-if="item.disabled" class="sidebar-link is-disabled" role="link" aria-disabled="true" :aria-label="item.label + ' — временно недоступно'" :title="item.label + ' — временно недоступно'">
              <i :class="['bi', item.icon]" aria-hidden="true"></i>
              <span v-if="!collapsed" class="label">{{ item.label }}</span>
            </span>
            <router-link v-else :to="{ name: item.name }" class="sidebar-link" :class="{ selected: activeSection === item.name }"
              :aria-current="activeSection === item.name ? 'page' : undefined"
              :aria-label="item.label + (item.name === 'notifications' ? ', непрочитанных: ' + notificationsState.unread : '')"
              :title="collapsed ? item.label : undefined" @click="emit('navigate')">
              <i :class="['bi', item.icon]" aria-hidden="true"></i>
              <span v-if="!collapsed" class="label">{{ item.label }}</span>
              <span v-if="item.name === 'notifications' && notificationsState.unread" class="count" aria-hidden="true">{{ notificationsState.unread > 99 ? '99+' : notificationsState.unread }}</span>
            </router-link>
          </li>
        </ul>
      </section>
      <p v-if="notificationsState.error && !collapsed" class="message" role="status">Не удалось обновить уведомления</p>
    </nav>
    <footer>
      <details ref="profileMenu" @keydown.esc.stop="closeProfile(true)">
        <summary :title="collapsed ? userLabel : undefined" :aria-label="'Меню пользователя: ' + userLabel">
          <span class="avatar" aria-hidden="true">{{ user?.login?.slice(0, 1).toLocaleUpperCase('ru') || 'Б' }}</span>
          <span v-if="!collapsed" class="profile-text"><strong>{{ userLabel }}</strong><small>Учётная запись</small></span>
          <i v-if="!collapsed" class="bi bi-three-dots" aria-hidden="true"></i>
        </summary>
        <div class="profile-actions">
          <router-link :to="{ name: 'users-all' }" :class="{ selected: route.path.startsWith('/users') }" @click="closeProfile(); emit('navigate')"><i class="bi bi-person-gear" aria-hidden="true"></i>Пользователи</router-link>
          <button v-if="userFailed" type="button" @click="getUserHandler"><i class="bi bi-arrow-clockwise" aria-hidden="true"></i>Повторить загрузку</button>
          <button type="button" class="logout" :disabled="loggingOut" @click="handleLogout"><i class="bi bi-box-arrow-right" aria-hidden="true"></i>{{ loggingOut ? 'Выходим…' : 'Выйти' }}</button>
        </div>
      </details>
      <p v-if="logoutError" class="message" role="alert">{{ logoutError }}</p>
    </footer>
  </div>
</template>

<script setup>
// новый код chat: разделы меню, загрузка пользователя и завершение сеанса
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '../api';
import { notificationsState, startNotifications, stopNotifications, refreshNotifications } from '../utils/notifications';
import { clearFileAccess } from '../utils/fileAccess';

const props = defineProps({ collapsed: Boolean, mobile: Boolean });
const emit = defineEmits(['toggle', 'close', 'navigate']);
const router = useRouter();
const route = useRoute();
const toggleLabel = computed(() => props.mobile ? 'Закрыть меню' : props.collapsed ? 'Развернуть панель' : 'Свернуть панель');
const groups = [
  { label: 'Работа', items: [
    { name: 'home', label: 'Главная', icon: 'bi-house-door' },
    { name: 'agreements', label: 'Договоры', icon: 'bi-building' },
    { name: 'employee-cards', label: 'Сотрудники', icon: 'bi-people' },
    { name: 'suplers', label: 'Поставщики', icon: 'bi-box-seam', disabled: true }, // новый код chat: временная блокировка
  ] },
  { label: 'Общение', items: [
    { name: 'dialogs', label: 'Сообщения', icon: 'bi-chat-left-text', disabled: true }, // новый код chat: временная блокировка
    { name: 'notifications', label: 'Уведомления', icon: 'bi-bell' },
  ] },
];
const activeSection = computed(() => {
  const path = route.path;
  if (path === '/') return 'home';
  if (/^\/(agreements?|estimate)(\/|$)/.test(path)) return 'agreements';
  if (/^\/employeecards(\/|$)/.test(path)) return 'employee-cards';
  if (/^\/(suplers|suppliers)(\/|$)/.test(path)) return 'suplers';
  if (/^\/(dialogs|email)(\/|$)/.test(path)) return 'dialogs';
  return path === '/notifications' ? 'notifications' : '';
});
const user = ref(null);
const userFailed = ref(false);
const userLabel = computed(() => user.value?.login || (userFailed.value ? 'Профиль недоступен' : 'Загрузка…'));
const profileMenu = ref(null);
const loggingOut = ref(false);
const logoutError = ref('');
let currentUserToken = '';
let userRequest = 0;
const getUserHandler = async () => {
  const request = ++userRequest;
  const requestToken = localStorage.getItem('user-token');
  const userId = localStorage.getItem('user-id');
  userFailed.value = false;
  if (!requestToken || !userId) { user.value = null; userFailed.value = true; return; }
  try {
    const { data } = await api.get('/users/' + encodeURIComponent(userId));
    if (request === userRequest && requestToken === localStorage.getItem('user-token')) user.value = data;
  } catch {
    if (request === userRequest && requestToken === localStorage.getItem('user-token')) userFailed.value = true;
  }
};
const closeProfile = (restoreFocus = false) => {
  if (!profileMenu.value?.open) return;
  profileMenu.value.open = false;
  if (restoreFocus) profileMenu.value.querySelector('summary')?.focus();
};
const outsideProfile = event => { if (!profileMenu.value?.contains(event.target)) closeProfile(); };
const handleLogout = async () => {
  if (loggingOut.value) return;
  loggingOut.value = true;
  logoutError.value = '';
  try {
    await clearFileAccess();
    localStorage.removeItem('user-token');
    localStorage.removeItem('user-id');
    localStorage.removeItem('employee-card-id');
    refreshNotifications();
    await router.push('/login');
  } catch (error) { logoutError.value = error.message || 'Не удалось выйти. Повторите попытку.'; }
  finally { loggingOut.value = false; }
};
watch(() => route.fullPath, () => {
  closeProfile();
  const token = localStorage.getItem('user-token') || '';
  if (token !== currentUserToken) {
    currentUserToken = token;
    user.value = null;
    getUserHandler();
    refreshNotifications(1, true);
  }
}, { immediate: true });
onMounted(() => { startNotifications(); document.addEventListener('pointerdown', outsideProfile); });
onBeforeUnmount(() => { userRequest++; stopNotifications(); document.removeEventListener('pointerdown', outsideProfile); });
</script>

<style scoped>
/* новый код chat: стандартный шрифт Bootstrap и чёрный текст во всех состояниях */
.sidebar { font-family: var(--bs-body-font-family); display: flex; flex-direction: column; height: 100%; min-height: 0; background: #fff; border-right: 1px solid #e5eaf0; color: #000; }
.sidebar-header { display: flex; align-items: center; gap: 6px; padding: 22px 12px 24px 16px; }
.brand { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; color: #000; text-decoration: none; }
.brand img { width: 30px; height: 36px; object-fit: contain; flex-shrink: 0; }
.brand span { font-size: 17px; font-weight: 700; white-space: nowrap; }
.toggle { width: 28px; height: 28px; display: grid; place-items: center; flex-shrink: 0; border: 0; border-radius: 7px; background: #f4f6f9; color: #000; font-size: 12px; }
.toggle:hover { background: #eaf0f8; color: #000; }
nav { flex: 1; min-height: 0; overflow-y: auto; padding: 0 10px 16px; }
section + section { margin-top: 26px; }
h2 { margin: 0 12px 9px; font-size: 10px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: #000; }
ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 4px; }
.sidebar-link { position: relative; display: flex; align-items: center; gap: 11px; min-height: 42px; padding: 10px 12px; border-radius: 8px; color: #000; font-size: 13px; font-weight: 500; text-decoration: none; transition: background-color .15s, color .15s; }
.sidebar-link > .bi { width: 20px; text-align: center; font-size: 18px; line-height: 1; flex-shrink: 0; }
.sidebar-link:hover { background: #f4f7fb; color: #000; }
/* новый код chat: отключённые пункты сохраняют читаемый чёрный текст */
.sidebar-link.is-disabled, .sidebar-link.is-disabled:hover { cursor: not-allowed; background: transparent; color: #000; }
.sidebar-link.selected { color: #000; background: #eaf2ff; }
.label { flex: 1; }
.count { padding: 2px 6px; border-radius: 6px; background: #e9eef6; color: #000; font-size: 10px; font-weight: 700; line-height: 15px; }
.selected .count { background: #d6e6ff; color: #000; }
footer { padding: 12px 10px; border-top: 1px solid #edf0f5; }
details { position: relative; }
summary { list-style: none; display: flex; align-items: center; gap: 9px; padding: 8px 4px; border-radius: 8px; cursor: pointer; }
summary::-webkit-details-marker { display: none; }
summary:hover, details[open] summary { background: #f4f7fb; }
.avatar { display: grid; place-items: center; width: 34px; height: 34px; flex-shrink: 0; border-radius: 10px; color: #000; background: #eaf0f8; font-size: 14px; font-weight: 600; }
.profile-text { min-width: 0; flex: 1; }
.profile-text strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 600; }
.profile-text small { display: block; margin-top: 2px; color: #000; font-size: 10px; }
.profile-actions { position: absolute; bottom: calc(100% + 8px); left: 0; width: 202px; padding: 6px; background: #fff; border: 1px solid #e5eaf0; box-shadow: 0 8px 28px #2634451a; border-radius: 10px; z-index: 2; }
.profile-actions a, .profile-actions button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px; border: 0; background: transparent; border-radius: 6px; color: #000; text-decoration: none; font-size: 12px; text-align: left; }
.profile-actions a:hover, .profile-actions button:hover, .profile-actions .selected { background: #f0f5fc; }
.profile-actions .logout { color: #000; border-top: 1px solid #edf0f5; border-radius: 0 0 6px 6px; margin-top: 4px; }
.logout:disabled { opacity: .6; cursor: wait; }
.message { font-size: 11px; margin: 12px 4px 0; color: #000; overflow-wrap: anywhere; }
.sidebar :is(a, button, summary):focus-visible { outline: 2px solid #3679d6; outline-offset: -2px; }
.compact .sidebar-header { flex-direction: column; padding: 18px 8px; gap: 14px; }
.compact .brand { flex: none; }
.compact nav { padding-inline: 8px; }
.compact .sidebar-link { justify-content: center; padding: 11px 0; }
.compact section + section { border-top: 1px solid #edf0f5; padding-top: 16px; margin-top: 16px; }
.compact .count { position: absolute; top: 1px; right: 0; padding: 0 3px; font-size: 9px; background: #dceaff; color: #000; }
.compact footer { padding-inline: 8px; }
.compact summary { justify-content: center; }
@media (prefers-reduced-motion: reduce) { .sidebar-link { transition: none; } }
</style>
