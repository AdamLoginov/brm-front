// --------- новый код chat: арифметика денежных полей без eval и выполнения JavaScript
export function calculateMoneyExpression(value) {
    const source = String(value).trim().replace(/^=/, '').replace(/\s/g, '').replace(/,/g, '.');
    if (!source || source.length > 256 || /[^\d.+\-*/()]/.test(source)) throw new Error('Проверьте выражение: допустимы числа, +, −, *, / и скобки.');
    let position = 0;
    const fail = () => { throw new Error('Некорректное выражение. Проверьте числа, операции и скобки.'); };
    const factor = () => {
        if (source[position] === '+' || source[position] === '-') {
            const sign = source[position++];
            return (sign === '-' ? -1 : 1) * factor();
        }
        if (source[position] === '(') {
            position++;
            const value = sum();
            if (source[position++] !== ')') fail();
            return value;
        }
        const match = source.slice(position).match(/^(?:\d+(?:\.\d+)?|\.\d+)/);
        if (!match) fail();
        position += match[0].length;
        return Number(match[0]);
    };
    const product = () => {
        let value = factor();
        while (source[position] === '*' || source[position] === '/') {
            const operation = source[position++];
            const right = factor();
            if (operation === '/' && right === 0) throw new Error('Нельзя делить на ноль.');
            value = operation === '*' ? value * right : value / right;
        }
        return value;
    };
    const sum = () => {
        let value = product();
        while (source[position] === '+' || source[position] === '-') {
            const operation = source[position++];
            const right = product();
            value = operation === '+' ? value + right : value - right;
        }
        return value;
    };
    const result = sum();
    if (position !== source.length) fail();
    if (!Number.isFinite(result) || Math.abs(result * 100) > Number.MAX_SAFE_INTEGER) throw new Error('Результат слишком большой.');
    if (result < 0) throw new Error('Сумма расхода не может быть отрицательной.');
    return (Math.round((result + Number.EPSILON * Math.max(1, result)) * 100) / 100).toFixed(2);
}
// --------- конец нового кода chat
