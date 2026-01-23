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
        <div class="background-container" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -100; pointer-events: none; background: var(--bg-primary); transition: background 0.3s ease;">
            <div id="jsi-flying-fish-container" style="position: absolute; bottom: 0; left: 0; width: 100%; height: 25vh; z-index: -95; pointer-events: none; opacity: 0.6;"></div>
            <canvas class="background" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -90; pointer-events: none;"></canvas>
        </div>
    `;

    // Inject background structure at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', backgroundHTML);

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
            // Check if jQuery is loaded (required for fish.js)
            if (typeof jQuery === 'undefined') {
                await loadScript(`${basePath}js/jquery-3.5.1.min.js`);
            }

            // Check if libraries are already loaded
            const scriptsToLoad = [];
            if (typeof Particles === 'undefined') {
                scriptsToLoad.push(loadScript(`${basePath}js/particles.min.js`));
            }
            
            scriptsToLoad.push(loadScript(`${basePath}js/foot.js`));
            scriptsToLoad.push(loadScript(`${basePath}js/dark-mode.js`));
            scriptsToLoad.push(loadScript(`${basePath}js/fish.js`));
            
            await Promise.all(scriptsToLoad);
            
            // Initialize Particles explicitly
            if (typeof Particles !== 'undefined') {
                Particles.init({
                    selector: '.background',
                    color: '#75A5B7',
                    connectParticles: false,
                    responsive: [
                        {
                            breakpoint: 768,
                            options: {
                                maxParticles: 40,
                                color: '#75A5B7',
                                connectParticles: false
                            }
                        }
                    ]
                });
            }

            // Initialize Fish (RENDERER) explicitly if loaded after DOMContentLoaded
            if (typeof RENDERER !== 'undefined') {
                RENDERER.init();
            }

            // Initialize DarkMode if not already initialized
            if (typeof DarkMode !== 'undefined' && !window.darkModeInstance) {
                window.darkModeInstance = new DarkMode();
            }

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
