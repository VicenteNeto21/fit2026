// auth/js/links.js
import { supabaseClient, uploadImageToStorage } from './api.js';
import { setTableLoading, showToast, showConfirmModal, setupHybridUpload } from './ui.js';

let loadedLinks = [];
let editingLinkId = null;
let lkSelectedFile = null;

const linksTableBody = document.getElementById('links-table-body');
const btnAddLink = document.getElementById('btn-add-link');
const linkModal = document.getElementById('link-modal');
const linkForm = document.getElementById('link-form');
const searchInput = document.querySelector('input[data-search="links"]');

export function initLinks() {
    setupHybridUpload('lk', (file) => lkSelectedFile = file, () => lkSelectedFile = null);

    if(btnAddLink) {
        btnAddLink.addEventListener('click', openAddModal);
    }

    if(linkForm) {
        linkForm.addEventListener('submit', handleFormSubmit);
    }

    let searchTimeout;
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => renderLinks(e.target.value), 250);
        });
    }

    // Event Delegation
    if(linksTableBody) {
        linksTableBody.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.row-btn-edit');
            const deleteBtn = e.target.closest('.row-btn-delete');
            
            if (editBtn) {
                const id = editBtn.getAttribute('data-id');
                if(id) openEditModal(id);
            } else if (deleteBtn) {
                const id = deleteBtn.getAttribute('data-id');
                if(id) deleteLink(id);
            }
        });
    }
}

export async function loadLinks() {
    if (!supabaseClient) return;
    setTableLoading('links', true);
    try {
        if(linksTableBody) {
            linksTableBody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Carregando links...</p></td></tr>`;
        }

        const { data, error } = await supabaseClient
            .from('fit_links')
            .select('*')
            .order('order_index', { ascending: true });

        if (error) throw error;

        loadedLinks = data || [];
        loadedLinks.sort((a, b) => {
            if (a.active === b.active) {
                return (a.order_index || 0) - (b.order_index || 0);
            }
            return a.active ? -1 : 1;
        });
        renderLinks(searchInput ? searchInput.value : '');
    } catch (err) {
        console.error('Erro ao carregar links do Supabase:', err.message);
        if(linksTableBody) {
            linksTableBody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i><p style="color: #ef4444;">Erro ao carregar links.</p></td></tr>`;
        }
    } finally {
        setTableLoading('links', false);
    }
}

function renderLinks(searchTerm = '') {
    if(!linksTableBody) return;
    
    const term = searchTerm.toLowerCase();
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
                    ? '<span style="display: inline-flex; align-items: center; gap: 4px; color: #10b981; font-weight: 600; font-size: 0.8rem; white-space: nowrap;"><i class="fas fa-check-circle"></i> Ativo</span>' 
                    : '<span style="display: inline-flex; align-items: center; gap: 4px; color: #ef4444; font-weight: 600; font-size: 0.8rem; white-space: nowrap;"><i class="fas fa-times-circle"></i> Inativo</span>'
                }
            </td>
            <td class="actions" data-label="Ações">
                <button class="row-btn row-btn-edit" data-id="${link.id}"><i class="fas fa-pen"></i> Editar</button>
                <button class="row-btn row-btn-delete" data-id="${link.id}"><i class="fas fa-trash"></i></button>
            </td>`;
        linksTableBody.appendChild(tr);
    });
}

function openAddModal() {
    editingLinkId = null;
    linkForm.reset();
    document.getElementById('lk-active').checked = true;
    
    lkSelectedFile = null;
    document.getElementById('lk-preview-img').src = '';
    document.getElementById('lk-upload-preview').style.display = 'none';
    document.getElementById('lk-upload-zone').style.display = 'flex';
    document.getElementById('lk-thumb').style.display = 'none';
    document.getElementById('lk-file-input').value = '';
    
    const toggleBtn = document.getElementById('lk-btn-toggle');
    toggleBtn.setAttribute('data-mode', 'upload');
    toggleBtn.textContent = 'Usar URL';

    document.querySelector('#link-modal h3').textContent = 'Adicionar Link Útil';
    linkModal.classList.add('show');
}

function openEditModal(id) {
    const link = loadedLinks.find(l => String(l.id) === String(id));
    if (!link) return;

    editingLinkId = id;
    document.getElementById('lk-title').value = link.title || '';
    document.getElementById('lk-url').value = link.url || '';
    document.getElementById('lk-desc').value = link.description || '';
    document.getElementById('lk-style').value = link.style_class || 'link-gamer';
    document.getElementById('lk-thumb').value = link.thumbnail_url || '';
    document.getElementById('lk-order').value = link.order_index || 0;
    document.getElementById('lk-active').checked = link.active !== false;

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

    document.querySelector('#link-modal h3').textContent = 'Editar Link Útil';
    linkModal.classList.add('show');
}

async function handleFormSubmit(e) {
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
            url: document.getElementById('lk-url').value.trim(),
            description: document.getElementById('lk-desc').value.trim() || null,
            style_class: document.getElementById('lk-style').value,
            thumbnail_url: thumbUrl,
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
}

async function deleteLink(id) {
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
        console.error(err);
        showToast('Erro ao excluir do Supabase', true);
    }
}
