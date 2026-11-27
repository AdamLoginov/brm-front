<!-- --------- новый код chat: компактная лента уведомлений -->
<template>
    <div class="container-fluid py-3 notifications-page">
        <section class="notification-panel" aria-labelledby="notifications-title">
            <div class="notification-header">
                <div>
                    <div class="d-flex align-items-center gap-2"><i class="bi bi-bell text-primary" aria-hidden="true"></i><h5 id="notifications-title" class="mb-0">Уведомления</h5><span class="notification-count">{{ state.total }}</span></div>
                    <div class="notification-summary">{{ state.unread ? `Непрочитанных: ${state.unread}` : 'Все уведомления прочитаны' }}</div>
                </div>
                <div class="d-flex gap-2 align-items-center">
                    <button class="btn btn-outline-secondary btn-sm notification-refresh" title="Обновить" aria-label="Обновить уведомления" :disabled="state.loading || state.busy" @click="refreshNotifications()"><i class="bi bi-arrow-clockwise" aria-hidden="true"></i></button>
                    <button class="btn btn-primary btn-sm" :disabled="state.busy || !state.unread" @click="readNotifications()"><i class="bi bi-check2-all me-1" aria-hidden="true"></i>Прочитать все</button>
                </div>
            </div>
            <div v-if="state.error" class="alert alert-danger m-3" role="alert">{{ state.error }}</div>
            <div v-if="state.loading && !state.items.length" class="notification-empty" role="status">Загружаем уведомления…</div>
            <div v-else-if="!state.items.length && !state.error" class="notification-empty"><i class="bi bi-bell-slash d-block mb-2" aria-hidden="true"></i>Уведомлений пока нет</div>
            <div v-if="targetMessage" class="alert alert-info m-3" role="status">{{ targetMessage }}</div> <!-- новый код chat -->
            <div class="notification-list">
                <article v-for="item in state.items" :key="item.ID" :id="'notification-' + item.ID" tabindex="-1" class="notification-item" :class="{'notification-unread': !item.read_at, 'notification-selected': String(item.ID) === selectedID}">
                    <div class="notification-icon" :class="`notification-icon-${item.kind}`"><i class="bi" :class="icons[item.kind] || 'bi-list-task'" aria-hidden="true"></i></div>
                    <div class="notification-content">
                        <div class="notification-heading"><strong>{{ titles[item.kind] || 'Задача' }}</strong><span v-if="!item.read_at" class="notification-unread-dot" role="img" aria-label="Не прочитано" title="Не прочитано"></span></div>
                        <div class="notification-message">{{ item.task_message }}</div>
                        <div class="notification-meta"><span>{{ actorLabels[item.kind] || 'Пользователь' }}: {{ item.actor_name }}</span><time :datetime="item.CreatedAt">{{ dateLabel(item.CreatedAt) }}</time></div>
                    </div>
                    <div class="notification-actions">
                        <router-link :to="{name:'tasks',query:{task:String(item.task_id)}}" class="notification-task-link">К задаче <i class="bi bi-arrow-up-right" aria-hidden="true"></i></router-link> <!-- новый код chat: отдельная страница задач -->
                        <button v-if="!item.read_at" class="btn btn-outline-primary btn-sm" :disabled="state.busy" @click="readNotifications(item.ID)"><i class="bi bi-check2 me-1" aria-hidden="true"></i>Прочитать</button>
                        <span v-else class="notification-read"><i class="bi bi-check2-all me-1" aria-hidden="true"></i>Прочитано</span>
                    </div>
                </article>
            </div>
            <div v-if="state.total > state.pageSize" class="notification-pagination">
                <button class="btn btn-outline-secondary btn-sm" :disabled="state.loading || state.page <= 1" @click="refreshNotifications(state.page-1,true)">Назад</button>
                <span>{{ state.page }} / {{ Math.ceil(state.total/state.pageSize) }}</span>
                <button class="btn btn-outline-secondary btn-sm" :disabled="state.loading || state.page * state.pageSize >= state.total" @click="refreshNotifications(state.page+1,true)">Далее</button>
            </div>
        </section>
    </div>
