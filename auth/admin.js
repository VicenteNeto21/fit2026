/* ========================================================
   FIT 2026 — Lógica do Painel Administrativo
   Integração Unificada com Supabase (Links, Palestrantes, Patrocinadores)
   Zero Dependências de Firebase
   ======================================================== */

// ── Globais e Referências de Elementos do DOM ───────────
let supabaseClient = null;
let loadedLinks = [];
let loadedSpeakers = [];
let loadedSponsors = [];

let editingSpeakerId = null;
let editingSponsorId = null;
let editingLinkId = null;

let spSelectedFile = null;
let patSelectedFile = null;
let lkSelectedFile = null;

// Wrappers principais
const adminWrapper = document.getElementById('admin-wrapper');

// Formulários
const speakerForm = document.getElementById('speaker-form');
const sponsorForm = document.getElementById('sponsor-form');
const linkForm = document.getElementById('link-form');

// Botões
const logoutBtn = document.getElementById('logout-btn');
const btnAddSpeaker = document.getElementById('btn-add-speaker');
const btnAddSponsor = document.getElementById('btn-add-sponsor');
const btnAddLink = document.getElementById('btn-add-link');

// Mensagens de Erro e Status
const userEmail = document.getElementById('user-email');
const toastEl = document.getElementById('toast');
const sbStatusDot = document.getElementById('sb-status-dot');
const sbStatusText = document.getElementById('sb-status-text');

// Modais
const speakerModal = document.getElementById('speaker-modal');
const sponsorModal = document.getElementById('sponsor-modal');
const linkModal = document.getElementById('link-modal');
const supabaseModal = document.getElementById('supabase-modal');
const confirmModal = document.getElementById('confirm-modal');
const confirmMessage = document.getElementById('confirm-message');
const btnConfirmOk = document.getElementById('btn-confirm-ok');
const btnConfirmCancel = document.getElementById('btn-confirm-cancel');

// Tabelas
const speakersTable = document.getElementById('speakers-table-body');
const sponsorsTable = document.getElementById('sponsors-table-body');
const linksTableBody = document.getElementById('links-table-body');

// ── Helper functions for Hybrid File Upload & Supabase Storage ──
function setupHybridUpload(prefix, onFileSelect, onFileRemove) {
    const toggleBtn = document.getElementById(`${prefix}-btn-toggle`);
    const uploadZone = document.getElementById(`${prefix}-upload-zone`);
    const fileInput = document.getElementById(`${prefix}-file-input`);
    const uploadPreview = document.getElementById(`${prefix}-upload-preview`);
    const previewImg = document.getElementById(`${prefix}-preview-img`);
    const removeBtn = document.getElementById(`${prefix}-btn-remove-file`);
    const textInputId = prefix === 'sp' ? 'sp-foto' : (prefix === 'pat' ? 'pat-logo' : 'lk-thumb');
    const textInput = document.getElementById(textInputId);

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
        const compressed = await compressImage(file);
        onFileSelect(compressed);
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            uploadZone.style.display = 'none';
            uploadPreview.style.display = 'flex';
        };
        reader.readAsDataURL(compressed);
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

async function uploadImageToStorage(folder, file) {
    if (!supabaseClient) throw new Error('Cliente Supabase não inicializado');
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabaseClient.storage
        .from('fit-images')
        .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabaseClient.storage
        .from('fit-images')
        .getPublicUrl(filePath);

    return publicUrl;
}

