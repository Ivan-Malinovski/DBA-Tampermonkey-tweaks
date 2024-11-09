// ==UserScript==
// @name         DBA.dk Enhanced Image Carousel
// @namespace    http://tampermonkey.net/
// @version      4.3
// @description  Modern image carousel for DBA.dk with full-size view and responsive navigation
// @author       Claude
// @match        https://www.dba.dk/*/id-*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const styles = {
        container: {
            position: 'relative',
            width: '100%',
            transition: 'all 0.3s ease-in-out'
        },
        wrapper: {
            display: 'flex',
            overflowX: 'scroll',
            scrollSnapType: 'x mandatory',
            width: '100%',
            gap: '10px',
            scrollBehavior: 'smooth',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            backgroundColor: '#fff',
            webkitOverflowScrolling: 'touch',
            maxHeight: '620px',
            padding: '0',
            position: 'relative',
            transition: 'all 0.3s ease-in-out'
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
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.5)',
            border: '1px solid rgba(221, 221, 221, 0.5)',
            borderRadius: '50%',
            cursor: 'pointer',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease-in-out',
            opacity: 0.7,
            pointerEvents: 'auto'
        }
    };

    function createButton(direction) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-label', direction);
        Object.assign(btn.style, styles.button);

        // Position buttons using percentages
        btn.style[direction === 'previous' ? 'left' : 'right'] = '2%';

        const svg = `<svg viewBox="0 0 100 100" width="18" height="18" style="fill: rgba(51, 51, 51, 0.8);">
            <path d="M 10,50 L 60,100 L 70,90 L 30,50 L 70,10 L 60,0 Z"
                  ${direction === 'next' ? 'transform="translate(100, 100) rotate(180)"' : ''}/>
        </svg>`;
        btn.innerHTML = svg;

        // Add hover effect
        btn.onmouseenter = () => {
            btn.style.background = 'rgba(255, 255, 255, 0.8)';
            btn.style.transform = 'translateY(-50%) scale(1.1)';
            btn.style.opacity = '1';
        };
        btn.onmouseleave = () => {
            btn.style.background = 'rgba(255, 255, 255, 0.5)';
            btn.style.transform = 'translateY(-50%) scale(1)';
            btn.style.opacity = '0.7';
        };

        return btn;
    }

    function initCarousel(container) {
        const images = Array.from(container.querySelectorAll('.thumb-printable'));
        if (images.length < 2) return;

        document.querySelector('#guide-card')?.remove();

        // Create a container for both wrapper and buttons
        const mainContainer = document.createElement('div');
        Object.assign(mainContainer.style, styles.container);

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
        mainContainer.appendChild(wrapper);
        container.appendChild(mainContainer);

        const prevBtn = createButton('previous');
        const nextBtn = createButton('next');
        const buttons = [prevBtn, nextBtn];

        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                wrapper.scrollBy({
                    left: (btn === prevBtn ? -1 : 1) * wrapper.clientWidth,
                    behavior: 'smooth'
                });
            });
            mainContainer.appendChild(btn);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key.startsWith('Arrow')) {
                wrapper.scrollBy({
                    left: (e.key === 'ArrowLeft' ? -1 : 1) * wrapper.clientWidth,
                    behavior: 'smooth'
                });
            }
        });

        let isExpanded = false;
        wrapper.addEventListener('click', () => {
            isExpanded = !isExpanded;

            // Update wrapper styles
            wrapper.style.maxHeight = isExpanded ? '1080px' : '620px';
            //wrapper.style.width = isExpanded ? '154%' : '100%';
            wrapper.style.zIndex = isExpanded ? '150' : '0';
            wrapper.style.transform = isExpanded ? 'scale(1.02)' : 'scale(1)';
            wrapper.style.boxShadow = isExpanded
                ? '0 8px 30px rgba(0, 0, 0, 0.15)'
                : '0 4px 15px rgba(0, 0, 0, 0.1)';

            // Update container width to match wrapper
            mainContainer.style.width = isExpanded ? '920px' : '100%';

            // Update button styles
            buttons.forEach(btn => {
                btn.style.width = isExpanded ? '40px' : '30px';
                btn.style.height = isExpanded ? '40px' : '30px';
                const svg = btn.querySelector('svg');
                svg.setAttribute('width', isExpanded ? '24' : '18');
                svg.setAttribute('height', isExpanded ? '24' : '18');
            });
        });
    }

    new MutationObserver((mutations, obs) => {
        const container = document.querySelector('.vip-picture-gallery.default-picture-gallery.clearfix[data-ga-lbl="open-picture-browser"]');
        if (container) {
            obs.disconnect();
            initCarousel(container);
        }
    }).observe(document.body, { childList: true, subtree: true });
})();
