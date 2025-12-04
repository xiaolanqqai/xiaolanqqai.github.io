// 深色模式切换功能
class DarkModeManager {
    constructor() {
        // 初始化主题切换功能
        this.init();
    }

    init() {
        // 创建或获取主题切换按钮
        this.createThemeToggleButton();
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            // 设置初始主题
            this.applySavedTheme();
            
            // 绑定主题切换事件
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    // 创建主题切换按钮
    createThemeToggleButton() {
        // 检查是否已存在主题切换按钮
        let themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) {
            themeToggle = document.createElement('button');
            themeToggle.id = 'themeToggle';
            themeToggle.className = 'theme-toggle';
            themeToggle.title = '切换主题';
            
            const themeIcon = document.createElement('i');
            themeIcon.id = 'themeIcon';
            themeIcon.className = 'fas';
            
            themeToggle.appendChild(themeIcon);
            document.body.appendChild(themeToggle);
        }
    }

    // 应用保存的主题
    applySavedTheme() {
        const savedTheme = localStorage.getItem('manager-theme') || 'light';
        const finalTheme = savedTheme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', finalTheme);
        this.updateThemeIcon();
        
        // 确保在DOM完全加载后应用主题颜色转换
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            // DOM已加载或正在加载中，应用主题颜色
            setTimeout(() => {
                this.applyThemeColors(finalTheme);
            }, 0);
        } else {
            // 等待DOM加载完成
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    this.applyThemeColors(finalTheme);
                }, 0);
            });
        }
    }

    // 切换主题
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // 应用新主题
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('manager-theme', newTheme);
        
        // 更新图标
        this.updateThemeIcon();
        
        // 处理颜色类和硬编码颜色值
        this.applyThemeColors(newTheme);
        
        // 添加过渡动画
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    }

    // 应用主题颜色转换
    applyThemeColors(theme) {
        const isDark = theme === 'dark';
        
        // 处理Bootstrap颜色类
        this.processBootstrapColorClasses(isDark);
        
        // 处理硬编码的颜色值
        this.processHardcodedColors(isDark);
    }

    // 处理Bootstrap颜色类
    processBootstrapColorClasses(isDark) {
        // 背景颜色类映射
        const bgClassMap = {
            'bg-light': 'bg-dark',
            'bg-white': 'bg-dark',
            'bg-warning': 'bg-warning', // 警告色在两种主题中保持不变
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
            if (!isDark && (color.includes('#212529') || color.includes('#6c757d'))) {
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
            if (!isDark && (bgColor.includes('#ffffff') || bgColor.includes('#f8f9fa') || bgColor.includes('#e9ecef'))) {
                style.backgroundColor = 'var(--bg-primary)';
            }
            // 检查是否是深色背景
            else if (isDark && (bgColor.includes('#212529') || bgColor.includes('#343a40'))) {
                style.backgroundColor = 'var(--bg-primary)';
            }
        });
    }

    // 更新主题图标
    updateThemeIcon() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = document.getElementById('themeIcon');
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            
            if (icon) {
                // 移除所有图标类
                icon.className = '';
                
                // 添加适当的图标
                icon.classList.add('fas');
                icon.classList.add(isDark ? 'fa-sun' : 'fa-moon');
                
                // 动画效果
                icon.classList.add('spin');
                setTimeout(() => {
                    icon.classList.remove('spin');
                }, 500);
            }
        }
    }
}

// 页面加载完成后初始化深色模式管理器
document.addEventListener('DOMContentLoaded', () => {
    new DarkModeManager();
});