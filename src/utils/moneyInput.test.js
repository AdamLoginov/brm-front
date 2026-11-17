// --------- новый код chat: точность, вставка и позиция курсора денежного поля
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMoneyInput, normalizeMoneyInput, moneyInputCaret } from './moneyInput.js';

test('разряды и копейки форматируются без числового округления', () => {
    assert.equal(formatMoneyInput('125000.50'), '125 000,50');
    assert.equal(formatMoneyInput('90071992547409.91'), '90 071 992 547 409,91');
    assert.equal(formatMoneyInput('500'), '500');
    assert.equal(formatMoneyInput(''), '');
    assert.equal(formatMoneyInput('1000.'), '1 000,');
});
test('вставка сумм с обычными и неразрывными пробелами', () => {
    assert.equal(normalizeMoneyInput('1\u00a0234\u202f567,89'), '1234567.89');
    assert.equal(normalizeMoneyInput(formatMoneyInput('1234567.89')), '1234567.89');
    assert.equal(formatMoneyInput('-100'), '-100');
    assert.equal(formatMoneyInput('12.34.56'), '12.34.56');
});
test('курсор сохраняет позицию среди цифр при изменении группировки', () => {
    assert.equal(moneyInputCaret('12 345', 3), 4);
    assert.equal(moneyInputCaret('1 234,50', 6), 7);
    assert.equal(moneyInputCaret('1 234', 0), 0);
});
// --------- конец нового кода chat
