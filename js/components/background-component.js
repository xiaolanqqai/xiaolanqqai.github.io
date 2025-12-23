/**
 * Background Component
 * Handles Particles.js and Flying Fish background
 */
(function() {
    let basePath;
    const path = window.location.pathname;
    if (path.includes('/index/manager/')) {
        basePath = '../../';
    } else if (path.includes('/index/')) {
        basePath = '../';
    } else {
        basePath = './';
    }
    
    const backgroundHTML = `
        <div class="z-1">
            <div class="z-4">
                <div id="jsi-flying-fish-container" class="w-100"></div>
            </div>
            <canvas class="background"></canvas>
        </div>
    `;

    // Inject background structure
    document.body.insertAdjacentHTML('beforeend', backgroundHTML);

    // Helper to load scripts sequentially
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    // Load libraries and init
    async function initBackground() {
        try {
            // Check if libraries are already loaded
            if (typeof Particles === 'undefined') {
                await loadScript(`${basePath}js/particles.min.js`);
            }
            
            // Load foot.js and dark-mode.js
            await loadScript(`${basePath}js/foot.js`);
            await loadScript(`${basePath}js/dark-mode.js`);
            
            // Optional: load fish.js if it exists
            // await loadScript(`${basePath}js/fish.js`);
        } catch (err) {
            console.error('Failed to load background components:', err);
        }
    }

    // Use DOMContentLoaded to ensure body is available
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBackground);
    } else {
        initBackground();
    }
})();
