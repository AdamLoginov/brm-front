<!-- --------- новый код chat: работа, позиция и материалы только выбранного цеха -->
<!-- --------- новый код chat: одна работа — строка таблицы, материалы непосредственно под ней -->
<template>
    <tr class="work-task-row" :class="{'table-danger':task.accounted}"> <!-- новый код chat -->
        <td class="text-center text-secondary">{{ index+1 }}</td>
        <td><textarea ref="nameInput" v-model="task.name" rows="1" required maxlength="500" class="form-control form-control-sm work-task-name-input" :aria-label="`Наименование работы ${index+1}`" placeholder="Наименование работы"></textarea></td>
        <td><select v-model="task.unit_id" class="form-select form-select-sm" :aria-label="`Единица работы ${index+1}`"><option :value="0">—</option><option v-for="unit in refs.units" :key="unit.ID" :value="unit.ID">{{ unit.name }}</option></select></td>
        <td><QuantityInputComponent v-model="task.quantity" :precision="3" placeholder="—" class="form-control form-control-sm" :aria-label="`Объём работы ${index+1}`" /></td> <!-- новый код chat: до трёх знаков для любого объёма -->
        <!-- новый код chat: часы работы, блок и позицию можно не указывать или очистить -->
        <td class="text-center"><QuantityInputComponent v-model="task.hours" placeholder="—" class="form-control form-control-sm text-center" :aria-label="`Человеко-часы работы ${index+1}`" /></td> <!-- новый код chat: часы по центру -->
        <td><select v-model="task.position_id" class="form-select form-select-sm" :aria-label="`Позиция работы ${index+1}`"><option :value="0">—</option><option v-for="p in positions" :key="p.ID" :value="p.ID">{{ p.number }} — {{ p.name }}</option></select><small v-if="workshopId&&!positions.length" class="text-secondary">В цехе нет позиций.</small></td> <!-- новый код chat: позиция выбирается независимо от блока -->
        <td><select v-model="selectedBlockID" class="form-select form-select-sm" :aria-label="`Блок работы ${index+1}`" @change="task.position_id=0"><option :value="0">—</option><option v-for="block in blocks" :key="block.ID" :value="block.ID">{{ block.name }}</option></select></td>
        <td><div class="work-row-actions">
            <label class="d-flex align-items-center gap-1 small" title="Учтён"><input v-model="task.accounted" type="checkbox" class="form-check-input m-0" aria-label="Учтён"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/></svg></label> <!-- новый код chat: крест в круге вместо подписи -->
            <button type="button" class="btn btn-sm text-primary" title="Добавить материал" :aria-label="`Добавить материал к работе ${index+1}`" @click="task.materials.push({material_id:0,quantity:''})"><i class="bi bi-box-seam" aria-hidden="true"></i></button>
            <button type="button" class="btn btn-sm text-secondary" title="Дублировать работу с материалами" :aria-label="`Дублировать работу ${index+1}`" @click="$emit('duplicate')"><i class="bi bi-copy" aria-hidden="true"></i></button>
            <button type="button" class="btn btn-sm text-danger" title="Удалить работу" :aria-label="`Удалить работу ${index+1}`" @click="remove"><i class="bi bi-trash" aria-hidden="true"></i></button>
        </div></td>
    </tr>
    <tr v-if="task.materials.length" class="work-material-row"><td></td><td colspan="7">
        <div class="work-materials">
            <span class="work-material-label">Материалы</span>
            <div class="work-material-list">
                <div v-for="(row,i) in task.materials" :key="i" class="work-material-input">
                    <select v-model="row.material_id" required class="form-select form-select-sm" :aria-label="`Материал ${i+1}, работа ${index+1}`"><option :value="0" disabled>Выберите материал</option><option v-for="m in materials" :key="m.ID" :value="m.ID">{{ m.name }} · доступно {{ quantityDisplay(m.available) }} {{ unitName(m.unit_id) }}</option></select>
                    <QuantityInputComponent v-model="row.quantity" :precision="3" required placeholder="Кол-во" class="form-control form-control-sm" :aria-label="`Количество материала ${i+1}, работа ${index+1}`" />
                    <span class="text-secondary">{{ unitName(materials.find(m=>m.ID===row.material_id)?.unit_id) || '—' }}</span>
                    <button type="button" class="btn btn-sm text-danger" title="Убрать материал" aria-label="Убрать материал из работы" @click="removeMaterial(i)"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
                </div>
            </div>
            <button type="button" class="btn btn-sm btn-link text-decoration-none p-0" @click="task.materials.push({material_id:0,quantity:''})">+ Материал</button>
        </div>
    </td></tr>
</template>
<script setup>
import {computed,ref,watch,onMounted,nextTick} from 'vue';import QuantityInputComponent from '../../QuantityInputComponent.vue';import {quantityDisplay} from './workOrderHelpers'; // новый код chat
const props=defineProps({task:Object,index:Number,refs:Object,workshopId:Number,materials:Array});const emit=defineEmits(['remove','duplicate']);
// --------- новый код chat: зависимый выбор блока и позиции, включая открытие сохранённой работы
const selectedBlockID = computed({get:()=>props.task.block_id || 0,set:value=>{props.task.block_id=value;}}); // новый код chat: блок сохраняется отдельно от позиции
// новый код chat: длинное название видно целиком, высота увеличивается по мере ввода.
const nameInput = ref(null);
const resizeName = () => { if(nameInput.value){ nameInput.value.style.height='auto'; nameInput.value.style.height=nameInput.value.scrollHeight+'px'; } };
onMounted(resizeName);
watch(()=>props.task.name,()=>nextTick(resizeName));
const blocks = computed(() => props.refs.blocks.filter(block => block.workshop_id === props.workshopId));
const positions = computed(() => props.refs.positions.filter(position => blocks.value.some(block => block.ID === position.block_id))); // новый код chat: все позиции текущего цеха, блок подставляется существующим watcher
watch(() => props.task, task => {
    selectedBlockID.value = task.block_id || props.refs.positions.find(position => position.ID === task.position_id)?.block_id || 0; // новый код chat
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
/* --------- новый код chat: компактные строки ввода с общими заголовками */
.work-task-row td { padding: 6px 4px; vertical-align: top; border-top: 1px solid #e5e9ef; }
.work-task-row:focus-within td { background: #f0f6ff; }
.form-control,.form-select { font-size: 13px; min-height: 32px; padding: 4px 7px; }
.form-select { padding-right: 24px; }
.work-task-name-input { resize: vertical; overflow: hidden; line-height: 1.45; }
.work-row-actions { display:flex; flex-wrap:nowrap; align-items:center; gap:0; } /* новый код chat: все действия в одну строку */
.work-row-actions>label { flex-shrink:0; margin:0 4px 0 0; } /* новый код chat */
.work-row-actions .btn { padding:4px 5px; }
.work-material-row td { background:#f8fafc; padding:5px 4px 7px; border-bottom:1px solid #e5e9ef; }
.work-materials { display:flex; gap:10px; align-items:flex-start; padding-right:8px; }
.work-material-label { font-size:12px; color:#536278; padding-top:6px; }
.work-material-list { flex:1; min-width:0; display:grid; gap:4px; }
.work-material-input { display:grid; grid-template-columns:minmax(180px,1fr) 90px 45px 28px; gap:6px; align-items:center; }
.work-material-input > span { font-size:12px; overflow-wrap:anywhere; }
/* --------- конец нового кода chat */
</style>
<!-- --------- конец нового кода chat -->
