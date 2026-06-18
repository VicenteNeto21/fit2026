let loadedUsuarios = [];

async function loadUsuariosList() {
    if (!window.supabaseClient) return;
    const tbody = document.getElementById('usuarios-table-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-14 text-gray-400 text-sm"><i class="fas fa-spinner fa-spin text-2xl mb-3 text-orange-300 block"></i>Carregando usuários...</td></tr>`;

    try {
        const { data, error } = await window.supabaseClient
            .from('perfis')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        loadedUsuarios = data || [];

        tbody.innerHTML = '';
        if (loadedUsuarios.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-14 text-gray-400 text-sm"><i class="fas fa-users-slash text-2xl mb-3 text-gray-300 block"></i>Nenhum usuário encontrado na tabela perfis.</td></tr>`;
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
                <td data-label="E-mail">${user.email}</td>
                <td data-label="Perfil">${roleBadge}</td>
                <td data-label="Criado em">${dataFormatada}</td>
                <td class="actions" data-label="Ações" style="width: 250px;">
                    <div style="display: flex; gap: 6px; align-items: center; justify-content: flex-end;">
                        <select class="role-select fit-input" style="padding: 4px 8px; height: 32px; font-size: 12px; min-height: 0; display: inline-block; width: auto; margin: 0;" data-id="${user.id}">
                            <option value="oficios" ${!isAdmin ? 'selected' : ''}>Apenas Ofícios</option>
                            <option value="admin" ${isAdmin ? 'selected' : ''}>Administrador</option>
                        </select>
                        <button class="row-btn btn-update-role" data-id="${user.id}" style="color:#0ea5e9; background:#e0f2fe; border-color:#bae6fd; padding:6px 12px; margin:0; display: inline-flex; align-items: center; gap: 4px;" title="Salvar Cargo"><i class="fas fa-save"></i> Salvar</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-14 text-red-500 text-sm">Erro ao carregar usuários (Tabela perfis configurada?).</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnRefresh = document.getElementById('btn-refresh-usuarios');
    const tabUsuarios = document.getElementById('tab-usuarios');
    const tbody = document.getElementById('usuarios-table-body');

    if (btnRefresh) btnRefresh.addEventListener('click', loadUsuariosList);
    if (tabUsuarios) tabUsuarios.addEventListener('click', loadUsuariosList);

    if (tbody) {
        tbody.addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-update-role');
            if (btn) {
                const id = btn.getAttribute('data-id');
                const select = document.querySelector(`.role-select[data-id="${id}"]`);
                if (select) {
                    const newRole = select.value;
                    try {
                        const { error } = await window.supabaseClient
                            .from('perfis')
                            .update({ role: newRole })
                            .eq('id', id);
                        
                        if (error) throw error;
                        
                        // Inform UI
                        if(window.showToast) window.showToast('Perfil atualizado com sucesso!');
                        
                        // Recarregar a lista para exibir o novo crachá
                        loadUsuariosList();
                    } catch (err) {
                        console.error(err);
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

            if (!emailInput || !passInput || !msgBox || !window.supabaseClient) return;

            const email = emailInput.value.trim();
            const password = passInput.value.trim();

            msgBox.className = 'text-xs p-3 rounded-lg mt-2 font-medium';
            msgBox.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando conta...';
            msgBox.classList.remove('hidden');
            msgBox.style.color = '#d97706'; // warning yellow/orange
            msgBox.style.backgroundColor = '#fef3c7';
            msgBox.style.borderColor = '#fde68a';
            btn.disabled = true;

            try {
                const { data, error } = await window.supabaseClient.auth.signUp({
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

                if(window.showToast) window.showToast('Novo usuário cadastrado!');

            } catch (err) {
                console.error(err);
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
});
