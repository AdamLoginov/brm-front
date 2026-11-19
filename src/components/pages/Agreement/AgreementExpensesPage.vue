<template>
    <div> <!-- новый код chat: общая панель и контейнер находятся в AgreementSalaryPage -->
        <div v-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div> <!-- новый код chat -->

        <!-- --------- новый код chat: единый блок создания той же ширины, что фильтры и таблица -->
        <section class="expense-create border rounded-3 p-3 col-12" aria-labelledby="expense-create-title"> <!-- новый код chat: полная ширина -->
            <!-- новый код chat: доступное сворачивание без сброса введённых данных -->
            <h2 id="expense-create-title" class="expense-section-heading">
                <button type="button" class="expense-section-toggle" :aria-expanded="createExpanded" aria-controls="expense-create-body" @click="createExpanded = !createExpanded">
                    <i class="bi bi-pencil-square text-primary" aria-hidden="true"></i>
                    {{ editingExpenseID ? 'Изменить расход' : 'Новый расход' }}
                    <i class="bi ms-auto" :class="createExpanded ? 'bi-chevron-up' : 'bi-chevron-down'" aria-hidden="true"></i>
                </button>
            </h2>
            <form v-show="createExpanded" id="expense-create-body" class="pt-3" @submit.prevent="postExpensesHandler">
                <div class="row g-3 align-items-end">

                    <!-- новый код chat: дата расхода, включая прошлые и будущие дни -->
                    <div class="col-12 col-md-6 col-xl-2">
                        <label for="expense-create-date" class="form-label">Дата расхода</label>
                        <input id="expense-create-date" v-model="formData.expense_date" type="date" required class="form-control form-control-sm">
                    </div>
                    <div class="col-12 col-xl-6"> <!-- новый код chat: место для категории -->
                        <label for="expense-create-name" class="form-label">Наименование</label>
                        <input id="expense-create-name" v-model="formData.name" type="text" class="form-control form-control-sm" placeholder="На что потрачены средства">
                    </div>

                    <!-- новый код chat: необязательная категория расхода -->
                    <div class="col-12 col-md-6 col-xl-4">
                        <div id="expense-create-category-label" class="form-label">Категория</div>
                        <MultiSelect v-model="createCategorySelection" plain-selection :options="categoryOptions" :multiple="false" placeholder="Без категории" search-placeholder="Поиск категории" aria-labelledby="expense-create-category-label" /> <!-- новый код chat: обычный текст вместо тегов -->
                    </div>
                    <div class="col-12 col-md-6 col-xl-5"> <!-- новый код chat: поля второй строки занимают всю ширину -->
                        <!-- новый код chat: тот же поиск, что в фильтрах, с выбором одного сотрудника -->
                        <div id="expense-create-employee-label" class="form-label">Сотрудник</div>
                        <MultiSelect v-model="createEmployeeSelection" :options="managerCards || []" :label-key="createEmployeeLabel" :search-key="employeeSearchLabel" :multiple="false" placeholder="Выбрать сотрудника" search-placeholder="Поиск сотрудника" aria-labelledby="expense-create-employee-label" /> <!-- новый код chat: инициалы и поиск по полному ФИО -->
                    </div>

                    <div class="col-12 col-md-6 col-xl-4"> <!-- новый код chat: место для суммы и выражения -->
                        <label for="expense-amount" class="form-label">Сумма</label>
                        <MoneyInputComponent id="expense-amount" ref="amountInput" v-model="formData.price" allow-expressions required class="form-control form-control-sm" placeholder="1 000 или =500*2" title="Можно вводить формулы с =, операции +, -, *, / и скобки. Расчёт при выходе из поля." /> <!-- новый код chat: сумма с вычислением выражений -->
                    </div>

                    <div class="col-12 col-md-6 col-xl-3"> <!-- новый код chat: ширина счёта -->
                        <div id="expense-create-account-label" class="form-label">Счёт</div>
                        <MultiSelect v-model="createAccountSelection" plain-selection :options="accountOptions" :multiple="false" :searchable="false" placeholder="Не указан" aria-labelledby="expense-create-account-label" /> <!-- новый код chat: обычный текст вместо тегов -->
                    </div>
                    
                </div>
                <div class="expense-create-footer">
                    <span>В сумме можно использовать формулу, например =500*2.</span>
                    <!-- новый код chat: сохранение и отмена редактирования -->
                    <div class="d-flex gap-2 ms-auto">
                        <button v-if="editingExpenseID" class="btn btn-outline-secondary btn-sm" type="button" :disabled="isSubmit" @click="resetExpenseForm">Отмена</button>
                        <button type="button" class="btn btn-outline-secondary btn-sm" @click="categoryModal?.open()"><i class="bi bi-tags me-1" aria-hidden="true"></i>Категории расходов</button> <!-- новый код chat: рядом с добавлением, общий размер кнопок формы -->
                        <button class="btn btn-primary btn-sm" type="submit" :disabled="isSubmit">{{ isSubmit ? 'Сохранение…' : editingExpenseID ? 'Сохранить' : 'Добавить расход' }}</button>
                    </div>
                </div>
            </form>
        </section>
        <!-- --------- конец нового кода chat -->

        <!-- --------- новый код chat: фильтры расходов, применяются совместно без отправки формы -->
        <section class="expense-filters border rounded-3 p-3 mt-3 col-12" aria-label="Фильтры расходов"> <!-- новый код chat: полная ширина -->
            <!-- новый код chat: свёрнутые фильтры продолжают применяться -->
            <h2 class="expense-section-heading">
                <button type="button" class="expense-section-toggle" :aria-expanded="filtersExpanded" aria-controls="expense-filters-body" @click="filtersExpanded = !filtersExpanded">
                    <i class="bi bi-funnel text-primary" aria-hidden="true"></i>
                    Фильтры
                    <span v-if="hasExpenseFilters" class="badge rounded-pill text-bg-primary fw-normal">Применены</span>
                    <i class="bi ms-auto" :class="filtersExpanded ? 'bi-chevron-up' : 'bi-chevron-down'" aria-hidden="true"></i>
                </button>
            </h2>
            <div v-show="filtersExpanded" id="expense-filters-body" class="pt-3">
            <div class="row g-3 align-items-end">
                <div class="col-12 col-md-6 col-xl-4">
                    <label for="expense-search" class="form-label">Поиск по наименованию</label>
                    <input id="expense-search" v-model="filters.search" type="search" class="form-control form-control-sm" placeholder="Введите текст комментария">
                </div>
                <div class="col-12 col-md-6 col-xl-4">
                    <div id="expense-employees-label" class="form-label">Сотрудники</div>
                    <MultiSelect v-model="filters.employeeIDs" :options="expenseEmployees" label-key="label" search-key="searchLabel" placeholder="Все сотрудники" search-placeholder="Поиск сотрудника" aria-labelledby="expense-employees-label" /> <!-- новый код chat: инициалы и поиск по полному ФИО -->
                </div>
                <div class="col-6 col-md-3 col-xl-2">
                    <div id="expense-account-label" class="form-label">Счёт</div>
                    <MultiSelect v-model="filterAccountSelection" plain-selection :options="filterAccountOptions" :multiple="false" :searchable="false" placeholder="Все счета" aria-labelledby="expense-account-label" /> <!-- новый код chat: обычный текст вместо тегов -->
                </div>
                <div class="col-6 col-md-3 col-xl-2">
                    <div id="expense-status-label" class="form-label">Статус</div>
                    <MultiSelect v-model="filterStatusSelection" plain-selection :options="filterStatusOptions" :multiple="false" :searchable="false" placeholder="Все статусы" aria-labelledby="expense-status-label" /> <!-- новый код chat: аналогично выбору счёта -->
                </div>
                <div class="col-6 col-md-3 col-xl-2">
                    <label for="expense-date-from" class="form-label">Дата с</label>
                    <input id="expense-date-from" v-model="filters.from" type="date" class="form-control form-control-sm" :aria-invalid="invalidDateRange" aria-describedby="expense-date-error">
                </div>
                <div class="col-6 col-md-3 col-xl-2">
                    <label for="expense-date-to" class="form-label">Дата по</label>
                    <input id="expense-date-to" v-model="filters.to" type="date" class="form-control form-control-sm" :aria-invalid="invalidDateRange" aria-describedby="expense-date-error">
                </div>
                <!-- новый код chat: фильтр по категории, включая расходы без категории -->
                <div class="col-12 col-md-6 col-xl-4">
                    <div id="expense-category-filter-label" class="form-label">Категории</div>
                    <MultiSelect v-model="filters.categoryIDs" plain-selection :options="categoryOptions" placeholder="Все категории" search-placeholder="Поиск категории" aria-labelledby="expense-category-filter-label" /> <!-- новый код chat: несколько категорий обычным текстом -->
                </div>
                <div class="col-auto"><button type="button" class="btn btn-outline-secondary btn-sm" :disabled="!hasExpenseFilters" @click="resetExpenseFilters">Сбросить фильтры</button></div>
            </div>
            <div v-if="invalidDateRange" id="expense-date-error" class="text-danger mt-2" role="alert">Дата «С» не должна быть позже даты «По».</div>
            </div> <!-- новый код chat: конец сворачиваемых фильтров -->
        </section>
        <!-- --------- конец нового кода chat -->
        <!-- --------- новый код chat: статистика договора или видимых строк таблицы -->
        <section class="expense-statistics border rounded-3 px-3 py-2 mt-3 col-12" aria-labelledby="expense-statistics-title"> <!-- новый код chat: полная ширина -->
            <h2 id="expense-statistics-title" class="expense-section-heading mb-2"><i class="bi bi-bar-chart text-primary me-2" aria-hidden="true"></i>Статистика расходов</h2>
            <div v-if="!expenses" class="text-secondary">Загрузка…</div>
            <div v-else-if="invalidDateRange" class="text-danger">Укажите корректный период в фильтрах.</div>
            <div v-else class="row g-2"> <!-- новый код chat: компактная сетка статистики -->
                <div v-for="period in expenseStatistics" :key="period.title" :class="hasExpenseFilters ? 'col-12' : 'col-12 col-xl-6'">
                    <div class="expense-statistics-card rounded-3 px-3 py-2 h-100">
                        <!-- новый код chat: сумма и период в одной строке -->
                        <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
                            <h3 class="expense-statistics-subtitle m-0">{{ period.title }}</h3>
                            <span class="text-secondary">Записей: {{ period.count }}</span>
                            <span class="expense-statistics-total ms-auto">{{ formatExpenseAmount(period.total / 100) }}</span>
                        </div>
                        <dl class="expense-statistics-values mb-0">
                            <div><dt>Счёт компании</dt><dd>{{ formatExpenseAmount(period.company / 100) }}</dd></div>
                            <div><dt>Личный счёт</dt><dd>{{ formatExpenseAmount(period.employee / 100) }}</dd></div>
                            <div><dt>Счёт не указан</dt><dd>{{ formatExpenseAmount(period.none / 100) }}</dd></div>
                            <div class="expense-statistics-outstanding"><dt>Из личных — не возмещено</dt><dd>{{ formatExpenseAmount(period.unreimbursed / 100) }}</dd></div>
                        </dl>
                    </div>
                </div>
            </div>
        </section>
        <!-- --------- конец нового кода chat -->
        <!-- новый код chat: окно справочника открывается кнопкой в форме расхода -->
        <ExpenseCategoryModal ref="categoryModal" @changed="categoriesChanged" />
        <div class="pt-3">
            <div class="list-group col-12" style="font-size: 14px;"> <!-- новый код chat: полная ширина -->

                <div class="list-group-item d-flex fw-semibold">
                    <div class="col-1 d-flex">
                        <div class="col-2">
                            №
                        </div>
                        <div class="col-10 d-flex justify-content-center">
                            Дата
                        </div>
                    </div>
                    <div class="col-1 d-flex justify-content-center">Счет</div> 
                    <div class="col-1">Сумма</div> <!-- новый код chat: название суммы расхода -->
                    <div class="col-2">Сотрудник</div>
                    <div class="expense-status-column">Статус</div> <!-- новый код chat: компактная колонка -->
                    <div class="expense-category-column">Категория</div> <!-- новый код chat -->
                    <div class="col-3">Наименование</div> <!-- новый код chat: больше места для текста -->
                </div>

                <div v-if="expenses && !filteredExpenses.length" class="list-group-item text-secondary" role="status">{{ invalidDateRange ? 'Укажите корректный период.' : 'Расходы не найдены.' }}</div> <!-- новый код chat -->
                <div v-for="(item, index) in filteredExpenses" :key="item.ID" class="list-group-item d-flex"> <!-- новый код chat: отфильтрованные расходы -->
                    <div class="col-1 d-flex">
                        <div class="col-2">
                            {{ index + 1  }}
                        </div>
                        <div class="col-10 d-flex justify-content-center">
                            {{ expenseDisplayDate(item) }} <!-- новый код chat: выбранная дата расхода -->
                        </div>
                    </div>
                    <div class="col-1 d-flex justify-content-center" style="font-size: 10px;">
                        <!-- новый код chat: компактный тег счёта у верхнего края ячейки -->
                        <div class="border rounded-5 lh-1 align-self-start px-2 py-1 text-nowrap"
                        :class="{'company': 'border-success text-success', 'employee': 'border-primary text-primary', 'none': 'border-danger text-danger'}[item.account]">
                            {{ item.account === "company"? "Компании" : item.account === "employee" ? "Личный" : "Не указан" }}
                        </div>
                    </div>
                    <div class="col-1 text-nowrap">{{ formatExpenseAmount(item.price) }}</div> <!-- новый код chat: разделение тысяч -->
                    <div class="col-2">{{ expenseEmployeeName(item) }}</div> <!-- новый код chat: безопасное имя, включая удалённые карточки -->
                    <!-- новый код chat: статус после сотрудника, только у личных расходов -->
                    <div class="expense-status-column"><span v-if="item.account === 'employee'" class="badge border rounded-5 bg-white fw-normal" :class="item.is_reimbursed ? 'text-success border-success' : 'text-warning border-warning'">{{ item.is_reimbursed ? 'Возмещён' : 'Не возмещён' }}</span><span v-else>—</span></div> <!-- новый код chat -->
                    <div class="expense-category-column"><span class="expense-category-tag">{{ expenseCategoryName(item.category_id) }}</span></div> <!-- новый код chat: тег как у специализаций -->
                    <div class="col-3 text-break">{{ item.name }}</div> <!-- новый код chat -->
                    <div class="col-1 d-flex justify-content-end">
                        <div class="btn-group">
                            <button class="btn p-0 border-0" type="button" data-bs-toggle="dropdown" aria-expanded="false"> <!-- новый код chat: меню без рамки -->
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li v-if="item.account === 'employee'"><button class="dropdown-item" :disabled="statusBusy" @click="changeReimbursement(item)">{{ item.is_reimbursed ? 'Отметить как не возмещённый' : 'Отметить как возмещённый' }}</button></li> <!-- новый код chat -->
                                <li><button type="button" class="dropdown-item" :disabled="isSubmit" @click="editExpense(item)">Изменить</button></li> <!-- новый код chat -->
                                <li><a class="dropdown-item text-danger" @click.prevent="deleteExpensesHandler(item.ID)">Удалить</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>

