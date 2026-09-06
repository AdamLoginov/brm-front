<template>
    <div ref="selectRef" class="multi-select">

        <!-- Основное поле -->
        <div
            class="form-select form-select-sm multi-select-control"
            :class="{ 'is-open': isOpen }"
            @click="toggleDropdown"
        >

            <!-- Если что-то выбрано -->
            <div
                v-if="modelValue.length"
                class="d-flex flex-wrap gap-1"
            >
                <span
                    v-for="id in modelValue"
                    :key="id"
                    class="badge text-bg-primary"
                >
                    {{ getLabel(id) }}

                    <span
                        class="ms-1 remove"
                        @click.stop="remove(id)"
                    >
                        ×
                    </span>
                </span>
            </div>

            <!-- Если ничего не выбрано -->
            <span
                v-else
                class="text-muted"
            >
                {{ placeholder }}
            </span>

        </div>


        <!-- Выпадающий список -->
        <div
            v-if="isOpen"
            class="multi-select-dropdown"
        >

            <!-- Поиск -->
            <div v-if="searchable" class="mb-2">

                <input
                    v-model="search"
                    type="text"
                    class="form-control form-control-sm"
                    :placeholder="searchPlaceholder"
                    @click.stop
                >

            </div>


            <!-- Список -->
            <div
                v-for="option in filteredOptions"
                :key="option[valueKey]"
                class="multi-select-option"
                @click="toggle(option[valueKey])"
            >

                <input
                    type="checkbox"
                    class="form-check-input me-2"
                    :checked="modelValue.includes(option[valueKey])"
                    @click.stop
                    @change="toggle(option[valueKey])"
                >

                <span>
                    {{ getOptionLabel(option) }}
                </span>

            </div>


            <!-- Ничего не найдено -->
            <div
                v-if="filteredOptions.length === 0"
                class="text-muted text-center py-2"
            >
                Ничего не найдено
            </div>

        </div>

    </div>
</template>


<script setup>

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'


const props = defineProps({

    modelValue: {
        type: Array,
        default: () => []
    },

    options: {
        type: Array,
        default: () => []
    },

    valueKey: {
        type: String,
        default: 'ID'
    },

    labelKey: {
        type: [String, Function],
        default: 'name'
    },

    placeholder: {
        type: String,
        default: 'Выбрать'
    },

    searchable: {
        type: Boolean,
        default: true
    },

    searchPlaceholder: {
        type: String,
        default: 'Поиск...'
    }

})


const emit = defineEmits([
    'update:modelValue'
])


const isOpen = ref(false)
const search = ref('')
const selectRef = ref(null)



// Открыть / закрыть
const toggleDropdown = () => {
    isOpen.value = !isOpen.value

    if (!isOpen.value) {
        search.value = ''
    }
}



// Выбор элемента
const toggle = (id) => {

    const selected = [...props.modelValue]

    const index = selected.indexOf(id)

    if (index !== -1) {

        selected.splice(index, 1)

    } else {

        selected.push(id)

    }

    emit('update:modelValue', selected)
}



// Удалить выбранный элемент
const remove = (id) => {

    emit(
        'update:modelValue',
        props.modelValue.filter(item => item !== id)
    )

}



// Получить название
const getLabel = (id) => {

    const option = props.options.find(
        item => item[props.valueKey] === id
    )

    if (!option) {
        return ''
    }

    return getOptionLabel(option)

}



// Получить отображаемый текст
const getOptionLabel = (option) => {

    if (typeof props.labelKey === 'function') {
        return props.labelKey(option)
    }

    return option[props.labelKey]

}



// Фильтрация
const filteredOptions = computed(() => {

    if (!search.value) {
        return props.options
    }

    const query = search.value.toLowerCase()

    return props.options.filter(option => {

        const label = getOptionLabel(option)

        return String(label)
            .toLowerCase()
            .includes(query)

    })

})



// Закрытие при клике вне
const handleClickOutside = (event) => {

    if (
        selectRef.value &&
        !selectRef.value.contains(event.target)
    ) {
        isOpen.value = false
        search.value = ''
    }

}


onMounted(() => {

    document.addEventListener(
        'click',
        handleClickOutside
    )

})


onBeforeUnmount(() => {

    document.removeEventListener(
        'click',
        handleClickOutside
    )

})

</script>


<style scoped>

.multi-select {
    position: relative;
    width: 100%;
}


/* Основное поле */

.multi-select-control {
    min-height: 31px;
    height: auto;
    cursor: pointer;

    display: flex;
    align-items: center;
    flex-wrap: wrap;

    padding: 4px 30px 4px 8px;

    background-color: #fff;
}


/* Когда открыто */

.multi-select-control.is-open {
    border-color: #86b7fe;
    box-shadow: 0 0 0 .25rem rgba(13, 110, 253, .25);
}


/* Крестик */

.remove {
    cursor: pointer;
    font-size: 15px;
}

.remove:hover {
    opacity: .7;
}


/* Dropdown */

.multi-select-dropdown {

    position: absolute;

    top: 100%;
    left: 0;

    z-index: 1000;

    width: 100%;

    margin-top: 2px;

    padding: 8px;

    background: #fff;

    border: 1px solid #dee2e6;
    border-radius: 6px;

    box-shadow: 0 .5rem 1rem rgba(0, 0, 0, .15);

    max-height: 300px;

    overflow-y: auto;

}


/* Элемент списка */

.multi-select-option {

    display: flex;
    align-items: center;

    padding: 7px 8px;

    border-radius: 4px;

    cursor: pointer;

}


.multi-select-option:hover {

    background-color: #f8f9fa;

}


.multi-select-option .form-check-input {

    cursor: pointer;

}

</style>