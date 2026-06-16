// auth/js/oficios.js
import { supabaseClient } from './api.js';
import { showToast, showConfirmModal } from './ui.js';

let loadedOficios = [];
let editingOficioId = null;

export function initOficios() {
    const oficiosMap = {
        'of-numero': 'prev-numero',
        'of-data': 'prev-data',
        'of-assunto': 'prev-assunto',
        'of-tratamento': 'prev-tratamento',
        'of-destinatario': 'prev-destinatario',
        'of-cargo': 'prev-cargo',
        'of-organizacao': 'prev-organizacao',
        'of-rua': 'prev-rua',
        'of-cep': 'prev-cep',
        'of-vocativo': 'prev-vocativo',
        'of-corpo': 'prev-corpo',
        'of-responsavel': 'prev-responsavel',
        'of-responsavel-cargo': 'prev-responsavel-cargo'
    };

    function updateOficioPreview() {
        for (const [inputId, prevId] of Object.entries(oficiosMap)) {
            const input = document.getElementById(inputId);
            const prev = document.getElementById(prevId);
            
            if (input && prev) {
                if (inputId === 'of-corpo') {
                    prev.innerHTML = input.value.replace(/\n/g, '<br>');
                } else {
                    prev.textContent = input.value;
                }
                
                // Hide optional fields if empty
                if (inputId === 'of-rua' || inputId === 'of-cep') {
                    if (!input.value.trim()) {
                        prev.style.display = 'none';
                    } else {
                        prev.style.display = 'block';
                    }
                }
            }
        }
    }

    // Add listener to inputs
    Object.keys(oficiosMap).forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', updateOficioPreview);
        }
    });

    // Initial update
    updateOficioPreview();

    // UI Elements
    const btnGeneratePdf = document.getElementById('btn-generate-pdf');
    const btnSaveOficio = document.getElementById('btn-save-oficio');
    const btnOficiosList = document.getElementById('btn-oficios-list');
    const btnOficioNovo = document.getElementById('btn-oficio-novo');
    const oficiosListModal = document.getElementById('oficios-list-modal');
    const oficiosTableBody = document.getElementById('oficios-table-body');
    const oficioForm = document.getElementById('oficio-form');

    // Salvar Ofício
    if (btnSaveOficio) {
        btnSaveOficio.addEventListener('click', async () => {
            if (!supabaseClient) return;
            if (!oficioForm.checkValidity()) {
                oficioForm.reportValidity();
                return;
            }

            const originalText = btnSaveOficio.innerHTML;
            btnSaveOficio.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
            btnSaveOficio.disabled = true;

            try {
                const data = {
                    numero: document.getElementById('of-numero').value,
                    data_local: document.getElementById('of-data').value,
                    assunto: document.getElementById('of-assunto').value,
                    tratamento: document.getElementById('of-tratamento').value,
                    destinatario: document.getElementById('of-destinatario').value,
                    cargo: document.getElementById('of-cargo').value,
                    organizacao: document.getElementById('of-organizacao').value,
                    rua: document.getElementById('of-rua').value,
                    cep: document.getElementById('of-cep').value,
                    vocativo: document.getElementById('of-vocativo').value,
                    corpo: document.getElementById('of-corpo').value,
                    responsavel: document.getElementById('of-responsavel').value,
                    responsavel_cargo: document.getElementById('of-responsavel-cargo').value
                };

                if (editingOficioId) {
                    const { error } = await supabaseClient
                        .from('oficios')
                        .update(data)
                        .eq('id', editingOficioId);
                    if (error) throw error;
                    showToast('Ofício atualizado com sucesso!');
                } else {
                    const { data: inserted, error } = await supabaseClient
                        .from('oficios')
                        .insert([data])
                        .select();
                    if (error) throw error;
                    if (inserted && inserted.length > 0) {
                        editingOficioId = inserted[0].id;
                    }
                    showToast('Ofício salvo com sucesso!');
                }
            } catch (err) {
                console.error(err);
                showToast('Erro ao salvar ofício', true);
            } finally {
                btnSaveOficio.innerHTML = originalText;
                btnSaveOficio.disabled = false;
            }
        });
    }

    // Novo Ofício
    if (btnOficioNovo) {
        btnOficioNovo.addEventListener('click', () => {
            editingOficioId = null;
            oficioForm.reset();
            updateOficioPreview();
            showToast('Formulário limpo para novo ofício.');
        });
    }

    // Carregar Lista de Ofícios
    if (btnOficiosList) {
        btnOficiosList.addEventListener('click', async () => {
            if (!supabaseClient) return;
            oficiosListModal.classList.add('show');
            oficiosTableBody.innerHTML = `<tr><td colspan="4" class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Carregando ofícios...</p></td></tr>`;
            
            try {
                const { data, error } = await supabaseClient
                    .from('oficios')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                loadedOficios = data || [];
                
                oficiosTableBody.innerHTML = '';
                if (loadedOficios.length === 0) {
                    oficiosTableBody.innerHTML = `<tr><td colspan="4" class="empty-state"><i class="fas fa-file-slash"></i><p>Nenhum ofício salvo.</p></td></tr>`;
                    return;
                }

                loadedOficios.forEach(oficio => {
                    const dataObj = new Date(oficio.created_at);
                    const dataFormatada = dataObj.toLocaleDateString('pt-BR') + ' ' + dataObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td data-label="Número">${oficio.numero || ''}</td>
                        <td data-label="Destinatário">${oficio.destinatario}</td>
                        <td data-label="Assunto">${oficio.assunto}</td>
                        <td data-label="Criado em" style="font-size: 0.85rem; color: #6b7280;">${dataFormatada}</td>
                        <td class="actions" data-label="Ações">
                            <button class="row-btn row-btn-load" data-id="${oficio.id}" style="color: #0ea5e9; background: #e0f2fe; border-color: #bae6fd;"><i class="fas fa-download"></i> Carregar</button>
                            <button class="row-btn row-btn-delete" data-id="${oficio.id}"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    oficiosTableBody.appendChild(tr);
                });
            } catch (err) {
                console.error(err);
                oficiosTableBody.innerHTML = `<tr><td colspan="4" class="empty-state" style="color:red;">Erro ao carregar ofícios.</td></tr>`;
            }
        });
    }

    // Delegação de eventos para botões na tabela de ofícios
    if (oficiosTableBody) {
        oficiosTableBody.addEventListener('click', async (e) => {
            const loadBtn = e.target.closest('.row-btn-load');
            const deleteBtn = e.target.closest('.row-btn-delete');
            
            if (loadBtn) {
                const id = loadBtn.getAttribute('data-id');
                const oficio = loadedOficios.find(o => o.id === id);
                if (oficio) {
                    editingOficioId = oficio.id;
                    document.getElementById('of-numero').value = oficio.numero || '';
                    document.getElementById('of-data').value = oficio.data_local || '';
                    document.getElementById('of-assunto').value = oficio.assunto || '';
                    document.getElementById('of-tratamento').value = oficio.tratamento || '';
                    document.getElementById('of-destinatario').value = oficio.destinatario || '';
                    document.getElementById('of-cargo').value = oficio.cargo || '';
                    document.getElementById('of-organizacao').value = oficio.organizacao || '';
                    document.getElementById('of-rua').value = oficio.rua || '';
                    document.getElementById('of-cep').value = oficio.cep || '';
                    document.getElementById('of-vocativo').value = oficio.vocativo || '';
                    document.getElementById('of-corpo').value = oficio.corpo || '';
                    document.getElementById('of-responsavel').value = oficio.responsavel || '';
                    document.getElementById('of-responsavel-cargo').value = oficio.responsavel_cargo || '';
                    
                    updateOficioPreview();
                    oficiosListModal.classList.remove('show');
                    showToast('Ofício carregado.');
                }
            } else if (deleteBtn) {
                const id = deleteBtn.getAttribute('data-id');
                if (!await showConfirmModal('Deseja realmente excluir este ofício do banco?')) return;
                
                try {
                    const { error } = await supabaseClient.from('oficios').delete().eq('id', id);
                    if (error) throw error;
                    
                    // Remover da UI
                    e.target.closest('tr').remove();
                    showToast('Ofício excluído com sucesso!');
                    if (editingOficioId === id) editingOficioId = null;
                } catch (err) {
                    console.error(err);
                    showToast('Erro ao excluir ofício', true);
                }
            }
        });
    }

    // PDF Generation
    if (btnGeneratePdf) {
        btnGeneratePdf.addEventListener('click', () => {
            const originalText = btnGeneratePdf.innerHTML;
            btnGeneratePdf.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
            btnGeneratePdf.disabled = true;

            const element = document.getElementById('oficio-document');
            const wrapper = document.querySelector('.oficio-preview-wrapper');
            if(wrapper && wrapper.parentElement) {
                wrapper.parentElement.classList.add('print-ready');
            }

            const destInput = document.getElementById('of-destinatario');
            const destName = destInput ? destInput.value.replace(/\s+/g, '_') : 'Destinatario';

            const opt = {
                margin:       0,
                filename:     `Oficio_FIT_2026_${destName}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, logging: false },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            if (window.html2pdf) {
                window.html2pdf().set(opt).from(element).save().then(() => {
                    if(wrapper && wrapper.parentElement) wrapper.parentElement.classList.remove('print-ready');
                    btnGeneratePdf.innerHTML = originalText;
                    btnGeneratePdf.disabled = false;
                    showToast('PDF gerado com sucesso!');
                }).catch(err => {
                    console.error('Erro ao gerar PDF:', err);
                    if(wrapper && wrapper.parentElement) wrapper.parentElement.classList.remove('print-ready');
                    btnGeneratePdf.innerHTML = originalText;
                    btnGeneratePdf.disabled = false;
                    showToast('Erro ao gerar o PDF', true);
                });
            } else {
                showToast('Biblioteca PDF não carregada', true);
                btnGeneratePdf.innerHTML = originalText;
                btnGeneratePdf.disabled = false;
            }
        });
    }
}
