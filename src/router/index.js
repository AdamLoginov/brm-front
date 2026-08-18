import { createRouter, createWebHistory } from 'vue-router'

import Login from '../components/Login.vue'
import Users from '../components/Users.vue'
import Employee from '../components/Employee.vue'
import EmployeeCreate from '../components/EmployeeCreate.vue'

import HomePage from '../components/HomePage.vue'
import MaterialPage from '../components/pages/MaterialPage.vue'


import AgreementDetailPage from '../components/pages/AgreementDetailPage.vue'
import AgreementsPage from '../components/pages/AgreementsPage.vue'
import AgreementCreatePage from '../components/pages/AgreementCreatePage.vue'
import AgreementEmployee from '../components/pages/AgreementEmployee.vue'

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
import ExpensesPage from '../components/pages/ExpensesPage.vue'
import EmailsPage from '../components/pages/EmailsPage.vue'

//tools
import ToolsAgreementpage from '../components/pages/ToolsAgreementpage.vue'
// EmployeeCards
import EmployeeCardsPage from '../components/pages/EmployeeCardsPage.vue'
import EmployeeCardCreatePage from '../components/pages/Employee/EmployeeCardCreatePage.vue'
import AgreementAppendEmployee from '../components/pages/AgreementAppendEmployee.vue'
import EmployeeCardDetailPage from '../components/pages/Employee/EmployeeCardDetailPage.vue'
import EmployeeCardDocumentCreate from '../components/pages/Employee/EmployeeCardDocumentCreate.vue'


const routes = [
  { path: '/', name: 'home', component: HomePage, meta:{requiresAuth: true} },
  { path: '/login', name: 'login', component: Login, meta:{requiresAuth: false} },
  { path: '/users', name: 'users', component: Users, meta:{requiresAuth: true} },

  { path: '/materials/create', name: 'materials-creaate-one', component: MaterialPage, meta:{requiresAuth: true} },
  { path: '/materials', name: 'materials', component: MaterialPage, meta:{requiresAuth: true} },

  //expenses
  { path: '/agreements/:id/expenses', name: 'expenses', component: ExpensesPage, meta:{requiresAuth: true} },

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

  { path: '/agreements/:id/employee', name: 'agreement-employee', component: AgreementEmployee, meta:{requiresAuth: true} },
  { path: '/agreements/:id/employee/append', name: 'agreement-employee-append', component: AgreementAppendEmployee, meta:{requiresAuth: true} },
  
  //Сметы
  { path: '/estimate/:id', name: 'estimate-detail', component: EstimateDetailPage, meta:{requiresAuth: true} },


  { path: '/suppliers/detail/:id', name: 'supplier-detail', component: SupplierDetailPage, meta:{requiresAuth: true} },
  { path: '/suppliers/detail/:id/createmanager', name: 'create-manager', component: ManagerCardCreatePage, meta:{requiresAuth: true} },
  { path: '/suplers', name: 'suplers', component: SuplersPage, meta:{requiresAuth: true} },
  { path: '/suplers/create', name: 'suplerCreate', component: SuplerCreatePage, meta:{requiresAuth: true} },
  
  //Инструменты
  { path: '/agreement/:id/tools', name: 'agreement-tools', component: ToolsAgreementpage, meta:{requiresAuth: true} },
  
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
    path: '/employeecards/:id/document/create', name :`employee-card-document-create`, component: EmployeeCardDocumentCreate, meta:{requiresAuth: true,breadcrumb: [
        { title: 'Сотрудники', name: 'employee-cards' },
        { title: 'Подробнее', name: 'employee-cards-detail' },
        { title: 'Создать документ', name: 'employee-card-document-create' },
      ]
    } 
  }
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