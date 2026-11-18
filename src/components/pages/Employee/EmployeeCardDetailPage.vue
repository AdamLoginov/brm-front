<template>
  <!-- --------- новый код chat: карточка сотрудника в стиле форм создания и редактирования -->
  <div class="container-fluid employee-detail-page py-3">
    <router-link :to="{name: 'employee-cards'}" class="employee-back-link"><i class="bi bi-arrow-left" aria-hidden="true"></i> Сотрудники</router-link>
    <div v-if="errorMessage" class="alert alert-danger mt-3" role="alert">{{ errorMessage }}</div>
    <div v-if="loading" class="employee-panel p-4 mt-3 text-secondary" role="status"><span class="spinner-border spinner-border-sm me-2"></span>Загрузка карточки…</div>
    <template v-else-if="employeeCard">
      <!-- --------- новый код chat: крупный портрет слева и плотная сетка данных справа -->
      <div class="employee-overview mt-3">
        <aside class="employee-profile-column">
<header class="employee-panel employee-profile-header">
        <a v-if="avatarDocument && avatarUrl" :href="documentFileUrl(avatarDocument.ID)" @click.prevent="openDocument(avatarDocument)" target="_blank" rel="noopener" class="employee-avatar" aria-label="Открыть фото сотрудника">
          <img :src="avatarUrl" alt="Фото сотрудника" @error="avatarUrl = null">
        </a>
        <div v-else class="employee-avatar employee-avatar-empty"><i class="bi bi-person" aria-hidden="true"></i><span>Нет фото</span></div>
        <div class="employee-profile-title">
          <div class="employee-eyebrow">Карточка сотрудника</div>
          <h1>{{ fullName }}</h1>
          <p>{{ employeeCard.profession || 'Должность не указана' }}</p>
          <div class="d-flex flex-wrap gap-2">
            <span class="employee-badge" :class="employeeCard.status ? 'text-danger border-danger' : 'text-success border-success'">{{ employeeCard.status ? 'Уволен' : 'Работает' }}</span>
            <span v-if="employeeCard.is_itr" class="employee-badge text-primary border-primary">ИТР</span>
            <span class="employee-badge text-secondary">{{ employeeCard.officially_employed ? 'Устроен официально' : 'Не устроен официально' }}</span>
          </div>
        </div>
        <router-link :to="{name: 'employee-card-update', params: {id: route.params.id}}" class="btn btn-primary btn-sm employee-edit-button"><i class="bi bi-pencil me-1" aria-hidden="true"></i>Редактировать</router-link>
      </header>


        </aside>
        <div class="employee-main-column">
          <div class="employee-information-grid">
            <!-- новый код chat: работа слева, личные данные справа -->
<section class="employee-panel">
            <div class="employee-panel-heading"><span class="employee-section-icon"><i class="bi bi-briefcase" aria-hidden="true"></i></span><h2>Работа и оплата</h2></div>
            <dl class="employee-work-group">
              <div><dt>Должность</dt><dd>{{ employeeCard.profession || '—' }}</dd></div>
              <div><dt>Специализации</dt><dd class="d-flex flex-wrap gap-2">
                <span v-for="item in employeeCard.specializations || []" :key="item.ID" class="employee-specialization">{{ item.name }}</span>
                <span v-if="!employeeCard.specializations?.length">—</span>
              </dd></div>
              <!-- новый код chat: информационная плашка статуса -->
              <div class="employee-status-card">
                <dt><i class="bi bi-person-badge" aria-hidden="true"></i><span>Сотрудник ИТР</span></dt>
                <dd class="employee-status-value" :class="employeeCard.is_itr ? 'text-success border-success' : 'text-secondary'">
                  <i :class="employeeCard.is_itr ? 'bi bi-check2' : 'bi bi-dash'" aria-hidden="true"></i>{{ employeeCard.is_itr ? 'Да' : 'Нет' }}
                </dd>
              </div>
            </dl>
            <dl class="employee-work-group">
              <div><dt>Договор</dt><dd><router-link v-if="employeeCard.agreement_id" :to="{name: 'agreement', params: {id: employeeCard.agreement_id}}">{{ employeeCard.agreement?.name || 'Договор № ' + employeeCard.agreement_id }}<i class="bi bi-arrow-up-right ms-1" aria-hidden="true"></i></router-link><span v-else class="text-secondary">Не закреплён за договором</span></dd></div>
              <div><dt>Начало работы</dt><dd>{{ displayDate(employeeCard.start_date) }}</dd></div>
            </dl>
            <dl class="employee-work-group">
              <div><dt>Ставка за смену</dt><dd class="employee-money">{{ salaryRate }}</dd></div>
              <!-- --------- новый код chat: официальный статус и зарплата в общей строке -->
              <div class="employee-status-card employee-employment-summary">
                <dt><i class="bi bi-shield-check" aria-hidden="true"></i><span>Устроен официально</span></dt>
                <dd class="employee-status-value" :class="employeeCard.officially_employed ? 'text-success border-success' : 'text-secondary'">
                  <i :class="employeeCard.officially_employed ? 'bi bi-check2' : 'bi bi-dash'" aria-hidden="true"></i>{{ employeeCard.officially_employed ? 'Да' : 'Нет' }}
                </dd>
                <template v-if="employeeCard.officially_employed">
                  <dt class="employee-monthly-label">ЗП в месяц</dt>
                  <dd class="employee-monthly-value">{{ money((employeeCard.monthly_salary_kopecks || 0) / 100) }}</dd>
                </template>
              </div>
              <!-- --------- конец нового кода chat -->
            </dl>
          </section>
            <div class="employee-personal-column">