// ── Client-Side Image Compression ──────────────────────
async function compressImage(file, maxWidth = 1920, quality = 0.8) {
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

// ── Toast Notification ──────────────────────────────────
function showToast(message, isError = false) {
    toastEl.textContent = message;
    toastEl.className = `toast show${isError ? ' error' : ''}`;
    setTimeout(() => toastEl.classList.remove('show'), isError ? 6000 : 3000);
}

// ── Confirm Modal (substitui confirm() nativo) ──────────
function showConfirmModal(message) {
    return new Promise((resolve) => {
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

// ── Search & Filter State ──────────────────────────────
let searchFilters = { speakers: '', sponsors: '', links: '' };

// ── Table Loading Overlay ──────────────────────────────
function setTableLoading(prefix, loading) {
    const overlay = document.getElementById(`${prefix}-loading`);
    if (overlay) overlay.style.display = loading ? 'flex' : 'none';
}

// ── Render functions with search filter ────────────────
function renderPalestrantes() {
    const term = searchFilters.speakers.toLowerCase();
    const filtered = term
        ? loadedSpeakers.filter(s =>
            (s.nome || '').toLowerCase().includes(term) ||
            (s.cargo || '').toLowerCase().includes(term) ||
            (s.tema || '').toLowerCase().includes(term))
        : loadedSpeakers;

    speakersTable.innerHTML = '';

    if (filtered.length === 0) {
        speakersTable.innerHTML = `<tr><td colspan="5" class="empty-state"><i class="fas fa-user-slash"></i><p>${loadedSpeakers.length === 0 ? 'Nenhum palestrante cadastrado' : 'Nenhum palestrante encontrado para esta busca'}</p></td></tr>`;
        return;
    }

    filtered.forEach(speaker => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Nome">${speaker.nome}</td>
            <td data-label="Cargo">${speaker.cargo || '—'}</td>
            <td data-label="Tema">${speaker.tema || '—'}</td>
            <td data-label="Ordem">${speaker.ordem}</td>
            <td class="actions" data-label="Ações">
                <button class="row-btn row-btn-edit" onclick="editSpeaker('${speaker.id}')"><i class="fas fa-pen"></i> Editar</button>
                <button class="row-btn row-btn-delete" onclick="deleteSpeaker('${speaker.id}')"><i class="fas fa-trash"></i></button>
            </td>`;
        speakersTable.appendChild(tr);
    });
}

function renderPatrocinadores() {
    const term = searchFilters.sponsors.toLowerCase();
    const filtered = term
        ? loadedSponsors.filter(s =>
            (s.nome || '').toLowerCase().includes(term) ||
            (s.tier || '').toLowerCase().includes(term))
        : loadedSponsors;

    sponsorsTable.innerHTML = '';

    if (filtered.length === 0) {
        sponsorsTable.innerHTML = `<tr><td colspan="4" class="empty-state"><i class="fas fa-handshake-slash"></i><p>${loadedSponsors.length === 0 ? 'Nenhum patrocinador cadastrado' : 'Nenhum patrocinador encontrado para esta busca'}</p></td></tr>`;
        return;
    }

    filtered.forEach(sponsor => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Nome">${sponsor.nome}</td>
            <td data-label="Categoria"><span class="tier-badge ${sponsor.tier}">${sponsor.tier}</span></td>
            <td data-label="Ordem">${sponsor.ordem}</td>
            <td class="actions" data-label="Ações">
                <button class="row-btn row-btn-edit" onclick="editSponsor('${sponsor.id}')"><i class="fas fa-pen"></i> Editar</button>
                <button class="row-btn row-btn-delete" onclick="deleteSponsor('${sponsor.id}')"><i class="fas fa-trash"></i></button>
            </td>`;
        sponsorsTable.appendChild(tr);
    });
}

function renderLinks() {
    const term = searchFilters.links.toLowerCase();
    const filtered = term
        ? loadedLinks.filter(l =>
            (l.title || '').toLowerCase().includes(term) ||
            (l.description || '').toLowerCase().includes(term) ||
            (l.url || '').toLowerCase().includes(term))
        : loadedLinks;

    linksTableBody.innerHTML = '';

    if (filtered.length === 0) {
        linksTableBody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-link-slash"></i><p>${loadedLinks.length === 0 ? 'Nenhum link cadastrado' : 'Nenhum link encontrado para esta busca'}</p></td></tr>`;
        return;
    }

    filtered.forEach(link => {
        const styleBadge = {
            'link-gamer': '<span class="tier-badge" style="color: #B78103; background: rgba(255, 200, 0, 0.1); border: 1px solid rgba(255, 200, 0, 0.2);">Amarelo</span>',
            'link-orange': '<span class="tier-badge" style="color: #D4380D; background: rgba(255, 95, 23, 0.1); border: 1px solid rgba(255, 95, 23, 0.2);">Laranja</span>',
            'link-blue': '<span class="tier-badge" style="color: #096DD9; background: rgba(28, 0, 255, 0.1); border: 1px solid rgba(28, 0, 255, 0.2);">Azul</span>',
            'link-gray': '<span class="tier-badge" style="color: #71717a; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);">Cinza</span>'
        }[link.style_class] || `<span class="tier-badge">${link.style_class}</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Título">
                <div style="font-weight: 700; color: #111827;">${link.title}</div>
                <div style="font-size: 0.78rem; color: #71717a; margin-top: 2px;">${link.description || '—'}</div>
            </td>
            <td data-label="URL" style="font-family: monospace; font-size: 0.8rem; color: #a1a1aa; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${link.url}
            </td>
            <td data-label="Miniatura" style="font-size: 0.8rem; color: #71717a;">
                ${link.thumbnail_url ? `<span style="color:#10b981; font-weight:600;"><i class="fas fa-image"></i> Sim</span>` : 'Não'}
            </td>
            <td data-label="Estilo">${styleBadge}</td>
            <td data-label="Ordem">${link.order_index}</td>
            <td data-label="Status">
                ${link.active 
                    ? '<span style="color: #10b981; font-weight: 600; font-size: 0.8rem;"><i class="fas fa-check-circle"></i> Ativo</span>' 
                    : '<span style="color: #ef4444; font-weight: 600; font-size: 0.8rem;"><i class="fas fa-times-circle"></i> Inativo</span>'
                }
            </td>
            <td class="actions" data-label="Ações">
                <button class="row-btn row-btn-edit" onclick="editLink('${link.id}')"><i class="fas fa-pen"></i> Editar</button>
                <button class="row-btn row-btn-delete" onclick="deleteLink('${link.id}')"><i class="fas fa-trash"></i></button>
            </td>`;
        linksTableBody.appendChild(tr);
    });
}

// ── Fluxo de Inicialização do Supabase & Interface ──────
async function checkDatabaseConnection() {
    const url = (window.SUPABASE_URL && window.SUPABASE_URL !== 'SUA_SUPABASE_URL_AQUI') ? window.SUPABASE_URL : localStorage.getItem('supabase_url');
    const key = (window.SUPABASE_ANON_KEY && window.SUPABASE_ANON_KEY !== 'SUA_SUPABASE_ANON_KEY_AQUI') ? window.SUPABASE_ANON_KEY : localStorage.getItem('supabase_anon_key');

    if (!url || !key) {
        window.location.href = 'login.html';
        return false;
    }

    try {
        supabaseClient = window.supabase.createClient(url, key);
        
        // Verifica sessão ativa imediatamente e inicia os escutadores
        await listenAuthState();
        return true;
    } catch (err) {
        console.error('Erro de inicialização do Supabase:', err);
        window.location.href = 'login.html';
        return false;
    }
}

// ── Listener de Estado de Autenticação Supabase ─────────
async function listenAuthState() {
    if (!supabaseClient) return;

    // Verifica sessão ativa imediatamente
    const { data: { session } } = await supabaseClient.auth.getSession();
    handleSessionTransition(session);

    // Escuta mudanças de auth (login, logout, token refresh)
    supabaseClient.auth.onAuthStateChange((event, session) => {
        handleSessionTransition(session);
    });
}

function handleSessionTransition(session) {
    if (session) {
        adminWrapper.style.display = 'block';
        userEmail.textContent = session.user.email;
        
        sbStatusDot.style.background = '#10b981';
        sbStatusText.textContent = 'Conectado';
        sbStatusText.style.color = '#10b981';

        loadPalestrantes();
        loadPatrocinadores();
        loadLinks();
    } else {
        // Sessão expirou — avisa antes de redirecionar
        showToast('Sessão expirada. Faça login novamente.', true);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
}

// ── Logout ──────────────────────────────────────────────
logoutBtn.addEventListener('click', async () => {
    if (!supabaseClient) return;
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        showToast('Você saiu do painel administrativo.');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 800);
    } catch (err) {
        console.error(err);
        showToast('Erro ao deslogar.', true);
    }
});

// ── Tabs do Painel Administrativo ────────────────────────
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.section).classList.add('active');
    });
});

