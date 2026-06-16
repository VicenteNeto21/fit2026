// auth/js/login.js
import { checkDatabaseConnection, supabaseClient } from './api.js';
import { showToast } from './ui.js';

// Elementos DOM
const loginBox = document.getElementById('login-box');
const loadingState = document.getElementById('loading-state');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginBtn = document.getElementById('login-btn');

async function initLogin() {
    const connected = await checkDatabaseConnection();
    if (!connected) {
        if(loadingState) {
            loadingState.innerHTML = `
                <div class="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-4">
                    <i class="fas fa-exclamation-triangle text-red-400 text-xl"></i>
                </div>
                <p class="text-sm text-gray-500 font-medium text-center max-w-[260px]">Banco de dados não configurado. Contate o administrador.</p>
            `;
        }
        return;
    }

    try {
        // Verifica se já está logado
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            window.location.href = 'admin.html';
            return;
        }

        if(loadingState) loadingState.style.display = 'none';
        if(loginBox) loginBox.style.display = 'block';
    } catch (err) {
        console.error('Erro de inicialização do Supabase:', err);
        if(loadingState) {
            loadingState.innerHTML = `
                <div class="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-4">
                    <i class="fas fa-exclamation-triangle text-red-400 text-xl"></i>
                </div>
                <p class="text-sm text-gray-500 font-medium text-center max-w-[260px]">Erro ao conectar ao banco. Contate o administrador.</p>
            `;
        }
    }
}

if(loginForm) {
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

            if (error) {
                // Rate Limiting realçado via erro da API (Supabase Auth API)
                if (error.status === 429 || error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('too many requests')) {
                    throw new Error('Muitas tentativas! Aguarde alguns minutos antes de tentar novamente.');
                }
                throw error;
            }

            showToast('Login realizado com sucesso!');
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1200);
        } catch (err) {
            console.error('Erro de login:', err.message);
            
            // Tratamento unificado de erros
            if (err.message.includes('Invalid login credentials')) {
                loginError.innerHTML = '<strong>Email ou senha incorretos.</strong>';
            } else {
                loginError.innerHTML = `<strong>Erro no login:</strong><br><span style="font-size:0.75rem;">${err.message}</span>`;
            }
            loginError.classList.add('show');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Entrar';
        }
    });
}

document.addEventListener('DOMContentLoaded', initLogin);
