<!-- --------- новый код chat: поля официального трудоустройства -->
<template>
    <div class="col-4 pt-3">
        <label for="employee-official" class="form-label">Устроен официально</label>
        <select id="employee-official" :value="officiallyEmployed ? 'true' : 'false'" class="form-select form-select-sm" @change="changeEmployment">
            <option value="false">Нет</option><option value="true">Да</option>
        </select>
    </div>
    <div v-if="officiallyEmployed" class="col-4 pt-3">
        <label for="employee-monthly-salary" class="form-label">ЗП в месяц, ₽</label>
        <input id="employee-monthly-salary" :value="salaryInput" type="text" inputmode="decimal" class="form-control form-control-sm" @focus="editing = true" @blur="editing = false" @input="changeSalary">
    </div>
</template>
<!-- --------- конец нового кода chat -->
<script setup>
// --------- новый код chat: точное преобразование рублей в копейки
import { computed, ref, watch } from 'vue';
const props = defineProps({officiallyEmployed:Boolean, monthlySalaryKopecks:{type:Number, default:0}});
const emit = defineEmits(['update:officiallyEmployed', 'update:monthlySalaryKopecks']);
const salaryText = computed(() => {
    const cents = BigInt(props.monthlySalaryKopecks || 0);
    return `${cents / 100n},${String(cents % 100n).padStart(2, '0')}`;
});
const salaryInput = ref(salaryText.value), editing = ref(false);
watch(salaryText, value => { if (!editing.value) salaryInput.value = value; });
const changeEmployment = event => {
    const official = event.target.value === 'true';
    emit('update:officiallyEmployed', official);
    if (!official) {
        editing.value = false;
        salaryInput.value = '0,00';
        emit('update:monthlySalaryKopecks', 0);
    }
};
const changeSalary = event => {
    salaryInput.value = event.target.value;
    const value = event.target.value.trim().replace(',', '.') || '0';
    let cents = null;
    if (/^\d+(?:\.\d{1,2})?$/.test(value)) {
        const [rubles, fraction = ''] = value.split('.');
        cents = BigInt(rubles) * 100n + BigInt(fraction.padEnd(2, '0'));
    }
    const valid = cents !== null && cents <= 9007199254740991n;
    event.target.setCustomValidity(valid ? '' : 'Введите сумму от 0, не более двух знаков после запятой, в допустимом диапазоне.');
    if (valid) emit('update:monthlySalaryKopecks', Number(cents));
};
// --------- конец нового кода chat
</script>
