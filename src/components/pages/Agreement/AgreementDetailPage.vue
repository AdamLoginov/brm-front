<template>
    <!-- --------- новый код chat: обзор договора и быстрые переходы -->
    <div class="container-fluid py-3 agreement-detail">
        <router-link :to="{name: 'agreements'}" class="back-link"><i class="bi bi-arrow-left"></i> Договоры</router-link>
        <div v-if="errorMessage" class="alert alert-danger mt-3" role="alert">{{ errorMessage }}</div>
        <div v-if="loading" class="detail-panel p-4 mt-3 text-secondary" role="status">
            <span class="spinner-border spinner-border-sm me-2"></span>Загрузка договора…
        </div>
        <template v-else-if="agreement">
            <section class="detail-panel mt-3">
                <header class="agreement-heading">
                    <div class="heading-icon"><i class="bi bi-file-earmark-text"></i></div>
                    <div class="heading-title">
                        <div class="text-secondary small mb-1">Договор № {{ agreement.number || '—' }}</div>
                        <h1>{{ agreement.name }}</h1>
<!-- новый код chat: подпись завершённого договора -->
                        <span class="status-label mt-2">{{ ['Закончен', 'Законченный'].includes(agreement.status) ? 'Завершен' : agreement.status || 'Статус не указан' }}</span>
                    </div>
                    <div class="heading-actions">
                        <router-link :to="{name: 'agreement-update', params: {id: agreement.ID}}" class="btn btn-outline-primary btn-sm">
                            <i class="bi bi-pencil me-1"></i>Редактировать
                        </router-link>
                        <button class="btn btn-outline-danger btn-sm" title="Удалить договор" aria-label="Удалить договор" :disabled="deleting" @click="DeleteAgreementHandler(agreement.ID)">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </header>
                <dl class="agreement-facts">
                    <div><dt>Краткое наименование</dt><dd>{{ agreement.short_name || '—' }}</dd></div>
                    <div><dt>Заказчик</dt><dd>{{ agreement.customer || '—' }}</dd></div>
                    <div><dt>Адрес объекта</dt><dd>{{ agreement.address || '—' }}</dd></div>
                    <div><dt>Срок выполнения</dt><dd><i class="bi bi-calendar3 me-1 text-secondary"></i>{{ agreement.date_end ? formatDateStr(agreement.date_end) : '—' }}</dd></div>
                </dl>
            </section>

            <!-- новый код chat: общий блок с внутренним разделением групп -->
            <div class="detail-panel mt-3">
            <section v-for="group in navigationGroups" :key="group.title" class="navigation-group p-3">
                <h2 class="section-title mb-3">{{ group.title }}</h2>
                <nav class="quick-navigation" :aria-label="group.title">
                    <router-link v-for="item in group.items" :key="item.route" :to="{name: item.route, params: {id: agreement.ID}}" class="quick-link">
                        <i :class="['bi', item.icon]"></i><span>{{ item.label }}</span><i class="bi bi-chevron-right quick-arrow"></i>
                    </router-link>
                </nav>
            </section>
            </div>

            <div class="row g-3 mt-0">
                <div class="col-12">
                    <section class="detail-panel">
                        <header class="section-heading"><h2>Заказы <span class="count">{{ agreement.orders.length }}</span></h2><router-link :to="{name: 'orders', params: {id: agreement.ID}}">Все заказы <i class="bi bi-arrow-right"></i></router-link></header>
                        <div v-if="agreement.orders.length" class="table-responsive">
                            <table class="table detail-table mb-0">
                                <thead><tr><th>№</th><th>Статус</th><th>Дата</th><th>Поставщик</th><th>Email</th></tr></thead>
                                <tbody><tr v-for="order in recent(agreement.orders)" :key="order.ID">
                                    <td class="text-secondary">{{ order.ID }}</td>
                                    <td><span class="record-status" :class="order.is_paid ? 'text-success border-success' : order.status ? 'text-danger border-danger' : 'text-warning-emphasis border-warning'">{{ order.is_paid ? 'Оплачено' : order.status ? 'Счёт отсутствует' : 'Ожидание' }}</span></td>
                                    <td class="text-nowrap">{{ getOnlyDate(order.CreatedAt) }}</td>
                                    <td>{{ order.manager_card?.suppliers?.Name || '—' }}</td>
                                    <td>{{ order.manager_card?.email || '—' }}</td>
                                </tr></tbody>
                            </table>
                        </div>
                        <div v-else class="empty-state">Заказов пока нет</div>
                    </section>
                </div>
                <div class="col-12 col-lg-6">
                    <section class="detail-panel h-100">
                        <header class="section-heading"><h2>Инструменты <span class="count">{{ agreement.tools.length }}</span></h2><router-link :to="{name: 'agreement-tools', params: {id: agreement.ID}}">Все <i class="bi bi-arrow-right"></i></router-link></header>
                        <div v-for="tool in recent(agreement.tools)" :key="tool.ID" class="compact-row"><span class="record-number">{{ tool.ID }}</span><i class="bi bi-tools text-secondary"></i><span>{{ tool.name }}</span></div>
                        <div v-if="!agreement.tools.length" class="empty-state">Инструменты не добавлены</div>
                    </section>
                </div>
                <div class="col-12 col-lg-6">
                    <section class="detail-panel h-100">
                        <header class="section-heading"><h2>Сметы <span class="count">{{ agreement.estimate.length }}</span></h2><router-link :to="{name: 'estimates', params: {id: agreement.ID}}">Все <i class="bi bi-arrow-right"></i></router-link></header>
                        <router-link v-for="estimate in recent(agreement.estimate)" :key="estimate.ID" :to="{name: 'estimate-detail', params: {id: estimate.ID}}" class="compact-row estimate-link"><span class="record-number">{{ estimate.ID }}</span><i class="bi bi-file-earmark-spreadsheet text-secondary"></i><span>{{ estimate.name }}</span><i class="bi bi-chevron-right ms-auto"></i></router-link>
                        <div v-if="!agreement.estimate.length" class="empty-state">Сметы не добавлены</div>
                    </section>
                </div>
                <div class="col-12">
                    <section class="detail-panel">
                        <header class="section-heading"><h2>Расходы <span class="count">{{ agreement.expenses.length }}</span></h2><router-link :to="{name: 'expenses', params: {id: agreement.ID}}">Все расходы <i class="bi bi-arrow-right"></i></router-link></header>
                        <div v-if="agreement.expenses.length" class="table-responsive">
                            <table class="table detail-table mb-0">
                                <thead><tr><th>№</th><th>Дата</th><th>Счёт</th><th class="text-end">Сумма, ₽</th><th>Сотрудник</th><th>Описание</th></tr></thead>
                                <tbody><tr v-for="(expense, index) in recent(agreement.expenses)" :key="expense.ID">
                                    <td class="text-secondary">{{ index + 1 }}</td><td class="text-nowrap">{{ getOnlyDate(expense.CreatedAt) }}</td>
                                    <td><span class="record-status" :class="expense.account === 'company' ? 'border-success text-success' : expense.account === 'employee' ? 'border-primary text-primary' : 'border-secondary text-secondary'">{{ expense.account === 'company' ? 'Компании' : expense.account === 'employee' ? 'Личный' : 'Не указан' }}</span></td>
                                    <td class="text-end text-nowrap fw-medium">{{ money(expense.price) }}</td><td class="text-nowrap">{{ employeeName(expense.employee_card) }}</td><td>{{ expense.name }}</td>
                                </tr></tbody>
                            </table>
                        </div>
                        <div v-else class="empty-state">Расходов пока нет</div>
                    </section>
                </div>
            </div>
            <p class="small text-secondary mt-2 mb-0">В списках показаны последние пять записей.</p>
        </template>
    </div>
    <!-- --------- конец нового кода chat -->