// ════════════════════════════════════════════════════════
// PALESTRANTES CRUD (Supabase `palestrantes`)
// ════════════════════════════════════════════════════════
async function loadPalestrantes() {
    if (!supabaseClient) return;
    setTableLoading('speakers', true);
    try {
        speakersTable.innerHTML = `<tr><td colspan="5" class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Carregando palestrantes...</p></td></tr>`;
        
        const { data, error } = await supabaseClient
            .from('palestrantes')
            .select('*')
            .order('ordem', { ascending: true });

        if (error) throw error;

        loadedSpeakers = data || [];
        renderPalestrantes();
    } catch (err) {
        console.error('Erro ao carregar palestrantes:', err.message);
        showToast('Erro ao carregar palestrantes do Supabase', true);
    } finally {
        setTableLoading('speakers', false);
    }
}

// Abrir modal de Palestrante
btnAddSpeaker.addEventListener('click', () => {
    editingSpeakerId = null;
    speakerForm.reset();
    
    // Reset file uploads
    spSelectedFile = null;
    document.getElementById('sp-preview-img').src = '';
    document.getElementById('sp-upload-preview').style.display = 'none';
    document.getElementById('sp-upload-zone').style.display = 'flex';
    document.getElementById('sp-foto').style.display = 'none';
    document.getElementById('sp-file-input').value = '';
    
    const toggleBtn = document.getElementById('sp-btn-toggle');
    toggleBtn.setAttribute('data-mode', 'upload');
    toggleBtn.textContent = 'Usar URL';

    document.querySelector('#speaker-modal h3').textContent = 'Adicionar Palestrante';
    speakerModal.classList.add('show');
});

