<!-- --------- новый код chat: карточки договоров с поиском и фильтром -->
<template>
    <div class="container-fluid agreements-page">
        <header class="agreements-heading">
            <div><h1>Договоры</h1><p>Объекты, заказчики и сроки выполнения работ</p></div>
            <router-link :to="{name:'agreement-create'}" class="btn btn-primary btn-sm"><i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Создать договор</router-link>
        </header>

        <section class="agreements-filters" aria-label="Поиск и фильтры договоров">
            <div class="agreements-search">
                <label for="agreements-search" class="form-label">Поиск договора</label>
                <div class="agreements-search-field">
                    <i class="bi bi-search" aria-hidden="true"></i>
                    <input id="agreements-search" v-model="search" type="search" class="form-control form-control-sm" placeholder="Название, номер, заказчик или адрес">
                </div>
            </div>
            <div class="agreements-status-filter">
                <label for="agreements-status" class="form-label">Статус</label>
                <select id="agreements-status" v-model="status" class="form-select form-select-sm">
                    <option value="Активный">Активные</option>
                    <option value="Закончен">Законченные</option>
                    <option value="">Все</option>
                </select>
            </div>
            <span class="agreements-count" role="status">{{ loading ? 'Загрузка…' : 'Найдено: ' + filteredAgreements.length }}</span>
        </section>

        <div v-if="errorMessage" class="alert alert-danger d-flex align-items-center gap-3 flex-wrap" role="alert">
            <span>{{ errorMessage }}</span><button class="btn btn-sm btn-outline-danger" @click="GetAllAgreementsHandler">Повторить</button>
        </div>
        <div v-else-if="loading" class="agreements-empty" role="status"><span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Загружаем договоры…</div>
        <div v-else-if="!filteredAgreements.length" class="agreements-empty">
            <i class="bi bi-folder2-open" aria-hidden="true"></i>
            <strong>Договоры не найдены</strong>
            <span>{{ agreements.length ? 'Измените поисковый запрос или выберите другой статус.' : 'Создайте первый договор, чтобы начать работу.' }}</span>
        </div>
        <div v-else class="row g-3">
            <div v-for="agreement in filteredAgreements" :key="agreement.ID" class="col-12 col-md-6 col-xl-4">
                <router-link :to="{name:'agreement', params:{id:agreement.ID}}" class="agreement-card">
                    <div class="agreement-card-heading">
                        <h2>{{ agreement.short_name || agreement.name || 'Без названия' }}</h2>
                        <span class="agreement-status" :class="{'agreement-status-active':agreement.status === 'Активный'}">{{ agreement.status || '—' }}</span>
                    </div>
                    <p v-if="agreement.short_name && agreement.name" class="agreement-full-name">{{ agreement.name }}</p>
                    <dl class="agreement-info">
                        <div><dt>Номер</dt><dd>{{ agreement.number || '—' }}</dd></div>
                        <div><dt>Заказчик</dt><dd>{{ agreement.customer || '—' }}</dd></div>
                        <div><dt>Объект</dt><dd>{{ agreement.address || '—' }}</dd></div>
                    </dl>
                    <div class="agreement-card-footer"><span><i class="bi bi-calendar3 me-2" aria-hidden="true"></i>Срок: <strong>{{ agreement.date_end ? formatDateStr(agreement.date_end) || '—' : '—' }}</strong></span><i class="bi bi-arrow-right" aria-hidden="true"></i></div>
                </router-link>
            </div>
        </div>
    </div>
</template>
<!-- --------- конец нового кода chat -->

<script setup>
// --------- новый код chat: активные договоры по умолчанию при каждом открытии страницы
import { computed, onMounted, ref } from 'vue';
import api from '../../../api';
import { formatDateStr } from '../../../utils/date';

const agreements = ref([]);
const search = ref('');
const status = ref('Активный');
const loading = ref(false);
const errorMessage = ref('');
const normalize = value => String(value ?? '').toLocaleLowerCase('ru-RU').replaceAll('ё', 'е');
const filteredAgreements = computed(() => {
    const query = normalize(search.value.trim());
    return agreements.value.filter(agreement => {
        if (status.value && agreement.status !== status.value) return false;
        return !query || [agreement.name, agreement.short_name, agreement.number, agreement.customer, agreement.address]
            .some(value => normalize(value).includes(query));
    });
});

