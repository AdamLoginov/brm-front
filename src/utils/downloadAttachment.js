// --------- новый код chat: браузер скачивает вложение напрямую с авторизацией cookie
import { ensureFileAccess, attachmentFileUrl } from './fileAccess';
export async function downloadAttachment(attachment) {
    return downloadProtectedFile(attachmentFileUrl(attachment.ID), attachment.file_name);
}
// новый код chat: скачивание по защищённой ссылке без открытия вкладки
export async function downloadProtectedFile(url, filename) {
    try {
        await ensureFileAccess();
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || 'attachment';
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) { window.alert(error.message || 'Не удалось скачать файл.'); }
}
// --------- конец нового кода chat
