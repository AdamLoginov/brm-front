<!-- --------- новый код chat: денежное поле с группировкой разрядов и обычным v-model -->
<template>
    <input ref="inputElement" type="text" :inputmode="allowExpressions ? 'text' : 'decimal'" :value="displayValue" @input="handleInput" @keydown="handleDelete" @focus="showExpression" @blur="resolveExpression" @compositionend="handleInput"> <!-- новый код chat: возврат формулы при фокусе -->
</template>

<script setup>
// --------- новый код chat: в модели строка без пробелов, в поле — форматированная сумма
import { computed, ref, watch } from 'vue'; // новый код chat: сброс формулы при изменении значения извне
import { formatMoneyInput, normalizeMoneyInput, moneyInputCaret } from '../utils/moneyInput';
import { calculateMoneyExpression } from '../utils/moneyExpression'; // новый код chat

const props = defineProps({modelValue: {type: [String, Number], default: ''}, allowExpressions: {type: Boolean, default: false}}); // новый код chat: формулы включаются отдельно
const emit = defineEmits(['update:modelValue']);
// --------- новый код chat: формулы сохраняются при вводе и вычисляются при выходе
const inputElement = ref(null);
const isExpression = value => props.allowExpressions && String(value).trimStart().startsWith('=');
// --------- новый код chat: формула хранится отдельно от рассчитанной суммы
const savedExpression = ref('');
const expressionResult = ref(null);
const editingExpression = ref(false);
const displayValue = computed(() => {
    if (editingExpression.value && savedExpression.value) return savedExpression.value;
    return isExpression(props.modelValue) ? props.modelValue : formatMoneyInput(props.modelValue);
});
const showExpression = () => {
    if (!props.allowExpressions || !savedExpression.value) return;
    editingExpression.value = true;
    if (inputElement.value) inputElement.value.value = savedExpression.value;
};
watch(() => props.modelValue, value => {
    // Собственное вычисление не стирает формулу; очистка формы или новая сумма — стирает.
    if (String(value ?? '') !== savedExpression.value && String(value ?? '') !== expressionResult.value) {
        savedExpression.value = '';
        expressionResult.value = null;
        editingExpression.value = false;
        inputElement.value?.setCustomValidity('');
    }
});
// --------- конец нового кода chat
const resolveExpression = () => {
    const input = inputElement.value;
    if (!input || !isExpression(input.value)) return true;
    try {
        const expression = input.value; // новый код chat: сохраняем исходную запись
        const value = calculateMoneyExpression(expression);
        savedExpression.value = expression; // новый код chat
        expressionResult.value = value; // новый код chat: модель содержит сумму, а не формулу
        editingExpression.value = false; // новый код chat: после расчёта показываем число
        input.setCustomValidity('');
        input.value = formatMoneyInput(value);
        emit('update:modelValue', value);
        return true;
    } catch (error) {
        input.setCustomValidity(error.message);
        input.reportValidity();
        return false;
    }
};
defineExpose({resolveExpression});
// --------- конец нового кода chat

const handleInput = event => {
    if (event.isComposing) return;
    const input = event.target;
    input.setCustomValidity(''); // новый код chat: повторный ввод снимает ошибку
    // --------- новый код chat: изменение формулы или замена её обычной суммой
    if (isExpression(input.value)) {
        savedExpression.value = input.value;
        expressionResult.value = null;
        editingExpression.value = true;
        emit('update:modelValue', input.value);
        return;
    }
    savedExpression.value = '';
    expressionResult.value = null;
    editingExpression.value = false;
    // --------- конец нового кода chat
    const position = normalizeMoneyInput(input.value.slice(0, input.selectionStart ?? input.value.length)).length;
    const value = normalizeMoneyInput(input.value);
    const formatted = formatMoneyInput(value);
    input.value = formatted;
    const caret = moneyInputCaret(formatted, position);
    input.setSelectionRange(caret, caret);
    emit('update:modelValue', value);
};

const handleDelete = event => {
    // новый код chat: Enter вычисляет формулу перед отправкой формы
    if (event.key === 'Enter' && !event.isComposing && !resolveExpression()) { event.preventDefault(); return; }
    if (isExpression(event.target.value)) return;
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