</template>

<script setup>
import { onMounted, reactive, ref, computed, watch } from 'vue'; // новый код chat: обновление при смене договора
import api from '../../../api';
import ExpenseCategoryModal from './ExpenseCategoryModal.vue'; // новый код chat
import MoneyInputComponent from '../../MoneyInputComponent.vue'; // новый код chat: общее денежное поле
import { useRoute } from 'vue-router';
import { formatDate } from '../../../utils/date';
import MultiSelect from '../../MultiSelect.vue'; // новый код chat: тот же выбор сотрудников, что в табеле
import { emptyExpenseFilters, filterExpenses, expenseDateKey } from '../../../utils/expenseFilters'; // новый код chat

const route = useRoute();
const agreement_id = computed(() => route.params.id); // новый код chat
const errorMessage = ref(''), statusBusy = ref(false); // новый код chat
const isSubmit = ref(false);
const editingExpenseID = ref(null); // новый код chat
// --------- новый код chat: справочник общий для всех договоров
const categoryModal = ref(null), expenseCategories = ref([]);
const expenseCategoryName = id => expenseCategories.value.find(row => row.ID === id)?.name || 'Без категории';
const loadExpenseCategories = async () => {
    try { expenseCategories.value = (await api.get('/expense-categories')).data; }
    catch (err) { errorMessage.value = 'Не удалось загрузить категории расходов'; }
};
const categoriesChanged = (rows, deletedID) => {
    expenseCategories.value = rows;
    if (deletedID) {
        if (formData.category_id === deletedID) formData.category_id = null;
        filters.categoryIDs = [...new Set(filters.categoryIDs.map(id => id === deletedID ? 'none' : id))]; // новый код chat
        expenses.value = (expenses.value || []).map(row => row.category_id === deletedID ? { ...row, category_id: null } : row);
    }
};
// --------- конец нового кода chat
const createExpanded = ref(false), filtersExpanded = ref(false); // новый код chat: по умолчанию оба блока свёрнуты

