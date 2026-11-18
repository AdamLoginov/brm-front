<!-- --------- новый код chat: несколько телефонов сотрудника -->
<template>
    <div>
        <div class="form-label fw-medium">Телефоны</div> <!-- новый код chat: жирность 500, как у остальных подписей -->
        <div v-for="(phone, index) in phones" :key="index" class="d-flex gap-2 mb-2">
            <input :value="phone" @input="updatePhone(index, $event.target.value)" type="tel" class="form-control form-control-sm" :aria-label="'Телефон ' + (index + 1)" placeholder="+7 900 000-00-00">
            <button type="button" class="btn btn-outline-danger btn-sm" :aria-label="'Удалить телефон ' + (index + 1)" @click="removePhone(index)"><i class="bi bi-trash"></i></button>
        </div>
        <button type="button" class="btn btn-outline-primary btn-sm" @click="phones = [...phones, '']"><i class="bi bi-plus-lg me-1"></i>Добавить номер</button>
    </div>
</template>
<script setup>
const phones = defineModel({type: Array, default: () => ['']});
const updatePhone = (index, value) => { const next = [...phones.value]; next[index] = value; phones.value = next; };
const removePhone = index => {
    if (phones.value[index] && !window.confirm('Удалить этот номер телефона из карточки?')) return;
    phones.value = phones.value.filter((_, position) => position !== index);
};
</script>
<!-- --------- конец нового кода chat -->
