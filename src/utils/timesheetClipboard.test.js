// --------- новый код chat: проверки диапазонов, вставки и состояний сохранения
import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTimesheetValue, timesheetRange, parseTimesheetClipboard, planTimesheetPaste, copyTimesheetRange, updateTimesheetCell} from './timesheetClipboard.js';

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
// --------- конец нового кода chat