const GetAllAgreementsHandler = async() => {
    if (loading.value) return;
    loading.value = true; errorMessage.value = '';
    try {
        const res = await api.get('/agreements');
        agreements.value = res.data || [];
    } catch (err) {
        errorMessage.value = 'Не удалось загрузить договоры. Повторите попытку.';
    } finally {
        loading.value = false;
    }
};
onMounted(GetAllAgreementsHandler);
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: компактные карточки и единая панель фильтров */
.agreements-page { padding-top: 20px; padding-bottom: 24px; color: #000; font-size: 14px; }
.agreements-heading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 18px; }
.agreements-heading h1 { font-size: 22px; font-weight: 600; margin: 0 0 6px; }
.agreements-heading p { margin: 0; font-size: 13px; color: #495057; }
.agreements-page .btn { font-size: 14px; }
.agreements-filters { display: flex; align-items: end; flex-wrap: wrap; gap: 12px; padding: 14px 16px; background: #fff; border: 1px solid var(--bs-border-color); border-radius: 12px; margin-bottom: 18px; }
.agreements-filters .form-label { font-size: 13px; font-weight: 600; margin-bottom: 5px; }
.agreements-search { flex: 1; min-width: 230px; }
.agreements-search-field { position: relative; }
.agreements-search-field > i { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.agreements-search-field input { padding-left: 32px; }
.agreements-status-filter { width: 180px; }
.agreements-filters .form-control, .agreements-filters .form-select { font-size: 13px; min-height: 34px; }
.agreements-count { font-size: 13px; padding-bottom: 7px; min-width: 90px; }
.agreement-card { display: flex; flex-direction: column; height: 100%; padding: 16px; background: #fff; border: 1px solid var(--bs-border-color); border-radius: 12px; text-decoration: none; color: #000; transition: border-color .15s ease, box-shadow .15s ease; }
.agreement-card:hover { color: #000; border-color: #86b7fe; box-shadow: 0 4px 14px #0000000a; }
.agreement-card:focus-visible { outline: 2px solid var(--bs-primary); outline-offset: 3px; }
.agreement-card-heading { display: flex; align-items: flex-start; gap: 10px; justify-content: space-between; margin-bottom: 10px; }
.agreement-card-heading h2 { font-size: 16px; font-weight: 600; line-height: 1.4; margin: 0; overflow-wrap: anywhere; }
.agreement-status { flex-shrink: 0; padding: 3px 9px; font-size: 11px; line-height: 1.4; border-radius: 50rem; background: #f1f3f5; color: #343a40; }
.agreement-status-active { background: #e8f5ed; color: #146c43; }
.agreement-full-name { font-size: 13px; line-height: 1.45; margin: 0 0 14px; overflow-wrap: anywhere; }
.agreement-info { display: grid; gap: 9px; margin: 0 0 16px; }
.agreement-info > div { display: grid; grid-template-columns: 75px minmax(0, 1fr); gap: 8px; }
.agreement-info dt { font-size: 12px; font-weight: 400; color: #495057; }
.agreement-info dd { margin: 0; font-size: 13px; overflow-wrap: anywhere; }
.agreement-card-footer { display: flex; justify-content: space-between; gap: 8px; border-top: 1px solid var(--bs-border-color); padding-top: 12px; margin-top: auto; font-size: 12px; }
.agreement-card-footer > i { color: var(--bs-primary); }
.agreements-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 36px 16px; border: 1px dashed var(--bs-border-color); border-radius: 12px; background: #fff; text-align: center; }
.agreements-empty > i { font-size: 26px; color: #495057; }
.agreements-empty > span { font-size: 13px; }
@media (max-width: 575px) {
    .agreements-page { padding-top: 12px; }
    .agreements-search { min-width: 0; flex-basis: 100%; }
    .agreements-status-filter { flex: 1; }
    .agreements-filters { padding: 12px; }
}
/* --------- конец нового кода chat */
</style>
