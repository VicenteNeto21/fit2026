/* ============================================
   FIT 2026 — JavaScript Interativo
   Countdown, Menu Mobile, Programação (JSON),
   Scroll suave, Animações
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ── Header Scroll Effect ──────────────────────
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 60);
    });

    // ── Mobile Menu ───────────────────────────────
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileBtn && mobileMenu) {
        // Ensure initial ARIA state
        mobileBtn.setAttribute('aria-expanded', mobileMenu.classList.contains('hidden') ? 'false' : 'true');
        mobileMenu.setAttribute('aria-hidden', mobileMenu.classList.contains('hidden') ? 'true' : 'false');

        function handleEscape(e) {
            if (e.key === 'Escape' || e.key === 'Esc') {
                if (!mobileMenu.classList.contains('hidden')) toggleMobileMenu();
            }
        }

        function toggleMobileMenu() {
            const willOpen = mobileMenu.classList.contains('hidden');
            if (willOpen) {
                mobileMenu.classList.remove('hidden');
                mobileMenu.setAttribute('aria-hidden', 'false');
                mobileBtn.setAttribute('aria-expanded', 'true');
                const icon = mobileBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-times';
                // Move focus to first link in menu for accessibility
                const firstLink = mobileMenu.querySelector('a');
                if (firstLink) firstLink.focus();
                // Prevent background scroll when menu open
                document.body.style.overflow = 'hidden';
                document.addEventListener('keydown', handleEscape);
            } else {
                mobileMenu.classList.add('hidden');
                mobileMenu.setAttribute('aria-hidden', 'true');
                mobileBtn.setAttribute('aria-expanded', 'false');
                const icon = mobileBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-bars';
                document.body.style.overflow = '';
                mobileBtn.focus();
                document.removeEventListener('keydown', handleEscape);
            }
        }

        mobileBtn.addEventListener('click', toggleMobileMenu);

        // Fechar menu ao clicar em link (mantendo foco e aria atualizados)
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (!mobileMenu.classList.contains('hidden')) toggleMobileMenu();
            });
        });
    }

    // ── Countdown Timer ──────────────────────────
    const eventDate = new Date('2026-10-04T08:00:00-03:00').getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const diff = eventDate - now;

        if (diff <= 0) {
            document.getElementById('cd-days').textContent = '00';
            document.getElementById('cd-hours').textContent = '00';
            document.getElementById('cd-minutes').textContent = '00';
            document.getElementById('cd-seconds').textContent = '00';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('cd-days').textContent = String(days).padStart(2, '0');
        document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('cd-minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('cd-seconds').textContent = String(seconds).padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);

    // ── Programação Dinâmica (JSON) ──────────────
    async function loadProgramacao() {
        try {
            const response = await fetch('assets/data/programacao.json');
            if (!response.ok) throw new Error('Erro ao carregar programação');
            const data = await response.json();
            renderProgramacao(data);
        } catch (error) {
            console.error('Erro:', error);
            const tabsContainer = document.getElementById('schedule-tabs');
            if (tabsContainer) {
                tabsContainer.innerHTML = '<span class="schedule-loading" style="color:#ff6b35;">Erro ao carregar programação. Recarregue a página.</span>';
            }
        }
    }

    function renderProgramacao(data) {
        const tabsContainer = document.getElementById('schedule-tabs');
        const daysContainer = document.getElementById('schedule-days-container');

        if (!tabsContainer || !daysContainer) return;

        // Limpar loading
        tabsContainer.innerHTML = '';
        daysContainer.innerHTML = '';

        // Gerar abas
        data.dias.forEach((dia, index) => {
            const tab = document.createElement('button');
            tab.className = 'schedule-tab' + (index === 0 ? ' active' : '');
            tab.setAttribute('data-day', dia.id);
            tab.textContent = `${dia.label} (${dia.data})`;
            tabsContainer.appendChild(tab);
        });

        // Gerar conteúdo dos dias
        data.dias.forEach((dia, index) => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'schedule-day' + (index === 0 ? ' active' : '');
            dayDiv.id = dia.id;

            dia.atividades.forEach(atividade => {
                const card = createScheduleCard(atividade);
                dayDiv.appendChild(card);
            });

            daysContainer.appendChild(dayDiv);
        });

        // Ativar abas
        initScheduleTabs();
    }

    function createScheduleCard(atividade) {
        const card = document.createElement('div');
        card.className = 'schedule-card' + (atividade.tipo === 'coffee' ? ' card-coffee' : '');

        // Horário
        const time = document.createElement('div');
        time.className = 'schedule-time';
        time.textContent = atividade.horario;
        card.appendChild(time);

        // Info
        const info = document.createElement('div');
        info.className = 'schedule-info';

        const title = document.createElement('h4');
        title.textContent = atividade.titulo;
        info.appendChild(title);

        if (atividade.palestrante) {
            const speaker = document.createElement('p');
            speaker.innerHTML = `<i class="fas fa-user"></i> ${atividade.palestrante}`;
            info.appendChild(speaker);
        }

        const location = document.createElement('p');
        location.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${atividade.local}`;
        info.appendChild(location);

        card.appendChild(info);

        // Tag
        const tag = document.createElement('span');
        tag.className = `schedule-tag tag-${atividade.tipo}`;
        tag.textContent = atividade.tipoLabel;
        card.appendChild(tag);

        return card;
    }

    function initScheduleTabs() {
        const tabs = document.querySelectorAll('.schedule-tab');
        const days = document.querySelectorAll('.schedule-day');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetDay = tab.getAttribute('data-day');

                tabs.forEach(t => t.classList.remove('active'));
                days.forEach(d => d.classList.remove('active'));

                tab.classList.add('active');
                const targetElement = document.getElementById(targetDay);
                if (targetElement) targetElement.classList.add('active');
            });
        });
    }

    // Carregar programação
    loadProgramacao();

    // ── Smooth Scroll (Links de Navegação) ───────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            e.preventDefault();
            const target = document.querySelector(targetId);
            if (target) {
                const headerHeight = header.offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });

    // ── Active Nav Link ──────────────────────────
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('section[id]');

    function highlightNavLink() {
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const top = section.offsetTop - 80;
            const bottom = top + section.offsetHeight;
            const id = section.getAttribute('id');

            navLinks.forEach(link => {
                if (link.getAttribute('href') === `#${id}`) {
                    link.classList.toggle('active', scrollPos >= top && scrollPos < bottom);
                }
            });
        });
    }

    window.addEventListener('scroll', highlightNavLink);

    // ── Fade-in Animations ──────────────────────
    const fadeElements = document.querySelectorAll('.section-header, .schedule-card, .speaker-card, .sponsor-tier, .organizer-card, .evento-content');

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                fadeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        fadeObserver.observe(el);
    });

    // ── Speaker Modal Logic ─────────────────────
    const speakerModal = document.getElementById('speaker-modal');
    const detailButtons = document.querySelectorAll('.btn-details');
    const closeModalBtn = document.getElementById('close-modal');
    const modalOverlay = document.querySelector('.speaker-modal-overlay');

    if (speakerModal) {
        function openSpeakerModal(btn) {
            // Populate data
            document.getElementById('modal-photo').src = btn.dataset.photo;
            document.getElementById('modal-name').textContent = btn.dataset.name;
            document.getElementById('modal-role').textContent = btn.dataset.role;
            document.getElementById('modal-title').textContent = btn.dataset.title;
            document.getElementById('modal-time').textContent = btn.dataset.time;
            document.getElementById('modal-location').textContent = btn.dataset.location;
            document.getElementById('modal-bio').innerHTML = btn.dataset.bio;
            document.getElementById('modal-link').href = btn.dataset.link;

            // Show modal
            speakerModal.classList.remove('hidden');
            speakerModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';

            // Add ESC listener
            document.addEventListener('keydown', handleModalEscape);
        }

        function closeSpeakerModal() {
            speakerModal.classList.add('hidden');
            speakerModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleModalEscape);
        }

        function handleModalEscape(e) {
            if (e.key === 'Escape' || e.key === 'Esc') {
                closeSpeakerModal();
            }
        }

        detailButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                openSpeakerModal(btn);
            });
        });

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeSpeakerModal);
        }

        if (modalOverlay) {
            modalOverlay.addEventListener('click', closeSpeakerModal);
        }
    }

});
