/* ============================================
   FIT 2026 — JavaScript Interativo
   Countdown, Menu Mobile, Programação (JSON),
   Scroll suave, Animações
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ── Header Scroll Effect + Active Nav (único listener passivo) ────
    const header = document.getElementById('header');
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('section[id]');

    function onScroll() {
        // Header scrolled state
        header.classList.toggle('scrolled', window.scrollY > 60);

        // Active nav link
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

    window.addEventListener('scroll', onScroll, { passive: true });

    // ── Mobile Menu ───────────────────────────────
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', () => {
            const isOpen = !mobileMenu.classList.contains('hidden');
            mobileMenu.classList.toggle('hidden');
            mobileBtn.setAttribute('aria-expanded', !isOpen);
            mobileBtn.querySelector('i').className = isOpen ? 'fas fa-bars' : 'fas fa-times';
        });

        // Fechar menu ao clicar em link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                mobileBtn.setAttribute('aria-expanded', 'false');
                mobileBtn.querySelector('i').className = 'fas fa-bars';
            });
        });
    }

    // ── Countdown Timer (elementos cacheados) ────────────────────────
    const eventDate = new Date('2026-10-04T08:00:00-03:00').getTime();
    const cdDays    = document.getElementById('cd-days');
    const cdHours   = document.getElementById('cd-hours');
    const cdMinutes = document.getElementById('cd-minutes');
    const cdSeconds = document.getElementById('cd-seconds');

    function updateCountdown() {
        const diff = eventDate - Date.now();

        if (diff <= 0) {
            cdDays.textContent = cdHours.textContent = cdMinutes.textContent = cdSeconds.textContent = '00';
            return;
        }

        cdDays.textContent    = String(Math.floor(diff / 864e5)).padStart(2, '0');
        cdHours.textContent   = String(Math.floor((diff % 864e5) / 36e5)).padStart(2, '0');
        cdMinutes.textContent = String(Math.floor((diff % 36e5) / 6e4)).padStart(2, '0');
        cdSeconds.textContent = String(Math.floor((diff % 6e4) / 1e3)).padStart(2, '0');
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
                tabsContainer.innerHTML = '<span class="schedule-loading" style="color:var(--clr-orange);">Erro ao carregar programação. Recarregue a página.</span>';
            }
        }
    }

    function renderProgramacao(data) {
        const tabsContainer = document.getElementById('schedule-tabs');
        const daysContainer = document.getElementById('schedule-days-container');

        if (!tabsContainer || !daysContainer) return;

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

        initScheduleTabs();
    }

    function createScheduleCard(atividade) {
        const card = document.createElement('div');
        card.className = 'schedule-card' + (atividade.tipo === 'coffee' ? ' card-coffee' : '');

        const time = document.createElement('div');
        time.className = 'schedule-time';
        time.textContent = atividade.horario;
        card.appendChild(time);

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

    loadProgramacao();

    // ── Smooth Scroll (Links de Navegação) ───────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            e.preventDefault();
            const target = document.querySelector(targetId);
            if (target) {
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 16;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });

    // ── Fade-in via CSS class (sem inline style) ─
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.section-header, .schedule-card, .speaker-card, .sponsor-tier, .organizer-card, .evento-content')
        .forEach(el => {
            el.classList.add('fade-in');
            fadeObserver.observe(el);
        });

});

