<!-- --------- новый код chat: список СИЗ в общем МТР и внутри договора -->
<template>
    <div class="ppe-page">
        <div class="row g-2 align-items-center mb-3">
            <div class="col-12 col-xl"><input v-model="search" type="search" class="form-control form-control-sm" placeholder="Поиск по наименованию" aria-label="Поиск СИЗ"></div>
            <div class="col-6 col-md-3 col-xl-2"><select v-model="sizeFilter" class="form-select form-select-sm" aria-label="Размер"><option value="">Все размеры</option><option value="none">Не указан</option><option v-for="size in sizes" :key="size" :value="'size:'+size">{{ size }}</option></select></div>
            <div class="col-6 col-md-3 col-xl-2"><select v-model="categoryFilter" class="form-select form-select-sm" aria-label="Категория"><option value="">Все категории</option><option v-for="(label,key) in categoryLabels" :key="key" :value="key">{{ label }}</option></select></div>
            <div class="col-12 col-md-6 col-xl-2"><MultiSelect v-model="employeeFilter" :options="employeeOptions" :multiple="true" :plain-selection="true" label-key="label" search-key="search" placeholder="Все сотрудники" search-placeholder="Поиск по ФИО" /></div>
            <div v-if="isGlobal" class="col-12 col-md-6 col-xl-2"><select v-model="agreementFilter" class="form-select form-select-sm" aria-label="Договор"><option value="">Все договоры</option><option v-for="agreement in agreements" :key="agreement.ID" :value="String(agreement.ID)">{{ agreementLabel(agreement.ID) }}</option></select></div>
            <div class="col-12 col-xl-auto d-flex justify-content-end"><button class="btn btn-outline-primary btn-sm" :disabled="loading || deleting || !referencesReady" @click="editor.open()"><i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Добавить СИЗ</button></div>
        </div>
        <div v-if="error" class="alert alert-danger" role="alert">{{ error }} <button class="btn btn-sm btn-outline-danger ms-2" :disabled="loading" @click="load">Повторить</button></div>
        <div v-if="loading" class="py-2" role="status">Загружаем СИЗ…</div>
        <!-- новый код chat: оформление таблицы по аналогии с инструментами -->
        <div class="col-12 table-responsive ppe-table-wrap">
            <table class="table table-sm align-middle mb-0 ppe-table">
                <thead><tr><th class="text-center">№</th><th class="name-column">Наименование</th><th>Размер</th><th>Категория</th><th v-if="isGlobal">Договор</th><th>Ответственный</th><th class="text-end">Цена, ₽</th><th></th></tr></thead>
                <tbody>
                    <tr v-for="(row,index) in filtered" :key="row.ID">
                        <td class="text-center">{{ index+1 }}</td><td class="name-column">{{ row.name }}</td><td>{{ row.size || '—' }}</td><td><span class="category-tag">{{ categoryLabels[row.category] || '—' }}</span></td>
                        <td v-if="isGlobal"><router-link :to="{name:'agreement',params:{id:row.agreement_id}}">{{ agreementLabel(row.agreement_id) }}</router-link></td>
                        <td><router-link v-if="row.employee_card" :to="{name:'employee-card-detail',params:{id:row.employee_card_id}}">{{ shortName(row.employee_card) }}</router-link><span v-else>—</span></td>
                        <td class="text-end">{{ money(row.price_kopecks) }}</td>
                        <td><div class="dropdown">
                            <button type="button" class="btn btn-sm border-0" data-bs-toggle="dropdown" aria-label="Действия с СИЗ" :disabled="loading || deleting" @focus="prepareMenu" @click="prepareMenu"><i class="bi bi-three-dots-vertical" aria-hidden="true"></i></button>
                            <ul class="dropdown-menu dropdown-menu-end"><li><button class="dropdown-item" :disabled="!referencesReady" @click="editor.open(row)">Изменить</button></li><li><button class="dropdown-item text-danger" @click="remove(row)">Удалить</button></li></ul>
                        </div></td>
                    </tr>
                    <tr v-if="!loading && !filtered.length"><td :colspan="isGlobal?8:7" class="text-center py-4">СИЗ не найдены</td></tr>
                </tbody>
            </table>
        </div>
        <PpeModal :key="route.fullPath" ref="editor" :agreement-id="isGlobal?null:route.params.id" :agreements="agreements" :employees="employees" @saved="load" />
    </div>
