<!-- новый код chat: единое представление вложений задач -->
<template>
    <button ref="card" type="button" class="attachment" :title="(image || pdf ? 'Открыть: ' : 'Скачать: ') + file.name" @click="activateFile">
        <span class="preview" aria-hidden="true">
            <img v-if="ready && image && !failed" :src="url" alt="" @error="failed = true">
            <canvas v-else-if="pdf && !failed" v-show="rendered" ref="canvas"></canvas>
            <span v-if="!(image && ready && !failed) && !rendered" class="placeholder-file">
                <i class="bi bi-file-earmark"></i>{{ extension }}
            </span>
        </span>
        <span class="filename">{{ file.name }}</span>
    </button>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { ensureFileAccess, openDocumentFile } from '../../../utils/fileAccess';
import { downloadProtectedFile } from '../../../utils/downloadAttachment'; // новый код chat
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const props = defineProps({ file: { type: Object, required: true } });
const card = ref(null), canvas = ref(null);
const ready = ref(false), failed = ref(false), rendered = ref(false);
const pdf = computed(() => props.file.mime === 'application/pdf');
const image = computed(() => /^image\/(jpeg|png|gif|webp|avif)$/.test(props.file.mime));
const extension = computed(() => props.file.name.match(/\.([^.]{1,10})$/)?.[1].toUpperCase() || 'Файл');
// новый код chat: локальная миниатюра использует выбранный файл до отправки
const localUrl = props.file.source ? URL.createObjectURL(props.file.source) : '';
const url = computed(() => localUrl || '/api/files/tasks/' + encodeURIComponent(props.file.id));
let observer, loading, disposed = false;

function activateFile() { // новый код chat
    if (localUrl) {
        const link = document.createElement('a');
        link.href = localUrl;
        if (image.value || pdf.value) {
            link.target = '_blank';
            link.rel = 'noopener';
        } else {
            link.download = props.file.name;
        }
        link.click();
        return;
    }
    if (image.value || pdf.value) return openDocumentFile(props.file.id, url.value);
    return downloadProtectedFile(url.value, props.file.name);
}

async function preview() {
    try {
        if (!localUrl) await ensureFileAccess();
        if (disposed) return;
        ready.value = true;
        if (!pdf.value) return;
        const renderer = await import('pdfjs-dist');
        if (disposed) return;
        renderer.GlobalWorkerOptions.workerSrc = workerUrl;
        loading = renderer.getDocument({ url: url.value, isEvalSupported: false, disableAutoFetch: true, disableStream: true });
        const document = await loading.promise;
        const page = await document.getPage(1);
        if (disposed) return;
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(240 / base.width, 156 / base.height) });
        canvas.value.width = Math.ceil(viewport.width);
        canvas.value.height = Math.ceil(viewport.height);
        await page.render({ canvas: canvas.value, viewport }).promise;
        rendered.value = true;
    } catch {
        failed.value = true;
    } finally {
        if (loading) { const task = loading; loading = null; await task.destroy(); }
    }
}
onMounted(() => {
    if (!image.value && !pdf.value) return;
    observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
            observer.disconnect();
            preview();
        }
    });
    observer.observe(card.value);
});
onBeforeUnmount(() => {
    disposed = true;
    observer?.disconnect();
    if (localUrl) URL.revokeObjectURL(localUrl);
    if (loading) { loading.destroy(); loading = null; }
});
</script>

<style scoped>
.attachment { width: 120px; padding: 0; margin: 4px 0; background: white; color: #212529; border: 1px solid #dee2e6; border-radius: 7px; overflow: hidden; text-align: left; }
.attachment:hover, .attachment:focus-visible { border-color: #0d6efd; }
.preview { height: 78px; background: #eef0f2; display: grid; place-items: center; }
.preview img { width: 100%; height: 78px; object-fit: contain; }
.preview canvas { max-width: 100%; max-height: 78px; }
.placeholder-file { display: grid; justify-items: center; color: #495057; font-size: 11px; }
.placeholder-file i { font-size: 23px; }
.filename { display: block; padding: 4px 7px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
</style>
