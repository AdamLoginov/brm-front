<!-- новый код chat: адаптивная компоновка с мобильным меню -->
<template>
  <NotificationToasts />
  <div class="app-shell">
    <div v-if="showSidebar && isMobile && mobileOpen" class="sidebar-backdrop" aria-hidden="true" @click="closeMobile" />
    <aside v-if="showSidebar" id="app-sidebar" ref="sidebarElement" class="app-sidebar"
      :class="{ 'is-collapsed': collapsed && !isMobile, 'is-mobile': isMobile, 'is-open': mobileOpen }"
      :role="isMobile && mobileOpen ? 'dialog' : undefined" :aria-modal="isMobile && mobileOpen ? true : undefined"
      aria-label="Навигация БРМ" :inert="isMobile && !mobileOpen" @keydown="handleSidebarKeydown">
      <Sidebar :collapsed="collapsed && !isMobile" :mobile="isMobile" @toggle="toggleSidebar" @close="closeMobile" @navigate="closeMobile" />
    </aside>
    <div class="app-content" :inert="showSidebar && isMobile && mobileOpen">
      <header v-if="showSidebar && isMobile" class="mobile-header">
        <button ref="menuButton" type="button" class="mobile-menu-button" aria-label="Открыть меню" aria-controls="app-sidebar" :aria-expanded="mobileOpen" @click="mobileOpen = true"><i class="bi bi-list" aria-hidden="true"></i></button>
        <span>ООО БРМ</span>
      </header>
      <main><router-view /></main>
    </div>
  </div>
</template>

<script setup>
// новый код chat: сохранение состояния панели и управление мобильным фокусом
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import NotificationToasts from './components/NotificationToasts.vue';
import Sidebar from './components/Sidebar.vue';

const route = useRoute();
const showSidebar = computed(() => route.name !== 'login');
const savedCollapsed = () => { try { return localStorage.getItem('brm-sidebar-collapsed') === 'true'; } catch { return false; } };
const collapsed = ref(savedCollapsed());
const mobileMedia = window.matchMedia('(max-width: 767px)');
const isMobile = ref(mobileMedia.matches);
const mobileOpen = ref(false);
const sidebarElement = ref(null);
const menuButton = ref(null);
let previousOverflow = null;
const toggleSidebar = () => {
  collapsed.value = !collapsed.value;
  try { localStorage.setItem('brm-sidebar-collapsed', String(collapsed.value)); } catch { /* новый код chat: состояние сохраняется до перезагрузки */ }
};
const closeMobile = () => { mobileOpen.value = false; };
const mediaChanged = event => { isMobile.value = event.matches; closeMobile(); };
const focusableElements = () => [...(sidebarElement.value?.querySelectorAll('a[href], button:not([disabled]), summary, [tabindex="0"]') || [])].filter(element => element.getClientRects().length);
const handleSidebarKeydown = event => {
  if (!isMobile.value || !mobileOpen.value) return;
  if (event.key === 'Escape') { event.preventDefault(); closeMobile(); }
  if (event.key !== 'Tab') return;
  const elements = focusableElements();
  const first = elements[0];
  const last = elements.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
};
watch(() => route.fullPath, closeMobile);
watch(mobileOpen, async open => {
  if (open) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    await nextTick();
    if (mobileOpen.value) focusableElements()[0]?.focus();
  } else {
    if (previousOverflow !== null) { document.body.style.overflow = previousOverflow; previousOverflow = null; }
    await nextTick();
    if (isMobile.value) menuButton.value?.focus();
  }
});
onMounted(() => mobileMedia.addEventListener('change', mediaChanged));
onBeforeUnmount(() => {
  mobileMedia.removeEventListener('change', mediaChanged);
  if (previousOverflow !== null) document.body.style.overflow = previousOverflow;
});
</script>

<style scoped>
/* новый код chat: настольная панель и выдвижное меню */
.app-shell { display: flex; min-height: 100vh; min-height: 100dvh; }
.app-sidebar { position: sticky; top: 0; flex: 0 0 224px; width: 224px; height: 100vh; height: 100dvh; z-index: 1020; }
.app-sidebar.is-collapsed { flex-basis: 64px; width: 64px; }
.app-content { flex: 1; min-width: 0; }
.app-content main { min-width: 0; overflow-x: auto; }
/* новый код chat: шрифт Bootstrap и чёрные надписи мобильного меню */
.mobile-header { font-family: var(--bs-body-font-family); position: sticky; top: 0; z-index: 1010; display: flex; align-items: center; gap: 12px; height: 56px; padding: 8px 14px; background: #fff; border-bottom: 1px solid #e5eaf0; color: #000; font-size: 14px; font-weight: 600; }
.mobile-menu-button { display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid #e5eaf0; border-radius: 8px; background: #fff; color: #000; font-size: 23px; }
.mobile-menu-button:focus-visible { outline: 2px solid #3679d6; outline-offset: 2px; }
.sidebar-backdrop { position: fixed; inset: 0; z-index: 1090; background: #17283c66; }
.app-sidebar.is-mobile { position: fixed; inset: 0 auto 0 0; width: min(280px, 85vw); z-index: 1100; transform: translateX(-100%); visibility: hidden; transition: transform .2s ease, visibility .2s; }
.app-sidebar.is-mobile.is-open { transform: translateX(0); visibility: visible; }
@media (prefers-reduced-motion: reduce) { .app-sidebar.is-mobile { transition: none; } }
</style>
