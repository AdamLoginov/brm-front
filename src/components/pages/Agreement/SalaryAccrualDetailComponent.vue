<!-- --------- новый код chat: подробности начисления сотрудника -->
<template>
    <Teleport to="body">
    <!-- новый код chat: стандартное модальное окно Bootstrap -->
    <div ref="dialog" class="modal salary-detail" tabindex="-1" aria-labelledby="salary-detail-title" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"><div class="modal-content">
        <div class="modal-body p-3 p-md-4">
            <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
                <div><h5 id="salary-detail-title" class="mb-1">{{ accrual.employee_name }}</h5><div class="text-secondary">{{ monthLabel }}</div></div>
                <button class="btn-close" aria-label="Закрыть" @click="close"></button>
            </div>
            <div class="d-flex gap-3 flex-wrap mb-3">
                <span>Ставка за смену: <strong>{{ money(accrual.salary_rate_kopecks) }}</strong></span>
                <span>Часов в смене: <strong>{{ accrual.shift_hours }}</strong></span>
                <span>Всего смен: <strong>{{ totalShifts }}</strong></span> <!-- новый код chat: количество смен по часам табеля -->
                <span>Начислено: <strong>{{ money(accrual.amount_kopecks) }}</strong></span>
            </div>
            <div v-if="loading" class="text-secondary" role="status">Загружаем табель и удержания…</div>
            <div v-else-if="error" class="alert alert-danger" role="alert">{{ error }} <button class="btn btn-sm btn-outline-danger" @click="load">Повторить</button></div>
            <template v-else>
                <h6>Табель за {{ monthLabel }}</h6>
                <div class="salary-calendar mb-2">
                    <div v-for="weekday in weekdays" :key="weekday" class="calendar-heading">{{ weekday }}</div>
                    <div v-for="(day, index) in calendar" :key="index" class="calendar-day" :class="{'calendar-blank': !day}" :style="{backgroundColor: day ? timesheetColors[day.mark] || '#fff' : undefined}">
                        <template v-if="day"><span class="calendar-number">{{ day.number }}</span><strong :title="day.worked ? `${day.mark} ч.` : day.mark">{{ day.mark }}<small v-if="day.worked"> ч.</small></strong></template>
                    </div>
                </div>
                <section v-for="group in groups" :key="group.title" class="mt-3">
                    <h6>{{ group.title }} — {{ money(group.rows.reduce((sum, row) => sum + (group.isPenalty && row.status !== 'active' ? 0 : Number(row.amount_kopecks)), 0)) }}</h6> <!-- новый код chat: в сумму удержаний входят только актуальные штрафы -->
                    <p class="small text-secondary">{{ group.description }}</p>
                    <div v-if="group.rows.length" class="table-responsive detail-table">
                        <table class="table table-sm table-bordered align-middle mb-0">
                            <!-- новый код chat: статус штрафа и прощение прогула -->
                            <thead class="table-light"><tr><th>{{ group.dateLabel }}</th><th v-if="group.isPenalty">Статус</th><th class="text-end">Сумма</th><th>Комментарий</th><th v-if="group.isPenalty">Действия</th></tr></thead>
                            <tbody><tr v-for="row in group.rows" :key="row.ID">
                                <td class="text-nowrap">{{ dateLabel(row.date) }}</td>
                                <td v-if="group.isPenalty"><span class="badge rounded-5 border bg-white fw-normal" :class="statusClass(row.status)">{{ statusLabel(row.status) }}</span></td>
                                <td class="text-end text-nowrap">{{ money(row.amount_kopecks) }}</td><td class="detail-comment">{{ row.comment || '—' }}</td>
                                <td v-if="group.isPenalty"><button v-if="canForgive(row)" class="btn btn-sm btn-outline-primary" :disabled="saving" @click="forgive(row)">Простить</button></td>
                            </tr></tbody>
                        </table>
                    </div>
                    <p v-else class="text-secondary">{{ group.empty }}</p>
                </section>
            </template>
            <div class="text-end mt-3"><button class="btn btn-sm btn-secondary" @click="close">Закрыть</button></div>
        </div>
    </div></div></div>
    </Teleport>
</template>
<!-- --------- конец нового кода chat -->

