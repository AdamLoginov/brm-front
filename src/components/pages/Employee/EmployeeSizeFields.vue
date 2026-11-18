<template>
    <!-- --------- новый код chat: общие поля размеров и категории сотрудника -->
    <section class="employee-size-fields">
        <div class="size-heading"><span class="size-icon"><i class="bi bi-person-bounding-box" aria-hidden="true"></i></span><h2>Рабочая одежда</h2></div>
        <div class="row g-3">
            <div class="col-12 col-sm-4">
                <label class="form-label d-block">Размер одежды
                    <input v-model="clothingSize" type="text" class="form-control form-control-sm mt-1" placeholder="48–50 / L">
                </label>
            </div>
            <div class="col-12 col-sm-4">
                <label class="form-label d-block">Размер обуви
                    <input v-model="shoeSize" type="text" class="form-control form-control-sm mt-1" placeholder="42">
                </label>
            </div>
            <div class="col-12 col-sm-4">
                <label class="form-label d-block">Рост, см
                    <input :value="heightCM ?? ''" @input="heightCM = $event.target.value === '' ? null : Number($event.target.value)" type="number" min="1" step="1" class="form-control form-control-sm mt-1" placeholder="180">
                </label>
            </div>
        </div>

    </section>
    <!-- --------- конец нового кода chat -->
</template>

<script setup>
// --------- новый код chat: модели общих полей создания и редактирования
const clothingSize = defineModel('clothingSize', {type: String});
const shoeSize = defineModel('shoeSize', {type: String});
const heightCM = defineModel('heightCM', {type: Number});
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: отдельный блок размеров */
.employee-size-fields { padding: 18px; border: 1px solid var(--bs-border-color); border-radius: 10px; background: var(--bs-body-bg); font-size: 13px; font-weight: 400; }
h2 { font-size: 14px; font-weight: 600; margin: 0; }
.size-heading { display: flex; align-items: center; gap: 9px; margin-bottom: 18px; }
.size-icon { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; color: var(--bs-primary); background: var(--bs-primary-bg-subtle); font-size: 15px; }
.form-label { font-size: 12px; font-weight: 500; margin-bottom: 0; }
.form-control { font-size: 13px; min-height: 36px; }
/* --------- конец нового кода chat */
</style>
