<!-- --------- новый код chat: расходники всех договоров и отдельного договора -->
<template>
    <div class="consumables-page">
        <div class="row g-2 align-items-center mb-3">
            <div class="col-12 col-xl"><input v-model="search" type="search" class="form-control form-control-sm" placeholder="Поиск по наименованию" aria-label="Поиск расходника"></div>
            <div v-if="isGlobal" class="col-6 col-xl-2"><select v-model="agreementFilter" class="form-select form-select-sm" aria-label="Фильтр договора"><option value="">Все договоры</option><option value="none">Не указан</option><option v-for="item in agreements" :key="item.ID" :value="String(item.ID)">{{ agreementLabel(item.ID) }}</option></select></div>
            <div class="col-6 col-xl-2"><select v-model="categoryFilter" class="form-select form-select-sm" aria-label="Фильтр категории"><option value="">Все категории</option><option value="none">Не указана</option><option v-for="item in categories" :key="item.ID" :value="String(item.ID)">{{ item.name }}</option></select></div>
            <div class="col-12 col-xl-auto d-flex gap-2 justify-content-end flex-wrap">
                <button class="btn btn-outline-primary btn-sm" :disabled="loading || deleting || !referencesReady" @click="editor.open()"><i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Добавить расходник</button>
            </div>
        </div>
        <div v-if="error" class="alert alert-danger" role="alert">{{ error }} <button class="btn btn-sm btn-outline-danger ms-2" :disabled="loading" @click="load">Повторить</button></div>
        <div v-if="loading" class="py-2" role="status">Загружаем расходники…</div>
        <!-- новый код chat: оформление и пропорции таблицы как в инструментах -->
        <div class="col-12 table-responsive consumables-table-wrap">
            <table class="table table-sm align-middle mb-0 consumables-table">
                <!-- новый код chat: сокращённый заголовок количества -->
                <thead><tr><th class="text-center">№</th><th class="name-column">Наименование</th><th>Дата добавления</th><th class="text-end">Кол-во</th><th v-if="isGlobal">Договор</th><th>Категория</th><th></th></tr></thead>
                <tbody>
                    <tr v-for="(row,index) in filtered" :key="row.ID">
                        <td class="text-center">{{ index + 1 }}</td><td class="name-column">{{ row.name }}</td><td>{{ dateLabel(row.added_date) }}</td><td class="text-end">{{ Number(row.quantity).toLocaleString('ru-RU') }}</td>
                        <td v-if="isGlobal"><router-link v-if="row.agreement_id" :to="{name:'agreement',params:{id:row.agreement_id}}">{{ agreementLabel(row.agreement_id) }}</router-link><span v-else>—</span></td>
                        <td><span v-if="row.category_id" class="category-tag">{{ categoryLabel(row.category_id) }}</span><span v-else>—</span></td>
                        <td><div class="dropdown">
                            <button type="button" class="btn btn-sm border-0" data-bs-toggle="dropdown" aria-label="Действия с расходником" :disabled="loading || deleting" @focus="prepareMenu" @click="prepareMenu"><i class="bi bi-three-dots-vertical" aria-hidden="true"></i></button>
                            <ul class="dropdown-menu dropdown-menu-end"><li><button class="dropdown-item" :disabled="!referencesReady" @click="editor.open(row)">Изменить</button></li><li><button class="dropdown-item text-danger" @click="remove(row)">Удалить</button></li></ul>
                        </div></td>
                    </tr>
                    <tr v-if="!loading && !filtered.length"><td :colspan="isGlobal ? 7 : 6" class="text-center py-4">Расходники не найдены</td></tr>
                </tbody>
            </table>
        </div>
        <!-- новый код chat: управление категориями внутри формы расходника -->
        <ConsumableModal :key="'editor-'+route.fullPath" ref="editor" :agreement-id="isGlobal ? null : route.params.id" :agreements="agreements" :categories="categories" @saved="load" @categories-changed="categoriesChanged" />
    </div>
