import NotificationsPage from '../components/pages/NotificationsPage.vue'; // новый код chat: личные уведомления
import AgreementSalaryDebtPage from '../components/pages/Agreement/AgreementSalaryDebtPage.vue'; // новый код chat
import AgreementSalaryBonusPage from '../components/pages/Agreement/AgreementSalaryBonusPage.vue'; // новый код chat: вкладка премий
import { createRouter, createWebHistory } from 'vue-router'

import Login from '../components/Login.vue'
import Employee from '../components/Employee.vue'
import EmployeeCreate from '../components/EmployeeCreate.vue'

import MaterialPage from '../components/pages/MaterialPage.vue'


import AgreementDetailPage from '../components/pages/Agreement/AgreementDetailPage.vue'
import AgreementsPage from '../components/pages/Agreement/AgreementsPage.vue'
import AgreementCreatePage from '../components/pages/Agreement/AgreementCreatePage.vue'
import AgreementEmployee from '../components/pages/Agreement/AgreementEmployeeTimesheet.vue'

//Сметы
import EstimatesCreatePage from '../components/pages/EstimatesCreatePage.vue'
import EstimatesPage from '../components/pages/EstimatesPage.vue'
import EstimateDetailPage from '../components/pages/EstimateDetailPage.vue'

import SuplersPage from '../components/pages/SuplersPage.vue'
import SupplierDetailPage from '../components/pages/SupplierDetailPage.vue'
import SuplerCreatePage from '../components/pages/SuplerCreatePage.vue'
import ManagerCardCreatePage from '../components/pages/ManagerCardCreatePage.vue'

// Заказы
import OrdersPage from '../components/pages/OrdersPage.vue'
import CreateOrderPage from '../components/pages/CreateOrderPage.vue'
import OrderCheckPage from '../components/pages/OrderCheckPage.vue'

// Дилоги
import DialogsPage from '../components/pages/DialogsPage.vue'
import DialogDetailPage from '../components/pages/DialogDetailPage.vue'
// Email
import EmailDetailPage from '../components/pages/EmailDetailPage.vue'

//expenses
import ExpensesPage from '../components/pages/Agreement/AgreementExpensesPage.vue'
import EmailsPage from '../components/pages/EmailsPage.vue'

//tools
import ToolsAgreementpage from '../components/pages/ToolsAgreementpage.vue'
import MtrPage from '../components/pages/MTR/MtrPage.vue' // новый код chat
import PpePage from '../components/pages/MTR/PpePage.vue' // новый код chat: учёт СИЗ вместо заглушки
import ConsumablesPage from '../components/pages/MTR/ConsumablesPage.vue' // новый код chat: учёт расходников
// EmployeeCards
import EmployeeCardsPage from '../components/pages/Employee/EmployeeCardsPage.vue'
import EmployeeCardCreatePage from '../components/pages/Employee/EmployeeCardCreatePage.vue'
import AgreementAppendEmployee from '../components/pages/AgreementAppendEmployee.vue'
import EmployeeCardDetailPage from '../components/pages/Employee/EmployeeCardDetailPage.vue'
import EmployeeCardDocumentCreate from '../components/pages/Employee/EmployeeCardDocumentCreate.vue'
import EmployeeCardUpdatePage from '../components/pages/Employee/EmployeeCardUpdatePage.vue'
// новый код chat: категории документов открываются в модальном окне формы документа

import UsersPage from '../components/pages/Users/UsersPage.vue'
import UserCreatePage from '../components/pages/Users/UserCreatePage.vue'
import UserUploadPage from '../components/pages/Users/UserUploadPage.vue'
import AgreementUpdatePage from '../components/pages/Agreement/AgreementUpdatePage.vue'
import DocumentHeightCreate from '../components/pages/DocumentHeightCreate.vue'
import AgreementEmployeeAdvance from '../components/pages/Agreement/AgreementEmployeeAdvance.vue'
import HomePage from '../components/pages/Home/HomePage.vue'
import AgreementTimeSheetPage from '../components/pages/Agreement/AgreementTimeSheetPage.vue'
import AgreementPaymentPage from '../components/pages/Agreement/Payment/AgreementPaymentPage.vue'
import AgreementSalaryPage from '../components/pages/Agreement/AgreementSalaryPage.vue' // новый код chat: общая оболочка зарплаты
import AgreementDailyAllowancePage from '../components/pages/Agreement/AgreementDailyAllowancePage.vue' // новый код chat: суточные
import AgreementSalaryAccrualPage from '../components/pages/Agreement/AgreementSalaryAccrualPage.vue' // новый код chat: страница начислений
import AgreementSalaryAdvancePage from '../components/pages/Agreement/AgreementSalaryAdvancePage.vue' // новый код chat: страница авансов
import AgreementSalaryAlimonyPage from '../components/pages/Agreement/AgreementSalaryAlimonyPage.vue' // новый код chat: алименты
import AgreementSalaryPenaltyPage from '../components/pages/Agreement/AgreementSalaryPenaltyPage.vue' // новый код chat: страница штрафов


