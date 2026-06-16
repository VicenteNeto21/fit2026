// auth/js/main.js
import { checkDatabaseConnection, supabaseClient } from './api.js';
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

async function handleSessionTransition(session) {
    if (session) {
        adminWrapper.style.display = 'block';
        if(userEmail) userEmail.textContent = session.user.email;
        
        if(sbStatusDot && sbStatusText) {
            sbStatusDot.style.background = '#10b981';
            sbStatusText.textContent = 'Conectado';
            sbStatusText.style.color = '#10b981';
        }

        loadPalestrantes();
        loadPatrocinadores();
        loadLinks();
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
        handleSessionTransition(session);
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

// Inicialização Principal
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializa dependências de UI locais (Tabs, modais de config)
    initTabs();
    initSupabaseConfigModal();
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

    // 3. Tenta conectar ao banco
    const connected = await checkDatabaseConnection();
    if(connected) {
        // Remove a tela de carregamento do corpo da página caso tenhamos escondido no HTML
        document.body.style.display = 'block';
        listenAuthState();
    }
});
