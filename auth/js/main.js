// auth/js/main.js
import { checkDatabaseConnection, supabaseClient, logAction, logger } from './api.js';
import { showToast, showConfirmModal } from './ui.js';
import { initPalestrantes, loadPalestrantes } from './palestrantes.js';
import { initPatrocinadores, loadPatrocinadores } from './patrocinadores.js';
import { initLinks, loadLinks } from './links.js';
import { initOficios } from './oficios.js';

// DOM Elements
const adminWrapper = document.getElementById('admin-wrapper');
const userEmail = document.getElementById('user-email');
const sbStatusDot = document.getElementById('sb-status-dot');
const sbStatusText = document.getElementById('sb-status-text');
const logoutBtn = document.getElementById('logout-btn');
const supabaseModal = document.getElementById('supabase-modal');
const supabaseConfigForm = document.getElementById('supabase-config-form');

let isDataLoaded = false;
let currentUserRole = 'admin';

async function handleSessionTransition(session) {
    if (session) {
        adminWrapper.style.display = 'block';
        if(userEmail) userEmail.textContent = session.user.email;
        
        if(sbStatusDot && sbStatusText) {
            sbStatusDot.style.background = '#10b981';
            sbStatusText.textContent = 'Conectado';
            sbStatusText.style.color = '#10b981';
        }

        // Fetch User Role and Profile Info
        try {
            const { data, error } = await supabaseClient
                .from('perfis')
                .select('role, nome, telefone, cargo_evento')
                .eq('id', session.user.id)
                .single();
            if (data) {
                if (data.role) currentUserRole = data.role;
                const inputNome = document.getElementById('my-profile-nome');
                const inputTelefone = document.getElementById('my-profile-telefone');
                const inputCargo = document.getElementById('my-profile-cargo');
                if (inputNome) inputNome.value = data.nome || '';
                if (inputTelefone) inputTelefone.value = data.telefone || '';
                if (inputCargo) inputCargo.value = data.cargo_evento || '';
            }
        } catch(e) {
            logger.warn('Tabela perfis ainda não configurada:', e);
        }

        // Popula Perfil nas Configurações
        const myEmail = document.getElementById('my-profile-email');
        const myRole = document.getElementById('my-profile-role');
        if (myEmail) myEmail.textContent = session.user.email;
        if (myRole) {
            myRole.innerHTML = currentUserRole === 'admin' 
                ? `<span style="background:#fef3c7; color:#d97706; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:bold;">Administrador</span>` 
                : `<span style="background:#e0e7ff; color:#4338ca; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:bold;">Apenas Ofícios</span>`;
        }

        // Apply RBAC
        const tabPalestrantes = document.querySelector('[data-section="section-palestrantes"]');
        const tabPatrocinadores = document.querySelector('[data-section="section-patrocinadores"]');
        const tabLinks = document.querySelector('[data-section="section-links"]');
        const tabConfig = document.getElementById('tab-configuracoes');
        const tabUsuarios = document.getElementById('tab-usuarios');
        
        if (currentUserRole === 'oficios') {
            if(tabPalestrantes) tabPalestrantes.style.display = 'none';
            if(tabPatrocinadores) tabPatrocinadores.style.display = 'none';
            if(tabLinks) tabLinks.style.display = 'none';
            if(tabConfig) tabConfig.style.display = 'none';
            if(tabUsuarios) tabUsuarios.style.display = 'none';
            // Auto click Oficios
            document.querySelector('[data-section="section-oficios"]').click();
        } else if (currentUserRole === 'admin') {
            if(tabUsuarios) tabUsuarios.style.display = 'flex';
        }

        if (!isDataLoaded && currentUserRole === 'admin') {
            loadPalestrantes();
            loadPatrocinadores();
            loadLinks();
            isDataLoaded = true;
        } else if (!isDataLoaded) {
            isDataLoaded = true;
        }
    } else {
        showToast('Sessão expirada. Faça login novamente.', true);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
}

async function listenAuthState() {
    if (!supabaseClient) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    handleSessionTransition(session);

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            handleSessionTransition(session);
        }
    });
}