<section class="employee-panel">
            <div class="employee-panel-heading"><span class="employee-section-icon"><i class="bi bi-person" aria-hidden="true"></i></span><h2>Личные данные</h2></div>
            <dl class="employee-data-grid">
              <div><dt>Дата рождения</dt><dd>{{ displayDate(employeeCard.date_of_birth) }}</dd></div>
              <div><dt>Город проживания</dt><dd>{{ employeeCard.place_of_residence || '—' }}</dd></div>
              <div><dt>Семейное положение</dt><dd>{{ employeeCard.marital_status || '—' }}</dd></div>
              <div><dt>Образование</dt><dd>{{ employeeCard.education || '—' }}</dd></div>
              <div><dt>Опыт работы</dt><dd>{{ employeeCard.experience || '—' }}</dd></div>
            </dl>
          </section>
<!-- новый код chat: контакты в группе личных данных -->
<section class="employee-panel">
            <div class="employee-panel-heading"><span class="employee-section-icon"><i class="bi bi-telephone" aria-hidden="true"></i></span><h2>Контакты</h2></div>
            <dl class="employee-data-grid employee-data-grid-two">
              <div><dt>Телефоны</dt><dd>
                <div v-for="(phone, index) in phones" :key="index" class="employee-phone"><a :href="'tel:' + phone.replace(/[^+0-9]/g, '')">{{ phone }}<i class="bi bi-telephone ms-2" aria-hidden="true"></i></a></div>
                <span v-if="!phones.length">—</span>
              </dd></div>
              <div><dt>Электронная почта</dt><dd><a v-if="employeeCard.email" :href="'mailto:' + employeeCard.email">{{ employeeCard.email }}<i class="bi bi-envelope ms-2" aria-hidden="true"></i></a><span v-else>—</span></dd></div>
            </dl>
          </section>
<section class="employee-panel">
            <div class="employee-panel-heading"><span class="employee-section-icon"><i class="bi bi-person-vcard" aria-hidden="true"></i></span><h2>Паспорт и СНИЛС</h2></div>
            <dl class="employee-data-grid">
              <div><dt>Серия паспорта</dt><dd>{{ employeeCard.pasport_serial || '—' }}</dd></div>
              <div><dt>Номер паспорта</dt><dd>{{ employeeCard.pasport_number || '—' }}</dd></div>
              <div><dt>СНИЛС</dt><dd>{{ employeeCard.snils || '—' }}</dd></div>
            </dl>
          </section>
