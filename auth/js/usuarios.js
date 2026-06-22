import { supabaseClient, logger } from './api.js';

let loadedUsuarios = [];

async function loadUsuariosList() {
    if (!supabaseClient) {
        logger.warn("Supabase Client não inicializado ao tentar carregar usuários.");
        return;
    }
    const tbody = document.getElementById('usuarios-table-body');
    if (!tbody) return;

    // Garantir que a tabela tenha altura mínima e o dropdown não seja cortado
    const tableWrapper = tbody.closest('.overflow-x-auto');
    if (tableWrapper) {
        tableWrapper.style.minHeight = '350px';
        tableWrapper.style.paddingBottom = '100px';
        const parentBox = tableWrapper.closest('.overflow-hidden');
        if (parentBox) parentBox.classList.remove('overflow-hidden');
    }

    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-14 text-gray-400 text-sm"><i class="fas fa-spinner fa-spin text-2xl mb-3 text-orange-300 block"></i>Carregando usuários...</td></tr>`;

    try {
        logger.info("Buscando lista de usuários no banco de dados...");
        const { data, error } = await supabaseClient
            .from('perfis')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        logger.success(`${data.length} usuários carregados com sucesso!`);
        loadedUsuarios = data || [];

        tbody.innerHTML = '';
        if (loadedUsuarios.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-14 text-gray-400 text-sm"><i class="fas fa-users-slash text-2xl mb-3 text-gray-300 block"></i>Nenhum usuário encontrado na tabela perfis.</td></tr>`;
            return;
        }

        loadedUsuarios.forEach(user => {
            const dataObj = new Date(user.created_at);
            const dataFormatada = dataObj.toLocaleDateString('pt-BR');
            const isAdmin = user.role === 'admin';
            
            const roleBadge = isAdmin ? 
                `<span style="background:#fef3c7; color:#d97706; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:bold;">Admin</span>` : 
                `<span style="background:#e0e7ff; color:#4338ca; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:bold;">Ofícios</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Nome">${user.nome || '-'}</td>
                <td data-label="E-mail">${user.email}</td>
                <td data-label="Telefone">${user.telefone || '-'}</td>
                <td data-label="Cargo (Evento)">${user.cargo_evento || '-'}</td>
                <td data-label="Perfil">${roleBadge}</td>
                <td data-label="Criado em">${dataFormatada}</td>
                <td class="actions" data-label="Ações" style="width: 250px;">
                    <div style="display: flex; gap: 6px; align-items: center; justify-content: flex-end;">
                        <div class="custom-dropdown-container" data-id="${user.id}">
                            <div class="custom-select-role dropdown-trigger" tabindex="0">
                                <span class="selected-text" style="pointer-events:none;">${isAdmin ? 'Administrador' : 'Apenas Ofícios'}</span>
                                <input type="hidden" class="role-hidden-input" data-id="${user.id}" value="${isAdmin ? 'admin' : 'oficios'}">
                                <i class="fas fa-chevron-down text-gray-400 text-[10px] transition-transform duration-200" style="pointer-events:none;"></i>
                            </div>
                            <div class="custom-dropdown-menu">
                                <div class="custom-dropdown-option ${!isAdmin ? 'active' : ''}" data-value="oficios">
                                    <div class="flex flex-col" style="pointer-events:none;">
                                        <span class="font-bold text-gray-700 text-xs">Apenas Ofícios</span>
                                        <span class="text-[10px] text-gray-400 font-normal mt-0.5">Acesso básico</span>
                                    </div>
                                    ${!isAdmin ? '<i class="fas fa-check text-orange-500 text-xs" style="pointer-events:none;"></i>' : ''}
                                </div>
                                <div class="custom-dropdown-option ${isAdmin ? 'active' : ''}" data-value="admin">
                                    <div class="flex flex-col" style="pointer-events:none;">
                                        <span class="font-bold text-orange-600 text-xs">Administrador</span>
                                        <span class="text-[10px] text-orange-400/70 font-normal mt-0.5">Acesso total</span>
                                    </div>
                                    ${isAdmin ? '<i class="fas fa-check text-orange-500 text-xs" style="pointer-events:none;"></i>' : ''}
                                </div>
                            </div>
                        </div>
                        <button class="row-btn btn-update-role" data-id="${user.id}" style="color:#0ea5e9; background:#e0f2fe; border-color:#bae6fd; padding:6px 12px; margin:0; display: inline-flex; align-items: center; gap: 4px;" title="Salvar Cargo"><i class="fas fa-save"></i> Salvar</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        logger.error("Falha ao carregar usuários (tabela 'perfis' existe?)", err);
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-14 text-red-500 text-sm">Erro ao carregar usuários. Verifique o console.</td></tr>`;
    }
}

const btnRefresh = document.getElementById('btn-refresh-usuarios');
const tabUsuarios = document.getElementById('tab-usuarios');
const tbody = document.getElementById('usuarios-table-body');

if (btnRefresh) btnRefresh.addEventListener('click', loadUsuariosList);
if (tabUsuarios) tabUsuarios.addEventListener('click', loadUsuariosList);

if (tbody) {
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown-container')) {
            document.querySelectorAll('.custom-dropdown-container.open').forEach(el => {
                el.classList.remove('open');
            });
        }
    });

    tbody.addEventListener('click', async (e) => {
        // Lógica de Abrir/Fechar Dropdown
        const trigger = e.target.closest('.dropdown-trigger');
        if (trigger) {
            e.stopPropagation();
            const container = trigger.closest('.custom-dropdown-container');
            document.querySelectorAll('.custom-dropdown-container.open').forEach(el => {
                if (el !== container) el.classList.remove('open');
            });
            container.classList.toggle('open');
            return;
        }

        // Lógica de Selecionar Opção
        const option = e.target.closest('.custom-dropdown-option');
        if (option) {
            e.stopPropagation();
            const container = option.closest('.custom-dropdown-container');
            const value = option.getAttribute('data-value');
            const text = option.querySelector('.font-bold').innerText;
            const input = container.querySelector('.role-hidden-input');
            const displaySpan = container.querySelector('.selected-text');
            
            input.value = value;
            displaySpan.innerText = text;
            
            // Atualiza checkmark visual
            container.querySelectorAll('.custom-dropdown-option').forEach(opt => {
                opt.classList.remove('active');
                const icon = opt.querySelector('.fa-check');
                if (icon) icon.remove();
            });
            option.classList.add('active');
            option.insertAdjacentHTML('beforeend', '<i class="fas fa-check text-orange-500 text-xs" style="pointer-events:none;"></i>');
            
            container.classList.remove('open');
            return;
        }

        // Botão de Salvar
        const btn = e.target.closest('.btn-update-role');
        if (btn) {
            const id = btn.getAttribute('data-id');
            const input = document.querySelector(`.role-hidden-input[data-id="${id}"]`);
            if (input) {
                const newRole = input.value;
                logger.info(`Atualizando cargo do usuário ${id} para ${newRole}...`);
                try {
                    const { error } = await supabaseClient
                        .from('perfis')
                        .update({ role: newRole })
                        .eq('id', id);
                    
                    if (error) throw error;
                    
                    logger.success(`Cargo do usuário atualizado para ${newRole}!`);
                    // Inform UI
                    if(window.showToast) window.showToast('Perfil atualizado com sucesso!');
                    
                    // Recarregar a lista para exibir o novo crachá
                    loadUsuariosList();
                } catch (err) {
                    logger.error(`Erro ao atualizar perfil do usuário ${id}`, err);
                    if(window.showToast) window.showToast('Erro ao atualizar perfil. Você tem permissão?', true);
                }
            }
        }
    });
}

