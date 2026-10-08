/* ===============================================
   OPULIA — portfolio.js

   Animation sequence for the portfolio hero:
   1. Page loads → green bg, title/label/sub fade in
   2. After ~1.4s → image strip fades in + starts scrolling
   3. Strip scrolls continuously (pure CSS after that)

   Also handles:
   - Gallery item staggered reveals
   - Testimonial slider
   =============================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ─────────────────────────────────────────────
       0. HEADER — override main.js inner-page scroll
          Portfolio has its own dark hero, NOT
          the white background of contact.html
    ───────────────────────────────────────────── */
    const header = document.getElementById('site-header');
    if (header && header.classList.contains('inner-page-header')) {
        // main.js already added 'scrolled' — remove it so
        // we start with transparent header over green bg
        header.classList.remove('scrolled');

        const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 80);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }


    /* ─────────────────────────────────────────────
       1. HERO ANIMATION SEQUENCE

       Step A — immediately: reveal label + title + sub
       Step B — after 1.4s: fade strip in + start scrolling
    ───────────────────────────────────────────── */
    const label    = document.getElementById('pfHeroLabel');
    const title    = document.getElementById('pfHeroTitle');
    const sub      = document.getElementById('pfHeroSub');
    const stripWrap = document.getElementById('pfStripWrap');

    // Step A: stagger-reveal title elements
    if (label)  setTimeout(() => label.classList.add('revealed'),  100);
    if (title)  setTimeout(() => title.classList.add('revealed'),  250);
    if (sub)    setTimeout(() => sub.classList.add('revealed'),    450);

    // Step B: after text is read, bring in the image strip
    if (stripWrap) {
        setTimeout(() => {
            stripWrap.classList.add('active');
            // animation-play-state: running is set via CSS .active
        }, 1400);
    }


    /* ─────────────────────────────────────────────
       2. PARALLAX COLLAGE SCROLL
       Handled entirely by CSS animation (colScrollDown / colScrollUp).
       No JavaScript needed.
    ───────────────────────────────────────────── */




    /* ─────────────────────────────────────────────
       3. TESTIMONIAL SLIDER
    ───────────────────────────────────────────── */
    const testiData = [
        {
            quote: "On our wedding day I didn't once think about logistics. I was simply present. Opulia turned our vision into something that felt too beautiful to be real — yet it was entirely ours.",
            author: '— AYESHA + ZAIN',
            archImg: 'https://res.cloudinary.com/numgcgpy/image/upload/q_auto,f_auto/testimonial1-img1.jpg',
            slideImg: 'https://res.cloudinary.com/numgcgpy/image/upload/q_auto,f_auto/testimonial1-img2.jpg',
            archAlt: 'Ayesha and Zain portrait',
            slideAlt: 'Ayesha and Zain event moment'
        },
        {
            quote: "I handed them my Pinterest board and a single line: 'I want it to feel like a dream I never want to wake from.' They delivered exactly that — and then some.",
            author: '— SARA M.',
            archImg: 'https://res.cloudinary.com/numgcgpy/image/upload/q_auto,f_auto/testimonial2-img1.jpg',
            slideImg: 'https://res.cloudinary.com/numgcgpy/image/upload/q_auto,f_auto/restimonial2-img2.jpg',
            archAlt: 'Sara M. portrait',
            slideAlt: 'Sara event moment'
        },
        {
            quote: "Our Nikkah was everything we prayed it would be. Every detail — from the calligraphy to the lighting — carried meaning. Opulia understood what this ceremony meant to our families.",
            author: '— FATIMA + OMAR',
            archImg: 'https://res.cloudinary.com/numgcgpy/image/upload/q_auto,f_auto/testimonial3-img1.jpg',
            slideImg: 'https://res.cloudinary.com/numgcgpy/image/upload/q_auto,f_auto/testimonial3-img2.jpg',
            archAlt: 'Fatima and Omar portrait',
            slideAlt: 'Fatima and Omar Nikkah detail'
        }
    ];

    let currentTesti  = 0;
    const archImg     = document.getElementById('htArchImg');
    const quoteBox    = document.getElementById('htQuoteBox');
    const quoteEl     = document.getElementById('htQuote');
    const authorEl    = document.getElementById('htAuthor');
    const sliderTrack = document.getElementById('htSliderTrack');
    const prevBtn     = document.getElementById('htPrev');
    const nextBtn     = document.getElementById('htNext');

    if (!archImg || !quoteEl || !sliderTrack) return;

    function switchTesti(idx, direction) {
        const data = testiData[idx];
        const dir  = direction === 'next' ? 1 : -1;

        quoteBox && quoteBox.classList.add('fading');
        archImg.classList.add('fading');

        const newPhoto = document.createElement('img');
        newPhoto.src = data.slideImg;
        newPhoto.alt = data.slideAlt;
        newPhoto.className = 'ht-photo ht-photo-incoming';
        newPhoto.style.cssText = `
            position:absolute; inset:0;
            width:100%; height:100%; object-fit:cover;
            transform:translateX(${dir * 100}%);
            transition:transform 0.85s cubic-bezier(0.16,1,0.3,1);
        `;
        sliderTrack.appendChild(newPhoto);

        const curPhoto = sliderTrack.querySelector('.ht-photo-current');
        if (curPhoto) curPhoto.style.transition = 'transform 0.85s cubic-bezier(0.16,1,0.3,1)';

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                newPhoto.style.transform = 'translateX(0)';
                if (curPhoto) curPhoto.style.transform = `translateX(${-dir * 100}%)`;
            });
        });

        setTimeout(() => {
            archImg.src = data.archImg;
            archImg.alt = data.archAlt;
            archImg.classList.remove('fading');
            if (quoteEl)  quoteEl.textContent  = data.quote;
            if (authorEl) authorEl.textContent = data.author;
            quoteBox && quoteBox.classList.remove('fading');
            if (curPhoto) curPhoto.remove();
            newPhoto.className = 'ht-photo ht-photo-current';
            newPhoto.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
        }, 850);
    }

    prevBtn && prevBtn.addEventListener('click', () => {
        currentTesti = (currentTesti - 1 + testiData.length) % testiData.length;
        switchTesti(currentTesti, 'prev');
    });
    nextBtn && nextBtn.addEventListener('click', () => {
        currentTesti = (currentTesti + 1) % testiData.length;
        switchTesti(currentTesti, 'next');
    });

    // Slide-in reveal for initial right photo
    const testiSec = document.getElementById('pf-testimonials');
    if (testiSec) {
        const initObs = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                const p = sliderTrack.querySelector('.ht-photo');
                if (p) {
                    p.style.cssText = `
                        position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
                        transform:translateX(100%);
                        transition:transform 1.1s cubic-bezier(0.16,1,0.3,1) 0.2s;
                    `;
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => { p.style.transform = 'translateX(0)'; });
                    });
                }
                initObs.disconnect();
            }
        }, { threshold: 0.2 });
        initObs.observe(testiSec);
    }

});
