/* ========================================================
   FIT 2026 — Script de Autenticação Administrativa
   ======================================================== */

let supabaseClient = null;

// Elementos DOM
const setupBox = document.getElementById('setup-box');
const loginBox = document.getElementById('login-box');
const setupDbForm = document.getElementById('setup-db-form');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const setupError = document.getElementById('setup-error');
const loginBtn = document.getElementById('login-btn');
const btnShowSetup = document.getElementById('btn-show-setup');
const googleBtn = document.getElementById('google-btn');
const toastEl = document.getElementById('toast');

// ── Toast Notification ──────────────────────────────────
function showToast(message, isError = false) {
    toastEl.textContent = message;
    toastEl.className = `toast show${isError ? ' error' : ''}`;
    setTimeout(() => toastEl.classList.remove('show'), 3000);
}

// ── Fluxo de Inicialização do Supabase & Interface ──────
async function checkDatabaseConnection() {
    // Busca do config global ou localStorage
    const url = (window.SUPABASE_URL && window.SUPABASE_URL !== 'SUA_SUPABASE_URL_AQUI') ? window.SUPABASE_URL : localStorage.getItem('supabase_url');
    const key = (window.SUPABASE_ANON_KEY && window.SUPABASE_ANON_KEY !== 'SUA_SUPABASE_ANON_KEY_AQUI') ? window.SUPABASE_ANON_KEY : localStorage.getItem('supabase_anon_key');

    if (!url || !key) {
        // Exibe setup do banco
        setupBox.style.display = 'block';
        loginBox.style.display = 'none';
        return false;
    }

    try {
        supabaseClient = window.supabase.createClient(url, key);
        
        // Exibe tela de login padrão
        setupBox.style.display = 'none';
        loginBox.style.display = 'block';
        
        // Verifica se já existe uma sessão ativa
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (session) {
            showToast('Sessão ativa encontrada. Redirecionando...');
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
        }
        return true;
    } catch (err) {
        console.error('Erro de inicialização do Supabase:', err);
        setupError.textContent = 'Erro ao inicializar cliente. Verifique as credenciais.';
        setupError.classList.add('show');
        setupBox.style.display = 'block';
        loginBox.style.display = 'none';
        return false;
    }
}

// ── Formulário de Configuração do Banco ──────────────────
setupDbForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('setup-url').value.trim();
    const key = document.getElementById('setup-key').value.trim();

    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_anon_key', key);
    
    showToast('Banco conectado com sucesso!');
    checkDatabaseConnection();
});

// Alternar para tela de setup
btnShowSetup.addEventListener('click', (e) => {
    e.preventDefault();
    loginBox.style.display = 'none';
    setupBox.style.display = 'block';
    
    document.getElementById('setup-url').value = (window.SUPABASE_URL && window.SUPABASE_URL !== 'SUA_SUPABASE_URL_AQUI') ? window.SUPABASE_URL : (localStorage.getItem('supabase_url') || '');
    document.getElementById('setup-key').value = (window.SUPABASE_ANON_KEY && window.SUPABASE_ANON_KEY !== 'SUA_SUPABASE_ANON_KEY_AQUI') ? window.SUPABASE_ANON_KEY : (localStorage.getItem('supabase_anon_key') || '');
});

// ── Formulário de Login (Email / Senha) ──────────────────
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!supabaseClient) {
        showToast('Supabase não inicializado. Configure o banco.', true);
        return;
    }

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    loginBtn.disabled = true;
    loginBtn.textContent = 'Entrando...';
    loginError.classList.remove('show');

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        showToast('Login realizado com sucesso!');
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1200);
    } catch (err) {
        console.error('Erro de login:', err.message);
        
        // Mensagem amigável de diagnóstico de erro de conexão
        if (err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
            loginError.innerHTML = '<strong>Erro de conexão com o banco!</strong><br><span style="font-size:0.75rem;">O Supabase recusou a conexão (ERR_CONNECTION_REFUSED). Verifique sua internet ou se o projeto está ativo.</span>';
        } else {
            loginError.textContent = 'Email ou senha incorretos.';
        }
        loginError.classList.add('show');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Entrar';
    }
});

// ── Login Social Google ──────────────────────────────────
googleBtn.addEventListener('click', async () => {
    if (!supabaseClient) {
        showToast('Supabase não inicializado.', true);
        return;
    }
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/auth/admin.html'
            }
        });
        if (error) throw error;
    } catch (err) {
        console.error('Erro de login Google:', err.message);
        showToast('Erro ao autenticar com o Google.', true);
    }
});

// Inicialização da página
document.addEventListener('DOMContentLoaded', checkDatabaseConnection);
