// auth/js/palestrantes.js
import { supabaseClient, uploadImageToStorage } from './api.js';
import { setTableLoading, showToast, showConfirmModal, setupHybridUpload } from './ui.js';

let loadedSpeakers = [];
let editingSpeakerId = null;
let spSelectedFile = null;

const speakersTable = document.getElementById('speakers-table-body');
const btnAddSpeaker = document.getElementById('btn-add-speaker');
const speakerModal = document.getElementById('speaker-modal');
const speakerForm = document.getElementById('speaker-form');
const searchInput = document.querySelector('input[data-search="speakers"]');

export function initPalestrantes() {
    setupHybridUpload('sp', (file) => spSelectedFile = file, () => spSelectedFile = null);

    if(btnAddSpeaker) {
        btnAddSpeaker.addEventListener('click', openAddModal);
    }

    if(speakerForm) {
        speakerForm.addEventListener('submit', handleFormSubmit);
    }

    let searchTimeout;
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => renderPalestrantes(e.target.value), 250);
        });
    }

    // Event Delegation for Edit/Delete buttons
    if(speakersTable) {
        speakersTable.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.row-btn-edit');
            const deleteBtn = e.target.closest('.row-btn-delete');
            
            if (editBtn) {
                const id = editBtn.getAttribute('data-id');
                if(id) openEditModal(id);
            } else if (deleteBtn) {
                const id = deleteBtn.getAttribute('data-id');
                if(id) deleteSpeaker(id);
            }
        });
    }

    // Modal Close handlers (clicking outside or close button)
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('show');
        });
    });
}

export async function loadPalestrantes() {
    if (!supabaseClient) return;
    setTableLoading('speakers', true);
    try {
        if(speakersTable) {
            speakersTable.innerHTML = `<tr><td colspan="5" class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Carregando palestrantes...</p></td></tr>`;
        }
        
        const { data, error } = await supabaseClient
            .from('palestrantes')
            .select('*')
            .order('ordem', { ascending: true });

        if (error) throw error;

        loadedSpeakers = data || [];
        renderPalestrantes(searchInput ? searchInput.value : '');
    } catch (err) {
        console.error('Erro ao carregar palestrantes:', err.message);
        showToast('Erro ao carregar palestrantes do Supabase', true);
    } finally {
        setTableLoading('speakers', false);
    }
}

function renderPalestrantes(searchTerm = '') {
    if(!speakersTable) return;
    
    const term = searchTerm.toLowerCase();
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
                <button class="row-btn row-btn-edit" data-id="${speaker.id}"><i class="fas fa-pen"></i> Editar</button>
                <button class="row-btn row-btn-delete" data-id="${speaker.id}"><i class="fas fa-trash"></i></button>
            </td>`;
        speakersTable.appendChild(tr);
    });
}

function openAddModal() {
    editingSpeakerId = null;
    speakerForm.reset();
    
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
}

function openEditModal(id) {
    const speaker = loadedSpeakers.find(s => String(s.id) === String(id));
    if (!speaker) return;

    editingSpeakerId = id;
    document.getElementById('sp-nome').value = speaker.nome || '';
    document.getElementById('sp-cargo').value = speaker.cargo || '';
    document.getElementById('sp-tema').value = speaker.tema || '';
    document.getElementById('sp-foto').value = speaker.foto || '';
    document.getElementById('sp-ordem').value = speaker.ordem || 0;

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
}

async function handleFormSubmit(e) {
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
}

async function deleteSpeaker(id) {
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
}