// Submissão do Form de Palestrante
speakerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!supabaseClient) return;

    const saveBtn = speakerForm.querySelector('button[type="submit"]');
    const originalBtnText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Enviando...';

    try {
        let fotoUrl = null;
        const toggleMode = document.getElementById('sp-btn-toggle').getAttribute('data-mode');

        if (toggleMode === 'upload') {
            if (spSelectedFile) {
                fotoUrl = await uploadImageToStorage('speakers', spSelectedFile);
            } else {
                const previewImg = document.getElementById('sp-preview-img');
                if (previewImg.src && !previewImg.src.startsWith('data:') && !previewImg.src.endsWith('/auth/admin.html') && previewImg.src !== window.location.href) {
                    fotoUrl = previewImg.src;
                }
            }
        } else {
            fotoUrl = document.getElementById('sp-foto').value.trim() || null;
        }

        const data = {
            nome: document.getElementById('sp-nome').value.trim(),
            cargo: document.getElementById('sp-cargo').value.trim() || null,
            tema: document.getElementById('sp-tema').value.trim() || null,
            foto: fotoUrl,
            ordem: parseInt(document.getElementById('sp-ordem').value) || 0
        };

        if (editingSpeakerId) {
            const { error } = await supabaseClient
                .from('palestrantes')
                .update(data)
                .eq('id', editingSpeakerId);
            
            if (error) throw error;
            showToast('Palestrante atualizado!');
        } else {
            const { error } = await supabaseClient
                .from('palestrantes')
                .insert([data]);

            if (error) throw error;
            showToast('Palestrante adicionado!');
        }
        
        speakerModal.classList.remove('show');
        loadPalestrantes();
    } catch (err) {
        console.error('Erro ao salvar palestrante:', err.message);
        showToast('Erro ao salvar palestrante: ' + err.message, true);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalBtnText;
    }
});

// Editar Palestrante
window.editSpeaker = function (id) {
    const speaker = loadedSpeakers.find(s => s.id === id);
    if (!speaker) return;

    editingSpeakerId = id;
    document.getElementById('sp-nome').value = speaker.nome || '';
    document.getElementById('sp-cargo').value = speaker.cargo || '';
    document.getElementById('sp-tema').value = speaker.tema || '';
    document.getElementById('sp-foto').value = speaker.foto || '';
    document.getElementById('sp-ordem').value = speaker.ordem || 0;

    // Reset file uploads
    spSelectedFile = null;
    document.getElementById('sp-file-input').value = '';

    const toggleBtn = document.getElementById('sp-btn-toggle');
    const uploadZone = document.getElementById('sp-upload-zone');
    const uploadPreview = document.getElementById('sp-upload-preview');
    const previewImg = document.getElementById('sp-preview-img');
    const textInput = document.getElementById('sp-foto');

    if (speaker.foto) {
        previewImg.src = speaker.foto;
        uploadZone.style.display = 'none';
        uploadPreview.style.display = 'flex';
        textInput.style.display = 'none';
        toggleBtn.setAttribute('data-mode', 'upload');
        toggleBtn.textContent = 'Usar URL';
    } else {
        previewImg.src = '';
        uploadZone.style.display = 'flex';
        uploadPreview.style.display = 'none';
        textInput.style.display = 'none';
        toggleBtn.setAttribute('data-mode', 'upload');
        toggleBtn.textContent = 'Usar URL';
    }

    document.querySelector('#speaker-modal h3').textContent = 'Editar Palestrante';
    speakerModal.classList.add('show');
};

