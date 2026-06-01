/* ========================================================
   FIT 2026 — Script de Autenticação Administrativa
   ======================================================== */

let supabaseClient = null;

// Rate Limiting
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 min
let loginAttempts = parseInt(localStorage.getItem('fit_login_attempts') || '0');
let loginBlockedUntil = parseInt(localStorage.getItem('fit_login_blocked_until') || '0');

function checkRateLimit() {
    const now = Date.now();
    if (loginBlockedUntil > now) {
        const remaining = Math.ceil((loginBlockedUntil - now) / 1000 / 60);
        return { blocked: true, remaining };
    }
    // Reset if window passed
    if (loginBlockedUntil && now > loginBlockedUntil) {
        loginAttempts = 0;
        loginBlockedUntil = 0;
        localStorage.removeItem('fit_login_attempts');
        localStorage.removeItem('fit_login_blocked_until');
    }
    return { blocked: false };
}

function recordAttempt() {
    loginAttempts++;
    localStorage.setItem('fit_login_attempts', loginAttempts.toString());
    if (loginAttempts >= RATE_LIMIT_MAX) {
        loginBlockedUntil = Date.now() + RATE_LIMIT_WINDOW;
        localStorage.setItem('fit_login_blocked_until', loginBlockedUntil.toString());
    }
}

function resetRateLimit() {
    loginAttempts = 0;
    loginBlockedUntil = 0;
    localStorage.removeItem('fit_login_attempts');
    localStorage.removeItem('fit_login_blocked_until');
}

// Elementos DOM
const loginBox = document.getElementById('login-box');
const loadingState = document.getElementById('loading-state');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginBtn = document.getElementById('login-btn');
const toastEl = document.getElementById('toast');

// ── Toast Notification ──────────────────────────────────
function showToast(message, isError = false) {
    toastEl.textContent = message;
    toastEl.className = `toast show${isError ? ' error' : ''}`;
    setTimeout(() => toastEl.classList.remove('show'), 3000);
}

// ── Fluxo de Inicialização do Supabase & Interface ──────
async function checkDatabaseConnection() {
    const url = (window.SUPABASE_URL && window.SUPABASE_URL !== 'SUA_SUPABASE_URL_AQUI') ? window.SUPABASE_URL : localStorage.getItem('supabase_url');
    const key = (window.SUPABASE_ANON_KEY && window.SUPABASE_ANON_KEY !== 'SUA_SUPABASE_ANON_KEY_AQUI') ? window.SUPABASE_ANON_KEY : localStorage.getItem('supabase_anon_key');

    if (!url || !key) {
        loadingState.innerHTML = `
            <div class="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-4">
                <i class="fas fa-exclamation-triangle text-red-400 text-xl"></i>
            </div>
            <p class="text-sm text-gray-500 font-medium text-center max-w-[260px]">Banco de dados não configurado. Contate o administrador.</p>
        `;
        return false;
    }

    try {
        supabaseClient = window.supabase.createClient(url, key);

        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            window.location.href = 'admin.html';
            return true;
        }

        loadingState.style.display = 'none';
        loginBox.style.display = 'block';
        return true;
    } catch (err) {
        console.error('Erro de inicialização do Supabase:', err);
        loadingState.innerHTML = `
            <div class="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-4">
                <i class="fas fa-exclamation-triangle text-red-400 text-xl"></i>
            </div>
            <p class="text-sm text-gray-500 font-medium text-center max-w-[260px]">Erro ao conectar ao banco. Contate o administrador.</p>
        `;
        return false;
    }
}

// ── Formulário de Login (Email / Senha) ──────────────────
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!supabaseClient) {
        showToast('Supabase não inicializado. Configure o banco.', true);
        return;
    }

    // Rate limit check
    const { blocked, remaining } = checkRateLimit();
    if (blocked) {
        loginError.innerHTML = `<strong>Muitas tentativas!</strong><br><span style="font-size:0.75rem;">Aguarde ${remaining} minuto(s) antes de tentar novamente.</span>`;
        loginError.classList.add('show');
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

        resetRateLimit();
        showToast('Login realizado com sucesso!');
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1200);
    } catch (err) {
        console.error('Erro de login:', err.message);
        recordAttempt();

        const remainingAttempts = RATE_LIMIT_MAX - loginAttempts;
        if (remainingAttempts > 0) {
            loginError.innerHTML = `<strong>Email ou senha incorretos.</strong><br><span style="font-size:0.75rem;">Tentativas restantes: ${remainingAttempts}</span>`;
        } else {
            loginError.innerHTML = '<strong>Muitas tentativas!</strong><br><span style="font-size:0.75rem;">Acesso bloqueado por 15 minutos.</span>';
        }
        loginError.classList.add('show');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Entrar';
    }
});

// Inicialização da página
document.addEventListener('DOMContentLoaded', checkDatabaseConnection);