</template>
<script setup>
// --------- новый код chat: фильтрация, справочники, удаление и обновление данных
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { Dropdown } from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import api from '../../../api';
import ConsumableModal from './ConsumableModal.vue';
const route = useRoute();
const isGlobal = computed(() => route.meta.mtrGlobal === true);
const rows = ref([]), agreements = ref([]), categories = ref([]);
const search = ref(''), agreementFilter = ref(''), categoryFilter = ref('');
const loading = ref(false), deleting = ref(false), referencesReady = ref(false), error = ref('');
const editor = ref(null); // новый код chat: окно категорий находится в форме
let version = 0;
const menus = new Set();
const clearMenus = () => { menus.forEach(menu => menu.dispose()); menus.clear(); };
const prepareMenu = event => menus.add(Dropdown.getOrCreateInstance(event.currentTarget,{boundary:'viewport',popperConfig:config=>({...config,strategy:'fixed'})}));
const agreementLabel = id => { const item = agreements.value.find(row => Number(row.ID) === Number(id)); return item?.short_name || item?.name || `Договор № ${id}`; };
const categoryLabel = id => categories.value.find(row => Number(row.ID) === Number(id))?.name || 'Категория недоступна';
const dateLabel = date => date ? date.split('-').reverse().join('.') : '—';
const errorText = err => typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось выполнить запрос.';
const filtered = computed(() => {
    const query = search.value.trim().toLocaleLowerCase('ru-RU');
    return rows.value.filter(row => (!query || row.name.toLocaleLowerCase('ru-RU').includes(query))
        && (!isGlobal.value || !agreementFilter.value || (agreementFilter.value === 'none' ? !row.agreement_id : String(row.agreement_id) === agreementFilter.value))
        && (!categoryFilter.value || (categoryFilter.value === 'none' ? !row.category_id : String(row.category_id) === categoryFilter.value)));
});
const load = async() => {
    const current = ++version; loading.value = true; error.value = ''; referencesReady.value = false;
    const results = await Promise.allSettled([
        api.get(isGlobal.value ? '/consumables' : `/agreements/${route.params.id}/consumables`),
        api.get('/agreements'), api.get('/consumable-categories'),
    ]);
    if (current !== version) return;
    clearMenus();
    rows.value = results[0].status === 'fulfilled' ? (results[0].value.data || []).sort((a,b)=>a.name.localeCompare(b.name,'ru',{numeric:true,sensitivity:'base'}) || a.ID-b.ID) : [];
    agreements.value = results[1].status === 'fulfilled' ? results[1].value.data || [] : [];
    categories.value = results[2].status === 'fulfilled' ? results[2].value.data || [] : [];
    agreements.value.sort((a,b)=>(a.short_name || a.name || '').localeCompare(b.short_name || b.name || '', 'ru'));
    categories.value.sort((a,b)=>a.name.localeCompare(b.name,'ru'));
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length) error.value = failures.map(result=>errorText(result.reason)).join(' ');
    referencesReady.value = results[1].status === 'fulfilled' && results[2].status === 'fulfilled';
    loading.value = false;
};
const categoriesChanged = updated => {
    categories.value = updated;
    if (categoryFilter.value && categoryFilter.value !== 'none' && !updated.some(row=>String(row.ID)===categoryFilter.value)) categoryFilter.value = '';
};
const remove = async row => {
    if (deleting.value || !window.confirm(`Удалить расходник «${row.name}»?`)) return;
    const current = version; deleting.value = true; error.value = '';
    try {
        await api.delete(`/consumables/${row.ID}`);
        if (current !== version) return;
        clearMenus(); rows.value = rows.value.filter(item=>item.ID!==row.ID);
    } catch(err) { if (current === version) error.value = errorText(err); }
    finally { deleting.value = false; }
};
watch(()=>route.fullPath,()=>{
    rows.value=[];search.value='';agreementFilter.value='';categoryFilter.value='';
    load();
},{immediate:true});
onBeforeUnmount(()=>{ version++; clearMenus(); });
// --------- конец нового кода chat
</script>
<style scoped>
/* --------- новый код chat: оформление как у списка инструментов */
.consumables-page { font-size: 14px; color: #000; }
.form-control, .form-select, .btn { font-size: 13px; }
.consumables-table-wrap { border: 1px solid var(--bs-border-color); border-radius: 8px; }
/* новый код chat: размеры колонок, заголовков и тегов совпадают со списком инструментов */
.consumables-table { width: 100%; }
.consumables-table th { font-size: 12px; font-weight: 600; white-space: nowrap; background: #f8f9fa; }
.consumables-table td, .consumables-table th { padding: 8px; white-space: nowrap; width: 1%; }
.consumables-table .name-column { width: 33.333333%; min-width: 240px; white-space: normal; overflow-wrap: anywhere; }
.category-tag { display: inline-block; border: 1px solid var(--bs-border-color); border-radius: 50rem; background: #f1f4f8; padding: 3px 6px; font-size: 10px; line-height: 1.3; white-space: nowrap; }
.dropdown-menu { font-size: 14px; }
/* --------- конец нового кода chat */
</style>
<!-- --------- конец нового кода chat -->