// Excluir Palestrante
window.deleteSpeaker = async function (id) {
    if (!supabaseClient) return;
    if (!await showConfirmModal('Deseja realmente excluir este palestrante do Supabase?')) return;

    try {
        const { error } = await supabaseClient
            .from('palestrantes')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast('Palestrante excluído com sucesso!');
        loadPalestrantes();
    } catch (err) {
        console.error(err);
        showToast('Erro ao excluir do Supabase', true);
    }
};


// ════════════════════════════════════════════════════════
// PATROCINADORES CRUD (Supabase `patrocinadores`)
// ════════════════════════════════════════════════════════
async function loadPatrocinadores() {
    if (!supabaseClient) return;
    setTableLoading('sponsors', true);
    try {
        sponsorsTable.innerHTML = `<tr><td colspan="4" class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Carregando patrocinadores...</p></td></tr>`;

        const { data, error } = await supabaseClient
            .from('patrocinadores')
            .select('*')
            .order('ordem', { ascending: true });

        if (error) throw error;

        loadedSponsors = data || [];
        renderPatrocinadores();
    } catch (err) {
        console.error('Erro ao carregar patrocinadores:', err.message);
        showToast('Erro ao carregar patrocinadores do Supabase', true);
    } finally {
        setTableLoading('sponsors', false);
    }
}

// Abrir modal de Patrocinador
btnAddSponsor.addEventListener('click', () => {
    editingSponsorId = null;
    sponsorForm.reset();
    
    // Reset file uploads
    patSelectedFile = null;
    document.getElementById('pat-preview-img').src = '';
    document.getElementById('pat-upload-preview').style.display = 'none';
    document.getElementById('pat-upload-zone').style.display = 'flex';
    document.getElementById('pat-logo').style.display = 'none';
    document.getElementById('pat-file-input').value = '';
    
    const toggleBtn = document.getElementById('pat-btn-toggle');
    toggleBtn.setAttribute('data-mode', 'upload');
    toggleBtn.textContent = 'Usar URL';

    document.querySelector('#sponsor-modal h3').textContent = 'Adicionar Patrocinador';
    sponsorModal.classList.add('show');
});

// Submissão do Form de Patrocinador
sponsorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!supabaseClient) return;

    const saveBtn = sponsorForm.querySelector('button[type="submit"]');
    const originalBtnText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Enviando...';

    try {
        let logoUrl = null;
        const toggleMode = document.getElementById('pat-btn-toggle').getAttribute('data-mode');

        if (toggleMode === 'upload') {
            if (patSelectedFile) {
                logoUrl = await uploadImageToStorage('sponsors', patSelectedFile);
            } else {
                const previewImg = document.getElementById('pat-preview-img');
                if (previewImg.src && !previewImg.src.startsWith('data:') && !previewImg.src.endsWith('/auth/admin.html') && previewImg.src !== window.location.href) {
                    logoUrl = previewImg.src;
                }
            }
        } else {
            logoUrl = document.getElementById('pat-logo').value.trim() || null;
        }

        const data = {
            nome: document.getElementById('pat-nome').value.trim(),
            tier: document.getElementById('pat-tier').value,
            logo: logoUrl,
            ordem: parseInt(document.getElementById('pat-ordem').value) || 0
        };

        if (editingSponsorId) {
            const { error } = await supabaseClient
                .from('patrocinadores')
                .update(data)
                .eq('id', editingSponsorId);
            
            if (error) throw error;
            showToast('Patrocinador atualizado!');
        } else {
            const { error } = await supabaseClient
                .from('patrocinadores')
                .insert([data]);

            if (error) throw error;
            showToast('Patrocinador adicionado!');
        }

        sponsorModal.classList.remove('show');
        loadPatrocinadores();
    } catch (err) {
        console.error('Erro ao salvar patrocinador:', err.message);
        showToast('Erro ao salvar patrocinador: ' + err.message, true);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalBtnText;
    }
});

