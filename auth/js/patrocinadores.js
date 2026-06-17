// auth/js/patrocinadores.js
import { supabaseClient, uploadImageToStorage } from './api.js';
import { setTableLoading, showToast, showConfirmModal, setupHybridUpload } from './ui.js';

let loadedSponsors = [];
let editingSponsorId = null;
let patSelectedFile = null;

const sponsorsTable = document.getElementById('sponsors-table-body');
const btnAddSponsor = document.getElementById('btn-add-sponsor');
const sponsorModal = document.getElementById('sponsor-modal');
const sponsorForm = document.getElementById('sponsor-form');
const searchInput = document.querySelector('input[data-search="sponsors"]');

export function initPatrocinadores() {
    setupHybridUpload('pat', (file) => patSelectedFile = file, () => patSelectedFile = null);

    if(btnAddSponsor) {
        btnAddSponsor.addEventListener('click', openAddModal);
    }

    if(sponsorForm) {
        sponsorForm.addEventListener('submit', handleFormSubmit);
    }

    let searchTimeout;
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => renderPatrocinadores(e.target.value), 250);
        });
    }

    // Event Delegation
    if(sponsorsTable) {
        sponsorsTable.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.row-btn-edit');
            const deleteBtn = e.target.closest('.row-btn-delete');
            
            if (editBtn) {
                const id = editBtn.getAttribute('data-id');
                if(id) openEditModal(id);
            } else if (deleteBtn) {
                const id = deleteBtn.getAttribute('data-id');
                if(id) deleteSponsor(id);
            }
        });
    }
}

export async function loadPatrocinadores() {
    if (!supabaseClient) return;
    setTableLoading('sponsors', true);
    try {
        if(sponsorsTable) {
            sponsorsTable.innerHTML = `<tr><td colspan="4" class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Carregando patrocinadores...</p></td></tr>`;
        }

        const { data, error } = await supabaseClient
            .from('patrocinadores')
            .select('*')
            .order('ordem', { ascending: true });

        if (error) throw error;

        loadedSponsors = data || [];
        renderPatrocinadores(searchInput ? searchInput.value : '');
    } catch (err) {
        console.error('Erro ao carregar patrocinadores:', err.message);
        showToast('Erro ao carregar patrocinadores do Supabase', true);
    } finally {
        setTableLoading('sponsors', false);
    }
}

function renderPatrocinadores(searchTerm = '') {
    if(!sponsorsTable) return;
    
    const term = searchTerm.toLowerCase();
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
                <button class="row-btn row-btn-edit" data-id="${sponsor.id}"><i class="fas fa-pen"></i> Editar</button>
                <button class="row-btn row-btn-delete" data-id="${sponsor.id}"><i class="fas fa-trash"></i></button>
            </td>`;
        sponsorsTable.appendChild(tr);
    });
}

function openAddModal() {
    editingSponsorId = null;
    sponsorForm.reset();
    
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
}

function openEditModal(id) {
    const sponsor = loadedSponsors.find(s => String(s.id) === String(id));
    if (!sponsor) return;

    editingSponsorId = id;
    document.getElementById('pat-nome').value = sponsor.nome || '';
    document.getElementById('pat-tier').value = sponsor.tier || 'diamante';
    document.getElementById('pat-logo').value = sponsor.logo || '';
    document.getElementById('pat-ordem').value = sponsor.ordem || 0;

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
}

async function handleFormSubmit(e) {
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
}

async function deleteSponsor(id) {
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
}
