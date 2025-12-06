// 通用深色模式切换功能 - 适用于所有页面
class DarkMode {
    constructor() {
        console.log('DarkMode: 构造函数被调用');
        // 绑定this上下文
        this.applyThemeColors = this.applyThemeColors.bind(this);
        this.toggleTheme = this.toggleTheme.bind(this);
        this.applySavedTheme = this.applySavedTheme.bind(this);
        this.updateThemeByTime = this.updateThemeByTime.bind(this);
        
        // 北京坐标
        this.beijingLat = 39.9042;
        this.beijingLng = 116.4074;
        
        this.init();
    }

    init() {
        console.log('DarkMode: 初始化开始');
        console.log('DarkMode: 当前this指向:', this);
        
        // 确保DOM完全加载后再执行
        if (document.readyState === 'loading') {
            console.log('DarkMode: DOM正在加载，等待完成...');
            document.addEventListener('DOMContentLoaded', () => {
                this.completeInit();
            });
        } else {
            this.completeInit();
        }
    }
    
    completeInit() {
        console.log('DarkMode: DOM加载完成，开始初始化功能');
        console.log('DarkMode: 当前this指向:', this);
        
        // 创建主题切换按钮
        this.createThemeToggleButton();
        
        // 设置初始主题（根据时间）
        this.updateThemeByTime();
        
        // 绑定主题切换事件
        this.bindThemeToggleEvent();
        
        // 应用主题颜色
        this.applyThemeColors();
        
        // 确保在DOM完全渲染后再次应用主题
        setTimeout(() => {
            this.applyThemeColors();
        }, 500);
        
        // 设置定时器，每小时检查一次时间并更新主题
        setInterval(() => {
            this.updateThemeByTime();
        }, 60 * 60 * 1000);
        
        console.log('DarkMode: 初始化完成');
        
        // 测试主题切换功能
        console.log('DarkMode: 测试 - 主题切换按钮:', document.getElementById('themeToggle'));
    }