const routes = [
  { path:'/tasks', name:'tasks', component:() => import('../components/pages/Home/TasksPage.vue'), meta:{requiresAuth:true} }, // новый код chat
  // новый код chat: сводная проверка сведений и документов сотрудников
  { path: '/employeecards/completeness', name: 'employee-completeness', component: () => import('../components/pages/Employee/EmployeeCompletenessPage.vue'), meta: { requiresAuth: true } },
  { path:'/notifications', name:'notifications', component:NotificationsPage, meta:{requiresAuth:true} }, // новый код chat
  { path: '/', name: 'home', component: HomePage, meta:{requiresAuth: true} },
  { path: '/login', name: 'login', component: Login, meta:{requiresAuth: false} },
  
  { path: '/users', name: 'users-all', component: UsersPage, meta:{requiresAuth: true} },
  { path: '/users/create', name: 'user-create', component: UserCreatePage, meta:{requiresAuth: true} },
  { path: '/users/upload/:id', name: 'user-upload', component: UserUploadPage, meta:{requiresAuth: true} },

  { path: '/materials/create', name: 'materials-creaate-one', component: MaterialPage, meta:{requiresAuth: true} },
  { path: '/materials', name: 'materials', component: MaterialPage, meta:{requiresAuth: true} },

  //agreement payment
  { path: '/agreements/:id/payment', name: 'agreement-payment', component: AgreementPaymentPage, meta:{requiresAuth: true} },
  // --------- новый код chat: вложенные вкладки с прежними адресами и именами
  {
    path: '/agreements/:id',
    component: AgreementSalaryPage,
    meta: {requiresAuth: true},
    children: [
      { path: 'work-orders', name: 'agreement-work-orders', component: () => import('../components/pages/Agreement/AgreementWorkOrderPage.vue') }, // новый код chat
      { path: 'work-orders/books/:bookId/positions', name: 'agreement-work-order-positions', component: () => import('../components/pages/Agreement/AgreementWorkOrderPositionPage.vue') }, // новый код chat: работы по позициям месячной книги
      { path: 'warehouse', name: 'agreement-warehouse', component: () => import('../components/pages/Agreement/AgreementWarehousePage.vue') }, // новый код chat
      { path: '', redirect: to => ({name: 'agreement-salary-accruals', params: {id: to.params.id}}) },
      { path: 'timesheet', name: 'agreement-timesheet-detail', component: AgreementEmployee }, // новый код chat: табель внутри общей оболочки
      { path: 'accruals', name: 'agreement-salary-accruals', component: AgreementSalaryAccrualPage },
      { path: 'advances', name: 'agreement-salary-advances', component: AgreementSalaryAdvancePage },
      { path: 'alimony', name: 'agreement-salary-alimony', component: AgreementSalaryAlimonyPage }, // новый код chat
      { path: 'debts', name: 'agreement-salary-debts', component: AgreementSalaryDebtPage }, // новый код chat
      { path: 'bonuses', name: 'agreement-salary-bonuses', component: AgreementSalaryBonusPage }, // новый код chat
      { path: 'penalties', name: 'agreement-salary-penalties', component: AgreementSalaryPenaltyPage },
      { path: 'expenses', name: 'expenses', component: ExpensesPage }, // новый код chat: расходы внутри общей панели
      { path: 'daily-allowance', name: 'agreement-daily-allowance', component: AgreementDailyAllowancePage }, // новый код chat
    ],
  },
  // --------- конец нового кода chat
  //expenses

  //order
  { path: '/agreements/orders/:id/check', name: 'order-check', component: OrderCheckPage, meta:{requiresAuth: true} },
  
  //Договоры
  { 
    path: '/agreements', 
    name: 'agreements', 
    component: AgreementsPage, 
    meta:{
      requiresAuth: true,
      breadcrumb: [
        { title: 'Договоры', name: 'agreements' },
      ]
    }
  },

  { path: '/agreements/:id/contacts', name: 'agreement-contacts', component: () => import('../components/pages/Agreement/AgreementContactsPage.vue'), meta: { requiresAuth: true } }, // новый код chat: контакты другой стороны договора
  { path: '/agreements/update/:id', name: 'agreement-update', component: AgreementUpdatePage, meta:{requiresAuth: true}},

  { path: '/agreements/detail/:id', 
    name: 'agreement', 
    component: AgreementDetailPage, 
    meta:{
      requiresAuth: true,
      breadcrumb: [
        { title: 'Договоры', name: 'agreements' },
        { title: 'Договор', name: 'agreement', useParams: ['id_agreement'] },
      ]
    } 
  },
  
  { path: '/agreements/:id/orders/create', name: 'order-create', component: CreateOrderPage, meta:{requiresAuth: true} },
  { path: '/agreements/:id/orders', name: 'orders', component: OrdersPage, meta:{requiresAuth: true} },
  { path: '/agreements/:id/estimates/create', name: 'estimate-create', component: EstimatesCreatePage, meta:{requiresAuth: true} },
  { path: '/agreements/:id/estimates', name: 'estimates', component: EstimatesPage, meta:{requiresAuth: true} },
  { path: '/agreements/create', name: 'agreement-create', component: AgreementCreatePage, meta:{requiresAuth: true} },


  // { path: '/agreements/:id/timesheet', name: 'agreement-timesheet', component: AgreementTimeSheetPage, meta:{requiresAuth: true} },
  { path: '/agreements/:id/employee/append', name: 'agreement-employee-append', component: AgreementAppendEmployee, meta:{requiresAuth: true} },

  { path: '/agreements/:id/employee/advance', name: 'agreement-employee-advance', component: AgreementEmployeeAdvance, meta:{requiresAuth: true} },
  
  //Сметы
  { path: '/estimate/:id', name: 'estimate-detail', component: EstimateDetailPage, meta:{requiresAuth: true} },


  { path: '/suppliers/detail/:id', name: 'supplier-detail', component: SupplierDetailPage, meta:{requiresAuth: true} },
  { path: '/suppliers/detail/:id/createmanager', name: 'create-manager', component: ManagerCardCreatePage, meta:{requiresAuth: true} },
  { path: '/suplers', name: 'suplers', component: SuplersPage, meta:{requiresAuth: true} },
  { path: '/suplers/create', name: 'suplerCreate', component: SuplerCreatePage, meta:{requiresAuth: true} },
  
  //Инструменты
  // --------- новый код chat: общие оболочки с постоянной панелью переключения
  { path: '/agreement/:id/tools', component: MtrPage, meta:{requiresAuth:true, mtrGlobal:false}, children:[
    {path:'', name:'agreement-tools', component:ToolsAgreementpage},
    {path:'ppe', name:'agreement-ppe', component:PpePage}, // новый код chat
    {path:'consumables', name:'agreement-consumables', component:ConsumablesPage}, // новый код chat
  ] },
  { path: '/mtr', component: MtrPage, meta:{requiresAuth:true, mtrGlobal:true}, children:[
    {path:'', name:'mtr', component:ToolsAgreementpage},
    {path:'ppe', name:'mtr-ppe', component:PpePage}, // новый код chat
    {path:'consumables', name:'mtr-consumables', component:ConsumablesPage}, // новый код chat
  ] },
  // --------- конец нового кода chat
  
  // Диалоги

  { path: '/dialogs', name: 'dialogs', component: DialogsPage, meta:{requiresAuth: true} },
  { path: '/dialogs/:id', name: 'dialog', component: DialogDetailPage, meta:{requiresAuth: true} },
  
  // Email
  { path: '/email/:id', name: 'email', component: EmailDetailPage, meta:{requiresAuth: true} },
  { path: '/email/all', name: 'emails', component: EmailsPage, meta:{requiresAuth: true} },

  // EmployeeCards
  { 
    path: '/employeecards', 
    name :`employee-cards`, 
    component: EmployeeCardsPage, 
    meta:{
      requiresAuth: true,
      breadcrumb: [
        { title: 'Сотрудники', name: 'employee-cards' },
      ]
    } 
  },

  { 
    path: '/employeecards/create', 
    name :`employee-card-create`, 
    component: EmployeeCardCreatePage, 
    meta:{
      requiresAuth: true,
      breadcrumb: [
        { title: 'Сотрудники', name: 'employee-cards' },
        { title: 'Создать', name: 'employee-cards-create' },
      ]
    } 
  }, 

  { 
    path: '/employeecards/:id', name :`employee-card-detail`, component: EmployeeCardDetailPage, meta:{requiresAuth: true,breadcrumb: [
        { title: 'Сотрудники', name: 'employee-cards' },
        { title: 'Подробнее', name: 'employee-cards-detail' },
      ]
    } 
  }, 

  { 
    path: '/employeecards/:id/update', name :`employee-card-update`, component: EmployeeCardUpdatePage, meta:{requiresAuth: true,breadcrumb: [
        { title: 'Сотрудники', name: 'employee-cards' },
      ]
    } 
  }, 

  { 
    path: '/employeecards/:id/document/create', name :`employee-card-document-create`, component: EmployeeCardDocumentCreate, meta:{requiresAuth: true,breadcrumb: [
        { title: 'Сотрудники', name: 'employee-cards' },
        { title: 'Подробнее', name: 'employee-cards-detail' },
        { title: 'Создать документ', name: 'employee-card-document-create' },
      ]
    } 
  },

  { path: '/documentheightcreate', name: 'document-height-create', component: DocumentHeightCreate, meta:{requiresAuth: false} },
]



const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from) => {
  const token = localStorage.getItem('user-token');
  
  if (to.meta.requiresAuth && !token) {
    return '/login';
  } 
  
  if (to.path === '/login' && token) {
    return '/';
  }
});

export default router;
