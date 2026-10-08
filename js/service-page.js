/* ============================================================
   OPULIA — service-page.js
   Shared behaviour for inner service pages:
   1. Header scroll state
   2. Mobile menu
   3. Horizontal process scroll + progress bar fill
   4. Scroll reveal
   5. Video modal
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ─── 1. HEADER SCROLL ─── */
    const header = document.getElementById('site-header');
    if (header) {
        const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 60);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ─── 2. MOBILE MENU ─── */
    const hamburger  = document.getElementById('hamburger');
    const mobileNav  = document.getElementById('mobileNav');
    const mobileLinks = document.querySelectorAll('.m-link, .m-cta');
    const closeMenu = () => {
        mobileNav  && mobileNav.classList.remove('open');
        hamburger  && hamburger.classList.remove('open');
        hamburger  && hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    };
    if (hamburger && mobileNav) {
        hamburger.addEventListener('click', () => {
            const isOpen = mobileNav.classList.toggle('open');
            hamburger.classList.toggle('open', isOpen);
            hamburger.setAttribute('aria-expanded', isOpen.toString());
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });
        mobileLinks.forEach(l => l.addEventListener('click', closeMenu));
    }

    /* ─── 3. HORIZONTAL PROCESS — scroll-linked bar fill ─── */
    const processWrap = document.querySelector('.svc-process-track-wrap');
    const processBar  = document.querySelector('.svc-process-bar-fill');
    const processSteps = document.querySelectorAll('.svc-p-step');

    if (processWrap && processBar) {
        const stepsEl = document.querySelector('.svc-process-steps');

        const updateBar = () => {
            if (!stepsEl) return;
            const max = stepsEl.scrollWidth - stepsEl.clientWidth;
            const pct = max > 0 ? (stepsEl.scrollLeft / max) * 100 : 100;
            processBar.style.width = Math.min(pct + 5, 100) + '%';

            // highlight active step
            processSteps.forEach((step, i) => {
                const stepLeft = step.offsetLeft - stepsEl.scrollLeft;
                step.classList.toggle('active', stepLeft < stepsEl.clientWidth * 0.5 && stepLeft > -step.offsetWidth);
            });
        };

        stepsEl && stepsEl.addEventListener('scroll', updateBar, { passive: true });

        // Also update on page scroll (section entering viewport)
        const barObs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    updateBar();
                    if (processSteps.length > 0) processSteps[0].classList.add('active');
                }
            });
        }, { threshold: 0.3 });
        barObs.observe(processWrap);
    }

    /* ─── 4. SCROLL REVEAL ─── */
    const reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && reveals.length) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('visible');
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        reveals.forEach(el => obs.observe(el));
    } else {
        reveals.forEach(el => el.classList.add('visible'));
    }

    /* ─── 5. VIDEO MODAL ─── */
    const modal     = document.getElementById('videoModal');
    const modalVideo = document.getElementById('modalVideo');
    const modalClose = document.getElementById('modalClose');

    document.querySelectorAll('[data-video-src]').forEach(tile => {
        tile.addEventListener('click', () => {
            const src = tile.dataset.videoSrc;
            if (!src || !modal || !modalVideo) return;
            modalVideo.src = src;
            modal.classList.add('open');
            modalVideo.play();
            document.body.style.overflow = 'hidden';
        });
    });

    const closeModal = () => {
        if (!modal || !modalVideo) return;
        modal.classList.remove('open');
        modalVideo.pause();
        modalVideo.src = '';
        document.body.style.overflow = '';
    };

    modalClose && modalClose.addEventListener('click', closeModal);
    modal && modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

});