const expenses = ref(null);
const amountInput = ref(null); // новый код chat: вычисление также перед отправкой формы
// --------- новый код chat: суммы в рублях с разделением тысяч и сохранением копеек
const expenseAmountFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const formatExpenseAmount = value => {
    if (value === null || value === undefined || value === '') return '—';
    const amount = Number(value);
    return Number.isFinite(amount) ? `${expenseAmountFormatter.format(amount)} ₽` : '—'; // новый код chat: символ рубля после суммы
};
// --------- конец нового кода chat
const managerCards = ref(null);
// --------- новый код chat: фильтры и сотрудники из всех расходов текущего договора
const filters = reactive(emptyExpenseFilters());
const resetExpenseFilters = () => Object.assign(filters, emptyExpenseFilters());
const hasExpenseFilters = computed(() => Object.values(filters).some(value => Array.isArray(value) ? value.length > 0 : value !== ''));
const invalidDateRange = computed(() => Boolean(filters.from && filters.to && filters.from > filters.to));
const filteredExpenses = computed(() => filterExpenses(expenses.value, filters));
// --------- новый код chat: считаем в копейках, при фильтрации используем ровно строки таблицы
const summarizeExpenses = (rows, title) => {
    const result = { title, count: rows.length, total: 0, company: 0, employee: 0, none: 0, unreimbursed: 0 };
    rows.forEach(item => {
        const amount = Number(item.price);
        const kopecks = Number.isFinite(amount) ? Math.round(amount * 100) : 0;
        result.total += kopecks;
        const account = ['company', 'employee'].includes(item.account) ? item.account : 'none';
        result[account] += kopecks;
        if (account === 'employee' && !item.is_reimbursed) result.unreimbursed += kopecks;
    });
    return result;
};
const expenseStatistics = computed(() => {
    if (hasExpenseFilters.value) return [summarizeExpenses(filteredExpenses.value, 'По выбранным фильтрам')];
    const rows = expenses.value || [];
    const today = new Date();
    const month = expenseDateKey(today).slice(0, 7);
    const monthLabel = today.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    const monthRows = rows.filter(item => expenseDateKey(item.expense_date || item.CreatedAt).slice(0, 7) === month);
    return [summarizeExpenses(rows, 'За весь период'), summarizeExpenses(monthRows, `Текущий месяц · ${monthLabel}`)];
});
// --------- конец нового кода chat
const expenseEmployeeCard = item => {
    const id = Number(item.employee_card_id || item.employee_card?.ID || 0);
    return item.employee_card?.surname || item.employee_card?.name ? item.employee_card : (managerCards.value || []).find(card => Number(card.ID) === id);
};
const expenseEmployeeName = item => {
    const card = expenseEmployeeCard(item);
    const id = Number(item.employee_card_id || item.employee_card?.ID || 0);
    return card ? [card.surname, card.name?.[0] ? card.name[0] + '.' : '', card.middle_name?.[0] ? card.middle_name[0] + '.' : ''].filter(Boolean).join(' ') : (id ? `Сотрудник №${id}` : 'Не указан');
};
const expenseEmployees = computed(() => {
    const employees = new Map();
    (expenses.value || []).forEach(item => {
        const id = Number(item.employee_card_id || item.employee_card?.ID || 0);
        const card = expenseEmployeeCard(item);
        const label = expenseEmployeeName(item); // новый код chat: фамилия и инициалы
        const searchLabel = card ? employeeSearchLabel(card) : label; // новый код chat: полное ФИО для поиска
        employees.set(id, { ID: id, label, searchLabel }); // новый код chat
    });
    return [...employees.values()].sort((a, b) => a.label.localeCompare(b.label, 'ru'));
});
// --------- конец нового кода chat
const formData = reactive({
    category_id: null, // новый код chat
    expense_date: expenseDateKey(new Date()), // новый код chat: сегодня по местному времени
    agreement_id: Number(agreement_id.value), // новый код chat
    name: "",
    price: "",
    account: "none",
    employee_card_id: parseInt(localStorage.getItem('employee-card-id')) || 0 // новый код chat: числовой ID
});

