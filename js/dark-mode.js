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
        
        // 创建主题切换按钮
        this.createThemeToggleButton();
        
        // 应用用户保存的主题（如果有）
        this.applySavedTheme();
        
        // 如果用户没有手动设置主题，根据时间自动设置
        const userThemePreference = localStorage.getItem('dark-mode');
        if (!userThemePreference) {
            this.updateThemeByTime();
        }
        
        // 绑定主题切换事件
        this.bindThemeToggleEvent();
        
        // 应用主题颜色 - 立即应用
        this.applyThemeColors();
        
        // 使用 MutationObserver 监听 DOM 变化，动态应用主题颜色
        this.observeDOMChanges();
        
        // 设置定时器，每小时检查一次时间并更新主题
        setInterval(() => {
            this.updateThemeByTime();
        }, 60 * 60 * 1000);
        
        console.log('DarkMode: 初始化完成');
    }

    // 新增：监听 DOM 变化，确保动态生成的元素也能正确应用深色模式
    observeDOMChanges() {
        const observer = new MutationObserver((mutations) => {
            if (document.documentElement.getAttribute('data-theme') === 'dark') {
                this.applyThemeColors();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
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
        // 调试信息
        console.log('DarkMode: applySavedTheme方法被调用');
        
        // 从localStorage获取保存的主题，默认使用light
        const savedTheme = localStorage.getItem('dark-mode') || 'light';
        console.log('DarkMode: 从localStorage获取的主题:', savedTheme);
        
        // 直接使用获取的主题，确保正确
        const finalTheme = savedTheme === 'dark' ? 'dark' : 'light';
        console.log(`DarkMode: 最终应用的主题: ${finalTheme}`);
        
        // 应用主题到HTML根元素
        document.documentElement.setAttribute('data-theme', finalTheme);
        console.log('DarkMode: applySavedTheme后data-theme属性值:', document.documentElement.getAttribute('data-theme'));
        
        // 直接设置背景色和文本色，确保主题立即生效
        const html = document.documentElement;
        const body = document.body;
        
        if (finalTheme === 'dark') {
            html.style.backgroundColor = 'var(--bg-primary)';
            body.style.backgroundColor = 'var(--bg-primary)';
            html.style.color = 'var(--text-primary)';
            body.style.color = 'var(--text-primary)';
        } else {
            html.style.backgroundColor = 'var(--bg-primary)';
            body.style.backgroundColor = 'var(--bg-primary)';
            html.style.color = 'var(--text-primary)';
            body.style.color = 'var(--text-primary)';
        }
        
        // 更新主题图标
        this.updateThemeIcon();
    }
    
    // 根据北京日出日落时间自动更新主题
    updateThemeByTime() {
        // 调试信息
        console.log('DarkMode: updateThemeByTime方法被调用');
        
        // 获取当前北京时间
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentTime = hours + minutes / 60;
        console.log(`DarkMode: 当前时间: ${hours}:${minutes} (${currentTime}小时)`);
        
        // 北京大致日出日落时间（冬季）
        // 日出：约7:00
        // 日落：约17:30
        const sunrise = 7.0;
        const sunset = 17.5;
        console.log(`DarkMode: 日出时间: ${sunrise}小时, 日落时间: ${sunset}小时`);
        
        // 判断是否应该使用深色模式
        // 晚上17:30到早上7:00使用深色模式
        const shouldBeDark = currentTime < sunrise || currentTime > sunset;
        const targetTheme = shouldBeDark ? 'dark' : 'light';
        console.log(`DarkMode: 根据时间判断应该使用的主题: ${targetTheme} (shouldBeDark: ${shouldBeDark})`);
        
        // 检查用户是否手动切换过主题
        const userThemePreference = localStorage.getItem('dark-mode');
        console.log(`DarkMode: 用户手动设置的主题: ${userThemePreference}`);
        
        // 如果用户没有手动切换过主题，根据时间自动切换
        if (!userThemePreference) {
            console.log(`DarkMode: 根据时间自动切换主题: ${targetTheme}`);
            document.documentElement.setAttribute('data-theme', targetTheme);
            console.log('DarkMode: updateThemeByTime后data-theme属性值:', document.documentElement.getAttribute('data-theme'));
            
            // 直接设置背景色和文本色
            const html = document.documentElement;
            const body = document.body;
            
            if (shouldBeDark) {
                html.style.backgroundColor = 'var(--bg-primary)';
                body.style.backgroundColor = 'var(--bg-primary)';
                html.style.color = 'var(--text-primary)';
                body.style.color = 'var(--text-primary)';
            } else {
                html.style.backgroundColor = 'var(--bg-primary)';
                body.style.backgroundColor = 'var(--bg-primary)';
                html.style.color = 'var(--text-primary)';
                body.style.color = 'var(--text-primary)';
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
        // 调试信息
        console.log('DarkMode: toggleTheme方法被调用');
        
        // 简单直接的主题切换逻辑
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        console.log('DarkMode: 当前主题:', currentTheme);
        
        // 计算新主题（与当前主题相反）
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        console.log(`DarkMode: 切换主题: ${currentTheme} -> ${newTheme}`);
        
        // 直接设置新主题到DOM
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // 保存到localStorage
        localStorage.setItem('dark-mode', newTheme);
        
        // 验证设置是否成功
        console.log('DarkMode: 设置后data-theme:', document.documentElement.getAttribute('data-theme'));
        console.log('DarkMode: 设置后localStorage:', localStorage.getItem('dark-mode'));
        
        // 直接设置背景色和文本色，确保立即切换
        const html = document.documentElement;
        const body = document.body;
        
        if (newTheme === 'dark') {
            html.style.backgroundColor = 'var(--bg-primary)';
            body.style.backgroundColor = 'var(--bg-primary)';
            html.style.color = 'var(--text-primary)';
            body.style.color = 'var(--text-primary)';
        } else {
            html.style.backgroundColor = 'var(--bg-primary)';
            body.style.backgroundColor = 'var(--bg-primary)';
            html.style.color = 'var(--text-primary)';
            body.style.color = 'var(--text-primary)';
        }
        
        // 更新图标
        this.updateThemeIcon();
        
        // 显示切换提示
        this.showToast(`主题已切换为${newTheme === 'dark' ? '深色' : '浅色'}模式`);
    }

    // 应用主题颜色转换
    applyThemeColors() {
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            // 使用更高效的选择器和批量操作
            document.querySelectorAll('.alert-secondary, .alert-info, .alert-success').forEach(el => {
                el.classList.add('bg-dark', 'text-light', 'border-secondary');
            });
            document.querySelectorAll('.btn-info, .btn-light').forEach(el => {
                el.classList.add('btn-dark');
                el.classList.remove('btn-info', 'btn-light');
            });
            document.querySelectorAll('.kuaijie-a-1, .text-black-50').forEach(el => {
                el.classList.add('text-light');
                el.classList.remove('text-black-50');
            });
        } else {
            document.querySelectorAll('.bg-dark.text-light.border-secondary').forEach(el => {
                el.classList.remove('bg-dark', 'text-light', 'border-secondary');
            });
            // 恢复原始类名（这里可以根据需要进一步细化）
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
            // 检查是否是深色主题下的深色文本（黑色背景配黑色文字的问题）
            else if (isDark && (color.includes('#212529') || color.includes('#000000') || color.includes('#6c757d'))) {
                style.color = 'var(--text-primary)';
            }
            // 检查是否是深色主题下的浅色文本
            else if (isDark && (color.includes('#ffffff') || color.includes('#f8f9fa'))) {
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
            
            // 处理所有div元素 - 无论是否有内联样式
            const divElements = document.querySelectorAll('div');
            divElements.forEach(div => {
                div.style.color = 'var(--text-primary)';
            });
            
            // 处理所有表格元素
            const tableElements = document.querySelectorAll('table, td, th');
            tableElements.forEach(element => {
                element.style.color = 'var(--text-primary)';
            });
            
            // 处理所有表单元素
            const formElements = document.querySelectorAll('input, textarea, select, label');
            formElements.forEach(element => {
                element.style.color = 'var(--text-primary)';
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