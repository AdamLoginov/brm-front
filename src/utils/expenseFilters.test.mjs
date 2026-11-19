// --------- новый код chat: совместная фильтрация и включительные границы периода
import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyExpenseFilters, expenseDateKey, filterExpenses } from './expenseFilters.js';
const rows = [
    { ID: 1, name: 'Покупка бензина', employee_card_id: 10, account: 'employee', is_reimbursed: false, CreatedAt: '2026-11-01T00:00:00' },
    { ID: 2, name: 'БЕНЗИН', employee_card_id: 20, account: 'employee', is_reimbursed: true, CreatedAt: '2026-11-30T23:59:59' },
    { ID: 3, name: 'Доставка', employee_card_id: 30, account: 'company', CreatedAt: '2026-12-01T00:00:00' },
    { ID: 4, name: null, employee_card_id: 0, account: 'none', CreatedAt: '2026-10-31T23:59:59' },
];
const ids = filters => filterExpenses(rows, { ...emptyExpenseFilters(), ...filters }).map(row => row.ID);
test('All filters, case insensitive search, multiple employees and account/status intersection', () => {
    assert.deepEqual(ids({}), [1, 2, 3, 4]);
    assert.deepEqual(ids({ search: ' бензин ', employeeIDs: [10, '20'], account: 'employee', status: 'unreimbursed' }), [1]);
    assert.deepEqual(ids({ status: 'reimbursed' }), [2]);
    assert.deepEqual(ids({ status: 'not_applicable' }), [3, 4]);
    assert.deepEqual(ids({ account: 'company', status: 'unreimbursed' }), []);
    assert.deepEqual(ids({ account: 'none', employeeIDs: [0] }), [4]);
});
test('Inclusive local dates, open boundaries and invalid period', () => {
    assert.deepEqual(ids({ from: '2026-11-01', to: '2026-11-30' }), [1, 2]);
    assert.deepEqual(ids({ from: '2026-11-30', to: '2026-11-30' }), [2]);
    assert.deepEqual(ids({ from: '2026-11-30' }), [2, 3]);
    assert.deepEqual(ids({ to: '2026-11-01' }), [1, 4]);
    assert.deepEqual(ids({ from: '2026-12-01', to: '2026-11-01' }), []);
    assert.equal(expenseDateKey('invalid'), '');
    const date = new Date('2026-11-01T23:30:00Z');
    assert.equal(expenseDateKey(date.toISOString()), `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
});
// --------- конец нового кода chat
// --------- новый код chat: категория сочетается с остальными фильтрами
test('Category filters include uncategorized legacy expenses', () => {
    const expenses = [{ ...rows[0], category_id: 7 }, { ...rows[1], category_id: 8 }, rows[2]];
    const select = extra => filterExpenses(expenses, { ...emptyExpenseFilters(), ...extra }).map(row => row.ID);
    assert.deepEqual(select({ categoryIDs: [7] }), [1]); // новый код chat
    assert.deepEqual(select({ categoryIDs: ['none'] }), [3]);
    assert.deepEqual(select({ categoryIDs: [8], status: 'unreimbursed' }), []);
    assert.deepEqual(select({ categoryIDs: [8], search: 'бензин', employeeIDs: [20] }), [2]);
    assert.deepEqual(select({ categoryIDs: [7, '8'] }), [1, 2]);
    assert.deepEqual(select({ categoryIDs: [7, 'none'] }), [1, 3]);
    assert.deepEqual(select({}), [1, 2, 3]);
});
// --------- конец нового кода chat
// --------- новый код chat: выбранная дата важнее технического времени записи
test('Expense date overrides CreatedAt and remains a calendar date', () => {
    const expense = { ...rows[0], expense_date: '2026-09-15' };
    assert.equal(expenseDateKey(expense.expense_date), '2026-09-15');
    assert.deepEqual(filterExpenses([expense], { ...emptyExpenseFilters(), from: '2026-09-15', to: '2026-09-15' }), [expense]);
    assert.deepEqual(filterExpenses([expense], { ...emptyExpenseFilters(), from: '2026-11-01' }), []);
});
// --------- конец нового кода chat
