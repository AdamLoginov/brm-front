// --------- новый код chat: браузер скачивает вложение напрямую с авторизацией cookie
import { ensureFileAccess, attachmentFileUrl } from './fileAccess';
export async function downloadAttachment(attachment) {
    try {
        await ensureFileAccess();
        const link = document.createElement('a');
        link.href = attachmentFileUrl(attachment.ID);
        link.download = attachment.file_name || 'attachment';
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) { window.alert(error.message || 'Не удалось скачать файл.'); }
}
// --------- конец нового кода chat