// Editar Patrocinador
window.editSponsor = function (id) {
    const sponsor = loadedSponsors.find(s => s.id === id);
    if (!sponsor) return;

    editingSponsorId = id;
    document.getElementById('pat-nome').value = sponsor.nome || '';
    document.getElementById('pat-tier').value = sponsor.tier || 'diamante';
    document.getElementById('pat-logo').value = sponsor.logo || '';
    document.getElementById('pat-ordem').value = sponsor.ordem || 0;

    // Reset file uploads
    patSelectedFile = null;
    document.getElementById('pat-file-input').value = '';

    const toggleBtn = document.getElementById('pat-btn-toggle');
    const uploadZone = document.getElementById('pat-upload-zone');
    const uploadPreview = document.getElementById('pat-upload-preview');
    const previewImg = document.getElementById('pat-preview-img');
    const textInput = document.getElementById('pat-logo');

    if (sponsor.logo) {
        previewImg.src = sponsor.logo;
        uploadZone.style.display = 'none';
        uploadPreview.style.display = 'flex';
        textInput.style.display = 'none';
        toggleBtn.setAttribute('data-mode', 'upload');
        toggleBtn.textContent = 'Usar URL';
    } else {
        previewImg.src = '';
        uploadZone.style.display = 'flex';
        uploadPreview.style.display = 'none';
        textInput.style.display = 'none';
        toggleBtn.setAttribute('data-mode', 'upload');
        toggleBtn.textContent = 'Usar URL';
    }

    document.querySelector('#sponsor-modal h3').textContent = 'Editar Patrocinador';
    sponsorModal.classList.add('show');
};

// Excluir Patrocinador
window.deleteSponsor = async function (id) {
    if (!supabaseClient) return;
    if (!await showConfirmModal('Deseja realmente excluir este patrocinador do Supabase?')) return;

    try {
        const { error } = await supabaseClient
            .from('patrocinadores')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast('Patrocinador excluído com sucesso!');
        loadPatrocinadores();
    } catch (err) {
        console.error(err);
        showToast('Erro ao excluir do Supabase', true);
    }
};


// ════════════════════════════════════════════════════════
// LINKS ÚTEIS CRUD (Supabase `fit_links`)
// ════════════════════════════════════════════════════════
async function loadLinks() {
    if (!supabaseClient) return;
    setTableLoading('links', true);
    try {
        linksTableBody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Carregando links...</p></td></tr>`;

        const { data, error } = await supabaseClient
            .from('fit_links')
            .select('*')
            .order('order_index', { ascending: true });

        if (error) throw error;

        loadedLinks = data || [];
        renderLinks();
    } catch (err) {
        console.error('Erro ao carregar links do Supabase:', err.message);
        linksTableBody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i><p style="color: #ef4444;">Erro ao carregar links.</p></td></tr>`;
    } finally {
        setTableLoading('links', false);
    }
}

// Configurar Banco no modal administrativo
document.getElementById('btn-config-supabase').addEventListener('click', () => {
    document.getElementById('sb-url').value = (window.SUPABASE_URL && window.SUPABASE_URL !== 'SUA_SUPABASE_URL_AQUI') ? window.SUPABASE_URL : (localStorage.getItem('supabase_url') || '');
    document.getElementById('sb-key').value = (window.SUPABASE_ANON_KEY && window.SUPABASE_ANON_KEY !== 'SUA_SUPABASE_ANON_KEY_AQUI') ? window.SUPABASE_ANON_KEY : (localStorage.getItem('supabase_anon_key') || '');
    supabaseModal.classList.add('show');
});

// Salvar chaves administrativas
document.getElementById('supabase-config-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('sb-url').value.trim();
    const key = document.getElementById('sb-key').value.trim();

    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_anon_key', key);
    
    supabaseModal.classList.remove('show');
    showToast('Conexão atualizada com sucesso!');
    checkDatabaseConnection();
});

// Desconectar o banco
document.getElementById('btn-disconnect-sb').addEventListener('click', async () => {
    if (await showConfirmModal('Deseja realmente desconectar o Supabase? Isso forçará o setup novamente.')) {
        localStorage.removeItem('supabase_url');
        localStorage.removeItem('supabase_anon_key');
        supabaseModal.classList.remove('show');
        showToast('Supabase desconectado.');
        checkDatabaseConnection();
    }
});