<section class="employee-panel">
            <div class="employee-panel-heading"><span class="employee-section-icon"><i class="bi bi-person-bounding-box" aria-hidden="true"></i></span><h2>Рабочая одежда</h2></div>
            <dl class="employee-data-grid">
              <div><dt>Размер одежды</dt><dd>{{ employeeCard.clothing_size || '—' }}</dd></div>
              <div><dt>Размер обуви</dt><dd>{{ employeeCard.shoe_size || '—' }}</dd></div>
              <div><dt>Рост</dt><dd>{{ employeeCard.height_cm ? employeeCard.height_cm + ' см' : '—' }}</dd></div>
            </dl>
          </section>
            </div>
          </div>
<section class="employee-panel employee-documents">
            <div class="employee-panel-heading employee-documents-heading">
              <div class="d-flex align-items-center gap-2"><span class="employee-section-icon"><i class="bi bi-files" aria-hidden="true"></i></span><h2>Документы</h2><span class="employee-document-count">{{ documents.length }}</span></div>
              <router-link :to="{name: 'employee-card-document-create', params: {id: route.params.id}}" class="btn btn-outline-primary btn-sm"><i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Добавить документ</router-link>
            </div>
            <div v-if="documents.length" class="table-responsive">
              <table class="table employee-document-table mb-0">
                <thead><tr><th class="text-center">№</th><th>Документ</th><th>Файл</th><th>Добавлен</th><th><span class="visually-hidden">Действия</span></th></tr></thead>
                <tbody><tr v-for="(document, index) in documents" :key="document.ID">
                  <td class="text-center text-secondary">{{ index + 1 }}</td>
                  <td>{{ document.category_document_card?.category_name || 'Без категории' }}</td>
                  <td><a :href="documentFileUrl(document.ID)" target="_blank" rel="noopener" class="employee-file-link" @click.prevent="openDocument(document)"><i class="bi bi-file-earmark-text" aria-hidden="true"></i><span>{{ document.file_name }}</span></a></td>
                  <td class="text-nowrap text-secondary">{{ displayDate(document.CreatedAt) }}</td>
                  <td class="text-end"><button type="button" class="btn btn-outline-danger btn-sm" :disabled="deletingID !== null" :aria-label="'Удалить документ ' + document.file_name" title="Удалить документ" @click="deleteEmployeeCardDocumentHandler(document.ID)"><span v-if="deletingID === document.ID" class="spinner-border spinner-border-sm" aria-hidden="true"></span><i v-else class="bi bi-trash" aria-hidden="true"></i></button></td>
                </tr></tbody>
              </table>
            </div>
            <div v-else class="employee-empty-state"><i class="bi bi-folder2-open" aria-hidden="true"></i><span>Документы пока не добавлены</span></div>
          </section>
        </div>
      </div>
      <!-- --------- конец нового кода chat -->
    </template>
  </div>
  <!-- --------- конец нового кода chat -->
</template>

<script setup>
// --------- новый код chat: представление данных и состояния карточки
import { useRoute } from 'vue-router';
import api from '../../../api';
import { documentFileUrl, ensureFileAccess, openDocumentFile } from '../../../utils/fileAccess';
import { computed, onMounted, ref } from 'vue';
import { formatDateStr } from '../../../utils/date';

const route = useRoute();
const employeeCard = ref(null);
const avatarUrl = ref(null);
const loading = ref(true);
const errorMessage = ref('');
const deletingID = ref(null);
const documents = computed(() => employeeCard.value?.employee_documents || []);
const avatarDocument = computed(() => documents.value.filter(item => item.category_document_card?.category_name === 'Фото').at(-1));
const fullName = computed(() => [employeeCard.value?.surname, employeeCard.value?.name, employeeCard.value?.middle_name].filter(Boolean).join(' ') || 'Без имени');
const phones = computed(() => employeeCard.value?.phones?.length ? employeeCard.value.phones : (employeeCard.value?.phone ? [employeeCard.value.phone] : []));
const displayDate = value => value && !String(value).startsWith('0001-') ? formatDateStr(value) || '—' : '—';
const money = value => Number(value).toLocaleString('ru-RU', {style: 'currency', currency: 'RUB'});
const salaryRate = computed(() => {
  const raw = employeeCard.value?.salary_rate;
  if (!raw?.trim()) return '—';
  const number = Number(raw.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(number) ? money(number) : raw;
});

const getEmployeeCardDetailHandler = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const {data} = await api.get(`/employeescard/${route.params.id}/detail`);
    employeeCard.value = data;
    await getAvatarHandler();
  } catch (err) {
    errorMessage.value = 'Не удалось загрузить карточку сотрудника. Обновите страницу.';
  } finally {
    loading.value = false;
  }
};