    // 创建主题切换按钮
    createThemeToggleButton() {
        console.log('DarkMode: 检查主题切换按钮...');
        
        // 检查是否已存在主题切换按钮
        let themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) {
            console.log('DarkMode: 创建主题切换按钮');
            themeToggle = document.createElement('button');
            themeToggle.id = 'themeToggle';
            themeToggle.className = 'theme-toggle';
            themeToggle.title = '切换主题';
            themeToggle.setAttribute('aria-label', '切换主题');
            
            const themeIcon = document.createElement('span');
            themeIcon.id = 'themeIcon';
            themeIcon.innerHTML = '🌙'; // 默认显示月亮图标
            themeIcon.style.fontSize = '1.2rem';
            
            themeToggle.appendChild(themeIcon);
            
            // 添加到body
            document.body.appendChild(themeToggle);
            console.log('DarkMode: 主题切换按钮已创建');
        } else {
            console.log('DarkMode: 主题切换按钮已存在');
        }
    }

    // 绑定主题切换事件
    bindThemeToggleEvent() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            console.log('DarkMode: 找到主题切换按钮，绑定点击事件');
            
            // 移除可能存在的旧事件监听器
            themeToggle.removeEventListener('click', this.toggleTheme);
            
            // 绑定新事件监听器 - 使用箭头函数确保this指向正确
            themeToggle.addEventListener('click', () => {
                console.log('DarkMode: 主题切换按钮被点击！');
                this.toggleTheme();
            });
            
            // 添加鼠标事件调试
            themeToggle.addEventListener('mouseover', () => {
                console.log('DarkMode: 鼠标悬停在主题切换按钮上');
                console.log('DarkMode: 当前按钮HTML:', themeToggle.innerHTML);
            });
            
            themeToggle.addEventListener('mouseout', () => {
                console.log('DarkMode: 鼠标离开主题切换按钮');
            });
            
            console.log('DarkMode: 点击事件绑定完成');
        } else {
            console.error('DarkMode: 未找到主题切换按钮');
        }
    }

    // 应用保存的主题
    applySavedTheme() {
        // 从localStorage获取保存的主题，默认使用light
        const savedTheme = localStorage.getItem('dark-mode') || 'light';
        const finalTheme = savedTheme === 'dark' ? 'dark' : 'light';
        
        console.log(`DarkMode: 应用保存的主题: ${finalTheme}`);
        
        // 应用主题到HTML根元素
        document.documentElement.setAttribute('data-theme', finalTheme);
        
        // 直接设置背景色和文本色，确保主题立即生效
        const isDark = finalTheme === 'dark';
        const html = document.documentElement;
        const body = document.body;
        
        if (isDark) {
            html.style.backgroundColor = '#2b2b2b';
            body.style.backgroundColor = '#2b2b2b';
            html.style.color = '#f8f9fa';
            body.style.color = '#f8f9fa';
        } else {
            html.style.backgroundColor = '#ffffff';
            body.style.backgroundColor = '#ffffff';
            html.style.color = '#212529';
            body.style.color = '#212529';
        }
        
        // 更新主题图标
        this.updateThemeIcon();
    }
    
    // 根据北京日出日落时间自动更新主题
    updateThemeByTime() {
        // 获取当前北京时间
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentTime = hours + minutes / 60;
        
        // 北京大致日出日落时间（冬季）
        // 日出：约7:00
        // 日落：约17:30
        const sunrise = 7.0;
        const sunset = 17.5;
        
        // 判断是否应该使用深色模式
        // 晚上17:30到早上7:00使用深色模式
        const shouldBeDark = currentTime < sunrise || currentTime > sunset;
        const targetTheme = shouldBeDark ? 'dark' : 'light';
        
        // 检查用户是否手动切换过主题
        const userThemePreference = localStorage.getItem('dark-mode');
        
        // 如果用户没有手动切换过主题，根据时间自动切换
        if (!userThemePreference) {
            console.log(`DarkMode: 根据时间自动切换主题: ${targetTheme}`);
            document.documentElement.setAttribute('data-theme', targetTheme);
            
            // 直接设置背景色和文本色
            const html = document.documentElement;
            const body = document.body;
            
            if (shouldBeDark) {
                html.style.backgroundColor = '#2b2b2b';
                body.style.backgroundColor = '#2b2b2b';
                html.style.color = '#f8f9fa';
                body.style.color = '#f8f9fa';
            } else {
                html.style.backgroundColor = '#ffffff';
                body.style.backgroundColor = '#ffffff';
                html.style.color = '#212529';
                body.style.color = '#212529';
            }
            
            // 更新主题图标
            this.updateThemeIcon();
        } else {
            // 如果用户手动切换过主题，保持用户的偏好
            console.log(`DarkMode: 保持用户手动设置的主题: ${userThemePreference}`);
        }
    }

    // 切换主题
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        console.log(`DarkMode: 切换主题: ${currentTheme} -> ${newTheme}`);
        
        // 应用新主题
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('dark-mode', newTheme);
        
        // 更新图标
        this.updateThemeIcon();
        
        // 直接修改body和html的背景色和文本色
        const html = document.documentElement;
        const body = document.body;
        
        if (newTheme === 'dark') {
            // 深色主题
            html.style.backgroundColor = '#2b2b2b';
            body.style.backgroundColor = '#2b2b2b';
            html.style.color = '#f8f9fa';
            body.style.color = '#f8f9fa';
        } else {
            // 浅色主题
            html.style.backgroundColor = '#ffffff';
            body.style.backgroundColor = '#ffffff';
            html.style.color = '#212529';
            body.style.color = '#212529';
        }
        
        // 处理颜色类和硬编码颜色值
        this.applyThemeColors(newTheme);
        
        // 确保页面所有元素都应用了正确的主题样式
        setTimeout(() => {
            this.applyThemeColors(newTheme);
        }, 100);
        
        // 添加过渡动画
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        
        // 显示切换提示
        this.showToast(`主题已切换为${newTheme === 'dark' ? '深色' : '浅色'}模式`);
    }

    // 应用主题颜色转换
    applyThemeColors(theme) {
        // 如果没有提供theme参数，从HTML根元素获取
        const currentTheme = theme || document.documentElement.getAttribute('data-theme') || 'light';
        const isDark = currentTheme === 'dark';
        
        console.log(`DarkMode: 应用主题颜色: ${isDark ? '深色' : '浅色'}`);
        
        // 处理Bootstrap颜色类
        this.processBootstrapColorClasses(isDark);
        
        // 处理硬编码的颜色值
        this.processHardcodedColors(isDark);
        
        // 直接为常见元素应用颜色
        const html = document.documentElement;
        const body = document.body;
        
        if (isDark) {
            // 深色主题
            html.style.backgroundColor = '#2b2b2b';
            body.style.backgroundColor = '#2b2b2b';
            html.style.color = '#f8f9fa';
            body.style.color = '#f8f9fa';
            
            // 为所有容器、卡片、区域应用深色背景
            const containers = document.querySelectorAll('.container, .row, .col, .section, .content, .main-content, .sidebar, .header, .footer, .panel, .widget, .block, .module, .box, .item, .element, .component, .part, .area, .zone');
            containers.forEach(container => {
                container.style.backgroundColor = '#2b2b2b';
                container.style.color = '#f8f9fa';
            });
            
            // 为所有文本元素应用深色文本
            const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, strong, li, .t1, .text-black-50');
            textElements.forEach(text => {
                text.style.color = '#f8f9fa';
            });
            
            // 特别处理alert元素
            const alerts = document.querySelectorAll('.alert');
            alerts.forEach(alert => {
                alert.style.backgroundColor = '#333333';
                alert.style.color = '#f8f9fa';
                alert.style.borderColor = '#555555';
            });
            
            // 特别处理badge元素
            const badges = document.querySelectorAll('.badge');
            badges.forEach(badge => {
                badge.style.backgroundColor = '#444444';
                badge.style.color = '#f8f9fa';
            });
            
            // 特别处理MM-secure.html中的密码输入区域
            const passwordContainer = document.querySelector('.password-container');
            if (passwordContainer) {
                passwordContainer.style.backgroundColor = 'rgba(43, 43, 43, 0.9)';
                passwordContainer.style.color = '#f8f9fa';
            }
            
            // 特别处理MM-secure.html中的模式按钮
            const patternBtns = document.querySelectorAll('.pattern-btn');
            patternBtns.forEach(btn => {
                btn.style.backgroundColor = '#444444';
                btn.style.borderColor = '#666666';
                btn.style.color = '#f8f9fa';
            });
            
            // 特别处理MM-secure.html中的选中模式按钮
            const selectedPatternBtns = document.querySelectorAll('.pattern-btn.selected');
            selectedPatternBtns.forEach(btn => {
                btn.style.backgroundColor = '#0d6efd';
                btn.style.color = '#ffffff';
            });
        } else {
            // 浅色主题
            html.style.backgroundColor = '#ffffff';
            body.style.backgroundColor = '#ffffff';
            html.style.color = '#212529';
            body.style.color = '#212529';
            
            // 为所有容器、卡片、区域应用浅色背景
            const containers = document.querySelectorAll('.container, .row, .col, .section, .content, .main-content, .sidebar, .header, .footer, .panel, .widget, .block, .module, .box, .item, .element, .component, .part, .area, .zone');
            containers.forEach(container => {
                container.style.backgroundColor = '#ffffff';
                container.style.color = '#212529';
            });
            
            // 为所有文本元素应用浅色文本
            const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, strong, li, .t1, .text-black-50');
            textElements.forEach(text => {
                text.style.color = '#212529';
            });
            
            // 特别处理alert元素
            const alerts = document.querySelectorAll('.alert');
            alerts.forEach(alert => {
                alert.style.backgroundColor = '';
                alert.style.color = '';
                alert.style.borderColor = '';
            });
            
            // 特别处理badge元素
            const badges = document.querySelectorAll('.badge');
            badges.forEach(badge => {
                badge.style.backgroundColor = '';
                badge.style.color = '';
            });
            
            // 特别处理MM-secure.html中的密码输入区域
            const passwordContainer = document.querySelector('.password-container');
            if (passwordContainer) {
                passwordContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                passwordContainer.style.color = '#212529';
            }
            
            // 特别处理MM-secure.html中的模式按钮
            const patternBtns = document.querySelectorAll('.pattern-btn');
            patternBtns.forEach(btn => {
                btn.style.backgroundColor = '#f8f9fa';
                btn.style.borderColor = '#ddd';
                btn.style.color = '#212529';
            });
            
            // 特别处理MM-secure.html中的选中模式按钮
            const selectedPatternBtns = document.querySelectorAll('.pattern-btn.selected');
            selectedPatternBtns.forEach(btn => {
                btn.style.backgroundColor = '#0d6efd';
                btn.style.color = '#ffffff';
            });
        }
    }

    // 处理Bootstrap颜色类
    processBootstrapColorClasses(isDark) {
        // 背景颜色类映射
        const bgClassMap = {
            'bg-light': 'bg-dark',
            'bg-white': 'bg-dark',
            'bg-warning': 'bg-warning',
            'bg-success': 'bg-success',
            'bg-danger': 'bg-danger',
            'bg-info': 'bg-info',
            'bg-primary': 'bg-primary',
            'bg-secondary': 'bg-secondary'
        };
        
        // 反向映射，用于从深色切换到浅色
        const bgClassReverseMap = {
            'bg-dark': 'bg-light',
            'bg-warning': 'bg-warning',
            'bg-success': 'bg-success',
            'bg-danger': 'bg-danger',
            'bg-info': 'bg-info',
            'bg-primary': 'bg-primary',
            'bg-secondary': 'bg-secondary'
        };
        
        // 文本颜色类映射
        const textClassMap = {
            'text-dark': 'text-light',
            'text-white': 'text-light'
        };
        
        // 反向映射，用于从深色切换到浅色
        const textClassReverseMap = {
            'text-light': 'text-dark'
        };
        
        // 处理背景类
        if (isDark) {
            // 从浅色切换到深色
            for (const [lightClass, darkClass] of Object.entries(bgClassMap)) {
                const elements = document.querySelectorAll(`.${lightClass.split(' ').join('.')}`);
                elements.forEach(el => {
                    el.classList.remove(lightClass);
                    el.classList.add(darkClass);
                });
            }
        } else {
            // 从深色切换到浅色
            for (const [darkClass, lightClass] of Object.entries(bgClassReverseMap)) {
                const elements = document.querySelectorAll(`.${darkClass.split(' ').join('.')}`);
                elements.forEach(el => {
                    el.classList.remove(darkClass);
                    el.classList.add(lightClass);
                });
            }
        }
        
        // 处理文本类
        if (isDark) {
            // 从浅色切换到深色
            for (const [lightClass, darkClass] of Object.entries(textClassMap)) {
                const elements = document.querySelectorAll(`.${lightClass.split(' ').join('.')}`);
                elements.forEach(el => {
                    el.classList.remove(lightClass);
                    el.classList.add(darkClass);
                });
            }
        } else {
            // 从深色切换到浅色
            for (const [darkClass, lightClass] of Object.entries(textClassReverseMap)) {
                const elements = document.querySelectorAll(`.${darkClass.split(' ').join('.')}`);
                elements.forEach(el => {
                    el.classList.remove(darkClass);
                    el.classList.add(lightClass);
                });
            }
        }
    }

    // 处理硬编码颜色值
    processHardcodedColors(isDark) {
        // 获取所有有内联样式的元素
        const elements = document.querySelectorAll('[style*="color:"]');
        
        elements.forEach(el => {
            const style = el.style;
            const color = style.color;
            
            // 检查是否是浅色主题下的深色文本
            if (!isDark && (color.includes('#212529') || color.includes('#6c757d') || color.includes('#000000'))) {
                style.color = 'var(--text-primary)';
            }
            // 检查是否是深色主题下的浅色文本
            else if (isDark && (color.includes('#ffffff') || color.includes('#f8f9fa') || color.includes('#ffffff'))) {
                style.color = 'var(--text-primary)';
            }
        });
        
        // 处理背景颜色
        const bgElements = document.querySelectorAll('[style*="background-color:"]');
        
        bgElements.forEach(el => {
            const style = el.style;
            const bgColor = style.backgroundColor;
            
            // 检查是否是浅色背景
            if (!isDark && (bgColor.includes('#ffffff') || bgColor.includes('#f8f9fa') || bgColor.includes('#e9ecef') || bgColor.includes('#f5f5f5'))) {
                style.backgroundColor = 'var(--bg-primary)';
            }
            // 检查是否是深色背景
            else if (isDark && (bgColor.includes('#212529') || bgColor.includes('#343a40') || bgColor.includes('#2b2b2b'))) {
                style.backgroundColor = 'var(--bg-primary)';
            }
        });
        
        // 处理特定区域的文本颜色
        if (isDark) {
            // 处理所有h1-h6标题元素
            const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headingElements.forEach(heading => {
                if (!heading.style.color || !heading.style.color.includes('var(')) {
                    heading.style.color = 'var(--text-primary)';
                }
            });
            
            // 处理所有p段落元素
            const pElements = document.querySelectorAll('p');
            pElements.forEach(p => {
                if (!p.style.color || !p.style.color.includes('var(')) {
                    p.style.color = 'var(--text-primary)';
                }
            });
            
            // 处理所有span元素
            const spanElements = document.querySelectorAll('span');
            spanElements.forEach(span => {
                if (!span.style.color || !span.style.color.includes('var(')) {
                    span.style.color = 'var(--text-primary)';
                }
            });
            
            // 处理所有div元素
            const divElements = document.querySelectorAll('div');
            divElements.forEach(div => {
                if (div.style.color && !div.style.color.includes('var(')) {
                    div.style.color = 'var(--text-primary)';
                }
            });
            
            // 处理所有a链接元素
            const aElements = document.querySelectorAll('a');
            aElements.forEach(a => {
                if (!a.style.color || !a.style.color.includes('var(')) {
                    a.style.color = 'var(--text-primary)';
                }
            });
            
            // 处理所有strong元素
            const strongElements = document.querySelectorAll('strong');
            strongElements.forEach(strong => {
                if (!strong.style.color || !strong.style.color.includes('var(')) {
                    strong.style.color = 'var(--text-primary)';
                }
            });
        }
    }

    // 更新主题图标
    updateThemeIcon() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = document.getElementById('themeIcon');
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            
            if (icon) {
                // 使用emoji图标
                icon.innerHTML = isDark ? '☀️' : '🌙';
                
                // 动画效果
                icon.classList.add('spin');
                setTimeout(() => {
                    icon.classList.remove('spin');
                }, 500);
            }
        }
    }

    // 显示切换提示
    showToast(message) {
        // 创建提示元素
        const toast = document.createElement('div');
        toast.className = 'dark-mode-toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--bg-secondary);
            color: var(--text-primary);
            padding: 12px 20px;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
            font-size: 0.9rem;
            font-weight: 500;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 显示提示
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);
        
        // 3秒后隐藏提示
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // 检查并更新所有引用了旧主题类的元素
    updateOldThemeClasses() {
        // 检查是否有元素使用了旧的主题类
        const oldLightElements = document.querySelectorAll('.light-theme-only');
        const oldDarkElements = document.querySelectorAll('.dark-theme-only');
        
        if (oldLightElements.length > 0 || oldDarkElements.length > 0) {
            console.log('检测到旧的主题类，正在更新...');
            
            // 更新旧的主题类
            oldLightElements.forEach(element => {
                element.classList.remove('light-theme-only');
                element.classList.add('light-theme-element');
            });
            
            oldDarkElements.forEach(element => {
                element.classList.remove('dark-theme-only');
                element.classList.add('dark-theme-element');
            });
            
            console.log('旧主题类更新完成');
        }
    }
}

// 自动初始化深色模式功能 - 确保在DOM加载完成后执行
function initializeDarkMode() {
    console.log('DarkMode: 尝试初始化...');
    try {
        // 确保DOM已完全加载
        if (document.readyState === 'loading') {
            console.log('DarkMode: DOM正在加载，等待完成...');
            document.addEventListener('DOMContentLoaded', () => {
                window.darkMode = new DarkMode();
            });
        } else {
            window.darkMode = new DarkMode();
        }
    } catch (error) {
        console.error('DarkMode: 初始化过程中发生错误:', error);
    }
}

// 立即执行初始化
initializeDarkMode();

// 导出供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DarkMode;
}