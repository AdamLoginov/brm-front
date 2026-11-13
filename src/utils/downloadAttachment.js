import api from '../api';

export async function downloadAttachment(attachment) {
    try {
        const response = await api.get(`/attachment/${attachment.ID}`, { responseType: 'blob' });
        const url = URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.file_name || 'attachment';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
        window.alert('Не удалось скачать файл. Проверьте вход в систему и наличие файла.');
    }
}