// Cadastro de novo usuário via aba de Configurações
const formNovoUsuario = document.getElementById('form-novo-usuario');
if (formNovoUsuario) {
    formNovoUsuario.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('new-user-email');
        const passInput = document.getElementById('new-user-password');
        const msgBox = document.getElementById('new-user-message');
        const btn = document.getElementById('btn-novo-usuario');

        if (!emailInput || !passInput || !msgBox || !supabaseClient) return;

        const email = emailInput.value.trim();
        const password = passInput.value.trim();

        msgBox.className = 'text-xs p-3 rounded-lg mt-2 font-medium';
        msgBox.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando conta...';
        msgBox.classList.remove('hidden');
        msgBox.style.color = '#d97706'; // warning yellow/orange
        msgBox.style.backgroundColor = '#fef3c7';
        msgBox.style.borderColor = '#fde68a';
        btn.disabled = true;

        logger.info(`Criando novo usuário: ${email}...`);

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            msgBox.style.color = '#15803d'; // green
            msgBox.style.backgroundColor = '#dcfce3';
            msgBox.style.borderColor = '#bbf7d0';
            msgBox.innerHTML = '<i class="fas fa-check-circle"></i> Usuário criado com sucesso! (Se ele precisar confirmar e-mail, avise-o).';
            formNovoUsuario.reset();
            
            // Recarrega a tabela de usuários se estivermos na aba
            loadUsuariosList();

            logger.success(`Usuário ${email} criado com sucesso!`);
            if(window.showToast) window.showToast('Novo usuário cadastrado!');

        } catch (err) {
            logger.error(`Falha ao criar o usuário ${email}`, err);
            msgBox.style.color = '#b91c1c'; // red
            msgBox.style.backgroundColor = '#fee2e2';
            msgBox.style.borderColor = '#fecaca';
            msgBox.innerHTML = `<i class="fas fa-exclamation-circle"></i> Erro: ${err.message || 'Falha ao criar usuário.'}`;
        } finally {
            btn.disabled = false;
        }
    });

    // Alternar visualização da senha
    const btnTogglePass = document.getElementById('btn-toggle-password');
    if (btnTogglePass) {
        btnTogglePass.addEventListener('click', () => {
            const passInput = document.getElementById('new-user-password');
            const icon = btnTogglePass.querySelector('i');
            if (passInput.type === 'password') {
                passInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
}
