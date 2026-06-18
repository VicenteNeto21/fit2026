// auth/js/api.js

export let supabaseClient = null;

export const logger = {
    info: (msg, data = '') => console.log(`%c ℹ️ [INFO] ${msg}`, 'color: #3b82f6; font-weight: bold;', data !== '' ? data : ''),
    success: (msg, data = '') => console.log(`%c ✅ [SUCESSO] ${msg}`, 'color: #10b981; font-weight: bold;', data !== '' ? data : ''),
    warn: (msg, data = '') => console.warn(`%c ⚠️ [AVISO] ${msg}`, 'color: #f59e0b; font-weight: bold;', data !== '' ? data : ''),
    error: (msg, err = '') => console.error(`%c 🔴 [ERRO] ${msg}`, 'color: #ef4444; font-weight: bold;', err !== '' ? err : '')
};

export async function checkDatabaseConnection() {
    const url = (window.SUPABASE_URL && window.SUPABASE_URL !== 'SUA_SUPABASE_URL_AQUI') ? window.SUPABASE_URL : localStorage.getItem('supabase_url');
    const key = (window.SUPABASE_ANON_KEY && window.SUPABASE_ANON_KEY !== 'SUA_SUPABASE_ANON_KEY_AQUI') ? window.SUPABASE_ANON_KEY : localStorage.getItem('supabase_anon_key');

    if (!url || !key) {
        window.location.href = 'login.html';
        return false;
    }

    try {
        supabaseClient = window.supabase.createClient(url, key, {
            auth: {
                storage: window.sessionStorage
            }
        });
        return true;
    } catch (err) {
        console.error('Erro de inicialização do Supabase:', err);
        window.location.href = 'login.html';
        return false;
    }
}

export async function uploadImageToStorage(folder, file) {
    if (!supabaseClient) throw new Error('Cliente Supabase não inicializado');
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabaseClient.storage
        .from('fit-images')
        .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabaseClient.storage
        .from('fit-images')
        .getPublicUrl(filePath);

    return publicUrl;
}

export async function logAction(acao, detalhes) {
    if (!supabaseClient) return;
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;
        await supabaseClient.from('sys_logs').insert([{
            user_id: session.user.id,
            acao: acao,
            detalhes: detalhes
        }]);
    } catch (err) {
        console.warn('Erro silencioso ao registrar log de auditoria:', err);
    }
}
