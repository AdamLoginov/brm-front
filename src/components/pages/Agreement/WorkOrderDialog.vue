<!-- --------- новый код chat: единая Bootstrap-оболочка окон книги и склада -->
<template><Teleport to="body"><div ref="element" class="modal work-order-dialog" tabindex="-1" role="dialog" aria-modal="true" :aria-labelledby="titleID"><div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"><div class="modal-content rounded-3"><div class="modal-header"><h2 :id="titleID" class="modal-title fs-6">{{ title }}</h2><button type="button" class="btn-close" :disabled="busy" aria-label="Закрыть" @click="$emit('close')"></button></div><div class="modal-body"><slot /></div></div></div></div></Teleport></template>
<script setup>
import { ref, useId, onMounted, onBeforeUnmount } from 'vue';
import { Modal } from 'bootstrap/dist/js/bootstrap.bundle.min.js';
defineProps({ title: String, busy: Boolean }); defineEmits(['close']);
const element = ref(null), titleID = useId(); let modal;
onMounted(() => { modal = new Modal(element.value, { backdrop: 'static', keyboard: false }); modal.show(); });
onBeforeUnmount(() => { modal?.hide(); modal?.dispose(); });
</script>
<style scoped>.work-order-dialog { font-size:13px; } :deep(.form-control), :deep(.form-select), :deep(.btn) { font-size:13px; } :deep(label) { font-weight:500; } :deep(.table) { font-size:13px; }</style>
<!-- --------- конец нового кода chat -->
