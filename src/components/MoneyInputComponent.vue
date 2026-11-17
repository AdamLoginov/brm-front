<!-- --------- новый код chat: денежное поле с группировкой разрядов и обычным v-model -->
<template>
    <input type="text" inputmode="decimal" :value="displayValue" @input="handleInput" @keydown="handleDelete" @compositionend="handleInput">
</template>

<script setup>
// --------- новый код chat: в модели строка без пробелов, в поле — форматированная сумма
import { computed } from 'vue';
import { formatMoneyInput, normalizeMoneyInput, moneyInputCaret } from '../utils/moneyInput';

const props = defineProps({modelValue: {type: [String, Number], default: ''}});
const emit = defineEmits(['update:modelValue']);
const displayValue = computed(() => formatMoneyInput(props.modelValue));

const handleInput = event => {
    if (event.isComposing) return;
    const input = event.target;
    const position = normalizeMoneyInput(input.value.slice(0, input.selectionStart ?? input.value.length)).length;
    const value = normalizeMoneyInput(input.value);
    const formatted = formatMoneyInput(value);
    input.value = formatted;
    const caret = moneyInputCaret(formatted, position);
    input.setSelectionRange(caret, caret);
    emit('update:modelValue', value);
};

const handleDelete = event => {
    if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const input = event.target;
    const position = input.selectionStart;
    if (position !== input.selectionEnd) return;
    // Пробел — оформление, поэтому удаляем соседнюю цифру, а не восстанавливаем пробел снова.
    if (event.key === 'Backspace' && input.value[position - 1] === ' ') input.setSelectionRange(position - 1, position - 1);
    if (event.key === 'Delete' && input.value[position] === ' ') input.setSelectionRange(position + 1, position + 1);
};
// --------- конец нового кода chat
</script>
