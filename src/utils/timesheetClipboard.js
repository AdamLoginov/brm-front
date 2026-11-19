// --------- новый код chat: диапазоны и буфер обмена табеля
export const normalizeTimesheetValue = raw => {
    const value = String(raw ?? '').trim().toUpperCase();
    if (value === '' || ['П', 'Б', 'Д', 'В', 'О'].includes(value)) return value; // новый код chat: О — отпуск
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
        if (value === null) throw new Error(`Недопустимое значение в строке ${rowIndex + 1}, столбце ${colIndex + 1}: «${cell.slice(0, 30)}». Допустимы 0–24, П, Б, Д, В, О и пустые ячейки.`); // новый код chat
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

// --------- новый код chat: снимок одной операции для отмены всего диапазона
export const planTimesheetEdit = (changes, getItem) => changes.flatMap(change => {
    const before = getItem(change.row,change.col) || {};
    const after = updateTimesheetCell(before,change.value);
    return before === after ? [] : [{row:change.row,col:change.col,before:{...before},after}];
});
// --------- конец нового кода chat
// --------- новый код chat: протягивание прямоугольного шаблона по одной оси
export const timesheetFillRange = (source, target) => {
    // новый код chat: одиночную ячейку можно размножить прямоугольником по диагонали
    if (source.top === source.bottom && source.left === source.right) return {
        top:Math.min(source.top,target.row), bottom:Math.max(source.bottom,target.row),
        left:Math.min(source.left,target.col), right:Math.max(source.right,target.col),
    };
    const vertical = target.row < source.top ? target.row - source.top : Math.max(0, target.row - source.bottom);
    const horizontal = target.col < source.left ? target.col - source.left : Math.max(0, target.col - source.right);
    if (Math.abs(vertical) >= Math.abs(horizontal)) return {...source, top:Math.min(source.top,target.row), bottom:Math.max(source.bottom,target.row)};
    return {...source, left:Math.min(source.left,target.col), right:Math.max(source.right,target.col)};
};

export const planTimesheetFill = (source, target, rowCount, colCount, getValue) => {
    const range = timesheetFillRange(source,target);
    if (range.top < 0 || range.left < 0 || range.bottom >= rowCount || range.right >= colCount) throw new Error('Протягивание выходит за границы табеля.');
    const height = source.bottom - source.top + 1, width = source.right - source.left + 1;
    const pattern = [];
    for (let row = source.top; row <= source.bottom; row++) {
        const values = [];
        for (let col = source.left; col <= source.right; col++) {
            const value = normalizeTimesheetValue(getValue(row,col));
            if (value === null) throw new Error('В выделенном шаблоне есть недопустимое значение. Исправьте его перед протягиванием.');
            values.push(value);
        }
        pattern.push(values);
    }
    const changes = [], mod = (value,size) => ((value % size) + size) % size;
    for (let row = range.top; row <= range.bottom; row++) {
        for (let col = range.left; col <= range.right; col++) {
            if (row >= source.top && row <= source.bottom && col >= source.left && col <= source.right) continue;
            changes.push({row,col,value:pattern[mod(row-source.top,height)][mod(col-source.left,width)]});
        }
    }
    return {range,changes};
};
// --------- конец нового кода chat
