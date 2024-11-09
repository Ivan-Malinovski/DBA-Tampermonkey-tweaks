// ==UserScript==
// @name         DBA.dk Enhanced Image Carousel
// @namespace    http://tampermonkey.net/
// @version      5.8
// @description  Modern image carousel for DBA.dk with full-size view and navigation
// @author       Claude
// @match        https://www.dba.dk/*/id-*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const styles = {
        wrapper: {
            display: 'flex',
            overflowX: 'scroll',
            scrollSnapType: 'x mandatory',
            width: '50vh',
            gap: '10px',
            scrollBehavior: 'smooth',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            backgroundColor: '#fff',
            webkitOverflowScrolling: 'touch',
            maxHeight: '50vh',
            padding: '0',
            zIndex: '9999',
            position: 'relative',
            transition: 'width 0.5s ease-in-out, max-height 0.5s ease-in-out'
        },
        slide: {
            flex: '0 0 100%',
            scrollSnapAlign: 'center',
            position: 'relative'
        },
        image: {
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
            maxHeight: '100%',
            transition: 'opacity 0.5s ease-in-out'
        },
        button: {
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: '10000',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #ddd',
            borderRadius: '50%',
            cursor: 'pointer',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            transition: 'transform 0.3s ease'
        }
    };

    function createButton(direction) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-label', direction);
        Object.assign(btn.style, styles.button);
        btn.style[direction === 'previous' ? 'left' : 'right'] = '20px';

        const svg = `<svg viewBox="0 0 100 100" width="24" height="24" style="fill: #333;">
            <path d="M 10,50 L 60,100 L 70,90 L 30,50 L 70,10 L 60,0 Z"
                  ${direction === 'next' ? 'transform="translate(100, 100) rotate(180)"' : ''}/>
        </svg>`;
        btn.innerHTML = svg;

        // Add hover effect
        btn.onmouseenter = () => {
            btn.style.background = 'rgba(255, 255, 255, 0.95)';
            btn.style.transform = 'translateY(-50%) scale(1.1)';
        };
        btn.onmouseleave = () => {
            btn.style.background = 'rgba(255, 255, 255, 0.8)';
            btn.style.transform = 'translateY(-50%) scale(1)';
        };

        return btn;
    }

    function initCarousel(container) {
        const images = Array.from(container.querySelectorAll('.thumb-printable'));
        if (images.length < 2) return;

        document.querySelector('#guide-card')?.remove();

        const wrapper = document.createElement('div');
        Object.assign(wrapper.style, styles.wrapper);

        images.forEach(img => {
            const slide = document.createElement('div');
            Object.assign(slide.style, styles.slide);

            const fullImg = document.createElement('img');
            fullImg.src = img.dataset.srcLarge || img.src;
            Object.assign(fullImg.style, styles.image);

            slide.appendChild(fullImg);
            wrapper.appendChild(slide);
        });

        container.innerHTML = '';
        container.style.position = 'relative'; // Ensure container is positioned to allow buttons to be positioned absolutely within it
        container.appendChild(wrapper);

        const prevBtn = createButton('previous');
        const nextBtn = createButton('next');

        // Append buttons to the container so they stay fixed relative to the carousel itself
        container.appendChild(prevBtn);
        container.appendChild(nextBtn);

        [prevBtn, nextBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                wrapper.scrollBy({
                    left: (btn === prevBtn ? -1 : 1) * wrapper.clientWidth,
                    behavior: 'smooth'
                });
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key.startsWith('Arrow')) {
                wrapper.scrollBy({
                    left: (e.key === 'ArrowLeft' ? -1 : 1) * wrapper.clientWidth,
                    behavior: 'smooth'
                });
            }
        });

        wrapper.addEventListener('click', () => {
            if (wrapper.style.maxHeight === '90vh') {
                wrapper.style.maxHeight = '50vh';
                wrapper.style.width = '50vh';
                moveBusinessCardDown(false);
            } else {
                wrapper.style.maxHeight = '90vh';
                wrapper.style.width = '77vh';
                moveBusinessCardDown(true);
            }
            updateButtonPosition(); // Update button position when toggling wrapper size
        });

        // Move the business-card below the carousel in expanded mode
        const moveBusinessCardDown = (moveDown) => {
            const businessCard = document.querySelector('#business-card');
            if (businessCard) {
                businessCard.style.transition = 'margin-top 0.5s ease-in-out';
                if (moveDown) {
                    const wrapperHeight = wrapper.getBoundingClientRect().height;
                    businessCard.style.marginTop = `${wrapperHeight + 300}px`;
                } else {
                    businessCard.style.marginTop = '0';
                }
            }
        };

        // Update button positioning on wrapper resize
        const updateButtonPosition = () => {
            const wrapperRect = wrapper.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            prevBtn.style.left = `${wrapperRect.left - containerRect.left + 10}px`;
            nextBtn.style.left = `${wrapperRect.right - containerRect.left - nextBtn.clientWidth - 30}px`;
        };

        // Observe changes in the wrapper size
        new ResizeObserver(updateButtonPosition).observe(wrapper);

        // Initial position update
        updateButtonPosition();

        window.addEventListener('resize', updateButtonPosition);
    }

    new MutationObserver((mutations, obs) => {
        const container = document.querySelector('.vip-picture-gallery.default-picture-gallery.clearfix[data-ga-lbl="open-picture-browser"]');
        if (container) {
            obs.disconnect();
            initCarousel(container);
        }
    }).observe(document.body, { childList: true, subtree: true });
})();
