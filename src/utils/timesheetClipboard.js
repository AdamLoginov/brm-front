// --------- новый код chat: диапазоны и буфер обмена табеля
export const normalizeTimesheetValue = raw => {
    const value = String(raw ?? '').trim().toUpperCase();
    if (value === '' || ['П', 'Б', 'Д', 'В'].includes(value)) return value;
    if (/^\d{1,2}$/.test(value) && Number(value) <= 24) return String(Number(value));
    return null;
};

export const timesheetRange = (anchor, end = anchor) => anchor && end ? {
    top:Math.min(anchor.row, end.row), bottom:Math.max(anchor.row, end.row),
    left:Math.min(anchor.col, end.col), right:Math.max(anchor.col, end.col),
} : null;

export const parseTimesheetClipboard = text => {
    if (text.length > 1000000) throw new Error('Слишком большая область для вставки.');
    const normalized = text.replace(/\r\n?/g, '\n').replace(/\n$/, '');
    const rows = normalized.split('\n').map(row => row.split('\t'));
    const width = rows[0].length;
    if (rows.some(row => row.length !== width)) throw new Error('Скопированная область должна быть прямоугольной.');
    return rows.map((row, rowIndex) => row.map((cell, colIndex) => {
        const value = normalizeTimesheetValue(cell);
        if (value === null) throw new Error(`Недопустимое значение в строке ${rowIndex + 1}, столбце ${colIndex + 1}: «${cell.slice(0, 30)}». Допустимы 0–24, П, Б, Д, В и пустые ячейки.`);
        return value;
    }));
};

export const planTimesheetPaste = (text, range, rowCount, colCount) => {
    if (!range) throw new Error('Выберите ячейку для вставки.');
    const values = parseTimesheetClipboard(text);
    const fill = values.length === 1 && values[0].length === 1;
    const height = fill ? range.bottom - range.top + 1 : values.length;
    const width = fill ? range.right - range.left + 1 : values[0].length;
    if (range.top < 0 || range.left < 0 || range.top + height > rowCount || range.left + width > colCount) throw new Error('Область вставки выходит за границы сотрудников или дней месяца.');
    const changes = [];
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) changes.push({row:range.top + row, col:range.left + col, value:fill ? values[0][0] : values[row][col]});
    }
    return {changes, range:{top:range.top, left:range.left, bottom:range.top + height - 1, right:range.left + width - 1}};
};

export const copyTimesheetRange = (range, getValue) => {
    const rows = [];
    for (let row = range.top; row <= range.bottom; row++) {
        const cells = [];
        for (let col = range.left; col <= range.right; col++) cells.push(String(getValue(row, col) ?? ''));
        rows.push(cells.join('\t'));
    }
    return rows.join('\r\n') + '\r\n'; // новый код chat: завершающий перенос сохраняет последнюю пустую строку при вставке
};

export const updateTimesheetCell = (item = {}, value) => {
    if (value === (item.status ?? '')) return item;
    const persisted = !!item.id;
    return {...item, status:value, state:persisted ? (value === '' ? 'Delete' : 'Update') : (value === '' ? '' : 'Create')};
};
// --------- конец нового кода chat
