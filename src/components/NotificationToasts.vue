<!-- --------- новый код chat: глобальная очередь Bootstrap toast без автоматического закрытия -->
<template>
    <Teleport to="body">
        <div class="toast-container position-fixed bottom-0 end-0 p-3 notification-toasts" aria-live="polite" aria-relevant="additions">
            <div v-for="item in visible" :key="item.ID" class="toast show" role="status" aria-atomic="true">
                <div class="toast-header" @click="open(item)">
                    <i class="bi bi-bell text-primary me-2" aria-hidden="true"></i>
                    <strong class="me-auto">{{ titles[item.kind] || 'Уведомление' }}</strong>
                    <button type="button" class="btn-close ms-2" aria-label="Скрыть уведомление" @click.stop="dismiss(item.ID)"></button>
                </div>
                <button type="button" class="toast-body notification-toast-open" @click="open(item)">
                    <span class="notification-toast-message">{{ item.task_message }}</span>
                    <span class="notification-toast-meta">{{ item.actor_name }} · {{ dateLabel(item.CreatedAt) }}</span>
                </button>
            </div>
        </div>
    </Teleport>
</template>
<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { notificationsState as state } from '../utils/notifications';
const router = useRouter();
const dismissed = ref([]);
const titles = {assigned:'Вам назначена задача', reopened:'Задача возвращена в работу', completed:'Ваша задача выполнена'};
const key = () => 'notification-toast-dismissed:' + state.toastOwner;
const restore = () => {
    try {
        const value = JSON.parse(localStorage.getItem(key()) || '[]');
        dismissed.value = Array.isArray(value) ? value.map(String) : [];
    } catch { dismissed.value = []; }
};
watch(() => state.toastOwner, restore, {immediate:true});
const storageChanged = event => { if (event.key === key()) restore(); };
onMounted(() => window.addEventListener('storage', storageChanged));
onBeforeUnmount(() => window.removeEventListener('storage', storageChanged));
const visible = computed(() => state.toastOwner ? state.toastItems.filter(item => !item.read_at && !dismissed.value.includes(String(item.ID))).slice(0,5) : []);
const dismiss = id => {
    // Закрытие влияет только на показ в этом браузере, не на прочтение.
    dismissed.value = [...new Set([...dismissed.value, String(id)])];
    try { localStorage.setItem(key(), JSON.stringify(dismissed.value)); } catch { /* Скрытие остаётся действующим в текущем сеансе. */ }
};
// --------- новый код chat: переход скрывает toast, сохраняя уведомление непрочитанным
const open = item => {
    dismiss(item.ID);
    return router.push({name:'notifications', query:{notification:String(item.ID)}});
};
// --------- конец нового кода chat
const dateLabel = value => new Date(value).toLocaleString('ru-RU', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
</script>
<style scoped>
.notification-toasts { z-index: 1080; max-width: 100vw; max-height: 100dvh; overflow-y: auto; pointer-events: none; }
.notification-toasts .toast { width: 360px; max-width: calc(100vw - 32px); background: var(--bs-body-bg); border-radius: 10px; overflow: hidden; pointer-events: auto; }
.toast-header { background: var(--bs-body-bg); padding: 10px 12px; font-size: 13px; }
.notification-toast-open { display: block; width: 100%; border: 0; text-align: left; background: transparent; color: var(--bs-body-color); font-size: 13px; }
.notification-toast-open:hover { background: var(--bs-tertiary-bg); }
.notification-toast-open:focus-visible { outline: 2px solid var(--bs-primary); outline-offset: -2px; }
.notification-toast-message { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; overflow-wrap: anywhere; white-space: pre-wrap; }
.notification-toast-meta { display: block; margin-top: 6px; font-size: 11px; color: var(--bs-secondary-color); }
</style>
<!-- --------- конец нового кода chat -->
