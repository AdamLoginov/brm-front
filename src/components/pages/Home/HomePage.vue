<!-- новый код chat: главная страница договора и расчётов -->
<template>
    <main class="overview">
        <header class="overview-head">
            <h1>Обзор работы</h1>
            <div class="filters">
                <label>Период<input v-model="month" type="month" class="form-control form-control-sm"></label>
                <label>Договор<select v-model="agreement" class="form-select form-select-sm">
                    <option :value="0">Все договоры</option>
                    <option v-for="a in agreements" :key="a.ID" :value="a.ID">{{ a.Name }}</option>
                </select></label>
            </div>
        </header>
        <div v-if="error" class="alert alert-danger" role="alert">{{ error }} <button class="btn btn-link btn-sm" @click="refresh">Повторить</button></div>
        <div v-else-if="loading" class="panel text-secondary" role="status">Загрузка сводки…</div>
        <template v-else-if="data">
            <section class="metrics" aria-label="Показатели месяца">
                <article v-for="m in metrics" :key="m.label" class="metric">
                    <div class="metric-head"><span>{{ m.label }}</span><i :class="['bi',m.icon]" aria-hidden="true"></i></div>
                    <strong>{{ m.value }}</strong><small>{{ m.note }}</small>
                </article>
            </section>
            <div class="middle">
                <section class="panel activity">
                    <header><h2>Работа по дням</h2>
                        <div class="btn-group btn-group-sm" aria-label="Показатель графика">
                            <button v-for="item in modes" :key="item.key" :aria-pressed="mode===item.key" :class="['btn',mode===item.key?'btn-primary':'btn-light']" @click="mode=item.key">{{ item.label }}</button>
                        </div>
                    </header>
                    <div class="plot" role="group" aria-label="Дни выбранного месяца">
                        <button v-for="(d,i) in data.Days" :key="d.Date" :class="{selected:day===i}" :title="dayText(d)" :aria-label="dayText(d)" @mouseenter="day=i" @focus="day=i" @click="day=i">
                            <span class="track"><span :class="{marked:d.Marks}" :style="{height: d[mode] ? Math.max(3,100*d[mode]/peak)+'%' : '2px'}"></span></span>
                            <small>{{ i===0 || (i+1)%5===0 ? i+1 : '' }}</small>
                        </button>
                    </div>
                    <div class="day-info">{{ dayText(data.Days[day]) }}</div>
                </section>
                <section class="panel attention">
                    <header><h2>Требует внимания</h2></header>
                    <details v-for="item in checks" :key="item.key" class="attention-check">
                        <summary>{{ item.label }} <b>{{ item.format(sum(item.key)) }}</b></summary>
                        <template v-if="sum(item.key)">
                            <router-link v-for="row in data.Rows.filter(r=>r[item.key])" :key="row.ID" :to="path(row,item.tab)" @click="remember(row,item.tab)">{{ row.Name }} · {{ item.format(row[item.key]) }}</router-link>
                        </template>
                        <small v-else>Нет за выбранный период</small>
                    </details>
                    <router-link :to="{name:'tasks',query:{filter:'assigned'}}"><span>Мои просроченные задачи на сегодня</span><b>{{ data.Overdue }} ↗</b></router-link>
                </section>
            </div>
            <section class="panel contracts">
                <header><h2>Сводка по договорам</h2><small>Долг по суточным на {{ dateText(data.BalanceDate) }}</small></header>
                <div class="table-responsive"><table class="table align-middle mb-0">
                    <thead><tr><th>Договор</th><th>Работали</th><th>Часы</th><th>Итого к выплате</th><th>Согласовано</th><th>Расходы</th><th>Долг по суточным</th></tr></thead>
                    <tbody><tr v-for="r in data.Rows" :key="r.ID">
                        <th>{{ r.Name }}</th><td>{{ r.People }}</td>
                        <td><router-link v-if="r.MonthID" :to="path(r,'timesheet')" @click="remember(r,'timesheet')">{{ number(r.Hours) }}</router-link><span v-else>—</span></td>
                        <td><router-link v-if="r.MonthID" :to="path(r,'accruals')" @click="remember(r,'accruals')">{{ money(r.Payable) }}</router-link><span v-else>—</span></td>
                        <td>{{ r.MonthID ? r.Approved+' из '+(r.Pending+r.Approved) : '—' }}</td>
                        <td><router-link :to="path(r,'expenses')">{{ money(r.Expense) }}</router-link></td>
                        <td><router-link v-if="r.MonthID" :to="path(r,'daily-allowance')" @click="remember(r,'daily-allowance')">{{ money(r.AllowanceDebt) }}</router-link><span v-else>{{ money(r.AllowanceDebt) }}</span></td>
                    </tr></tbody>
                </table></div><p v-if="!data.Rows.length" class="text-secondary mb-0">Договоров пока нет.</p>
            </section>
        </template>
    </main>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import api from '../../../api';
