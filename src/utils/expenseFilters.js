// --------- новый код chat: совместные фильтры расходов по отображаемой локальной дате
export const emptyExpenseFilters = () => ({ search: '', employeeIDs: [], account: '', status: '', from: '', to: '' });

export const expenseDateKey = value => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value; // новый код chat: календарная дата без сдвига часового пояса
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const filterExpenses = (expenses, filters) => {
    if (filters.from && filters.to && filters.from > filters.to) return [];
    const search = filters.search.trim().toLocaleLowerCase('ru');
    const employees = new Set(filters.employeeIDs.map(Number));
    return (expenses || []).filter(item => {
        if (search && !String(item.name || '').toLocaleLowerCase('ru').includes(search)) return false;
        if (employees.size && !employees.has(Number(item.employee_card_id || item.employee_card?.ID || 0))) return false;
        if (filters.account && item.account !== filters.account) return false;
        if (filters.status === 'reimbursed' && (item.account !== 'employee' || !item.is_reimbursed)) return false;
        if (filters.status === 'unreimbursed' && (item.account !== 'employee' || item.is_reimbursed)) return false;
        if (filters.status === 'not_applicable' && item.account === 'employee') return false;
        if (filters.from || filters.to) {
            const date = expenseDateKey(item.expense_date || item.CreatedAt); // новый код chat: прежняя дата для старых расходов
            if (!date || (filters.from && date < filters.from) || (filters.to && date > filters.to)) return false;
        }
        return true;
    });
};
// --------- конец нового кода chat