// Cancelar modal
document.getElementById('btn-cancel-sb').addEventListener('click', () => {
    supabaseModal.classList.remove('show');
});

// Adicionar Novo Link
btnAddLink.addEventListener('click', () => {
    editingLinkId = null;
    linkForm.reset();
    document.getElementById('lk-active').checked = true;
    
    // Reset file uploads
    lkSelectedFile = null;
    document.getElementById('lk-preview-img').src = '';
    document.getElementById('lk-upload-preview').style.display = 'none';
    document.getElementById('lk-upload-zone').style.display = 'flex';
    document.getElementById('lk-thumb').style.display = 'none';
    document.getElementById('lk-file-input').value = '';
    
    const toggleBtn = document.getElementById('lk-btn-toggle');
    toggleBtn.setAttribute('data-mode', 'upload');
    toggleBtn.textContent = 'Usar URL';

    document.getElementById('link-modal-title').textContent = 'Adicionar Link (Supabase)';
    linkModal.classList.add('show');
});

// Submissão do Form de Link
linkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!supabaseClient) return;

    const saveBtn = linkForm.querySelector('button[type="submit"]');
    const originalBtnText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Enviando...';

    try {
        let thumbUrl = null;
        const toggleMode = document.getElementById('lk-btn-toggle').getAttribute('data-mode');

        if (toggleMode === 'upload') {
            if (lkSelectedFile) {
                thumbUrl = await uploadImageToStorage('links', lkSelectedFile);
            } else {
                const previewImg = document.getElementById('lk-preview-img');
                if (previewImg.src && !previewImg.src.startsWith('data:') && !previewImg.src.endsWith('/auth/admin.html') && previewImg.src !== window.location.href) {
                    thumbUrl = previewImg.src;
                }
            }
        } else {
            thumbUrl = document.getElementById('lk-thumb').value.trim() || null;
        }

        const data = {
            title: document.getElementById('lk-title').value.trim(),
            description: document.getElementById('lk-desc').value.trim() || null,
            url: document.getElementById('lk-url').value.trim(),
            thumbnail_url: thumbUrl,
            style_class: document.getElementById('lk-style').value,
            order_index: parseInt(document.getElementById('lk-order').value) || 0,
            active: document.getElementById('lk-active').checked
        };

        if (editingLinkId) {
            const { error } = await supabaseClient
                .from('fit_links')
                .update(data)
                .eq('id', editingLinkId);
            
            if (error) throw error;
            showToast('Link atualizado!');
        } else {
            const { error } = await supabaseClient
                .from('fit_links')
                .insert([data]);

            if (error) throw error;
            showToast('Link adicionado!');
        }

        linkModal.classList.remove('show');
        loadLinks();
    } catch (err) {
        console.error('Erro ao salvar link:', err.message);
        showToast('Erro ao salvar link: ' + err.message, true);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalBtnText;
    }
});

// Editar Link
window.editLink = function (id) {
    const link = loadedLinks.find(l => l.id === id);
    if (!link) return;

    editingLinkId = id;
    document.getElementById('lk-title').value = link.title || '';
    document.getElementById('lk-desc').value = link.description || '';
    document.getElementById('lk-url').value = link.url || '';
    document.getElementById('lk-thumb').value = link.thumbnail_url || '';
    document.getElementById('lk-style').value = link.style_class || 'link-gray';
    document.getElementById('lk-order').value = link.order_index || 0;
    document.getElementById('lk-active').checked = link.active;

    // Reset file uploads
    lkSelectedFile = null;
    document.getElementById('lk-file-input').value = '';

    const toggleBtn = document.getElementById('lk-btn-toggle');
    const uploadZone = document.getElementById('lk-upload-zone');
    const uploadPreview = document.getElementById('lk-upload-preview');
    const previewImg = document.getElementById('lk-preview-img');
    const textInput = document.getElementById('lk-thumb');

    if (link.thumbnail_url) {
        previewImg.src = link.thumbnail_url;
        uploadZone.style.display = 'none';
        uploadPreview.style.display = 'flex';
        textInput.style.display = 'none';
        toggleBtn.setAttribute('data-mode', 'upload');
        toggleBtn.textContent = 'Usar URL';
    } else {
        previewImg.src = '';
        uploadZone.style.display = 'flex';
        uploadPreview.style.display = 'none';
        textInput.style.display = 'none';
        toggleBtn.setAttribute('data-mode', 'upload');
        toggleBtn.textContent = 'Usar URL';
    }

    document.getElementById('link-modal-title').textContent = 'Editar Link (Supabase)';
    linkModal.classList.add('show');
};

