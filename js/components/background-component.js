/**
 * Background Component
 * Handles Interactive Particles and Flying Fish background
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
            <canvas id="interactive-particles" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -90; pointer-events: none;"></canvas>
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

    // --- Custom Interactive Particles System ---
    const ParticleSystem = {
        canvas: null,
        ctx: null,
        particles: [],
        mouse: { x: null, y: null },
        isGathering: false, // 是否处于聚拢模式
        config: {
            // 粒子总数限制
            // 建议范围: 50 (高性能) - 1000 (密集效果)
            // 注意: 数量过多会严重影响低端设备性能
            particleCount: 1000, 

            // 粒子颜色
            // 格式: HEX (#75A5B7), RGB (rgb(117, 165, 183)), 或 RGBA
            color: '#75A5B7',

            // 鼠标排斥影响半径 (像素)
            // 建议范围: 100 - 300
            // 值越大，鼠标能推开更远处的粒子
            mouseRadius: 100,

            // 鼠标排斥力度
            // 建议范围: 1 (柔和) - 10 (强力)
            // 值越大，粒子被推开的速度越快
            mouseForce: 2,

            // 粒子基础移动速度
            // 建议范围: 0.1 (缓慢) - 2.0 (快速)
            // 粒子在没有鼠标干扰时的自然游动速度
            baseSpeed: 1,
            
            // 连线半径 (0 表示不连线)
            // 如果需要粒子之间连线，可设置为 100-200
            // 注意: 连线计算量大，开启后建议减少 particleCount
            connectionRadius: 0
        },

        init: function() {
            this.canvas = document.getElementById('interactive-particles');
            if (!this.canvas) return;
            
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            
            // Create particles
            this.createParticles();
            
            // Event Listeners
            window.addEventListener('resize', () => this.resize());
            window.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            });
            window.addEventListener('mouseout', () => {
                this.mouse.x = null;
                this.mouse.y = null;
            });

            // 点击切换聚拢/排斥模式 (使用捕获模式确保不被拦截)
            window.addEventListener('click', (e) => {
                this.isGathering = !this.isGathering;
                
                // 确保鼠标位置已更新，防止点击时 mouse 为 null
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
                
                // 可选：给个控制台反馈
                console.log('Particle Mode:', this.isGathering ? 'Gathering' : 'Repulsing');
            }, true);

            // Start loop
            this.animate();
        },

        resize: function() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        },

        createParticles: function() {
            // 根据屏幕大小调整粒子数量，但允许用户配置更高的数量
            // 基础密度：每 10000 像素 1 个粒子
            const density = Math.floor(window.innerWidth * window.innerHeight / 10000);
            
            // 使用配置的数量，但保留一个基于屏幕尺寸的合理上限（例如配置值的 2 倍或更高），防止在极小屏幕上过多
            // 这里我们直接使用用户配置的 particleCount，除非它远超屏幕承载能力（可选，这里为了满足需求直接使用配置值）
            let count = this.config.particleCount;
            
            // 如果是在手机等小屏幕上，为了性能还是适当减少一点，但保证有足够数量
            if (window.innerWidth < 768) {
                count = Math.min(count, 1000); // 移动端限制
            }

            this.count = count;
            
            // Initialize Float32Arrays for better performance
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
                const vx = (Math.random() - 0.5) * this.config.baseSpeed;
                const vy = (Math.random() - 0.5) * this.config.baseSpeed;
                this.pVx[i] = vx;
                this.pVy[i] = vy;
                this.pBaseVx[i] = vx;
                this.pBaseVy[i] = vy;
                this.pSize[i] = Math.random() * 2 + 1;
            }
        },

        animate: function() {
            const width = this.canvas.width;
            const height = this.canvas.height;
            const ctx = this.ctx;
            const count = this.count;
            
            // Pre-calculate constants
            const mouseRadiusSq = this.config.mouseRadius * this.config.mouseRadius;
            const baseSpeedSq = (this.config.baseSpeed * 2) * (this.config.baseSpeed * 2);
            const minReboundSpeed = this.config.baseSpeed * 1.5;
            
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = this.config.color;
            
            // Batch rendering optimization: beginPath once
            ctx.beginPath();
            
            for (let i = 0; i < count; i++) {
                // 1. 基础移动
                this.pX[i] += this.pVx[i];
                this.pY[i] += this.pVy[i];

                // 2. 交互逻辑 (聚拢 vs 排斥)
                if (this.isGathering && this.mouse.x != null) {
                    // --- 聚拢模式 ---
                    const dx = this.mouse.x - this.pX[i]; 
                    const dy = this.mouse.y - this.pY[i];
                    // Using squared distance check to avoid sqrt where possible
                    const distSq = dx * dx + dy * dy;
                    
                    if (distSq > 1) {
                        const force = 0.1;
                        this.pVx[i] += dx * force * 0.1; 
                        this.pVy[i] += dy * force * 0.1;
                        
                        this.pVx[i] *= 0.85; 
                        this.pVy[i] *= 0.85;
                    }
                } else if (this.mouse.x != null) {
                    // --- 排斥模式 ---
                    const dx = this.pX[i] - this.mouse.x;
                    const dy = this.pY[i] - this.mouse.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < mouseRadiusSq) {
                        const distance = Math.sqrt(distSq); // Only calculate sqrt when necessary
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;
                        const force = (this.config.mouseRadius - distance) / this.config.mouseRadius;
                        
                        const repulseX = forceDirectionX * force * this.config.mouseForce;
                        const repulseY = forceDirectionY * force * this.config.mouseForce;
                        
                        this.pVx[i] += repulseX;
                        this.pVy[i] += repulseY;
                    }
                }

                // 3. 摩擦力/速度恢复
                if (!this.isGathering || this.mouse.x == null) {
                    const speedSq = this.pVx[i] * this.pVx[i] + this.pVy[i] * this.pVy[i];
                    if (speedSq > baseSpeedSq) {
                        this.pVx[i] *= 0.95;
                        this.pVy[i] *= 0.95;
                    } else {
                        this.pVx[i] += (this.pBaseVx[i] - this.pVx[i]) * 0.05;
                        this.pVy[i] += (this.pBaseVy[i] - this.pVy[i]) * 0.05;
                    }
                }

                // 4. 边界检查与反弹优化
                const padding = this.pSize[i];

                if (this.pX[i] < padding) {
                    this.pX[i] = padding;
                    this.pVx[i] = Math.abs(this.pVx[i]); 
                    if (this.pVx[i] < minReboundSpeed) this.pVx[i] = minReboundSpeed + Math.random();
                } else if (this.pX[i] > width - padding) {
                    this.pX[i] = width - padding;
                    this.pVx[i] = -Math.abs(this.pVx[i]);
                    if (Math.abs(this.pVx[i]) < minReboundSpeed) this.pVx[i] = -(minReboundSpeed + Math.random());
                }

                if (this.pY[i] < padding) {
                    this.pY[i] = padding;
                    this.pVy[i] = Math.abs(this.pVy[i]);
                    if (this.pVy[i] < minReboundSpeed) this.pVy[i] = minReboundSpeed + Math.random();
                } else if (this.pY[i] > height - padding) {
                    this.pY[i] = height - padding;
                    this.pVy[i] = -Math.abs(this.pVy[i]);
                    if (Math.abs(this.pVy[i]) < minReboundSpeed) this.pVy[i] = -(minReboundSpeed + Math.random());
                }

                // 额外保险
                if (this.pX[i] < -100 || this.pX[i] > width + 100 || this.pY[i] < -100 || this.pY[i] > height + 100) {
                    this.pX[i] = Math.random() * width;
                    this.pY[i] = Math.random() * height;
                    this.pVx[i] = (Math.random() - 0.5) * this.config.baseSpeed;
                    this.pVy[i] = (Math.random() - 0.5) * this.config.baseSpeed;
                }

                // 5. 绘制 - 使用 rect 替代 arc 以极大提升性能
                // 对于极小的粒子（1-3px），正方形在视觉上和圆形区别很小，但绘制开销小得多
                ctx.rect(this.pX[i], this.pY[i], this.pSize[i], this.pSize[i]);
            }
            
            // 一次性填充所有粒子
            ctx.fill();
            
            requestAnimationFrame(() => this.animate());
        }
    };

    // Load libraries and init
    async function initBackground() {
        try {
            // Check if jQuery is loaded (required for fish.js)
            if (typeof jQuery === 'undefined') {
                await loadScript(`${basePath}js/jquery-3.5.1.min.js`);
            }

            const scriptsToLoad = [];
            
            // 我们不再需要 particles.min.js，因为我们手写了逻辑
            // 但为了兼容性如果其他地方用到，可以留着，或者直接不加载
            // scriptsToLoad.push(loadScript(`${basePath}js/particles.min.js`));
            
            scriptsToLoad.push(loadScript(`${basePath}js/foot.js`));
            scriptsToLoad.push(loadScript(`${basePath}js/dark-mode.js`));
            scriptsToLoad.push(loadScript(`${basePath}js/fish.js`));
            
            await Promise.all(scriptsToLoad);
            
            // Initialize Custom Particles
            ParticleSystem.init();

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
