// --------- новый код chat: проверки диапазонов, вставки и состояний сохранения
import test from 'node:test';
import assert from 'node:assert/strict';
// --------- новый код chat: диагональное заполнение во всех направлениях
test('одна ячейка заполняет прямоугольник по диагонали', () => {
    const source = {top:2,bottom:2,left:2,right:2};
    for (const target of [{row:0,col:0},{row:0,col:4},{row:4,col:0},{row:4,col:4}]) {
        const plan = planTimesheetFill(source,target,5,5,() => '12');
        assert.equal(plan.changes.length,8);
        assert.ok(plan.changes.every(cell => cell.value === '12' && !(cell.row === 2 && cell.col === 2)));
        assert.ok(plan.changes.some(cell => cell.row === target.row && cell.col === target.col));
    }
});
// --------- конец нового кода chat
import {planTimesheetEdit} from './timesheetClipboard.js'; // новый код chat: проверка истории отмены

// --------- новый код chat: отмена диапазона восстанавливает значения и состояния записи
test('снимок операции восстанавливает сохранённые и новые ячейки после нескольких изменений', () => {
    const original = [{id:7,status:'12',state:'Server',time_sheet_month_id:4},{}];
    const cells = original.map(cell => ({...cell}));
    const history = [];
    for (const values of [['8','12'],['','']]) {
        const operation = planTimesheetEdit(values.map((value,col) => ({row:0,col,value})),(_,col) => cells[col]);
        history.push(operation);
        for (const change of operation) cells[change.col] = change.after;
    }
    assert.equal(cells[0].state,'Delete');
    for (const change of history.pop()) cells[change.col] = {...change.before};
    assert.equal(cells[0].status,'8');
    assert.equal(cells[1].state,'Create');
    for (const change of history.pop()) cells[change.col] = {...change.before};
    assert.deepEqual(cells,original);
    assert.deepEqual(planTimesheetEdit([{row:0,col:0,value:'12'}],(_,col) => cells[col]),[]);
});
// --------- конец нового кода chat
import {normalizeTimesheetValue, timesheetRange, parseTimesheetClipboard, planTimesheetPaste, copyTimesheetRange, updateTimesheetCell, planTimesheetFill} from './timesheetClipboard.js'; // новый код chat: проверка протягивания
// --------- новый код chat: не работает на объекте доступен при вводе, вставке и протягивании
test('отметка отсутствия на объекте нормализуется и заполняет область', () => {
    assert.equal(normalizeTimesheetValue(' н '), 'Н');
    assert.deepEqual(parseTimesheetClipboard('Н\t12\nп\tн'), [['Н', '12'], ['П', 'Н']]);
    const plan = planTimesheetFill({top:0,bottom:0,left:0,right:0}, {row:1,col:1}, 2, 2, () => 'Н');
    assert.equal(plan.changes.length, 3);
    assert.ok(plan.changes.every(cell => cell.value === 'Н'));
});
// --------- конец нового кода chat

