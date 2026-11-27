// --------- новый код chat: файлы открывает браузер, JavaScript получает только разрешение
let pendingSession = null;
export const documentFileUrl = id => `/api/files/documents/${encodeURIComponent(id)}`;
export const attachmentFileUrl = id => `/api/files/attachments/${encodeURIComponent(id)}`;
export const ensureFileAccess = () => {
    if (pendingSession) return pendingSession;
    const token = localStorage.getItem('user-token');
    if (!token) return Promise.reject(new Error('Войдите в систему для просмотра файла.'));
    pendingSession = fetch('/api/files/session', {method:'POST', credentials:'same-origin', headers:{Authorization:`Bearer ${token}`}})
        .then(response => { if (!response.ok) throw new Error(response.status === 401 ? 'Вход устарел. Войдите в систему повторно.' : 'Не удалось получить доступ к файлу.'); })
        .finally(() => { pendingSession = null; });
    return pendingSession;
};
export const clearFileAccess = async() => {
    // Если выдача cookie уже началась, удаляем её после завершения запроса.
    if (pendingSession) await pendingSession.catch(() => {});
    const response = await fetch('/api/files/logout', {method:'POST', credentials:'same-origin'});
    if (!response.ok) throw new Error('Не удалось завершить доступ к файлам. Повторите выход.');
};
export const openDocumentFile = async (id, url = documentFileUrl(id)) => { // новый код chat
    const tab = window.open('about:blank','_blank');
    if (!tab) { window.alert('Разрешите открытие новой вкладки для просмотра документа.'); return; }
    tab.opener = null;
    tab.document.title = 'Загрузка документа';
    tab.document.body.textContent = 'Открываем документ…';
    try {
        await ensureFileAccess();
        if (!tab.closed) tab.location.replace(url);
    } catch (error) { tab.close(); window.alert(error.message); }
};
// --------- конец нового кода chat