// Excluir Link
window.deleteLink = async function (id) {
    if (!supabaseClient) return;
    if (!await showConfirmModal('Deseja realmente excluir este link do Supabase?')) return;

    try {
        const { error } = await supabaseClient
            .from('fit_links')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast('Link excluído com sucesso!');
        loadLinks();
    } catch (err) {
        console.error('Erro ao excluir:', err.message);
        showToast('Erro ao excluir link', true);
    }
};

// ── Confirm Cancel Edit (dirty form tracking) ──────────
const formState = { speaker: false, sponsor: false, link: false };

function trackFormDirty(prefix, stateKey) {
    const form = document.getElementById(`${prefix}-form`);
    const inputs = form.querySelectorAll('input, select, textarea');
    const checkOriginals = () => {
        formState[stateKey] = Array.from(inputs).some(inp => {
            if (inp.type === 'checkbox') return inp.checked !== inp.defaultChecked;
            return inp.value !== inp.defaultValue;
        });
    };
    inputs.forEach(inp => inp.addEventListener('input', checkOriginals));
    inputs.forEach(inp => inp.addEventListener('change', checkOriginals));
    // Reset tracking when modal opens
    const modal = document.getElementById(`${prefix}-modal`);
    const observer = new MutationObserver(() => {
        if (modal.classList.contains('show')) {
            inputs.forEach(inp => {
                inp.defaultValue = inp.value;
                if (inp.type === 'checkbox') inp.defaultChecked = inp.checked;
            });
            formState[stateKey] = false;
        }
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
}

async function confirmCancelIfDirty(stateKey, modalId) {
    if (formState[stateKey]) {
        if (!await showConfirmModal('Há alterações não salvas. Deseja realmente descartá-las?')) return false;
    }
    document.getElementById(modalId).classList.remove('show');
    return true;
}

// ── Modais Auxiliares: Close Actions ────────────────────
document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', (e) => {
        if (e.target === el) {
            const modalId = el.id;
            // Determine state key from modal id
            const map = { 'speaker-modal': 'speaker', 'sponsor-modal': 'sponsor', 'link-modal': 'link' };
            const key = map[modalId];
            if (key) confirmCancelIfDirty(key, modalId);
            else el.classList.remove('show');
        }
    });
});

document.querySelectorAll('.btn-cancel').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modal = btn.closest('.modal-overlay');
        if (!modal) return;
        const map = { 'speaker-modal': 'speaker', 'sponsor-modal': 'sponsor', 'link-modal': 'link' };
        const key = map[modal.id];
        if (key) confirmCancelIfDirty(key, modal.id);
        else modal.classList.remove('show');
    });
});

// ── Search Input Handlers ──────────────────────────────
document.querySelectorAll('.search-input').forEach(input => {
    input.addEventListener('input', () => {
        const tableId = input.dataset.search;
        searchFilters[tableId] = input.value;
        if (tableId === 'speakers') renderPalestrantes();
        else if (tableId === 'sponsors') renderPatrocinadores();
        else if (tableId === 'links') renderLinks();
    });
});

// ── Inicialização de Uploads Híbridos e Ouvintes ─────────
document.addEventListener('DOMContentLoaded', () => {
    setupHybridUpload('sp', (file) => { spSelectedFile = file; }, () => { spSelectedFile = null; });
    setupHybridUpload('pat', (file) => { patSelectedFile = file; }, () => { patSelectedFile = null; });
    setupHybridUpload('lk', (file) => { lkSelectedFile = file; }, () => { lkSelectedFile = null; });
    trackFormDirty('speaker', 'speaker');
    trackFormDirty('sponsor', 'sponsor');
    trackFormDirty('link', 'link');
});

// ── Inicialização ───────────────────────────────────────
checkDatabaseConnection();
