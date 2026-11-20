<!-- --------- новый код chat: десятичное количество без округления лишних знаков -->
<template><input type="text" inputmode="decimal" :value="modelValue" :pattern="`[0-9]+([.,][0-9]{1,${precision}})?`" :title="`Неотрицательное число, до ${precision} знаков после запятой`" @input="$emit('update:modelValue', $event.target.value)" /></template>
<script setup>
defineProps({ modelValue: { type: [String, Number], default: '' }, precision: { type: Number, default: 2 } });
defineEmits(['update:modelValue']);
</script>
<!-- --------- конец нового кода chat -->
