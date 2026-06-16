// auth/js/ui.js

export const toastEl = document.getElementById('toast');
export const confirmModal = document.getElementById('confirm-modal');
export const confirmMessage = document.getElementById('confirm-message');
export const btnConfirmOk = document.getElementById('btn-confirm-ok');
export const btnConfirmCancel = document.getElementById('btn-confirm-cancel');

export function showToast(message, isError = false) {
    if(!toastEl) return;
    toastEl.textContent = message;
    toastEl.className = `toast show${isError ? ' error' : ''}`;
    setTimeout(() => toastEl.classList.remove('show'), isError ? 6000 : 3000);
}

export function showConfirmModal(message) {
    return new Promise((resolve) => {
        if(!confirmModal || !confirmMessage) return resolve(window.confirm(message)); // Fallback

        confirmMessage.textContent = message;
        confirmModal.classList.add('show');

        function cleanup() {
            confirmModal.classList.remove('show');
            btnConfirmOk.removeEventListener('click', onConfirm);
            btnConfirmCancel.removeEventListener('click', onCancel);
            confirmModal.removeEventListener('click', onOverlay);
        }

        function onConfirm() {
            cleanup();
            resolve(true);
        }

        function onCancel() {
            cleanup();
            resolve(false);
        }

        function onOverlay(e) {
            if (e.target === confirmModal) onCancel();
        }

        btnConfirmOk.addEventListener('click', onConfirm);
        btnConfirmCancel.addEventListener('click', onCancel);
        confirmModal.addEventListener('click', onOverlay);
    });
}

export function setTableLoading(prefix, loading) {
    const overlay = document.getElementById(`${prefix}-loading`);
    if (overlay) overlay.style.display = loading ? 'flex' : 'none';
}

export async function compressImage(file, maxWidth = 1920, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height;
            if (w > maxWidth) {
                h = Math.round(h * maxWidth / w);
                w = maxWidth;
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            canvas.toBlob(blob => {
                resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg', lastModified: Date.now() }));
            }, 'image/jpeg', quality);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

export function setupHybridUpload(prefix, onFileSelect, onFileRemove) {
    const toggleBtn = document.getElementById(`${prefix}-btn-toggle`);
    const uploadZone = document.getElementById(`${prefix}-upload-zone`);
    const fileInput = document.getElementById(`${prefix}-file-input`);
    const uploadPreview = document.getElementById(`${prefix}-upload-preview`);
    const previewImg = document.getElementById(`${prefix}-preview-img`);
    const removeBtn = document.getElementById(`${prefix}-btn-remove-file`);
    const textInputId = prefix === 'sp' ? 'sp-foto' : (prefix === 'pat' ? 'pat-logo' : 'lk-thumb');
    const textInput = document.getElementById(textInputId);

    if(!toggleBtn || !uploadZone || !fileInput) return;

    toggleBtn.addEventListener('click', () => {
        const mode = toggleBtn.getAttribute('data-mode');
        if (mode === 'upload') {
            toggleBtn.setAttribute('data-mode', 'url');
            toggleBtn.textContent = prefix === 'sp' ? 'Enviar Foto' : (prefix === 'pat' ? 'Enviar Logo' : 'Enviar Miniatura');
            uploadZone.style.display = 'none';
            uploadPreview.style.display = 'none';
            textInput.style.display = 'block';
        } else {
            toggleBtn.setAttribute('data-mode', 'upload');
            toggleBtn.textContent = 'Usar URL';
            textInput.style.display = 'none';
            if (previewImg.src && !previewImg.src.endsWith('/auth/admin.html') && previewImg.src !== window.location.href) {
                uploadPreview.style.display = 'flex';
            } else {
                uploadZone.style.display = 'flex';
            }
        }
    });

    uploadZone.addEventListener('click', (e) => {
        if (e.target !== fileInput) fileInput.click();
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-active');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-active');
        }, false);
    });

    uploadZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            handleFile(files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFile(fileInput.files[0]);
        }
    });

    async function handleFile(file) {
        try {
            const compressed = await compressImage(file);
            onFileSelect(compressed);
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                uploadZone.style.display = 'none';
                uploadPreview.style.display = 'flex';
            };
            reader.readAsDataURL(compressed);
        } catch(e) {
            showToast('Erro ao processar imagem', true);
            console.error(e);
        }
    }

    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        previewImg.src = '';
        uploadPreview.style.display = 'none';
        uploadZone.style.display = 'flex';
        fileInput.value = '';
        onFileRemove();
    });
}