</template>

<script setup>
    import { onMounted, ref } from 'vue';
    import api from '../../../api';
    import { useRoute, useRouter } from 'vue-router';
    import { formatDate, formatDateStr } from '../../../utils/date';

    const route = useRoute();
    const router = useRouter();
    const agreement = ref(null);

    // --------- новый код chat: состояния страницы и разделы договора
    const loading = ref(false);
    const deleting = ref(false);
    const errorMessage = ref('');
    const navigation = [
        {label: 'Книга наряд-заданий', route: 'agreement-work-orders', icon: 'bi-journal-text'}, // новый код chat
        {label: 'Склад', route: 'agreement-warehouse', icon: 'bi-box-seam'}, // новый код chat
        {label: 'Контакты', route: 'agreement-contacts', icon: 'bi-person-lines-fill'}, // новый код chat
        {label: 'Табель', route: 'agreement-timesheet-detail', icon: 'bi-calendar3'},
        {label: 'Суточные', route: 'agreement-daily-allowance', icon: 'bi-calendar-check'},
        {label: 'Начисления', route: 'agreement-salary-accruals', icon: 'bi-calculator'},
        {label: 'Авансы', route: 'agreement-salary-advances', icon: 'bi-wallet2'},
        {label: 'Премии', route: 'agreement-salary-bonuses', icon: 'bi-award'},
        {label: 'Штрафы', route: 'agreement-salary-penalties', icon: 'bi-exclamation-circle'},
        {label: 'Долги', route: 'agreement-salary-debts', icon: 'bi-arrow-left-right'},
        {label: 'Расходы', route: 'expenses', icon: 'bi-receipt'},
    ];
    // --------- новый код chat: работа, контакты и расчёты разделены по назначению
    const workRoutes = ['agreement-work-orders', 'agreement-warehouse'];
    const navigationGroups = [
        {title: 'Работы и склад', items: navigation.filter(item => workRoutes.includes(item.route))},
        {title: 'Контакты', items: navigation.filter(item => item.route === 'agreement-contacts')},
        {title: 'Табель и расчёты', items: navigation.filter(item => !workRoutes.includes(item.route) && item.route !== 'agreement-contacts')},
    ];
    // --------- конец нового кода chat
    const recent = (items) => [...items].reverse().slice(0, 5);
    const money = (value) => Number(value || 0).toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    const employeeName = (employee) => employee
        ? [employee.surname, employee.name?.[0] ? employee.name[0] + '.' : '', employee.middle_name?.[0] ? employee.middle_name[0] + '.' : ''].filter(Boolean).join(' ') || '—'
        : '—';

    const GetAgreementHandler = async () => {
        loading.value = true;
        errorMessage.value = '';
        try {
            const res = await api.get(`/agreements/${route.params.id}`);
            agreement.value = {
                ...res.data,
                expenses: res.data.expenses || [],
                tools: res.data.tools || [],
                estimate: res.data.estimate || [],
                orders: res.data.orders || [],
            };
        } catch (err) {
            errorMessage.value = 'Не удалось загрузить договор. Попробуйте обновить страницу.';
            console.error(err);
        } finally {
            loading.value = false;
        }
    };

    const DeleteAgreementHandler = async (id) => {
        if (deleting.value || !window.confirm('Удалить договор?')) return;
        deleting.value = true;
        errorMessage.value = '';
        try {
            await api.delete(`/agreements/delete/${id}`);
            router.push({name: 'agreements'});
        } catch (err) {
            errorMessage.value = 'Не удалось удалить договор. Попробуйте ещё раз.';
            console.error(err);
        } finally {
            deleting.value = false;
        }
    };
    // --------- конец нового кода chat

    const getOnlyDate = (time) => {
        try {
            const dateTime = formatDate(time);
            return dateTime.split(" ")[1];
        } catch (err) {
            return '—';
        }
    };

    onMounted(GetAgreementHandler);
