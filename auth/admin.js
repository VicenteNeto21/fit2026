/* ============================================
   FIT 2026 — Admin Panel Logic
   Auth + Firestore CRUD
   ============================================ */

import {
    db, auth, googleProvider,
    collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy,
    signInWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged
} from '../assets/js/firebase-config.js';

// ── DOM Elements ───────────────────────────
const loginWrapper = document.getElementById('login-wrapper');
const adminWrapper = document.getElementById('admin-wrapper');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginBtn = document.getElementById('login-btn');
const googleBtn = document.getElementById('google-btn');
const logoutBtn = document.getElementById('logout-btn');
const userEmail = document.getElementById('user-email');
const toastEl = document.getElementById('toast');

// ── Auth State ─────────────────────────────
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginWrapper.style.display = 'none';
        adminWrapper.style.display = 'block';
        userEmail.textContent = user.email;
        loadPalestrantes();
        loadPatrocinadores();
    } else {
        loginWrapper.style.display = '';
        adminWrapper.style.display = 'none';
    }
});

// ── Login ───────────────────────────────────
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    loginBtn.disabled = true;
    loginBtn.textContent = 'Entrando...';
    loginError.classList.remove('show');

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        loginError.textContent = 'Email ou senha incorretos.';
        loginError.classList.add('show');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Entrar';
    }
});

// ── Logout ──────────────────────────────────
logoutBtn.addEventListener('click', () => signOut(auth));

// ── Google Login ────────────────────────────
googleBtn.addEventListener('click', async () => {
    loginError.classList.remove('show');
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (err) {
        loginError.textContent = 'Erro ao entrar com Google. Tente novamente.';
        loginError.classList.add('show');
    }
});

// ── Tabs ────────────────────────────────────
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.section).classList.add('active');
    });
});

// ── Toast Notification ──────────────────────
function showToast(message, isError = false) {
    toastEl.textContent = message;
    toastEl.className = `toast show${isError ? ' error' : ''}`;
    setTimeout(() => toastEl.classList.remove('show'), 3000);
}

// ══════════════════════════════════════════════
// PALESTRANTES
// ══════════════════════════════════════════════
const speakersTable = document.getElementById('speakers-table-body');
const speakerModal = document.getElementById('speaker-modal');
const speakerForm = document.getElementById('speaker-form');
let editingSpeakerId = null;

