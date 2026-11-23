// --------- новый код chat: отображение точных величин и ответы API
export const workError = error => typeof error.response?.data === 'string' ? error.response.data.trim() : 'Не удалось сохранить или загрузить данные';
export const emptyWorkReferences = () => ({ units: [], workshops: [], blocks: [], positions: [], employees: [] });
export const workQuantity = task => task.quantity_thousandths ?? (task.quantity_hundredths || 0) * 10; // новый код chat: точные объёмы и старые записи
export const quantityText = (value, digits = 3) => {
    const number = Number(value || 0);
    return (number / (10 ** digits)).toFixed(digits).replace(/\.?0+$/, '') || '0';
};
export const quantityDisplay = (value, digits = 3) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(Number(value || 0) / (10 ** digits));
export const scaledQuantity = (text, digits = 2) => {
    const parts = String(text ?? '').trim().replace(',', '.').split('.');
    if (parts.length > 2 || !/^\d{1,9}$/.test(parts[0]) || (parts.length === 2 && !new RegExp(`^\\d{1,${digits}}$`).test(parts[1]))) return null;
    return Number(parts[0]) * 10 ** digits + Number((parts[1] || '').padEnd(digits, '0'));
};
export const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const employeeName = e => [e.surname, e.name, e.middle_name].filter(Boolean).join(' ');
// --------- конец нового кода chat
