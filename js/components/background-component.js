/**
 * Background Component - Interactive Particles and Flying Fish
 */
(function() {
    const getBasePath = () => window.getBasePath?.()
        ?? ((window.location.pathname.includes('/index/manager/')) ? '../../'
            : (window.location.pathname.includes('/index/')) ? '../' : './');

    const bgHTML = `
<div class="background-container" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-100;pointer-events:none;background:var(--bg-primary);transition:background .3s ease;">
    <div id="jsi-flying-fish-container" style="position:absolute;bottom:0;left:0;width:100%;height:25vh;z-index:-95;pointer-events:none;opacity:.6;"></div>
    <canvas id="interactive-particles" style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:-90;pointer-events:none;"></canvas>
</div>`;
    document.body.insertAdjacentHTML('afterbegin', bgHTML);

    // --- Script loader ---
    const loadScript = src => new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
    });

    // --- ParticleSystem (SOA + Float32Array for performance) ---
    const ParticleSystem = {
        canvas: null, ctx: null, mouse: {x: null, y: null}, isGathering: false,
        config: {
            particleCount: 1000,
            color: '#75A5B7',
            mouseRadius: 100,
            mouseForce: 2,
            baseSpeed: 1,
            connectionRadius: 0
        },

        init() {
            this.canvas = document.getElementById('interactive-particles');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            this.createParticles();
            window.addEventListener('resize', () => this.resize());
            window.addEventListener('mousemove', e => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; });
            window.addEventListener('mouseout', () => { this.mouse.x = null; this.mouse.y = null; });
            // Click toggles gather/repel (capture phase)
            window.addEventListener('click', e => {
                this.isGathering = !this.isGathering;
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            }, true);
            this.animate();
        },

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        },

        createParticles() {
            let count = this.config.particleCount;
            if (window.innerWidth < 768) count = Math.min(count, 1000);
            this.count = count;

            // SOA layout for cache-friendly access
            const {baseSpeed} = this.config;
            this.pX = new Float32Array(count);
            this.pY = new Float32Array(count);
            this.pVx = new Float32Array(count);
            this.pVy = new Float32Array(count);
            this.pBaseVx = new Float32Array(count);
            this.pBaseVy = new Float32Array(count);
            this.pSize = new Float32Array(count);

            for (let i = 0; i < count; i++) {
                this.pX[i] = Math.random() * this.canvas.width;
                this.pY[i] = Math.random() * this.canvas.height;
                const vx = (Math.random() - 0.5) * baseSpeed;
                const vy = (Math.random() - 0.5) * baseSpeed;
                this.pVx[i] = vx; this.pVy[i] = vy;
                this.pBaseVx[i] = vx; this.pBaseVy[i] = vy;
                this.pSize[i] = Math.random() * 2 + 1;
            }
        },

        animate() {
            const {width, height} = this.canvas;
            const ctx = this.ctx;
            const count = this.count;
            const {mouseRadius, mouseForce, baseSpeed, color} = this.config;
            const mouseRadiusSq = mouseRadius * mouseRadius;
            const baseSpeedSq = (baseSpeed * 2) ** 2;
            const minRebound = baseSpeed * 1.5;

            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = color;
            ctx.beginPath(); // batch: single path for all rects

            for (let i = 0; i < count; i++) {
                // 1. Move
                this.pX[i] += this.pVx[i];
                this.pY[i] += this.pVy[i];

                const mx = this.mouse.x, my = this.mouse.y;

                // 2. Interact: gather or repel
                if (this.isGathering && mx != null) {
                    const dx = mx - this.pX[i], dy = my - this.pY[i];
                    if (dx * dx + dy * dy > 1) {
                        this.pVx[i] = (this.pVx[i] + dx * 0.01) * 0.85;
                        this.pVy[i] = (this.pVy[i] + dy * 0.01) * 0.85;
                    }
                } else if (mx != null) {
                    const dx = this.pX[i] - mx, dy = this.pY[i] - my;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < mouseRadiusSq && distSq > 0) {
                        const dist = Math.sqrt(distSq);
                        const force = (mouseRadius - dist) / mouseRadius;
                        this.pVx[i] += (dx / dist) * force * mouseForce;
                        this.pVy[i] += (dy / dist) * force * mouseForce;
                    }
                }

                // 3. Friction / speed recovery
                if (!this.isGathering || mx == null) {
                    const speedSq = this.pVx[i] ** 2 + this.pVy[i] ** 2;
                    if (speedSq > baseSpeedSq) {
                        this.pVx[i] *= 0.95;
                        this.pVy[i] *= 0.95;
                    } else {
                        this.pVx[i] += (this.pBaseVx[i] - this.pVx[i]) * 0.05;
                        this.pVy[i] += (this.pBaseVy[i] - this.pVy[i]) * 0.05;
                    }
                }

                // 4. Boundary bounce
                const pad = this.pSize[i];
                if (this.pX[i] < pad) {
                    this.pX[i] = pad; this.pVx[i] = Math.max(Math.abs(this.pVx[i]), minRebound + Math.random());
                } else if (this.pX[i] > width - pad) {
                    this.pX[i] = width - pad; this.pVx[i] = -Math.max(Math.abs(this.pVx[i]), minRebound + Math.random());
                }
                if (this.pY[i] < pad) {
                    this.pY[i] = pad; this.pVy[i] = Math.max(Math.abs(this.pVy[i]), minRebound + Math.random());
                } else if (this.pY[i] > height - pad) {
                    this.pY[i] = height - pad; this.pVy[i] = -Math.max(Math.abs(this.pVy[i]), minRebound + Math.random());
                }

                // Safety net
                if (this.pX[i] < -100 || this.pX[i] > width + 100 || this.pY[i] < -100 || this.pY[i] > height + 100) {
                    this.pX[i] = Math.random() * width;
                    this.pY[i] = Math.random() * height;
                    this.pVx[i] = (Math.random() - 0.5) * baseSpeed;
                    this.pVy[i] = (Math.random() - 0.5) * baseSpeed;
                }

                // 5. Draw (rect is much faster than arc for 1-3px particles)
                ctx.rect(this.pX[i], this.pY[i], this.pSize[i], this.pSize[i]);
            }

            ctx.fill();
            requestAnimationFrame(() => this.animate());
        }
    };

    // --- Init ---
    const initBackground = async () => {
        try {
            if (typeof jQuery === 'undefined') await loadScript(`${getBasePath()}js/jquery-3.5.1.min.js`);
            await Promise.all([
                loadScript(`${getBasePath()}js/foot.js`),
                loadScript(`${getBasePath()}js/dark-mode.js`),
                loadScript(`${getBasePath()}js/fish.js`)
            ]);
            ParticleSystem.init();
            if (typeof RENDERER !== 'undefined') RENDERER.init();
            if (typeof DarkMode !== 'undefined' && !window.darkModeInstance) {
                window.darkModeInstance = new DarkMode();
            }
        } catch (err) {
            console.error('Failed to load background components:', err);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBackground);
    } else {
        initBackground();
    }
})();
