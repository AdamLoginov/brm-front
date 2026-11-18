// новый код chat: отсутствие данных, категории и сочетания условий
import test from 'node:test';
import assert from 'node:assert/strict';
import { employeeFields, employeeCell, buildDocumentColumns, buildEmployeeRow, matchesEmployeeConditions, employeePhones } from './employeeCompleteness.js';
const field = key => employeeFields.find(item => item.key === key);

test('false и ноль заполнены, пробелы и нулевая дата — пропуски', () => {
  assert.equal(employeeCell({ status: false }, field('status')).text, 'Работает');
  assert.equal(employeeCell({ is_itr: false }, field('is_itr')).state, 'filled');
  assert.equal(employeeCell({ salary_rate: '0' }, field('salary_rate')).state, 'filled');
  assert.equal(employeeCell({ officially_employed: true, monthly_salary_kopecks: 0 }, field('monthly_salary_kopecks')).state, 'filled');
  for (const value of [null, undefined, '', '  ']) assert.equal(employeeCell({ email: value }, field('email')).state, 'missing');
  for (const value of ['', '0001-01-01T00:00:00Z', 'недопустимая дата']) assert.equal(employeeCell({ start_date: value }, field('start_date')).state, 'missing');
  assert.equal(employeeCell({ height_cm: 0 }, field('height_cm')).state, 'missing');
  assert.equal(employeeCell({ agreement_id: 0 }, field('agreement_id')).state, 'missing');
});

test('неприменимая зарплата не соответствует ни есть, ни нет', () => {
  const row = buildEmployeeRow({ officially_employed: false }, employeeFields);
  assert.equal(row.cells.monthly_salary_kopecks.state, 'na');
  for (const operator of ['filled', 'missing']) assert.equal(matchesEmployeeConditions(row, [{ key: 'monthly_salary_kopecks', operator }]), false);
  assert.equal(matchesEmployeeConditions(row, [{ key: 'monthly_salary_kopecks', operator: 'na' }]), true);
});

test('телефоны очищаются, старый телефон используется при пустом массиве', () => {
  assert.deepEqual(employeePhones({ phones: [' ', null], phone: '+7 123' }), ['+7 123']);
  assert.deepEqual(employeePhones({ phones: [' +7 123 ', '+7 123', '+7 456'], phone: 'старый' }), ['+7 123', '+7 456']);
});

test('категории сравниваются по ID, учитываются все файлы и отсутствующие категории', () => {
  const employee = { employee_documents: [
    { ID: 1, category_employee_document_id: 10, file_name: 'паспорт.pdf' },
    { ID: 2, category_employee_document_id: 10, file_name: 'паспорт-2.pdf' },
    { ID: 3, category_employee_document_id: 90, file_name: 'старый.pdf' },
  ] };
  const columns = buildDocumentColumns([{ ID: 10, category_name: 'Паспорт' }, { ID: 20, category_name: 'Паспорт' }, { ID: 30, category_name: 'Фото' }], [employee]);
  const row = buildEmployeeRow(employee, columns);
  assert.equal(row.cells['document:10'].files.length, 2);
  assert.equal(row.cells['document:20'].state, 'missing');
  assert.equal(row.missingDocuments, 2);
  assert.equal(row.cells['document:90'].files.length, 1);
  assert.equal(columns.find(c => c.key === 'document:90').requiredCategory, false);
});

test('И/ИЛИ и текстовые условия независимы от отображаемых столбцов', () => {
  const row = buildEmployeeRow({ email: 'test@example.ru', place_of_residence: 'Орёл', status: false }, employeeFields);
  const conditions = [{ key: 'phones', operator: 'missing' }, { key: 'email', operator: 'missing' }];
  assert.equal(matchesEmployeeConditions(row, conditions, 'all'), false);
  assert.equal(matchesEmployeeConditions(row, conditions, 'any'), true);
  assert.equal(matchesEmployeeConditions(row, [{ key: 'place_of_residence', operator: 'contains', value: ' ОРЕЛ ' }]), true);
  assert.equal(matchesEmployeeConditions(row, [{ key: 'status', operator: 'equals', value: 'работает' }]), true);
  assert.equal(matchesEmployeeConditions(row, [{ key: 'email', operator: 'contains', value: ' ' }]), false);
  assert.equal(matchesEmployeeConditions(row, []), true);
});