function initTabs() {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            
            const targetSection = document.getElementById(tab.dataset.section);
            if(targetSection) targetSection.classList.add('active');
        });
    });
}

function initSupabaseConfigModal() {
    const btnConfigSupabase = document.getElementById('btn-config-supabase');
    if(btnConfigSupabase) {
        btnConfigSupabase.addEventListener('click', () => {
            document.getElementById('sb-url').value = (window.SUPABASE_URL && window.SUPABASE_URL !== 'SUA_SUPABASE_URL_AQUI') ? window.SUPABASE_URL : (localStorage.getItem('supabase_url') || '');
            document.getElementById('sb-key').value = (window.SUPABASE_ANON_KEY && window.SUPABASE_ANON_KEY !== 'SUA_SUPABASE_ANON_KEY_AQUI') ? window.SUPABASE_ANON_KEY : (localStorage.getItem('supabase_anon_key') || '');
            supabaseModal.classList.add('show');
        });
    }

    if(supabaseConfigForm) {
        supabaseConfigForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('sb-url').value.trim();
            const key = document.getElementById('sb-key').value.trim();

            localStorage.setItem('supabase_url', url);
            localStorage.setItem('supabase_anon_key', key);
            
            supabaseModal.classList.remove('show');
            showToast('Conexão atualizada com sucesso!');
            
            const connected = await checkDatabaseConnection();
            if(connected) listenAuthState();
        });
    }

    const btnDisconnect = document.getElementById('btn-disconnect-sb');
    if(btnDisconnect) {
        btnDisconnect.addEventListener('click', async () => {
            if (await showConfirmModal('Deseja realmente desconectar o Supabase? Isso forçará o setup novamente.')) {
                localStorage.removeItem('supabase_url');
                localStorage.removeItem('supabase_anon_key');
                supabaseModal.classList.remove('show');
                logger.success('Supabase conectado com sucesso.', { role: currentUserRole });
                showToast('Supabase desconectado.');
                checkDatabaseConnection();
            }
        });
    }

    const btnCancel = document.getElementById('btn-cancel-sb');
    if(btnCancel) {
        btnCancel.addEventListener('click', () => {
            supabaseModal.classList.remove('show');
        });
    }
}

function initProfileForm() {
    const formPerfil = document.getElementById('form-meu-perfil');
    if (!formPerfil) return;

    formPerfil.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSalvar = document.getElementById('btn-salvar-perfil');
        const originalText = btnSalvar.innerHTML;
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        btnSalvar.disabled = true;

        try {
            const nome = document.getElementById('my-profile-nome').value.trim();
            const telefone = document.getElementById('my-profile-telefone').value.trim();
            const cargo = document.getElementById('my-profile-cargo').value.trim();

            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session) throw new Error("Sessão inválida.");

            const { error } = await supabaseClient
                .from('perfis')
                .update({ 
                    nome: nome, 
                    telefone: telefone, 
                    cargo_evento: cargo 
                })
                .eq('id', session.user.id);

            if (error) throw error;

            showToast('Perfil atualizado com sucesso!');
            logAction('ATUALIZOU_PERFIL', `O usuário atualizou seu próprio perfil de acesso.`);
        } catch (error) {
            logger.error('Erro ao atualizar perfil', error);
            showToast('Erro ao atualizar perfil: ' + error.message, true);
        } finally {
            btnSalvar.innerHTML = originalText;
            btnSalvar.disabled = false;
        }
    });
}

// Inicialização Principal
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializa dependências de UI locais (Tabs, modais de config)
    initTabs();
    initSupabaseConfigModal();
    initProfileForm();
    initPalestrantes();
    initPatrocinadores();
    initLinks();
    initOficios();

    // 2. Logout listener
    if(logoutBtn) {
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
    }

    // 3. Global modal cancel listener
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-cancel')) {
            const modal = e.target.closest('.modal-overlay');
            if (modal) modal.classList.remove('show');
        }
    });

    // 4. Tenta conectar ao banco
    const connected = await checkDatabaseConnection();
    if(connected) {
        // Remove a tela de carregamento do corpo da página caso tenhamos escondido no HTML
        document.body.style.display = 'block';
        listenAuthState();
    }
});
