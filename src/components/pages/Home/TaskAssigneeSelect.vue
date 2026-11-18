<template>
  <!-- --------- новый код chat: выбор нескольких участников без Ctrl -->
  <details class="task-assignee-picker">
    <summary :id="id">{{ modelValue.length ? 'Выбрано: ' + modelValue.length : 'Не назначены' }}</summary>
    <div class="assignee-options">
      <label v-for="user in users || []" :key="user.ID" class="assignee-option">
        <input type="checkbox" class="form-check-input" :checked="modelValue.includes(user.ID)" :disabled="disabled" @change="toggle(user.ID, $event.target.checked)">
        <span>{{ userName(user) }}</span>
      </label>
      <span v-if="!users?.length">Нет доступных пользователей</span>
    </div>
  </details>
  <!-- --------- конец нового кода chat -->
</template>
<script setup>
// --------- новый код chat: массив уникальных ID участников
const props = defineProps({ modelValue: { type: Array, default: () => [] }, users: Array, userName: Function, id: String, disabled: Boolean });
const emit = defineEmits(['update:modelValue']);
const toggle = (id, checked) => emit('update:modelValue', checked ? [...new Set([...props.modelValue, id])] : props.modelValue.filter(value => value !== id));
// --------- конец нового кода chat
</script>
<style scoped>
/* --------- новый код chat: компактный список с чекбоксами */
/* новый код chat: чёрный текст списка исполнителей */
.task-assignee-picker { color: #000; position: relative; font-size: 13px; }
.task-assignee-picker summary { padding: 5px 10px; min-height: 31px; border: 1px solid var(--bs-border-color); border-radius: 5px; background: white; cursor: pointer; }
.assignee-options { position: absolute; top: calc(100% + 4px); left: 0; width: max-content; min-width: 100%; max-width: min(300px, 80vw); max-height: 210px; overflow-y: auto; z-index: 20; background: white; border: 1px solid var(--bs-border-color); border-radius: 7px; padding: 8px; box-shadow: 0 5px 20px #23354d18; }
.assignee-option { display: flex; align-items: center; gap: 8px; padding: 6px; cursor: pointer; overflow-wrap: anywhere; }
.assignee-option:hover { background: var(--bs-tertiary-bg); }
.assignee-option input { margin: 0; flex-shrink: 0; }
/* --------- конец нового кода chat */
</style>