const deleteEmployeeCardDocumentHandler = async id => {
  if (deletingID.value !== null || !window.confirm('Удалить документ сотрудника?')) return;
  deletingID.value = id;
  errorMessage.value = '';
  try {
    await api.delete(`/employeescard/document/${id}/delete`);
    employeeCard.value.employee_documents = documents.value.filter(item => item.ID !== id);
    await getAvatarHandler();
  } catch (err) {
    errorMessage.value = 'Не удалось удалить документ. Попробуйте ещё раз.';
  } finally {
    deletingID.value = null;
  }
};

const getAvatarHandler = async () => {
  avatarUrl.value = null;
  const document = avatarDocument.value;
  if (!document) return;
  try {
    await ensureFileAccess();
    avatarUrl.value = documentFileUrl(document.ID);
  } catch (err) {
    console.error(err);
  }
};
const openDocument = document => openDocumentFile(document.ID);
onMounted(getEmployeeCardDetailHandler);
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: единое оформление карточки с формами сотрудника */
.employee-detail-page { max-width: none; font-size: 14px; }
.employee-back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--bs-secondary-color); text-decoration: none; }
.employee-back-link:hover { color: var(--bs-primary); }
.employee-panel { border: 1px solid var(--bs-border-color); border-radius: 10px; padding: 18px; background: var(--bs-body-bg); }
.employee-profile-header { display: flex; flex-direction: column; align-items: stretch; gap: 18px; }
.employee-avatar { display: block; width: 258px; max-width: 100%; aspect-ratio: 258 / 318; height: auto; align-self: center; flex-shrink: 0; border-radius: 8px; overflow: hidden; }
.employee-avatar img { width: 100%; height: 100%; object-fit: cover; object-position: center top; }
.employee-avatar-empty { display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 5px; background: var(--bs-tertiary-bg); color: var(--bs-secondary-color); font-size: 12px; }
.employee-avatar-empty > i { font-size: 33px; }
.employee-profile-title { flex: 1; min-width: 0; }
.employee-eyebrow { color: var(--bs-secondary-color); font-size: 13px; margin-bottom: 4px; }
.employee-profile-title h1 { margin: 0 0 5px; font-size: 24px; font-weight: 600; overflow-wrap: anywhere; }
.employee-profile-title p { margin: 0 0 10px; color: var(--bs-secondary-color); font-size: 15px; }
/* новый код chat: компактные теги статуса, ИТР и официального трудоустройства */
.employee-badge { display: inline-block; border: 1px solid var(--bs-border-color); border-radius: 5px; padding: 2px 6px; font-size: 12px; line-height: 1.4; font-weight: 400; }
.employee-edit-button { flex-shrink: 0; width: 100%; padding: 8px 12px; }
/* --------- новый код chat: адаптивные колонки без ограничения ширины страницы */
.employee-overview { display: grid; grid-template-columns: 296px minmax(0, 1fr); align-items: start; gap: 16px; }
.employee-profile-column, .employee-main-column, .employee-personal-column { display: grid; gap: 16px; min-width: 0; }
.employee-information-grid { display: grid; grid-template-columns: minmax(300px, 1fr) minmax(0, 1.4fr); align-items: stretch; gap: 16px; }
.employee-main-column > .employee-documents { min-width: 0; }
@media (max-width: 1199px) {
  .employee-information-grid { grid-template-columns: 1fr; }
}
@media (max-width: 767px) {
  .employee-overview { grid-template-columns: 1fr; }
}
/* --------- конец нового кода chat */
.employee-panel-heading { display: flex; align-items: center; gap: 9px; margin-bottom: 18px; }
.employee-panel-heading h2 { margin: 0; font-size: 16px; font-weight: 600; }
.employee-section-icon { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; flex-shrink: 0; border-radius: 8px; color: var(--bs-primary); background: var(--bs-primary-bg-subtle); font-size: 16px; }
.employee-data-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px 16px; margin: 0; }
.employee-data-grid-two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
dt { font-size: 14px; font-weight: 500; color: var(--bs-secondary-color); margin-bottom: 5px; }
dd { margin: 0; font-size: 15px; overflow-wrap: anywhere; }
dd a, .employee-file-link { text-decoration: none; }
dd a:hover, .employee-file-link:hover { text-decoration: underline; }
.employee-phone + .employee-phone { margin-top: 6px; }
.employee-work-group { display: grid; gap: 16px; margin: 0; }
.employee-work-group + .employee-work-group { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--bs-border-color); }
/* --------- новый код chat: статусы в стиле блоков формы сотрудника */
.employee-status-card { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px; border-radius: 8px; background: var(--bs-tertiary-bg); }
.employee-status-card dt { display: flex; align-items: center; gap: 9px; margin: 0; color: var(--bs-body-color); }
.employee-status-card dt > i { color: var(--bs-primary); flex-shrink: 0; }
.employee-status-value { display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0; padding: 3px 7px; border: 1px solid var(--bs-border-color); border-radius: 6px; background: var(--bs-body-bg); font-size: 13px; }
/* --------- конец нового кода chat */
/* --------- новый код chat: компактная строка официальной оплаты с переносом на узких экранах */
.employee-employment-summary { flex-wrap: wrap; justify-content: flex-start; gap: 8px 10px; }
.employee-employment-summary .employee-monthly-label { margin-left: auto; padding-left: 10px; border-left: 1px solid var(--bs-border-color); }
.employee-monthly-value { font-size: 15px; font-weight: 500; white-space: nowrap; font-variant-numeric: tabular-nums; }
/* --------- конец нового кода chat */
.employee-specialization { font-size: 13px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--bs-border-color); }
.employee-money { font-size: 17px; font-weight: 500; font-variant-numeric: tabular-nums; }
.employee-documents { padding: 0; overflow: hidden; }
.employee-documents-heading { justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 16px 18px; margin: 0; }
.employee-document-count { border-radius: 5px; padding: 2px 6px; font-size: 13px; background: var(--bs-tertiary-bg); color: var(--bs-secondary-color); }
.employee-document-table { font-size: 15px; }
.employee-document-table th { font-size: 14px; font-weight: 500; background: var(--bs-tertiary-bg); color: var(--bs-secondary-color); white-space: nowrap; }
.employee-document-table td, .employee-document-table th { padding: 10px 16px; vertical-align: middle; }
.employee-document-table tr:last-child td { border-bottom: 0; }
.employee-document-table th:first-child { width: 44px; }
.employee-file-link { display: inline-flex; align-items: flex-start; gap: 8px; min-width: 160px; }
.employee-file-link span { overflow-wrap: anywhere; }
.employee-empty-state { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 28px 16px; color: var(--bs-secondary-color); border-top: 1px solid var(--bs-border-color); }
.employee-detail-page .btn { font-size: 15px; border-radius: 6px; }
/* --------- новый код chat: компактная правая группа, общий нижний край с блоком работы */
.employee-personal-column { gap: 10px; align-content: stretch; } /* новый код chat: блоки заполняют общую высоту соседней колонки */
.employee-personal-column > .employee-panel { padding: 12px 16px; }
.employee-personal-column .employee-panel-heading { margin-bottom: 10px; }
.employee-personal-column .employee-data-grid { gap: 10px 14px; }
.employee-personal-column dt { margin-bottom: 3px; }
.employee-personal-column .employee-phone + .employee-phone { margin-top: 4px; }
/* --------- конец нового кода chat */
@media (max-width: 767px) {
  .employee-profile-header { flex-wrap: wrap; gap: 12px; }
  .employee-profile-title h1 { font-size: 21px; }
  .employee-data-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }

}
@media (max-width: 575px) {
  .employee-panel { padding: 14px; }
  .employee-documents { padding: 0; }
  .employee-avatar { width: 258px; height: auto; }
  .employee-data-grid { grid-template-columns: 1fr; gap: 14px; }
  .employee-documents-heading { padding: 14px; }
}
/* --------- конец нового кода chat */
</style>