</template>
<script setup>
// --------- новый код chat: фильтры по данным списка и общий выбор сотрудников
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { Dropdown } from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import api from '../../../api';
import MultiSelect from '../../MultiSelect.vue';
import PpeModal from './PpeModal.vue';
const route=useRoute();
const isGlobal=computed(()=>route.meta.mtrGlobal===true);
const rows=ref([]),agreements=ref([]),employees=ref([]);
const search=ref(''),sizeFilter=ref(''),categoryFilter=ref(''),agreementFilter=ref(''),employeeFilter=ref([]);
const loading=ref(false),deleting=ref(false),referencesReady=ref(false),error=ref(''),editor=ref(null);
const categoryLabels={summer:'Летняя',winter:'Зимняя',demiseason:'Демисезонная'};
let version=0;
const menus=new Set();
const clearMenus=()=>{menus.forEach(menu=>menu.dispose());menus.clear();};
const prepareMenu=event=>menus.add(Dropdown.getOrCreateInstance(event.currentTarget,{boundary:'viewport',popperConfig:config=>({...config,strategy:'fixed'})}));
const fullName=employee=>[employee.surname,employee.name,employee.middle_name].filter(Boolean).join(' ');
const shortName=employee=>[employee.surname,employee.name?.[0]?employee.name[0]+'.':'',employee.middle_name?.[0]?employee.middle_name[0]+'.':''].filter(Boolean).join(' ')||'—';
const agreementLabel=id=>{const item=agreements.value.find(row=>Number(row.ID)===Number(id));return item?.short_name||item?.name||`Договор № ${id}`;};
const money=value=>{const cents=BigInt(value||0);return `${(cents/100n).toLocaleString('ru-RU')},${String(cents%100n).padStart(2,'0')}`;};
const sizes=computed(()=>[...new Set(rows.value.map(row=>row.size).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru',{numeric:true})));
const employeeOptions=computed(()=>{
    const selected=new Map();
    for(const row of rows.value)if(row.employee_card)selected.set(String(row.employee_card_id),{ID:String(row.employee_card_id),label:shortName(row.employee_card),search:fullName(row.employee_card)});
    return [{ID:'none',label:'Не закреплён',search:''},...[...selected.values()].sort((a,b)=>a.label.localeCompare(b.label,'ru'))];
});
const filtered=computed(()=>{
    const query=search.value.trim().toLocaleLowerCase('ru-RU');
    return rows.value.filter(row=>(!query||row.name.toLocaleLowerCase('ru-RU').includes(query))
        &&(!sizeFilter.value||(sizeFilter.value==='none'?!row.size:'size:'+row.size===sizeFilter.value))
        &&(!categoryFilter.value||row.category===categoryFilter.value)
        &&(!isGlobal.value||!agreementFilter.value||String(row.agreement_id)===agreementFilter.value)
        &&(!employeeFilter.value.length||employeeFilter.value.includes(row.employee_card?String(row.employee_card_id):'none')));
});
const errorText=err=>typeof err.response?.data==='string'?err.response.data.trim():'Не удалось выполнить запрос.';
const load=async()=>{
    const current=++version;loading.value=true;referencesReady.value=false;error.value='';
    const results=await Promise.allSettled([api.get(isGlobal.value?'/ppe':`/agreements/${route.params.id}/ppe`),api.get('/agreements'),api.get('/employeecards')]);
    if(current!==version)return;
    clearMenus();
    rows.value=results[0].status==='fulfilled'?(results[0].value.data||[]).sort((a,b)=>a.name.localeCompare(b.name,'ru',{numeric:true,sensitivity:'base'})||a.ID-b.ID):[];
    agreements.value=results[1].status==='fulfilled'?results[1].value.data||[]:[];
    employees.value=results[2].status==='fulfilled'?results[2].value.data||[]:[];
    agreements.value.sort((a,b)=>(a.short_name||a.name||'').localeCompare(b.short_name||b.name||'','ru'));
    const failures=results.filter(result=>result.status==='rejected');
    if(failures.length)error.value=failures.map(result=>errorText(result.reason)).join(' ');
    referencesReady.value=results[1].status==='fulfilled'&&results[2].status==='fulfilled';loading.value=false;
};
const remove=async row=>{
    if(deleting.value||!window.confirm(`Удалить СИЗ «${row.name}»?`))return;
    const current=version;deleting.value=true;error.value='';
    try{await api.delete(`/ppe/${row.ID}`);if(current!==version)return;clearMenus();rows.value=rows.value.filter(item=>item.ID!==row.ID);}
    catch(err){if(current===version)error.value=errorText(err);}
    finally{deleting.value=false;}
};
watch(()=>route.fullPath,()=>{rows.value=[];search.value='';sizeFilter.value='';categoryFilter.value='';agreementFilter.value='';employeeFilter.value=[];load();},{immediate:true});
onBeforeUnmount(()=>{version++;clearMenus();});
// --------- конец нового кода chat
</script>
<style scoped>
/* новый код chat: таблица СИЗ в стиле инструментов */
.ppe-page { font-size:14px; color:#000; }
.form-control,.form-select,.btn { font-size:13px; }
.ppe-table-wrap { border:1px solid var(--bs-border-color); border-radius:8px; }
/* --------- новый код chat: пропорции колонок и компактные теги как в инструментах */
.ppe-table { width:100%; }
.ppe-table th { font-size:12px; font-weight:600; white-space:nowrap; background:#f8f9fa; }
.ppe-table td,.ppe-table th { padding:8px; white-space:nowrap; width:1%; }
.ppe-table .name-column { width:33.333333%; min-width:240px; white-space:normal; overflow-wrap:anywhere; }
.category-tag { display:inline-block; border:1px solid var(--bs-border-color); border-radius:50rem; background:#f1f4f8; padding:3px 6px; font-size:10px; line-height:1.3; white-space:nowrap; }
/* --------- конец нового кода chat */
.dropdown-menu { font-size:14px; }
</style>
<!-- --------- конец нового кода chat -->