<script setup>
// --------- новый код chat: данные выбранного сотрудника и календарь табеля
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import api from '../../../api';
import { Modal } from 'bootstrap/dist/js/bootstrap.bundle.min.js'; // новый код chat: тот же Bootstrap, что подключён в main.js
const props = defineProps({agreementId: {type: [String, Number], required: true}, month: {type: Object, required: true}, accrual: {type: Object, required: true}});
const emit = defineEmits(['close', 'changed']); // новый код chat: обновление начислений после прощения
const saving = ref(false); // новый код chat: защита от повторной отправки
const dialog = ref(null), loading = ref(true), error = ref('');
const entries = ref([]), advances = ref([]), penalties = ref([]);
let version = 0;
// --------- новый код chat: палитра отметок из табеля
const timesheetColors = {
    '':   '#fff',
    'Д':  '#c07ff1',
    'В':  '#fff200',
    'П':  '#dd4433',
    'Б':  '#e97c17',
    '0':  '#fff200',
    '1':  '#B8F0B5',
    '2':  '#A9EBAA',
    '3':  '#9AE69E',
    '4':  '#8BE193',
    '5':  '#7CDC87',
    '6':  '#6DD77B',
    '7':  '#5ED26F',
    '8':  '#4FCD63',
    '9':  '#40C857',
    '10': '#31C34B',
    '11': '#28BE3F',
    '12': '#20B936',
    '13': '#A8D8FF',
    '14': '#94D0FF',
    '15': '#80C8FF',
    '16': '#6BC0FF',
    '17': '#57B8FF',
    '18': '#43B0FF',
    '19': '#2FA8FF',
    '20': '#1B9FFF',
    '21': '#1293F0',
    '22': '#0987E0',
    '23': '#047BD0',
    '24': '#006FC0',
};
let modal = null, previousFocus = null;
const close = () => modal?.hide();
const afterHidden = () => { previousFocus?.focus(); emit('close'); };
// --------- конец нового кода chat
const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const money = value => (Number(value) / 100).toLocaleString('ru-RU', {style:'currency', currency:'RUB'});
// --------- новый код chat: смены с одним знаком после запятой, как в начислениях
const totalShifts = computed(() => {
    const hours = Number(props.accrual.total_hours), shiftHours = Number(props.accrual.shift_hours);
    return (shiftHours > 0 && Number.isFinite(hours) ? hours / shiftHours : 0).toLocaleString('ru-RU', {minimumFractionDigits: 1, maximumFractionDigits: 1});
});
// --------- конец нового кода chat
const dateLabel = value => value.split('-').reverse().join('.');
const monthLabel = computed(() => new Date(props.month.year, props.month.month - 1, 1).toLocaleDateString('ru-RU', {month:'long', year:'numeric'}));
const monthPrefix = computed(() => `${props.month.year}-${String(props.month.month).padStart(2, '0')}`);
const calendar = computed(() => {
    const marks = new Map();
    for (const entry of [...entries.value].sort((a,b) => a.ID - b.ID)) marks.set(entry.date, entry.status);
    const offset = (new Date(props.month.year, props.month.month - 1, 1).getDay() + 6) % 7;
    const count = new Date(props.month.year, props.month.month, 0).getDate();
    const days = Array(offset).fill(null);
    for (let number = 1; number <= count; number++) {
        const mark = String(marks.get(`${monthPrefix.value}-${String(number).padStart(2, '0')}`) || '').trim();
        const numeric = /^\d+(?:[.,]\d+)?$/.test(mark);
        days.push({number, mark, worked: numeric && Number(mark.replace(',', '.')) > 0, letter: !!mark && !numeric});
    }
    while (days.length % 7) days.push(null);
    return days;
});
const groups = computed(() => [
    {title:'Авансы', description:'Актуальные авансы по договору, учитываемые в начислении.', dateLabel:'Дата выплаты', rows:advances.value, empty:'Актуальных авансов нет.'},
    {title:'Штрафы', isPenalty:true, description:'Штрафы за месяц выбранного табеля. В сумму удержаний входят только актуальные.', dateLabel:'Дата назначения', rows:penalties.value, empty:'Штрафов за этот месяц нет.'}, // новый код chat: сохраняем видимость прощённых штрафов
]);
// --------- новый код chat: прощение штрафа за прогул через существующее API
const statusLabel = status => ({active:'Актуален', closed:'Закрыт', forgiven:'Прощён'}[status] || status);
const statusClass = status => ({active:'text-success border-success', closed:'text-secondary border-secondary', forgiven:'text-primary border-primary'}[status] || 'text-secondary border-secondary');
const canForgive = row => row.status === 'active' && (row.source_time_sheet_id || (row.comment || '').trim().toLocaleLowerCase('ru-RU') === 'прогул');
const forgive = async(row) => {
    if (saving.value || !canForgive(row) || !window.confirm('Простить штраф за прогул? Он больше не будет вычитаться из начисления.')) return;
    const current = version; saving.value = true;
    try {
        const res = await api.patch(`/agreements/${props.agreementId}/penalties/${row.ID}/status`, {status:'forgiven'});
        emit('changed');
        if (current !== version) return;
        penalties.value = penalties.value.map(item => item.ID === row.ID ? res.data : item);
    } catch (err) {
        if (current === version) error.value = typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось простить штраф.';
    } finally { if (current === version) saving.value = false; }
};
// --------- конец нового кода chat
const load = async() => {
    const current = ++version; loading.value = true; error.value = '';
    try {
        const [sheet, advanceRows, penaltyRows] = await Promise.all([
            api.get(`/agreements/timesheetmonth/detail/${props.month.ID}`),
            api.get(`/agreements/${props.agreementId}/advances`),
            api.get(`/agreements/${props.agreementId}/penalties`),
        ]);
        if (current !== version) return;
        const belongs = row => Number(row.employee_card_id) === Number(props.accrual.employee_card_id);
        const byDate = (a,b) => a.date.localeCompare(b.date) || a.ID - b.ID;
        entries.value = (sheet.data.time_sheets || []).filter(belongs);
        advances.value = (advanceRows.data || []).filter(row => belongs(row) && !row.is_settled).sort(byDate);
        penalties.value = (penaltyRows.data || []).filter(row => belongs(row) && row.date.startsWith(`${monthPrefix.value}-`)).sort(byDate); // новый код chat: все статусы штрафов выбранного месяца
    } catch (err) {
        if (current === version) error.value = typeof err.response?.data === 'string' ? err.response.data.trim() : 'Не удалось загрузить подробности начисления.';
    } finally { if (current === version) loading.value = false; }
};
// --------- новый код chat: открытие и очистка Bootstrap Modal без анимации
onMounted(() => {
    previousFocus = document.activeElement;
    dialog.value.addEventListener('hidden.bs.modal', afterHidden);
    modal = new Modal(dialog.value);
    modal.show();
    load();
});
onBeforeUnmount(() => {
    version++;
    dialog.value?.removeEventListener('hidden.bs.modal', afterHidden);
    modal?.hide();
    modal?.dispose();
});
// --------- конец нового кода chat
// --------- конец нового кода chat
</script>