// --------- новый код chat: список компонента связан с единственным ID расхода
const createEmployeeSelection = computed({
    get: () => formData.employee_card_id ? [Number(formData.employee_card_id)] : [],
    set: ids => { formData.employee_card_id = ids[0] ?? 0; }
});
// --------- новый код chat: адаптеры одиночных значений к общему компоненту
const accountOptions = [{ ID: 'none', name: 'Не указан' }, { ID: 'company', name: 'Компании' }, { ID: 'employee', name: 'Личный' }];
const filterAccountOptions = [{ ID: '', name: 'Все счета' }, ...accountOptions];
const categoryOptions = computed(() => [{ ID: 'none', name: 'Без категории' }, ...expenseCategories.value]);
const createCategorySelection = computed({
    get: () => [formData.category_id ?? 'none'],
    set: ids => { formData.category_id = ids[0] && ids[0] !== 'none' ? Number(ids[0]) : null; }
});
const createAccountSelection = computed({
    get: () => [formData.account],
    set: ids => { formData.account = ids[0] || 'none'; }
});
const filterAccountSelection = computed({
    get: () => filters.account ? [filters.account] : [],
    set: ids => { filters.account = ids[0] || ''; }
});
// --------- новый код chat: одиночный выбор статуса без поиска
const filterStatusOptions = [
    { ID: '', name: 'Все статусы' },
    { ID: 'reimbursed', name: 'Возмещён' },
    { ID: 'unreimbursed', name: 'Не возмещён' },
    { ID: 'not_applicable', name: 'Не применяется' }
];
const filterStatusSelection = computed({
    get: () => filters.status ? [filters.status] : [],
    set: ids => { filters.status = ids[0] || ''; }
});
// --------- конец нового кода chat
// --------- конец нового кода chat
const employeeSearchLabel = employee => [employee.surname, employee.name, employee.middle_name].filter(Boolean).join(' '); // новый код chat
const createEmployeeLabel = employee => expenseEmployeeName({ employee_card: employee, employee_card_id: employee.ID }); // новый код chat: единый формат фамилии и инициалов
// --------- конец нового кода chat