</template>
<script setup>
// --------- новый код chat: переход не меняет статус прочтения
import { onMounted, onBeforeUnmount, computed, ref, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { notificationsState as state, startNotifications, stopNotifications, refreshNotifications, readNotifications, locateNotification } from '../../utils/notifications';
// новый код chat: оформление события изменения задачи
const icons = {assigned:'bi-person-plus', reopened:'bi-arrow-counterclockwise', completed:'bi-check2',updated:'bi-pencil'};
const titles = {assigned:'Вам назначена задача',reopened:'Задача возвращена в работу',completed:'Задача выполнена',updated:'Задача изменена'};
const actorLabels = {assigned:'Назначил',reopened:'Вернул в работу',completed:'Отметил выполнение',updated:'Изменил'};
const dateLabel = value => new Date(value).toLocaleString('ru-RU');
// --------- новый код chat: поиск и подсветка уведомления без прочтения
const route = useRoute();
const selectedID = computed(() => String(route.query.notification || ''));
const targetMessage = ref('');
let focusVersion = 0;
const showSelected = async () => {
    const id = selectedID.value, request = ++focusVersion;
    targetMessage.value = '';
    if (!id) { await refreshNotifications(1,true); return; }
    try {
        const page = await locateNotification(id);
        if (request !== focusVersion) return;
        if (!page) { targetMessage.value = 'Уведомление больше недоступно.'; return; }
        await refreshNotifications(page,true);
        await focusSelected();
    } catch { if (request === focusVersion) targetMessage.value = 'Не удалось найти уведомление. Попробуйте ещё раз.'; }
};
const focusSelected = async () => {
    await nextTick();
    const element = document.getElementById('notification-' + selectedID.value);
    if (element) { element.scrollIntoView({block:'nearest', behavior:'smooth'}); element.focus({preventScroll:true}); }
};
watch(selectedID, showSelected);
watch(() => state.items, focusSelected);
onMounted(() => { startNotifications(); showSelected(); });
// --------- конец нового кода chat
onBeforeUnmount(() => { focusVersion++; stopNotifications(); });
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: плотная лента, спокойная подсветка и адаптация под узкий экран */
.notifications-page { font-size: 13px; }
.notification-panel { background: var(--bs-body-bg); border: 1px solid var(--bs-border-color); border-radius: 10px; overflow: hidden; }
.notification-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--bs-border-color); }
.notification-header h5 { font-size: 16px; }
.notification-count { padding: 1px 7px; border-radius: 6px; background: var(--bs-tertiary-bg); color: var(--bs-secondary-color); font-size: 12px; }
.notification-summary { margin-top: 4px; font-size: 12px; color: var(--bs-secondary-color); }
.notification-refresh { width: 31px; }
.notification-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--bs-border-color); }
.notification-item:last-child { border-bottom: none; }
.notification-unread { background: rgba(var(--bs-primary-rgb), .035); box-shadow: inset 3px 0 0 rgba(var(--bs-primary-rgb), .5); }
/* новый код chat: выделение уведомления, открытого из toast */
.notification-selected { background: var(--bs-primary-bg-subtle); box-shadow: inset 0 0 0 2px var(--bs-primary); outline: none; }
.notification-icon { display: flex; align-items: center; justify-content: center; flex: 0 0 30px; height: 30px; border-radius: 8px; background: var(--bs-tertiary-bg); color: var(--bs-secondary-color); font-size: 16px; }
.notification-icon-assigned, .notification-icon-updated { background: var(--bs-primary-bg-subtle); color: var(--bs-primary); } /* новый код chat */
.notification-icon-completed { background: var(--bs-success-bg-subtle); color: var(--bs-success); }
.notification-icon-reopened { background: var(--bs-warning-bg-subtle); color: var(--bs-warning-text-emphasis); }
.notification-content { flex: 1; min-width: 0; }
.notification-heading { display: flex; align-items: center; gap: 7px; line-height: 1.4; }
.notification-heading strong { font-weight: 600; }
.notification-unread-dot { flex: 0 0 6px; height: 6px; border-radius: 50%; background: var(--bs-primary); }
.notification-message { margin-top: 3px; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.4; }
.notification-meta { display: flex; flex-wrap: wrap; gap: 3px 14px; margin-top: 5px; font-size: 11px; color: var(--bs-secondary-color); }
.notification-meta span { overflow-wrap: anywhere; }
.notification-meta time { white-space: nowrap; }
.notification-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; padding-top: 2px; }
.notification-actions .btn { font-size: 12px; padding: 3px 8px; }
.notification-task-link { font-size: 12px; text-decoration: none; white-space: nowrap; }
.notification-task-link:hover { text-decoration: underline; }
.notification-read { color: var(--bs-secondary-color); font-size: 11px; white-space: nowrap; }
.notification-empty { padding: 36px 16px; text-align: center; color: var(--bs-secondary-color); }
.notification-empty > i { font-size: 24px; }
.notification-pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 12px; border-top: 1px solid var(--bs-border-color); color: var(--bs-secondary-color); font-size: 12px; }
@media (max-width: 767px) {
    .notification-item { flex-wrap: wrap; gap: 8px; padding: 10px 12px; }
    .notification-actions { flex-basis: 100%; padding-left: 38px; }
    .notification-header { padding: 12px; }
}
/* --------- конец нового кода chat */
</style>