<style scoped>
/* --------- новый код chat: непрозрачное окно и календарь сотрудника */
.salary-detail { font-size: 14px; } /* новый код chat: размеры и фон задаёт Bootstrap Modal */
.salary-calendar { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
.calendar-heading { text-align: center; font-size: 12px; padding: 4px; }
.calendar-day { min-height: 64px; border: 1px solid var(--bs-border-color); border-radius: 6px; padding: 5px; display: flex; flex-direction: column; }
.calendar-day strong { text-align: center; overflow-wrap: anywhere; }
.calendar-number { font-size: 12px; }
.calendar-blank { visibility: hidden; }
.detail-table { border-radius: 6px; border: 1px solid var(--bs-border-color); overflow: auto; }
/* --------- новый код chat: внешняя граница 1 px без дублирующих границ таблицы */
.detail-table .table > thead > tr:first-child { border-top: 0; }
.detail-table .table > tbody > tr:last-child { border-bottom: 0; }
.detail-table .table > :not(caption) > tr > :first-child { border-left: 0; }
.detail-table .table > :not(caption) > tr > :last-child { border-right: 0; }
/* --------- конец нового кода chat */
.detail-table th { font-weight: 600; }
.detail-comment { white-space: pre-wrap; overflow-wrap: anywhere; min-width: 120px; }
/* --------- конец нового кода chat */
</style>
