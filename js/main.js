/* ===============================================
   OPULIA — main.js
   All interactive behaviour:
   1. Header scroll state
   2. Mobile menu
   3. Hero timed cinematic text (synced to video)
   4. Scroll reveal
   5. Video modal
   6. Contact form
   =============================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ─────────────────────────────────────────────
       1. HEADER SCROLL STATE
    ───────────────────────────────────────────── */
    const header = document.getElementById('site-header');
    if (header) {
        if (header.classList.contains('inner-page-header')) {
            // Inner pages have no full-screen video hero — always show the
            // solid/scrolled state so nav links remain legible at page top.
            header.classList.add('scrolled');
        } else {
            const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 60);
            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll(); // run on load
        }
    }


    /* ─────────────────────────────────────────────
       2. MOBILE MENU
    ───────────────────────────────────────────── */
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


    /* ─────────────────────────────────────────────
       3. HERO TIMED CINEMATIC TEXT
       ─
       The hero video is ~16 seconds (looping).
       We split it into 4 phases × 4 seconds each.
       Every phase shows:
         • A large editorial headline
         • A supporting line
       Text fades out → swaps content → fades in.
    ───────────────────────────────────────────── */

    // Define the 4 slides matching event types seen in the video
    const heroSlides = [
        {
            line: 'Where every vow finds\nits perfect setting.',
            sub:  'Full-service wedding planning & design — from first concept to final farewell.'
        },
        {
            line: 'Culture honoured.\nBeauty elevated.',
            sub:  'We celebrate every tradition with the artistry and care it deserves.'
        },
        {
            line: 'Grand moments for\npeople who deserve it most.',
            sub:  'From intimate gatherings to extraordinary celebrations — every scale, curated.'
        },
        {
            line: 'We plan it all.\nSo you can feel it all.',
            sub:  'Destination events, anniversaries, private events — one team, unlimited capability.'
        }
    ];

    const SLIDE_DURATION = 4000; // ms per slide (total: 16s = one video loop)
    const FADE_DURATION  = 500;  // ms for fade transition

    const lineEl    = document.getElementById('heroLine');
    const subEl     = document.getElementById('heroSub');
    const cinematic = document.getElementById('heroCinematic');

    let currentSlide = 0;
    let slideTimer   = null;

    // Write a slide's content into the DOM
    const applySlide = (index) => {
        const s = heroSlides[index];
        if (!s || !lineEl || !subEl) return;

        // Convert \n to <br>
        lineEl.innerHTML  = s.line.replace(/\n/g, '<br>');
        subEl.textContent = s.sub;
    };

    // Transition to next slide
    const goToSlide = (index) => {
        if (!cinematic) return;

        // Fade out
        cinematic.classList.add('fading');

        setTimeout(() => {
            currentSlide = index % heroSlides.length;
            applySlide(currentSlide);

            // Fade back in by removing class
            cinematic.classList.remove('fading');
        }, FADE_DURATION);
    };

    // Auto-advance
    const startCycle = () => {
        if (slideTimer) clearInterval(slideTimer);
        slideTimer = setInterval(() => {
            goToSlide(currentSlide + 1);
        }, SLIDE_DURATION);
    };

    // Initialise
    if (cinematic && lineEl && subEl) {
        applySlide(0);
        startCycle();
    }

    // Optional: sync to video currentTime for perfect loop alignment
    const heroVideo = document.getElementById('heroVideo');
    if (heroVideo && cinematic) {
        heroVideo.addEventListener('timeupdate', () => {
            const t    = heroVideo.currentTime;
            const dur  = heroVideo.duration || 16;
            const pct  = (t % dur) / dur;          // 0 → 1 within one loop
            const idx  = Math.floor(pct * heroSlides.length);

            if (idx !== currentSlide) {
                // Video has moved to a new segment — snap immediately
                clearInterval(slideTimer);

                // Only animate if the gap is exactly 1 slide
                if (idx === (currentSlide + 1) % heroSlides.length) {
                    goToSlide(idx);
                } else {
                    // Jump without animation
                    currentSlide = idx;
                    applySlide(currentSlide);
                }
                startCycle();
            }
        });
    }


    /* ─────────────────────────────────────────────
       4. SCROLL REVEAL
    ───────────────────────────────────────────── */
    const reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && reveals.length) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

        reveals.forEach(el => obs.observe(el));
    } else {
        reveals.forEach(el => el.classList.add('visible'));
    }


    /* ─────────────────────────────────────────────
       5. SMOOTH ANCHOR SCROLL
    ───────────────────────────────────────────── */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const id = this.getAttribute('href');
            const target = id === '#' ? null : document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            closeMenu();
            const offset = header ? header.offsetHeight : 0;
            window.scrollTo({
                top: target.getBoundingClientRect().top + window.scrollY - offset,
                behavior: 'smooth'
            });
        });
    });


    /* ─────────────────────────────────────────────
       6. VIDEO MODAL
    ───────────────────────────────────────────── */
    const modal      = document.getElementById('videoModal');
    const modalVideo = document.getElementById('modalVideo');
    const modalClose = document.getElementById('modalClose');
    const vTiles     = document.querySelectorAll('.v-tile');

    if (modal && modalVideo && modalClose) {
        vTiles.forEach(tile => {
            tile.addEventListener('click', () => {
                const src = tile.dataset.videoSrc;
                if (!src) return;
                modalVideo.src = src;
                modal.classList.add('open');
                modalVideo.play();
                document.body.style.overflow = 'hidden';
            });
        });

        const closeModal = () => {
            modal.classList.remove('open');
            modalVideo.pause();
            modalVideo.src = '';
            document.body.style.overflow = '';
        };

        modalClose.addEventListener('click', closeModal);
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
    }


    /* ─────────────────────────────────────────────
       7. CONTACT FORM
    ───────────────────────────────────────────── */
    const form = document.getElementById('opulia-contact-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const btn = form.querySelector('.form-submit-btn');
            if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }

            setTimeout(() => {
                const confirmation = document.getElementById('form-confirmation');
                if (confirmation) {
                    form.style.display = 'none';
                    confirmation.style.display = 'block';
                }
            }, 1200);
        });
    }

    /* ─────────────────────────────────────────────
       8. SERVICES CAROUSEL
    ───────────────────────────────────────────── */
    const svcCarousel = document.getElementById('svcCarousel');
    const carouselLeft = document.getElementById('carouselLeft');
    const carouselRight = document.getElementById('carouselRight');

    if (svcCarousel && carouselLeft && carouselRight) {
        const getScrollAmount = () => {
            const card = svcCarousel.querySelector('.all-svc-card');
            return card ? card.offsetWidth + 24 : 300;
        };
        carouselLeft.addEventListener('click', () => { svcCarousel.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' }); });
        carouselRight.addEventListener('click', () => { svcCarousel.scrollBy({ left:  getScrollAmount(), behavior: 'smooth' }); });
    }


    /* ─────────────────────────────────────────────
       9. HORIZONTAL PROCESS TIMELINE (Sticky Pinned Scroll)
       The screen pins in place when reaching the Process section.
       As the user scrolls, the page stays on this section while
       the line smoothly fills horizontally across from 01 to 04.
       All 4 dots fill completely before the section unpins.
    ───────────────────────────────────────────── */
    const processSection = document.getElementById('process');
    const processWrap    = document.getElementById('processTimelineWrap');
    const hptTrack       = document.getElementById('hptTrack');
    const hptFill        = document.getElementById('hptFill');
    const hptDots        = [0,1,2,3].map(i => document.getElementById('hptDot' + i));
    const hptSteps       = document.querySelectorAll('.hpt-step');

    if (processSection && processWrap && hptFill) {
        // Pixel-perfect track alignment between center of Dot 0 and center of Dot 3
        const alignTrack = () => {
            if (!hptTrack || !hptDots[0] || !hptDots[3]) return;
            const wrapRect = processWrap.getBoundingClientRect();
            const d0Rect   = hptDots[0].getBoundingClientRect();
            const d3Rect   = hptDots[3].getBoundingClientRect();

            if (wrapRect.width > 0 && d0Rect.width > 0 && d3Rect.width > 0) {
                const leftOffset  = Math.round((d0Rect.left + d0Rect.width / 2) - wrapRect.left);
                const rightOffset = Math.round(wrapRect.right - (d3Rect.left + d3Rect.width / 2));
                // Track spans full container width — left/right kept at 0 by CSS
                // hptTrack.style.left  = leftOffset + 'px';
                // hptTrack.style.right = rightOffset + 'px';
            }
        };

        const updateTimeline = () => {
            const rect = processSection.getBoundingClientRect();
            const winH = window.innerHeight;
            const scrollRange = processSection.offsetHeight - winH;

            if (scrollRange <= 0) {
                // Non-sticky fallback (e.g. mobile)
                hptFill.style.width = '100%';
                hptDots.forEach(d => d && d.classList.add('active'));
                hptSteps.forEach(s => s && s.classList.add('active'));
                return;
            }

            alignTrack();

            // When section reaches the top of the viewport (pinned), rect.top is <= 0
            const scrolled = -rect.top;
            const rawPct   = Math.max(0, Math.min(1, scrolled / scrollRange));

            // Start filling shortly after arriving (0.02), reach 100% at 0.88.
            // This leaves 88% - 100% where all 4 dots are completely filled
            // and clearly visible before unpinning!
            const startBuf = 0.02;
            const endBuf   = 0.88;
            const fillPct  = Math.max(0, Math.min(1, (rawPct - startBuf) / (endBuf - startBuf)));

            hptFill.style.width = (fillPct * 100) + '%';

            // 4 dots evenly spaced: 0, 1/3, 2/3, 1.0
            const thresholds = [0.0, 0.32, 0.65, 0.98];
            hptDots.forEach((dot, idx) => {
                if (!dot) return;
                const isActive = fillPct >= thresholds[idx];
                dot.classList.toggle('active', isActive);
                if (hptSteps[idx]) {
                    hptSteps[idx].classList.toggle('active', isActive);
                }
            });
        };

        window.addEventListener('scroll', updateTimeline, { passive: true });
        window.addEventListener('resize', () => {
            alignTrack();
            updateTimeline();
        });

        // Trigger on initial load
        setTimeout(() => {
            alignTrack();
            updateTimeline();
        }, 120);
    }


    /* ─────────────────────────────────────────────
       10. TESTIMONIAL SLIDER
    ───────────────────────────────────────────── */
    const testimonials = [
        {
            leftImage: 'https://res.cloudinary.com/numgcgpy/image/upload/q_auto,f_auto/testimonial1-img1.jpg',
            rightImage: 'https://res.cloudinary.com/numgcgpy/image/upload/q_auto,f_auto/testimonial1-img2.jpg',
            quote: "On our wedding day I didn't once think about logistics. I was simply present. Opulia turned our vision into something that felt too beautiful to be real — yet it was entirely ours.",
            author: '— AYESHA + ZAIN'
        },
        {
            leftImage: 'https://res.cloudinary.com/numgcgpy/image/upload/q_auto,f_auto/testimonial2-img1.jpg',
            rightImage: 'https://res.cloudinary.com/numgcgpy/image/upload/q_auto,f_auto/restimonial2-img2.jpg',
            quote: "My 30th was meant to be intimate — 40 guests, no fuss. Opulia made it feel like the most considered, beautiful evening I've ever attended. Every detail was intentional.",
            author: '— SARA M.'
        },
        {
            leftImage: 'https://res.cloudinary.com/numgcgpy/image/upload/q_auto,f_auto/testimonial3-img1.jpg',
            rightImage: 'https://res.cloudinary.com/numgcgpy/image/upload/q_auto,f_auto/testimonial3-img2.jpg',
            quote: "Planning a Nikkah across two countries felt daunting. Opulia managed every moving part flawlessly. Our guests said it was the most beautifully organised event they had ever attended.",
            author: '— FATIMA + OMAR'
        }
    ];

    const htArchImg     = document.getElementById('htArchImg');
    const htQuoteBox    = document.getElementById('htQuoteBox');
    const htQuote       = document.getElementById('htQuote');
    const htAuthor      = document.getElementById('htAuthor');
    const htSliderTrack = document.getElementById('htSliderTrack');
    const htPrev        = document.getElementById('htPrev');
    const htNext        = document.getElementById('htNext');

    let currentTesti = 0;
    let isAnimating  = false;

    // Initial scroll reveal for first right photo — slides in from full right (same effect as the slider)
    if (htSliderTrack) {
        const initialPhoto = htSliderTrack.querySelector('.ht-photo');
        if (initialPhoto) {
            // Snap off-screen to the right (no transition yet so position is instant)
            initialPhoto.style.transform = 'translateX(100%)';
            initialPhoto.style.opacity = '1';
            initialPhoto.style.transition = 'none';

            const testiObs = new IntersectionObserver(entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        // Double rAF ensures the initial position is painted before we animate
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                initialPhoto.style.transition = 'transform 3s cubic-bezier(0.25, 1, 0.3, 1)';
                                initialPhoto.style.transform = 'translateX(0)';
                            });
                        });
                        testiObs.unobserve(e.target);
                    }
                });
            }, { threshold: 0.2 });
            testiObs.observe(htSliderTrack);
        }
    }

    const switchTesti = (targetIdx, direction = 'next') => {
        if (isAnimating || targetIdx === currentTesti) return;
        isAnimating = true;

        if (htPrev) htPrev.disabled = true;
        if (htNext) htNext.disabled = true;

        const data = testimonials[targetIdx];
        const currentPhoto = htSliderTrack ? htSliderTrack.querySelector('.ht-photo') : null;

        // 1. Prepare incoming right photo
        let incomingPhoto = null;
        if (htSliderTrack) {
            incomingPhoto = document.createElement('img');
            incomingPhoto.src = data.rightImage;
            incomingPhoto.alt = 'Curated celebration moment';
            incomingPhoto.className = 'ht-photo';
            incomingPhoto.style.zIndex = '2';

            const startX = direction === 'next' ? '100%' : '-100%';
            incomingPhoto.style.transform = `translateX(${startX})`;
            incomingPhoto.style.transition = 'transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)';
            htSliderTrack.appendChild(incomingPhoto);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    incomingPhoto.style.transform = 'translateX(0)';
                    if (currentPhoto) {
                        const exitX = direction === 'next' ? '-25%' : '25%';
                        currentPhoto.style.transition = 'transform 0.75s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.75s ease';
                        currentPhoto.style.transform = `translateX(${exitX})`;
                        currentPhoto.style.opacity = '0.4';
                    }
                });
            });
        }

        // 2. Left side arch photo and quote fade out
        if (htArchImg)  htArchImg.classList.add('fading');
        if (htQuoteBox) htQuoteBox.classList.add('fading');

        // 3. Swap text and arch photo midway through slide
        setTimeout(() => {
            if (htQuote)   htQuote.textContent  = data.quote;
            if (htAuthor)  htAuthor.textContent = data.author;
            if (htArchImg) {
                htArchImg.src = data.leftImage;
                htArchImg.onload = () => {
                    htArchImg.classList.remove('fading');
                };
                // Fallback in case cached image doesn't fire load immediately
                setTimeout(() => htArchImg.classList.remove('fading'), 50);
            }
            if (htQuoteBox) htQuoteBox.classList.remove('fading');
        }, 280);

        // 4. Cleanup when slide finishes
        setTimeout(() => {
            if (currentPhoto && currentPhoto.parentNode) {
                currentPhoto.remove();
            }
            if (incomingPhoto) {
                incomingPhoto.style.zIndex = '1';
                incomingPhoto.style.transition = '';
            }
            currentTesti = targetIdx;
            isAnimating = false;
            if (htPrev) htPrev.disabled = false;
            if (htNext) htNext.disabled = false;
        }, 780);
    };

    if (htPrev && htNext) {
        htPrev.addEventListener('click', () => {
            const prevIdx = (currentTesti - 1 + testimonials.length) % testimonials.length;
            switchTesti(prevIdx, 'prev');
        });
        htNext.addEventListener('click', () => {
            const nextIdx = (currentTesti + 1) % testimonials.length;
            switchTesti(nextIdx, 'next');
        });
    }


    /* ─────────────────────────────────────────────
       11. COUNT-UP ANIMATION (About section stats)
    ───────────────────────────────────────────── */
    const countEls = document.querySelectorAll('.count-up');
    if (countEls.length && 'IntersectionObserver' in window) {
        const countObs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el     = entry.target;
                const target = parseInt(el.dataset.target, 10);
                const suffix = el.dataset.suffix || '';
                const duration = 1600;
                const start  = performance.now();

                const tick = (now) => {
                    const elapsed = now - start;
                    const pct     = Math.min(elapsed / duration, 1);
                    // ease-out quad
                    const val     = Math.round(pct * pct * (3 - 2 * pct) * target);
                    el.textContent = val + (pct === 1 ? suffix : '');
                    if (pct < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
                countObs.unobserve(el);
            });
        }, { threshold: 0.5 });
        countEls.forEach(el => countObs.observe(el));
    }

});
