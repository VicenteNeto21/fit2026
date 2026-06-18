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

    function updateOficioPreview(e) {
        // Partial update if triggered by an event
        if (e && e.target && e.target.id && oficiosMap[e.target.id]) {
            const inputId = e.target.id;
            const prevId = oficiosMap[inputId];
            const input = e.target;
            const prev = document.getElementById(prevId);
            
            if (prev) {
                if (inputId === 'of-corpo') {
                    let formattedText = input.value.replace(/\n/g, '<br>');
                    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
                    prev.innerHTML = formattedText;
                } else {
                    prev.textContent = input.value;
                }
                
                if (inputId === 'of-rua' || inputId === 'of-cep') {
                    prev.style.display = input.value.trim() ? 'block' : 'none';
                }
            }
            return;
        }

        // Full update (initial load or load from DB)
        for (const [inputId, prevId] of Object.entries(oficiosMap)) {
            const input = document.getElementById(inputId);
            const prev = document.getElementById(prevId);
            
            if (input && prev) {
                if (inputId === 'of-corpo') {
                    let formattedText = input.value.replace(/\n/g, '<br>');
                    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
                    prev.innerHTML = formattedText;
                } else {
                    prev.textContent = input.value;
                }
                
                if (inputId === 'of-rua' || inputId === 'of-cep') {
                    prev.style.display = input.value.trim() ? 'block' : 'none';
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

    const toggleAssinatura = document.getElementById('of-assinatura-toggle');
    const prevAssinaturaLine = document.getElementById('prev-assinatura-line');

    function updateAssinaturaVisibility() {
        if (toggleAssinatura && prevAssinaturaLine) {
            if (toggleAssinatura.checked) {
                prevAssinaturaLine.classList.add('border-t', 'border-black', 'pt-1');
            } else {
                prevAssinaturaLine.classList.remove('border-t', 'border-black', 'pt-1');
            }
        }
    }

    if(toggleAssinatura) {
        toggleAssinatura.addEventListener('change', updateAssinaturaVisibility);
        updateAssinaturaVisibility(); // Call initially
    }

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
    const btnRefreshOficios = document.getElementById('btn-refresh-oficios');
    const tabOficiosSalvos = document.getElementById('tab-oficios-salvos');

    async function loadOficiosList() {
        if (!supabaseClient) return;
        if (!oficiosTableBody) return;
        
        oficiosTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-14 text-gray-400 text-sm"><i class="fas fa-spinner fa-spin text-2xl mb-3 text-orange-300 block"></i>Carregando ofícios...</td></tr>`;
        
        try {
            const { data, error } = await supabaseClient
                .from('oficios')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            loadedOficios = data || [];
            
            oficiosTableBody.innerHTML = '';
            if (loadedOficios.length === 0) {
                oficiosTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-14 text-gray-400 text-sm"><i class="fas fa-file-slash text-2xl mb-3 text-gray-300 block"></i>Nenhum ofício salvo.</td></tr>`;
                return;
            }

            loadedOficios.forEach(oficio => {
                const dataObj = new Date(oficio.created_at);
                const dataFormatada = dataObj.toLocaleDateString('pt-BR') + ' ' + dataObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

                const numeroLimitado = oficio.numero && oficio.numero.length > 25 ? oficio.numero.split(' – ')[0] : (oficio.numero || '-');
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td data-label="Número" style="font-weight: 600; color: #1f2937; white-space: nowrap;">${numeroLimitado}</td>
                    <td data-label="Destinatário" style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${oficio.destinatario || ''}">${oficio.destinatario || '<span style="color:#9ca3af;">-</span>'}</td>
                    <td data-label="Assunto" style="max-width: 250px; overflow: hidden; text-overflow: ellipsis;" title="${oficio.assunto || ''}">${oficio.assunto || ''}</td>
                    <td data-label="Criado em" style="font-size: 0.85rem; color: #6b7280; white-space: nowrap;">${dataFormatada}</td>
                    <td class="actions" data-label="Ações" style="width: 1%">
                        <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                            <button class="row-btn row-btn-load" data-id="${oficio.id}" style="color: #0ea5e9; background: #e0f2fe; border-color: #bae6fd; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; margin: 0;"><i class="fas fa-download"></i> Carregar</button>
                            <button class="row-btn row-btn-duplicate" data-id="${oficio.id}" style="color: #10b981; background: #d1fae5; border-color: #a7f3d0; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; margin: 0;" title="Duplicar"><i class="fas fa-copy"></i> Duplicar</button>
                            <button class="row-btn row-btn-delete" data-id="${oficio.id}" style="margin: 0; padding: 6px 10px;"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                oficiosTableBody.appendChild(tr);
            });
        } catch (err) {
            console.error(err);
            oficiosTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-14 text-red-500 text-sm">Erro ao carregar ofícios.</td></tr>`;
        }
    }

    if (btnRefreshOficios) {
        btnRefreshOficios.addEventListener('click', loadOficiosList);
    }
    
    if (tabOficiosSalvos) {
        tabOficiosSalvos.addEventListener('click', loadOficiosList);
    }

    // Delegação de eventos para botões na tabela de ofícios
    if (oficiosTableBody) {
        oficiosTableBody.addEventListener('click', async (e) => {
            const loadBtn = e.target.closest('.row-btn-load');
            const duplicateBtn = e.target.closest('.row-btn-duplicate');
            const deleteBtn = e.target.closest('.row-btn-delete');
            
            if (loadBtn || duplicateBtn) {
                const isDuplicate = !!duplicateBtn;
                const id = (loadBtn || duplicateBtn).getAttribute('data-id');
                const oficio = loadedOficios.find(o => String(o.id) === String(id));
                if (oficio) {
                    editingOficioId = isDuplicate ? null : oficio.id;
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
                    
                    // Switch to the 'Ofícios' tab automatically
                    document.querySelector('[data-section="section-oficios"]').click();
                    showToast(isDuplicate ? 'Ofício copiado! Altere os dados e clique em Salvar.' : 'Ofício carregado para edição');
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
                    if (String(editingOficioId) === String(id)) editingOficioId = null;
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
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak:    { mode: 'avoid-all' }
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