import { rememberSalaryMonth } from '../../../utils/salaryMonthStorage';
const today = new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Moscow'}).format(new Date());
const month=ref(today.slice(0,7)), agreement=ref(0), agreements=ref([]);
const data=ref(null), loading=ref(false), error=ref(''), retry=ref(0);
const mode=ref('People'), day=ref(0);
const modes=[{key:'People',label:'Люди'},{key:'Hours',label:'Часы'}];
const refresh=()=>retry.value++;
watch([month,agreement,retry],async ([period,id],previous,onCleanup)=>{
    const controller=new AbortController();
    onCleanup(()=>controller.abort());
    error.value=''; loading.value=true;
    if (!period) {error.value='Выберите месяц для сводки.'; loading.value=false; return;}
    try {
        const response=await api.get('/dashboard',{params:{month:period,agreement:id},signal:controller.signal});
        if (controller.signal.aborted) return;
        data.value=response.data;
        agreements.value=response.data.Agreements || [];
        const days=response.data.Days;
        const active=days.findIndex(d=>d.Date===today);
        day.value=active>=0 ? active : Math.max(0,days.findIndex(d=>d.Marks>0));
    } catch {
        if (!controller.signal.aborted) error.value='Не удалось загрузить данные главной страницы.';
    } finally { if (!controller.signal.aborted) loading.value=false; }
},{immediate:true});
const fmt=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2});
const number=n=>fmt.format(n);
const money=k=>number(k/100)+' ₽';
const checks=[
    {key:'MissingRate',label:'Отработали без ставки',tab:'accruals',format:number},
    {key:'Pending',label:'Расчёты без согласования',tab:'accruals',format:number},
    {key:'Refund',label:'Расходы к возмещению за месяц',tab:'expenses',format:money}
];
const sum=key=>data.value.Rows.reduce((s,r)=>s+r[key],0);
const metrics=computed(()=>[
    {label:'Работали за месяц',value:number(data.value.People),note:'Уникальные сотрудники',icon:'bi-people'},
    {label:'Отработано часов',value:number(sum('Hours')),note:'Человеко-дней: '+number(data.value.Days.reduce((s,d)=>s+d.People,0)),icon:'bi-clock'},
    {label:'Итого к выплате',value:money(sum('Payable')),note:'Согласованные выплаты: '+money(sum('ApprovedAmount')),icon:'bi-wallet2'},
    {label:'Расходы за месяц',value:money(sum('Expense')),note:'К возмещению: '+money(sum('Refund')),icon:'bi-receipt'}
]);
const peak=computed(()=>Math.max(1,...data.value.Days.map(d=>d[mode.value])));
const dateText=s=>s.split('-').reverse().join('.');
const dayText=d=>dateText(d.Date)+' · '+(d.Marks ? 'Работали: '+d.People+' · '+number(d.Hours)+' ч · Прогулы: '+d.Absent+' · Больничные: '+d.Sick : 'Нет отметок');
const path=(row,tab)=>'/agreements/'+row.ID+'/'+tab;
const remember=(row,tab)=>rememberSalaryMonth(row.ID,tab,row.MonthID);
</script>

<style scoped>
.overview {max-width:1550px;margin:auto;padding:clamp(14px,2.2vw,32px);color:#192a3e;font-size:14px}
.overview-head,.panel header,.metric-head,.filters {display:flex;align-items:center;justify-content:space-between;gap:12px}
.overview-head {margin-bottom:22px;flex-wrap:wrap}
h1,h2 {margin:0;font-weight:650} h1 {font-size:26px} h2 {font-size:17px}
.filters {align-items:end;flex-wrap:wrap}.filters label {display:grid;gap:4px;font-size:12px;font-weight:600}.filters select {max-width:300px}
.metrics,.middle {display:grid;gap:12px;margin-bottom:14px}.metrics {grid-template-columns:repeat(4,minmax(0,1fr))}
.panel,.metric {background:white;border:1px solid #dce3eb;border-radius:12px;padding:18px}
.metric-head {font-weight:600}.metric-head i {color:#2969ad;background:#eef5ff;border-radius:8px;padding:4px 8px}
.metric strong {display:block;margin:10px 0 4px;font-variant-numeric:tabular-nums;font-size:clamp(20px,1.7vw,29px);line-height:1.2}
small,.day-info {color:#566779}.middle {grid-template-columns:minmax(0,1.6fr) minmax(290px,1fr)}
.panel header {margin-bottom:12px;flex-wrap:wrap}.plot {display:flex;height:145px;gap:2px;background:repeating-linear-gradient(to top,transparent 0 31px,#edf1f6 31px 32px)}
.plot button {flex:1;min-width:0;background:transparent;border:0;padding:0;display:flex;flex-direction:column}.plot small {height:18px;width:100%;font-size:10px;background:white}.track {flex:1;width:100%;display:flex;align-items:end}
.track span {width:100%;background:#d8e1eb;border-radius:3px 3px 0 0}.track .marked {background:#79a9da}.selected .track .marked {background:#196abe}
.day-info {margin-top:8px;font-size:12px}.attention>div,.attention>a {display:flex;gap:10px;align-items:center;justify-content:space-between;border-top:1px solid #edf0f4;padding:9px 0;font-size:13px}.attention b {white-space:nowrap}
.contracts th,.contracts td {text-align:right;font-size:13px;white-space:nowrap;padding:10px}.contracts th:first-child {text-align:left;white-space:normal}.contracts thead th {background:#f5f7fa;color:#4c6074}.contracts a {text-decoration:none}.contracts a:hover {text-decoration:underline}
.attention-check {font-size:13px;padding:9px 0;border-top:1px solid #edf0f4}.attention-check summary b {float:right}.attention-check a,.attention-check small {display:block;margin:6px 0 0 12px}
@media(max-width:1000px){.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.middle{grid-template-columns:1fr}}
@media(max-width:540px){.metric,.panel{padding:12px}.metrics,.middle{gap:8px}.filters{width:100%}.filters label{max-width:100%}.metric strong{font-size:19px}.metric-head i{display:none}}
</style>