</script>

<style scoped>
/* --------- новый код chat: компактный адаптивный обзор договора */
.agreement-detail { font-size: 13px; max-width: 1500px; }
.back-link { display: inline-flex; align-items: center; gap: 6px; text-decoration: none; color: var(--bs-secondary-color); }
.detail-panel { border: 1px solid var(--bs-border-color); border-radius: 10px; background: var(--bs-body-bg); overflow: hidden; }
.agreement-heading { display: flex; align-items: flex-start; gap: 14px; padding: 20px; }
.heading-icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 10px; background: rgba(var(--bs-primary-rgb), .08); color: var(--bs-primary); font-size: 22px; flex-shrink: 0; }
.heading-title { flex: 1; min-width: 0; }
.heading-title h1 { font-size: 20px; line-height: 1.4; margin: 0; overflow-wrap: anywhere; }
.heading-actions { display: flex; gap: 8px; flex-shrink: 0; }
.status-label { display: inline-block; border: 1px solid var(--bs-border-color); border-radius: 6px; padding: 3px 8px; font-size: 11px; }
.agreement-facts { display: grid; grid-template-columns: 1fr 1fr 1.4fr 1fr; gap: 20px; border-top: 1px solid var(--bs-border-color); padding: 16px 20px; margin: 0; }
.agreement-facts dt { font-size: 11px; font-weight: 400; color: var(--bs-secondary-color); margin-bottom: 5px; }
.agreement-facts dd { margin: 0; font-weight: 500; overflow-wrap: anywhere; }
.section-title, .section-heading h2 { font-size: 14px; font-weight: 600; margin: 0; }
.quick-navigation { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.navigation-group + .navigation-group { border-top: 1px solid var(--bs-border-color); } /* новый код chat: внутренние разделители общего блока */
.quick-link { display: flex; align-items: center; gap: 9px; padding: 11px 12px; border: 1px solid var(--bs-border-color); border-radius: 7px; color: var(--bs-body-color); text-decoration: none; transition: background .15s, border-color .15s; }
.quick-link > .bi:first-child { color: var(--bs-primary); font-size: 16px; }
.quick-arrow { margin-left: auto; font-size: 10px; color: var(--bs-secondary-color); }
.quick-link:hover { background: rgba(var(--bs-primary-rgb), .05); border-color: var(--bs-primary); }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 16px; border-bottom: 1px solid var(--bs-border-color); }
.section-heading a { font-size: 12px; text-decoration: none; white-space: nowrap; }
.count { display: inline-block; margin-left: 5px; padding: 2px 6px; border-radius: 5px; font-size: 11px; font-weight: 400; background: var(--bs-tertiary-bg); color: var(--bs-secondary-color); }
.detail-table th { font-size: 11px; font-weight: 500; color: var(--bs-secondary-color); background: var(--bs-tertiary-bg); white-space: nowrap; }
.detail-table th, .detail-table td { padding: 10px 16px; vertical-align: middle; }
.detail-table tbody tr:last-child td { border-bottom: 0; }
.record-status { display: inline-block; border: 1px solid; border-radius: 5px; padding: 3px 6px; font-size: 11px; white-space: nowrap; }
.empty-state { padding: 24px 16px; color: var(--bs-secondary-color); text-align: center; }
.compact-row { display: flex; align-items: center; gap: 10px; padding: 11px 16px; border-bottom: 1px solid var(--bs-border-color); overflow-wrap: anywhere; }
.compact-row:last-child { border-bottom: 0; }
.record-number { min-width: 24px; color: var(--bs-secondary-color); font-size: 11px; }
.estimate-link { text-decoration: none; color: var(--bs-body-color); }
.estimate-link:hover { background: var(--bs-tertiary-bg); color: var(--bs-primary); }
@media (max-width: 991px) {
    .agreement-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 575px) {
    .agreement-heading { flex-wrap: wrap; padding: 16px; }
    .heading-actions { width: 100%; }
    .heading-title h1 { font-size: 18px; }
    .agreement-facts { grid-template-columns: 1fr; gap: 12px; padding: 16px; }
    .quick-navigation { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .quick-link { padding: 10px 8px; gap: 6px; }
    .detail-table th, .detail-table td { padding: 9px 12px; }
}
/* --------- конец нового кода chat */
</style>
