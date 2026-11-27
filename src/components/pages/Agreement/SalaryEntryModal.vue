<!-- новый код chat: общее окно финансовой записи -->
<template>
    <Teleport to="body">
        <dialog ref="windowRef" class="entry-window" aria-labelledby="entry-heading" @cancel.prevent="close">
            <header><h2 id="entry-heading"><i class="bi bi-pencil-square text-primary me-2"></i>{{ title }}</h2><button type="button" class="btn-close" aria-label="Закрыть" :disabled="busy" @click="close"></button></header>
            <div class="entry-body"><div v-if="error" class="alert alert-danger py-2" role="alert">{{ error }}</div><slot /></div>
        </dialog>
    </Teleport>
</template>
<script setup>
import { onMounted, ref } from 'vue';
const props = defineProps({title:String, busy:Boolean, error:String});
const emit = defineEmits(['close']);
const windowRef = ref(null);
function close() { if (!props.busy) emit('close'); }
onMounted(() => windowRef.value.showModal());
</script>
<style scoped>
.entry-window { margin:auto; width:min(680px,95vw); max-height:90dvh; padding:0; border:1px solid var(--bs-border-color); border-radius:12px; color:var(--bs-body-color); box-shadow:0 16px 50px #18243429; }
.entry-window::backdrop {background:#14203466}
header {display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--bs-border-color)}
h2 {margin:0;font-size:18px;font-weight:600}.entry-body {padding:22px 24px 28px}
/* новый код chat: меню сохраняет прокрутку даже на невысоком экране */
.entry-body :deep(.multi-select-dropdown) {max-height:min(300px,40dvh);margin-top:0}
@media(max-width:575px){.entry-body{padding:18px 16px 22px}}
.entry-body :deep(.form-label){font-size:13px;font-weight:600}
</style>