const onlyDate = (date) =>{
    return formatDate(date).split(" ")[1];
}

// --------- новый код chat: редактирование в общей форме и дата старых записей
const expenseDisplayDate = item => item.expense_date ? item.expense_date.split('-').reverse().join('.') : onlyDate(item.CreatedAt);
const resetExpenseForm = () => {
    editingExpenseID.value = null;
    Object.assign(formData, { name: '', price: '', account: 'none', employee_card_id: 0, expense_date: expenseDateKey(new Date()), category_id: null }); // новый код chat
};
const editExpense = item => {
    createExpanded.value = true; // новый код chat: раскрываем форму выбранного расхода
    editingExpenseID.value = item.ID;
    Object.assign(formData, { name: item.name, price: String(item.price), account: item.account, employee_card_id: item.employee_card_id || 0, expense_date: expenseDateKey(item.expense_date || item.CreatedAt), category_id: item.category_id || null }); // новый код chat
    errorMessage.value = '';
    document.getElementById('expense-create-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
// --------- конец нового кода chat

const postExpensesHandler = async()=>{
    if (isSubmit.value) return; // новый код chat: защита от повторного сохранения
    if (!amountInput.value?.resolveExpression()) return; // новый код chat: неверная формула не отправляется
    // --------- новый код chat: сохраняем проверки прежнего number-поля и числовой формат API
    const price = String(formData.price).trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(price) || !Number.isFinite(Number(price))) {
        errorMessage.value = 'Введите неотрицательную сумму расхода с точностью до копеек.';
        return;
    }
    // --------- конец нового кода chat
    try{
        isSubmit.value = true;
        errorMessage.value = ''; // новый код chat
        formData.agreement_id = Number(agreement_id.value); // новый код chat
        // --------- новый код chat: сохраняем только редактируемые поля
        const agreementID = agreement_id.value;
        const payload = { name: formData.name, price: Number(price), account: formData.account, employee_card_id: Number(formData.employee_card_id) || 0, expense_date: formData.expense_date };
        payload.category_id = formData.category_id; // новый код chat
        if (editingExpenseID.value) {
            await api.patch(`/agreements/${agreementID}/expenses/${editingExpenseID.value}`, payload);
        } else {
            await api.post(`/agreements/${agreementID}/expenses/create`, payload);
        }
        if (agreementID !== agreement_id.value) return;
        resetExpenseForm();
        await getExpensesHandler();
        // --------- конец нового кода chat
    }catch(err){
        errorMessage.value = typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось обработать расходы'; // новый код chat
        console.log(err);
    }finally{
        isSubmit.value = false;
    }
};

const getExpensesHandler = async()=>{
    const agreementID = agreement_id.value; // новый код chat: защита от ответа предыдущего договора
    try{
        // console.log("LocalStorage",localStorage.getItem('name') || '')
        const res = await api.get(`/agreements/${agreementID}/expenses`); // новый код chat
        if (agreementID !== agreement_id.value) return; // новый код chat
        expenses.value = (res.data.expenses || []).slice().reverse() // новый код chat: пустой список расходов
        console.log(res.data);
    }catch(err){
        errorMessage.value = typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось обработать расходы'; // новый код chat
        console.log(err);
    }
};

const getAllManagerCardHandler = async() =>{
    try{
        const res = await api.get('/employeecards');
        managerCards.value = res.data;
        console.log(res.data)
    }catch(err){
        console.log('[Error] ', err);
    }
};

const deleteExpensesHandler = async(id)=>{
    if (!window.confirm('Удалить расход?')) return; // новый код chat: подтверждение удаления
    try{
        const res = await api.delete(`/expenses/delete/${id}`)
        expenses.value = expenses.value.filter(item => item.ID !== id)
        if (editingExpenseID.value === id) resetExpenseForm(); // новый код chat
    }catch(err){
        console.log(err)
    }
};

// --------- новый код chat: ручное возмещение и отмена возмещения
const changeReimbursement = async(item) => {
    if (statusBusy.value) return;
    const agreementID = agreement_id.value;
    statusBusy.value = true; errorMessage.value = '';
    try {
        const res = await api.patch(`/agreements/${agreementID}/expenses/${item.ID}/status`, {is_reimbursed: !item.is_reimbursed});
        if (agreementID === agreement_id.value) expenses.value = expenses.value.map(row => row.ID === item.ID ? res.data : row);
    } catch (err) {
        if (agreementID === agreement_id.value) errorMessage.value = typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось изменить статус';
    } finally { statusBusy.value = false; }
};
// --------- конец нового кода chat

// новый код chat: отдельные расходы для текущего договора
watch(agreement_id, () => { createExpanded.value = false; filtersExpanded.value = false; resetExpenseForm(); resetExpenseFilters(); expenses.value = []; errorMessage.value = ''; getExpensesHandler(); }, {immediate:true}); // новый код chat: при открытии договора блоки свёрнуты
onMounted(getAllManagerCardHandler);
onMounted(loadExpenseCategories); // новый код chat
</script>

<style>
/* --------- новый код chat: узкие колонки и категория в стиле специализаций сотрудников */
.expense-status-column, .expense-category-column { flex: 0 0 12.5%; width: 12.5%; min-width: 0; padding-right: 8px; }
.expense-status-column .badge { max-width: 100%; white-space: normal; }
.expense-category-tag { display: inline-block; max-width: 100%; font-size: 12px; line-height: 1.5; border-radius: 999px; padding: 2px 6px; background: #f1f4f8; color: #000; overflow-wrap: anywhere; }
/* --------- конец нового кода chat */
/* --------- новый код chat: статистика в стилистике формы и фильтров */
.expense-statistics { background: #fff; font-size: 13px; }
.expense-statistics-card { background: #f8f9fa; border: 1px solid var(--bs-border-color); }
.expense-statistics-subtitle { font-size: 13px; font-weight: 600; }
/* новый код chat: показатели в две колонки с переносом на узком экране */
.expense-statistics-total { font-size: 17px; font-weight: 600; color: #212529; white-space: nowrap; }
.expense-statistics-values { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 4px 20px; padding-top: 6px; border-top: 1px solid var(--bs-border-color); font-size: 12px; }
.expense-statistics-values > div { display: flex; justify-content: space-between; gap: 8px; }
.expense-statistics-values dt { font-weight: 400; }
.expense-statistics-values dd { margin: 0; font-weight: 500; white-space: nowrap; }
.expense-statistics-outstanding { color: #212529; } /* новый код chat: без дополнительного отступа */
/* --------- конец нового кода chat */
/* --------- новый код chat: компактные заголовки сворачиваемых блоков */
.expense-section-heading { margin: 0; font-size: 15px; }
.expense-section-toggle { display: flex; align-items: center; gap: 8px; width: 100%; padding: 0; border: 0; background: transparent; color: #212529; font: inherit; font-weight: 600; text-align: left; }
.expense-section-toggle:focus-visible { outline: 2px solid var(--bs-primary); outline-offset: 5px; border-radius: 4px; }
.expense-section-toggle .badge { font-size: 11px; }
/* --------- конец нового кода chat */
/* --------- новый код chat: компактная форма в стиле соседних блоков */
.expense-create { background: #fff; font-size: 13px; }
.expense-create-title { display: flex; align-items: center; gap: 8px; margin: 0 0 14px; font-size: 15px; font-weight: 600; }
.expense-create-title i { color: var(--bs-primary); }
.expense-create .form-label { margin-bottom: 5px; font-weight: 500; }
.expense-create .form-control, .expense-create .form-select, .expense-create .btn { font-size: 13px; }
.expense-create-footer { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--bs-border-color); }
.expense-create-footer > span { font-size: 12px; color: #65738a; }
.expense-create-footer .btn { white-space: nowrap; margin-left: auto; }
/* --------- конец нового кода chat */
/* --------- новый код chat: панель в существующем стиле Bootstrap */
.expense-filters { background: #fff; font-size: 13px; }
.expense-filters .form-label { margin-bottom: 5px; font-weight: 500; }
.expense-filters .form-control, .expense-filters .form-select, .expense-filters .btn { font-size: 13px; }
/* --------- конец нового кода chat */
</style>
