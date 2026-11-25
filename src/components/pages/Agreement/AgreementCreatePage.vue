<!-- --------- новый код chat: единое оформление формы договора -->
<template>
    <div class="container-fluid agreement-form-page">
        <header class="agreement-form-heading">
            <div><h1>Создать договор</h1><p>Основные данные, объект и условия выполнения работ</p></div>
            <router-link :to="{name:'agreements'}" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left me-1" aria-hidden="true"></i>К договорам</router-link>
        </header>
        <div v-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
        
        <form @submit.prevent="HandlerSubmitForm" :aria-busy="isSubmit">
            <fieldset :disabled="isSubmit" class="agreement-fields">
                <div class="row g-3">
                    <div class="col-12 col-lg-7">
                        <section class="agreement-form-card h-100">
                            <h2><i class="bi bi-file-earmark-text" aria-hidden="true"></i>Основные данные</h2>
                            <div class="agreement-form-body">
                                <div><label for="agreement-name" class="form-label">Полное наименование договора</label><input id="agreement-name" v-model="formData.name" type="text" class="form-control form-control-sm" placeholder="Текущий ремонт оборудования"></div>
                                <div><label for="agreement-short-name" class="form-label">Краткое наименование договора</label><input id="agreement-short-name" v-model="formData.short_name" type="text" class="form-control form-control-sm" placeholder="ГМЗ (Краснокаменск)"></div>
                                <div><label for="agreement-number" class="form-label">Номер договора</label><input id="agreement-number" v-model="formData.number" type="text" class="form-control form-control-sm" placeholder="30-1168-33-77 от 31.12.2024 г."></div>
                            </div>
                        </section>
                    </div>
                    <div class="col-12 col-lg-5">
                        <section class="agreement-form-card h-100">
                            <h2><i class="bi bi-building" aria-hidden="true"></i>Заказчик и объект</h2>
                            <div class="agreement-form-body">
                                <div><label for="agreement-customer" class="form-label">Заказчик</label><input id="agreement-customer" v-model="formData.customer" type="text" class="form-control form-control-sm" placeholder="ПАО «ППГХО»"></div>
                                <div><label for="agreement-address" class="form-label">Месторасположение объекта</label><input id="agreement-address" v-model="formData.address" type="text" class="form-control form-control-sm" placeholder="Каширское шоссе, 51"></div>
                            </div>
                        </section>
                    </div>
                    <div class="col-12">
                        <section class="agreement-form-card">
                            <h2><i class="bi bi-sliders" aria-hidden="true"></i>Условия договора</h2>
                            <div class="agreement-form-body">
                                <div class="row g-3">
                                    <div class="col-12 col-md-4"><div><label for="agreement-price" class="form-label">Стоимость договора, ₽</label><input id="agreement-price" v-model="formData.price" type="number" step="any" class="form-control form-control-sm" placeholder="1000000"></div></div> <!-- новый код chat: сохраняем возможность ввода дробной стоимости -->
                                    <div class="col-12 col-md-4"><div><label for="agreement-date" class="form-label">Срок выполнения работ</label><input id="agreement-date" v-model="formData.date_end" type="date" class="form-control form-control-sm"></div></div>
                                    <!-- новый код chat: переключатель сохраняет прежние строковые значения статуса -->
                                    <div class="col-12 col-md-4">
                                        <div class="form-label">Статус договора</div>
                                        <div class="agreement-status-control" :class="{'is-active':formData.status === 'Активный'}">
                                            <div class="form-check form-switch mb-0">
                                                <input id="agreement-status" v-model="formData.status" class="form-check-input" type="checkbox" role="switch" true-value="Активный" false-value="Закончен">
                                                <label for="agreement-status" class="form-check-label">Договор активен</label>
                                            </div>
                                            <span class="agreement-status-label">{{ formData.status === 'Активный' ? 'Активный' : 'Закончен' }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
                <div class="agreement-form-footer">
                    <button type="button" class="btn btn-sm btn-outline-secondary" @click="router.push({name:'agreements'})">Отмена</button>
                    <button type="submit" class="btn btn-primary btn-sm px-3"><span v-if="isSubmit" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>{{ isSubmit ? 'Сохранение…' : 'Создать договор' }}</button>
                </div>
            </fieldset>
        </form>
    </div>
</template>
<!-- --------- конец нового кода chat -->

<script setup>
    import { reactive, ref } from 'vue';
    import api from '../../../api';
    import { useRouter } from 'vue-router';

    const router = useRouter();

    // --------- новый код chat: состояние запроса и понятное сообщение об ошибке
const isSubmit = ref(false);
const errorMessage = ref('');

const requestError = err => typeof err.response?.data === 'string' && err.response.data.trim()
    ? err.response.data.trim()
    : 'Не удалось сохранить договор. Повторите попытку.';
// --------- конец нового кода chat

    const formData = reactive({
        name:       "",
        short_name: "",
        number:     "",
        customer:   "",
        address:    "",
        price:      0,
        date_end:   "",
        status:     "Активный"
    });

    // --------- новый код chat: защита от повторной отправки и отображение ошибки
    const HandlerSubmitForm = async() => {
        if (isSubmit.value) return;
        isSubmit.value = true; errorMessage.value = '';
        try {
            await api.post('/agreements/create', formData);
            await router.push({name:'agreements'});
        } catch (err) {
            errorMessage.value = requestError(err);
        } finally {
            isSubmit.value = false;
        }
    };
    // --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: адаптивные блоки в стиле карточек сайта */
.agreement-form-page { padding-top: 20px; padding-bottom: 24px; color: #000; font-size: 14px; }
.agreement-form-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.agreement-form-heading h1 { font-size: 22px; font-weight: 600; margin: 0 0 6px; }
.agreement-form-heading p { margin: 0; font-size: 13px; color: #495057; }
.agreement-fields { min-width: 0; margin: 0; padding: 0; border: 0; }
.agreement-form-card { background: #fff; border: 1px solid var(--bs-border-color, #dee2e6); border-radius: 12px; overflow: hidden; }
.agreement-form-card h2 { display: flex; gap: 9px; align-items: center; margin: 0; padding: 14px 18px; font-size: 15px; font-weight: 600; background: #f8f9fa; border-bottom: 1px solid var(--bs-border-color, #dee2e6); }
.agreement-form-card h2 i { color: var(--bs-primary); }
.agreement-form-body { display: grid; gap: 16px; padding: 18px; }
.agreement-form-page .form-label { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
.agreement-form-page .form-control, .agreement-form-page .form-select { font-size: 14px; min-height: 36px; border-radius: 6px; }
.agreement-form-page .btn { font-size: 14px; }
.agreement-form-footer { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--bs-border-color, #dee2e6); }
@media (max-width: 575px) {
    .agreement-form-page { padding-top: 12px; }
    .agreement-form-card h2 { padding: 12px; }
    .agreement-form-body { padding: 12px; }
    .agreement-form-heading h1 { font-size: 20px; }
}
/* --------- конец нового кода chat */
/* --------- новый код chat: компактный переключатель статуса в блоке условий */
.agreement-status-control { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; min-height: 36px; padding: 6px 10px; border: 1px solid var(--bs-border-color); border-radius: 6px; background: #f8f9fa; }
.agreement-status-control.is-active { background: #f0f8f3; border-color: #c6e4d1; }
.agreement-status-control .form-check-label { font-size: 13px; cursor: pointer; }
.agreement-status-control .form-check-input { cursor: pointer; }
.agreement-status-control .form-check-input:checked { background-color: var(--bs-success); border-color: var(--bs-success); }
.agreement-status-control .form-check-input:disabled { cursor: default; }
.agreement-status-label { font-size: 11px; border-radius: 50rem; padding: 2px 8px; color: #495057; background: #e9ecef; }
.is-active .agreement-status-label { color: #146c43; background: #d1e7dd; }
/* --------- конец нового кода chat */
</style>
