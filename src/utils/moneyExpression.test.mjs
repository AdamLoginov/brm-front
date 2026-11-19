// --------- новый код chat: проверка арифметики и отклонения некорректных формул
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMoneyExpression } from './moneyExpression.js';

test('Money expressions: precedence, parentheses, decimals and rounding', () => {
    for (const [input, expected] of [
        ['=1*2', '2.00'], ['=1000+500*2', '2000.00'], ['=(1000+500)/3', '500.00'],
        ['=1 000 - 250', '750.00'], ['=12,5*2', '25.00'], ['=10/3', '3.33'],
        ['=1.005', '1.01'], ['=0.1+0.2', '0.30'], ['=-5+10', '5.00'], ['=5-5', '0.00'],
    ]) assert.equal(calculateMoneyExpression(input), expected, input);
});
test('Reject malformed expressions, division by zero, negative and unsafe results', () => {
    for (const input of ['=', '=2+', '=(1+2', '=1/0', '=5/(3-3)', '=1-2', '=2**3', '=alert(1)', '=1;2', '=9999999999999999999']) {
        assert.throws(() => calculateMoneyExpression(input), undefined, input);
    }
});
// --------- конец нового кода chat
