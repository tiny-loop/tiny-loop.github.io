import * as framerMotion from 'https://esm.run/framer-motion';

const { animate, timeline } = framerMotion;

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const slides = document.querySelectorAll('.slide');
    const slideWrapper = document.getElementById('slide-wrapper');
    const progressBar = document.getElementById('progress-bar');
    const navDotsContainer = document.querySelector('.nav-dots-container');
    const arrowPrev = document.getElementById('arrow-prev');
    const arrowNext = document.getElementById('arrow-next');
    const overviewGrid = document.getElementById('slide-overview-grid');
    
    let currentSlide = 0;
    let overviewVisible = false;

    function updateSlideWrapperSize() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let wrapperWidth, wrapperHeight;

        if (viewportWidth / viewportHeight > 16 / 9) {
            wrapperHeight = viewportHeight * 0.95; 
            wrapperWidth = wrapperHeight * (16 / 9);
        } else {
            wrapperWidth = viewportWidth * 0.95;
            wrapperHeight = wrapperWidth * (9 / 16);
        }
        
        slideWrapper.style.width = `${wrapperWidth}px`;
        slideWrapper.style.height = `${wrapperHeight}px`;
    }

    function createNavDots() {
        slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.classList.add('nav-dot');
            dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
            dot.addEventListener('click', () => goToSlide(index));
            navDotsContainer.appendChild(dot);
        });
    }

    function updateNavDots() {
        const dots = navDotsContainer.querySelectorAll('.nav-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    function updateProgressBar() {
        const progress = ((currentSlide + 1) / slides.length) * 100;
        gsap.to(progressBar, { width: `${progress}%`, duration: 0.3, ease: 'power2.out' });
    }
    
    function animateSlideIn(slideElement) {
        const elementsToAnimate = slideElement.querySelectorAll('h1, h2, h3, p, ul, li, div.grid > div, .bento-card, i[data-lucide]');
        const tl = gsap.timeline();
        tl.fromTo(elementsToAnimate, 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, stagger: 0.1, duration: 0.4, ease: 'power2.out' }
        );
    }

    function showSlide(index) {
        if (index < 0 || index >= slides.length) return;

        const oldSlide = slides[currentSlide];
        currentSlide = index;
        const newSlide = slides[currentSlide];

        slides.forEach(s => {
            s.classList.remove('active', 'prev');
            s.style.zIndex = 0; 
        });

        if (oldSlide !== newSlide) {
            gsap.to(oldSlide, {
                opacity: 0,
                xPercent: (index > Array.from(slides).indexOf(oldSlide)) ? -50 : 50,
                duration: 0.6,
                ease: 'power2.inOut',
                onComplete: () => {
                    oldSlide.classList.remove('active');
                }
            });
        }
        
        newSlide.classList.add('active');
        newSlide.style.zIndex = 1;
        gsap.fromTo(newSlide, 
            { opacity: 0, xPercent: (index > Array.from(slides).indexOf(oldSlide) || oldSlide === newSlide) ? 50 : -50 },
            { opacity: 1, xPercent: 0, duration: 0.6, ease: 'power2.inOut', onComplete: () => {
                 animateSlideIn(newSlide);
            }}
        );

        updateNavDots();
        updateProgressBar();
        lucide.createIcons({
            nodes: [newSlide],
            attrs: {
                'stroke-width': 1.5 
            }
        });
    }

    function nextSlide() {
        if (currentSlide < slides.length - 1) {
            showSlide(currentSlide + 1);
        }
    }

    function prevSlide() {
        if (currentSlide > 0) {
            showSlide(currentSlide - 1);
        }
    }

    function goToSlide(index) {
        if (overviewVisible) {
            toggleOverview();
        }
        showSlide(index);
    }

    function toggleOverview() {
        overviewVisible = !overviewVisible;
        if (overviewVisible) {
            overviewGrid.innerHTML = '';
            slides.forEach((slide, index) => {
                const thumb = document.createElement('div');
                thumb.classList.add('overview-slide-thumbnail');
                const titleElement = slide.querySelector('h1, h2');
                thumb.innerHTML = `<span>${index + 1}. ${titleElement ? titleElement.textContent.substring(0,50) : `Slide ${index+1}`}</span>`;
                thumb.addEventListener('click', () => goToSlide(index));
                overviewGrid.appendChild(thumb);
            });
            gsap.fromTo(overviewGrid, {opacity:0, display:'none'}, {opacity:1, display:'grid', duration:0.3});
        } else {
            gsap.to(overviewGrid, {opacity:0, duration:0.3, onComplete: () => overviewGrid.style.display = 'none'});
        }
    }

    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
    
    window.addEventListener('resize', updateSlideWrapperSize);
    
    arrowPrev.addEventListener('click', prevSlide);
    arrowNext.addEventListener('click', nextSlide);

    document.addEventListener('keydown', (e) => {
        if (overviewVisible && e.key !== 'Escape' && e.key.toLowerCase() !== 'o') return;

        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            nextSlide();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevSlide();
        } else if (e.key.toLowerCase() === 'o') {
            e.preventDefault();
            toggleOverview();
        } else if (e.key.toLowerCase() === 'f') {
            e.preventDefault();
            toggleFullScreen();
        } else if (e.key === 'Escape') {
            if (overviewVisible) {
                e.preventDefault();
                toggleOverview();
            }
        }
    });

    let touchstartX = 0;
    let touchendX = 0;
    
    slideWrapper.addEventListener('touchstart', function(event) {
        touchstartX = event.changedTouches[0].screenX;
    }, false);
    
    slideWrapper.addEventListener('touchend', function(event) {
        touchendX = event.changedTouches[0].screenX;
        handleGesture();
    }, false); 

    function handleGesture() {
        if (touchendX < touchstartX - 50) { // Swiped left
            nextSlide();
        }
        if (touchendX > touchstartX + 50) { // Swiped right
            prevSlide();
        }
    }
    
    let scrollTimeout;
    slideWrapper.addEventListener('wheel', (event) => {
        event.preventDefault();
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (event.deltaY > 0 || event.deltaX > 0) {
                nextSlide();
            } else if (event.deltaY < 0 || event.deltaX < 0) {
                prevSlide();
            }
        }, 50); // Debounce scroll events
    }, { passive: false });


    updateSlideWrapperSize();
    createNavDots();
    showSlide(0); 
});

