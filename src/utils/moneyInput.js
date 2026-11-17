// --------- новый код chat: строковое форматирование денег без потери копеек
export const normalizeMoneyInput = value => String(value ?? '').replace(/[ \u00a0\u202f]/g, '').replace(/,/g, '.');

export const formatMoneyInput = value => {
    const text = normalizeMoneyInput(value);
    // Ошибочное значение оставляем видимым для проверки в форме, не превращаем его в другую сумму.
    if (!/^\d*(?:\.\d*)?$/.test(text)) return text;
    const [whole, fraction] = text.split('.');
    return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (fraction === undefined ? '' : ',' + fraction);
};

export const moneyInputCaret = (text, count) => {
    if (count <= 0) return 0;
    let seen = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] !== ' ' && ++seen === count) return i + 1;
    }
    return text.length;
};
// --------- конец нового кода chat
