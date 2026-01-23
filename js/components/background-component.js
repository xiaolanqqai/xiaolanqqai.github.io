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
            this.particles = [];
            // 根据屏幕大小调整粒子数量，但允许用户配置更高的数量
            // 基础密度：每 10000 像素 1 个粒子
            const density = Math.floor(window.innerWidth * window.innerHeight / 10000);
            
            // 使用配置的数量，但保留一个基于屏幕尺寸的合理上限（例如配置值的 2 倍或更高），防止在极小屏幕上过多
            // 这里我们直接使用用户配置的 particleCount，除非它远超屏幕承载能力（可选，这里为了满足需求直接使用配置值）
            let count = this.config.particleCount;
            
            // 如果是在手机等小屏幕上，为了性能还是适当减少一点，但保证有足够数量
            if (window.innerWidth < 768) {
                count = Math.min(count, 300); // 移动端限制
            }

            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * this.config.baseSpeed,
                    vy: (Math.random() - 0.5) * this.config.baseSpeed,
                    size: Math.random() * 2 + 1,
                    // 存储原始速度以便恢复
                    baseVx: (Math.random() - 0.5) * this.config.baseSpeed,
                    baseVy: (Math.random() - 0.5) * this.config.baseSpeed
                });
            }
        },

        animate: function() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.particles.forEach(p => {
                // 1. 基础移动
                p.x += p.vx;
                p.y += p.vy;

                // 2. 交互逻辑 (聚拢 vs 排斥)
                if (this.isGathering && this.mouse.x != null) {
                    // --- 聚拢模式 ---
                    const dx = this.mouse.x - p.x; // 注意方向：指向鼠标
                    const dy = this.mouse.y - p.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // 简单的引力模型
                    // 距离越远，引力越大，但设置上限防止过快
                    // 距离越近，引力减小，防止穿模震荡
                    if (distance > 1) {
                        const force = 0.05; // 引力系数
                        p.vx += dx * force * 0.05; // 缓动跟随
                        p.vy += dy * force * 0.05;
                        
                        // 施加较强的摩擦力，防止粒子在鼠标位置反复弹射过快
                        p.vx *= 0.9;
                        p.vy *= 0.9;
                    }
                } else if (this.mouse.x != null) {
                    // --- 排斥模式 (原有逻辑) ---
                    const dx = p.x - this.mouse.x;
                    const dy = p.y - this.mouse.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < this.config.mouseRadius) {
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;
                        const force = (this.config.mouseRadius - distance) / this.config.mouseRadius;
                        
                        // 施加排斥力
                        const repulseX = forceDirectionX * force * this.config.mouseForce;
                        const repulseY = forceDirectionY * force * this.config.mouseForce;
                        
                        p.vx += repulseX;
                        p.vy += repulseY;
                    }
                }

                // 3. 摩擦力/速度恢复 (让粒子慢慢平静下来)
                // 仅在非聚拢模式或无鼠标时应用标准物理恢复，避免干扰聚拢效果
                if (!this.isGathering || this.mouse.x == null) {
                    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                    if (speed > this.config.baseSpeed * 2) {
                        p.vx *= 0.95;
                        p.vy *= 0.95;
                    } else {
                        // 缓慢恢复到原始游荡状态
                        p.vx += (p.baseVx - p.vx) * 0.05;
                        p.vy += (p.baseVy - p.vy) * 0.05;
                    }
                }

                // 4. 边界检查与反弹优化
                // 当粒子碰到边界时，不仅反转速度，还要强制将其拉回画布内一点点，防止卡在边缘
                // 修复：增加反弹时的最小速度，防止因动能耗尽粘在墙上
                const padding = p.size; // 边距缓冲
                const minReboundSpeed = this.config.baseSpeed * 1.5; // 反弹最小速度

                if (p.x < padding) {
                    p.x = padding;
                    p.vx = Math.abs(p.vx); 
                    if (p.vx < minReboundSpeed) p.vx = minReboundSpeed + Math.random(); // 确保有足够动能离开墙壁
                } else if (p.x > this.canvas.width - padding) {
                    p.x = this.canvas.width - padding;
                    p.vx = -Math.abs(p.vx);
                    if (Math.abs(p.vx) < minReboundSpeed) p.vx = -(minReboundSpeed + Math.random());
                }

                if (p.y < padding) {
                    p.y = padding;
                    p.vy = Math.abs(p.vy);
                    if (p.vy < minReboundSpeed) p.vy = minReboundSpeed + Math.random();
                } else if (p.y > this.canvas.height - padding) {
                    p.y = this.canvas.height - padding;
                    p.vy = -Math.abs(p.vy);
                    if (Math.abs(p.vy) < minReboundSpeed) p.vy = -(minReboundSpeed + Math.random());
                }

                // 额外保险：如果粒子被鼠标用力推得太远（例如推到了负无穷），重置到画布中心
                if (p.x < -100 || p.x > this.canvas.width + 100 || p.y < -100 || p.y > this.canvas.height + 100) {
                    p.x = Math.random() * this.canvas.width;
                    p.y = Math.random() * this.canvas.height;
                    p.vx = (Math.random() - 0.5) * this.config.baseSpeed;
                    p.vy = (Math.random() - 0.5) * this.config.baseSpeed;
                }

                // 5. 绘制
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fillStyle = this.config.color;
                this.ctx.fill();
            });

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
