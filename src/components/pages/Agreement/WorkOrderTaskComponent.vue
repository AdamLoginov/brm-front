<!-- --------- новый код chat: работа, позиция и материалы только выбранного цеха -->
<template><section class="border rounded-3 p-3 mt-3 bg-white">
    <div class="d-flex justify-content-between mb-2"><strong>Работа {{ index+1 }}</strong><button type="button" class="btn btn-outline-danger btn-sm" @click="remove">Удалить работу</button></div>
    <!-- новый код chat: работа → единица → количество → часы → блок → позиция -->
    <div class="work-task-fields">
        <div class="work-task-name"><label class="form-label">Наименование работы</label><input v-model="task.name" required maxlength="500" class="form-control form-control-sm"></div>
        <!-- новый код chat: объём и единица работы необязательны, выбор можно очистить -->
        <div><label class="form-label">Ед. изм.</label><select v-model="task.unit_id" class="form-select form-select-sm"><option :value="0">Не указана</option><option v-for="unit in refs.units" :key="unit.ID" :value="unit.ID">{{ unit.name }}</option></select></div>
        <div><label class="form-label">Кол-во</label><QuantityInputComponent v-model="task.quantity" placeholder="Не указано" class="form-control form-control-sm" /></div>
        <div><label class="form-label" title="Человеко-часы">Часы</label><QuantityInputComponent v-model="task.hours" required class="form-control form-control-sm" /></div>
        <div><label class="form-label">Блок</label><select v-model="selectedBlockID" required class="form-select form-select-sm" @change="task.position_id=0"><option :value="0" disabled>Выберите блок</option><option v-for="block in blocks" :key="block.ID" :value="block.ID">{{ block.name }}</option></select></div>
        <div><label class="form-label">Позиция</label><select v-model="task.position_id" :disabled="!selectedBlockID" required class="form-select form-select-sm"><option :value="0" disabled>{{ selectedBlockID ? 'Выберите позицию' : 'Сначала выберите блок' }}</option><option v-for="p in positions" :key="p.ID" :value="p.ID">{{ p.number }} — {{ p.name }}</option></select><small v-if="selectedBlockID&&!positions.length" class="text-secondary">В блоке пока нет позиций.</small></div>
    </div>
    <div class="d-flex justify-content-between align-items-center mt-3"><strong>Материалы</strong><button type="button" class="btn btn-outline-secondary btn-sm" @click="task.materials.push({material_id:0,quantity:''})">Добавить материал</button></div>
    <div v-for="(row,i) in task.materials" :key="i" class="row g-2 mt-1 align-items-end">
        <div class="col-md-8"><label class="form-label">Материал · доступно до сохранения смены</label><select v-model="row.material_id" required class="form-select form-select-sm"><option :value="0" disabled>Выберите материал</option><option v-for="m in materials" :key="m.ID" :value="m.ID">{{ m.name }} · {{ quantityDisplay(m.available) }} {{ unitName(m.unit_id) }}</option></select></div>
        <div class="col"><label class="form-label">Количество</label><QuantityInputComponent v-model="row.quantity" :precision="3" required class="form-control form-control-sm" /></div>
        <div class="col-auto"><button type="button" class="btn btn-outline-danger btn-sm" aria-label="Убрать материал из работы" @click="removeMaterial(i)"><i class="bi bi-x-lg"></i></button></div>
    </div>
</section></template>
<script setup>
import {computed,ref,watch} from 'vue';import QuantityInputComponent from '../../QuantityInputComponent.vue';import {quantityDisplay} from './workOrderHelpers'; // новый код chat
const props=defineProps({task:Object,index:Number,refs:Object,workshopId:Number,materials:Array});const emit=defineEmits(['remove']);
// --------- новый код chat: зависимый выбор блока и позиции, включая открытие сохранённой работы
const selectedBlockID = ref(0);
const blocks = computed(() => props.refs.blocks.filter(block => block.workshop_id === props.workshopId));
const positions = computed(() => props.refs.positions.filter(position => position.block_id === selectedBlockID.value && blocks.value.some(block => block.ID === position.block_id)));
watch(() => props.task, task => {
    selectedBlockID.value = props.refs.positions.find(position => position.ID === task.position_id)?.block_id || 0;
}, { immediate: true });
watch(() => props.task.position_id, id => {
    if (id) selectedBlockID.value = props.refs.positions.find(position => position.ID === id)?.block_id || 0;
});
watch(blocks, values => {
    if (selectedBlockID.value && !values.some(block => block.ID === selectedBlockID.value)) {
        selectedBlockID.value = 0;
        props.task.position_id = 0;
    }
});
const unitName=id=>props.refs.units.find(u=>u.ID===id)?.name||'';
// --------- конец нового кода chat
const remove=()=>{if(confirm('Удалить работу? После сохранения смены её материалы вернутся на склад.'))emit('remove');};
const removeMaterial=i=>{if(confirm('Убрать материал из работы? После сохранения смены он вернётся на склад.'))props.task.materials.splice(i,1);};
</script>
<style scoped>
/* --------- новый код chat: наименование шире остальных полей, адаптация без горизонтального переполнения */
.work-task-fields { display: grid; grid-template-columns: minmax(0, 3fr) minmax(85px, .8fr) minmax(80px, .7fr) minmax(80px, .7fr) minmax(0, 1.3fr) minmax(0, 1.5fr); gap: 10px; align-items: start; }
.work-task-fields > div { min-width: 0; }
@media (max-width: 1199px) {
    .work-task-fields { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .work-task-name { grid-column: 1 / -1; }
}
@media (max-width: 575px) {
    .work-task-fields { grid-template-columns: minmax(0, 1fr); }
}
/* --------- конец нового кода chat */
</style>
<!-- --------- конец нового кода chat -->