async function loadPalestrantes() {
    try {
        const q = query(collection(db, 'palestrantes'), orderBy('ordem'));
        const snapshot = await getDocs(q);
        speakersTable.innerHTML = '';

        if (snapshot.empty) {
            speakersTable.innerHTML = `<tr><td colspan="5" class="empty-state"><i class="fas fa-user-slash"></i><p>Nenhum palestrante cadastrado</p></td></tr>`;
            return;
        }

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${data.nome}</td>
                <td>${data.cargo || '—'}</td>
                <td>${data.tema || '—'}</td>
                <td>${data.ordem || 0}</td>
                <td class="actions">
                    <button class="btn-edit" onclick="editSpeaker('${docSnap.id}')"><i class="fas fa-pen"></i> Editar</button>
                    <button class="btn-delete" onclick="deleteSpeaker('${docSnap.id}')"><i class="fas fa-trash"></i></button>
                </td>`;
            speakersTable.appendChild(tr);
        });
    } catch (err) {
        console.error('Erro ao carregar palestrantes:', err);
        showToast('Erro ao carregar palestrantes', true);
    }
}

document.getElementById('btn-add-speaker').addEventListener('click', () => {
    editingSpeakerId = null;
    speakerForm.reset();
    document.querySelector('#speaker-modal h3').textContent = 'Adicionar Palestrante';
    speakerModal.classList.add('show');
});

speakerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        nome: document.getElementById('sp-nome').value,
        cargo: document.getElementById('sp-cargo').value,
        tema: document.getElementById('sp-tema').value,
        foto: document.getElementById('sp-foto').value,
        ordem: parseInt(document.getElementById('sp-ordem').value) || 0
    };

    try {
        if (editingSpeakerId) {
            await updateDoc(doc(db, 'palestrantes', editingSpeakerId), data);
            showToast('Palestrante atualizado!');
        } else {
            await addDoc(collection(db, 'palestrantes'), data);
            showToast('Palestrante adicionado!');
        }
        speakerModal.classList.remove('show');
        loadPalestrantes();
    } catch (err) {
        console.error(err);
        showToast('Erro ao salvar palestrante', true);
    }
});

window.editSpeaker = async function (id) {
    const docSnap = await getDocs(query(collection(db, 'palestrantes')));
    docSnap.forEach(d => {
        if (d.id === id) {
            const data = d.data();
            editingSpeakerId = id;
            document.getElementById('sp-nome').value = data.nome || '';
            document.getElementById('sp-cargo').value = data.cargo || '';
            document.getElementById('sp-tema').value = data.tema || '';
            document.getElementById('sp-foto').value = data.foto || '';
            document.getElementById('sp-ordem').value = data.ordem || 0;
            document.querySelector('#speaker-modal h3').textContent = 'Editar Palestrante';
            speakerModal.classList.add('show');
        }
    });
};

window.deleteSpeaker = async function (id) {
    if (!confirm('Tem certeza que deseja excluir este palestrante?')) return;
    try {
        await deleteDoc(doc(db, 'palestrantes', id));
        showToast('Palestrante excluído!');
        loadPalestrantes();
    } catch (err) {
        showToast('Erro ao excluir', true);
    }
};

// ══════════════════════════════════════════════
// PATROCINADORES
// ══════════════════════════════════════════════
const sponsorsTable = document.getElementById('sponsors-table-body');
const sponsorModal = document.getElementById('sponsor-modal');
const sponsorForm = document.getElementById('sponsor-form');
let editingSponsorId = null;

async function loadPatrocinadores() {
    try {
        const q = query(collection(db, 'patrocinadores'), orderBy('ordem'));
        const snapshot = await getDocs(q);
        sponsorsTable.innerHTML = '';

        if (snapshot.empty) {
            sponsorsTable.innerHTML = `<tr><td colspan="4" class="empty-state"><i class="fas fa-handshake-slash"></i><p>Nenhum patrocinador cadastrado</p></td></tr>`;
            return;
        }

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${data.nome}</td>
                <td><span class="tier-badge ${data.tier}">${data.tier}</span></td>
                <td>${data.ordem || 0}</td>
                <td class="actions">
                    <button class="btn-edit" onclick="editSponsor('${docSnap.id}')"><i class="fas fa-pen"></i> Editar</button>
                    <button class="btn-delete" onclick="deleteSponsor('${docSnap.id}')"><i class="fas fa-trash"></i></button>
                </td>`;
            sponsorsTable.appendChild(tr);
        });
    } catch (err) {
        console.error('Erro ao carregar patrocinadores:', err);
        showToast('Erro ao carregar patrocinadores', true);
    }
}

document.getElementById('btn-add-sponsor').addEventListener('click', () => {
    editingSponsorId = null;
    sponsorForm.reset();
    document.querySelector('#sponsor-modal h3').textContent = 'Adicionar Patrocinador';
    sponsorModal.classList.add('show');
});

sponsorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        nome: document.getElementById('pat-nome').value,
        tier: document.getElementById('pat-tier').value,
        logo: document.getElementById('pat-logo').value,
        ordem: parseInt(document.getElementById('pat-ordem').value) || 0
    };

    try {
        if (editingSponsorId) {
            await updateDoc(doc(db, 'patrocinadores', editingSponsorId), data);
            showToast('Patrocinador atualizado!');
        } else {
            await addDoc(collection(db, 'patrocinadores'), data);
            showToast('Patrocinador adicionado!');
        }
        sponsorModal.classList.remove('show');
        loadPatrocinadores();
    } catch (err) {
        console.error(err);
        showToast('Erro ao salvar patrocinador', true);
    }
});

window.editSponsor = async function (id) {
    const docSnap = await getDocs(query(collection(db, 'patrocinadores')));
    docSnap.forEach(d => {
        if (d.id === id) {
            const data = d.data();
            editingSponsorId = id;
            document.getElementById('pat-nome').value = data.nome || '';
            document.getElementById('pat-tier').value = data.tier || 'diamante';
            document.getElementById('pat-logo').value = data.logo || '';
            document.getElementById('pat-ordem').value = data.ordem || 0;
            document.querySelector('#sponsor-modal h3').textContent = 'Editar Patrocinador';
            sponsorModal.classList.add('show');
        }
    });
};

window.deleteSponsor = async function (id) {
    if (!confirm('Tem certeza que deseja excluir este patrocinador?')) return;
    try {
        await deleteDoc(doc(db, 'patrocinadores', id));
        showToast('Patrocinador excluído!');
        loadPatrocinadores();
    } catch (err) {
        showToast('Erro ao excluir', true);
    }
};

// ── Close Modals ────────────────────────────
document.querySelectorAll('.btn-cancel, .modal-overlay').forEach(el => {
    el.addEventListener('click', (e) => {
        if (e.target === el) {
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('show'));
        }
    });
});

document.querySelectorAll('.btn-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('show'));
    });
});