test('табличный текст Excel: CRLF, пустые ячейки и буквенные отметки', () => {
    assert.deepEqual(parseTimesheetClipboard('12\tп\t\r\n0\t\t24\r\n'), [['12','П',''],['0','','24']]);
    assert.deepEqual(parseTimesheetClipboard('12\n\n'), [['12'],['']]);
    assert.deepEqual(parseTimesheetClipboard(''), [['']]);
    assert.equal(normalizeTimesheetValue(' в '), 'В');
    for (const value of ['25','-1','1.5','=SUM(A1)','x']) assert.equal(normalizeTimesheetValue(value),null);
});
test('обратное выделение и копирование сохраняют форму и пустоты', () => {
    const range = timesheetRange({row:2,col:3},{row:1,col:1});
    assert.deepEqual(range,{top:1,bottom:2,left:1,right:3});
    assert.equal(copyTimesheetRange(range,(row,col) => col===2 ? '' : `${row}`), '1\t\t1\r\n2\t\t2\r\n');
    const copied = copyTimesheetRange({top:0,bottom:1,left:0,right:0},row => row === 0 ? '12' : '');
    assert.deepEqual(parseTimesheetClipboard(copied), [['12'],['']]);
});
test('одна ячейка заполняет всю выделенную область', () => {
    const plan = planTimesheetPaste('б',{top:1,bottom:2,left:2,right:4},4,31);
    assert.equal(plan.changes.length,6);
    assert.ok(plan.changes.every(cell => cell.value==='Б'));
    assert.deepEqual(plan.changes[5],{row:2,col:4,value:'Б'});
});
test('блок вставляется от верхнего левого угла, а не размножается', () => {
    const plan = planTimesheetPaste('12\tП\n\t0',{top:1,bottom:4,left:3,right:8},5,31);
    assert.deepEqual(plan.range,{top:1,left:3,bottom:2,right:4});
    assert.deepEqual(plan.changes[2],{row:2,col:3,value:''});
});
test('ошибки во всём блоке и выход за границы отклоняют план целиком', () => {
    const range={top:1,bottom:1,left:30,right:30};
    assert.throws(() => planTimesheetPaste('12\t13',range,3,31),/границы/);
    assert.throws(() => planTimesheetPaste('12\n13\n14',range,3,31),/границы/);
    assert.throws(() => planTimesheetPaste('12\t25',range,3,31),/Недопустимое/);
    assert.throws(() => parseTimesheetClipboard('12\tП\n12'),/прямоугольной/);
});
test('сохранённые и новые ячейки корректно создаются, меняются и очищаются', () => {
    const stored={id:7,status:'П',state:'Server'};
    assert.deepEqual(updateTimesheetCell(stored,''),{id:7,status:'',state:'Delete'});
    assert.deepEqual(updateTimesheetCell(updateTimesheetCell(stored,''),'12'),{id:7,status:'12',state:'Update'});
    assert.deepEqual(updateTimesheetCell({},'0'),{status:'0',state:'Create'});
    assert.deepEqual(updateTimesheetCell({status:'12',state:'Create'},''),{status:'',state:''});
    assert.equal(updateTimesheetCell(stored,'П'),stored);
    assert.equal(stored.status,'П');
});
test('протягивание вправо повторяет шаблон, не изменяя исходные ячейки', () => {
    const values = ['12','12','В'];
    const plan = planTimesheetFill({top:0,bottom:0,left:0,right:2},{row:0,col:7},3,31,(_,col) => values[col]);
    assert.deepEqual(plan.changes.map(cell => cell.value),['12','12','В','12','12']);
    assert.ok(plan.changes.every(cell => cell.col > 2));
    assert.deepEqual(values,['12','12','В']);
});
test('протягивание влево и вверх продолжает шаблон в обратном направлении', () => {
    const left = planTimesheetFill({top:0,bottom:0,left:3,right:5},{row:0,col:0},4,31,(_,col) => ['12','12','В'][col-3]);
    assert.deepEqual(left.changes.map(cell => cell.value),['12','12','В']);
    const up = planTimesheetFill({top:3,bottom:4,left:0,right:0},{row:0,col:0},5,31,row => row === 3 ? '12' : 'В');
    assert.deepEqual(up.changes.map(cell => cell.value),['В','12','В']);
});
test('протягивание блока вниз сохраняет столбцы и повторяет пустые значения', () => {
    const values = [['12',''],['В','0']];
    const plan = planTimesheetFill({top:0,bottom:1,left:0,right:1},{row:4,col:1},5,31,(row,col) => values[row][col]);
    assert.deepEqual(plan.changes.map(cell => cell.value),['12','','В','0','12','']);
    assert.deepEqual(plan.range,{top:0,bottom:4,left:0,right:1});
});
test('одиночное значение, отмена внутри исходной области и ошибки протягивания', () => {
    const source = {top:1,bottom:1,left:1,right:1};
    assert.deepEqual(planTimesheetFill(source,{row:3,col:1},4,31,()=>'П').changes.map(cell => cell.value),['П','П']);
    assert.equal(planTimesheetFill(source,{row:1,col:1},4,31,()=>'П').changes.length,0);
    assert.throws(() => planTimesheetFill(source,{row:5,col:1},4,31,()=>'П'),/границы/);
    assert.throws(() => planTimesheetFill(source,{row:2,col:1},4,31,()=>'25'),/недопустимое/);
});
// --------- конец нового кода chat
