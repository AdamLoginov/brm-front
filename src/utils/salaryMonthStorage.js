// --------- новый код chat: выбранный табель отдельно для договора и вкладки
const storageKey = (agreementID, tab) => `salary-month:${agreementID}:${tab}`;

export const rememberSalaryMonth = (agreementID, tab, monthID) => {
    if (!monthID) return;
    try { localStorage.setItem(storageKey(agreementID, tab), String(monthID)); }
    catch { /* Недоступное хранилище не мешает работе страницы. */ }
};

export const restoreSalaryMonth = (agreementID, tab, months) => {
    let saved = null;
    try { saved = localStorage.getItem(storageKey(agreementID, tab)); }
    catch { /* Без хранилища открываем последний доступный табель. */ }
    return months.find(month => String(month.ID) === saved)?.ID ?? months[0]?.ID ?? null;
};
// --------- конец нового кода chat
