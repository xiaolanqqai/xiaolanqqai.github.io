// 简化的深色模式实现 - 与现有的dark-mode.css配合工作
console.log('ThemeToggler: 脚本开始加载');

// 使用IIFE确保类只被声明一次
(function() {
    console.log('ThemeToggler: IIFE开始执行');
    
    // 检查是否已经存在ThemeToggler类
    if (typeof window.ThemeToggler === 'undefined') {
        console.log('ThemeToggler: 创建新的类定义');
        
        class ThemeToggler {
            constructor() {
                console.log('ThemeToggler: 创建实例');
                this.init();
            }

            init() {
                console.log('ThemeToggler: 初始化开始');
                // 确保DOM完全加载
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => this.initialize());
                } else {
                    this.initialize();
                }
            }

            // 实际的初始化工作
            initialize() {
                console.log('ThemeToggler: 实际初始化开始');
                // 创建主题切换按钮
                this.createToggleButton();
                
                // 应用保存的主题
                this.applySavedTheme();
                
                // 绑定切换事件
                this.bindToggleEvent();
                
                console.log('ThemeToggler: 初始化完成');
            }

            // 创建主题切换按钮
            createToggleButton() {
                // 检查是否已存在
                let toggle = document.getElementById('themeToggle');
                if (!toggle) {
                    toggle = document.createElement('button');
                    toggle.id = 'themeToggle';
                    toggle.className = 'theme-toggle'; // 使用现有的theme-toggle类
                    toggle.innerHTML = '🌙'; // 默认显示月亮图标
                    
                    try {
                        document.body.appendChild(toggle);
                        console.log('ThemeToggler: 切换按钮创建成功');
                    } catch (error) {
                        console.error('ThemeToggler: 创建切换按钮时出错:', error);
                    }
                } else {
                    console.log('ThemeToggler: 切换按钮已存在');
                }
            }

            // 应用保存的主题
            applySavedTheme() {
                const saved = localStorage.getItem('dark-mode') || 'light';
                console.log('ThemeToggler: 应用保存的主题:', saved);
                this.applyTheme(saved);
            }

            // 绑定切换事件
            bindToggleEvent() {
                const toggle = document.getElementById('themeToggle');
                if (toggle) {
                    // 先移除可能存在的事件监听器，避免重复绑定
                    toggle.removeEventListener('click', this.toggleHandler);
                    
                    this.toggleHandler = () => {
                        const current = document.documentElement.getAttribute('data-theme') || 'light';
                        const newTheme = current === 'dark' ? 'light' : 'dark';
                        console.log('ThemeToggler: 切换主题从', current, '到', newTheme);
                        this.applyTheme(newTheme);
                        localStorage.setItem('dark-mode', newTheme);
                    };
                    
                    toggle.addEventListener('click', this.toggleHandler);
                    console.log('ThemeToggler: 切换事件绑定成功');
                } else {
                    console.error('ThemeToggler: 未找到切换按钮以绑定事件');
                }
            }

            // 应用主题 - 仅设置data-theme属性，让CSS处理样式
            applyTheme(theme) {
                const isDark = theme === 'dark';
                const html = document.documentElement;
                const toggle = document.getElementById('themeToggle');
                
                // 设置主题属性 - 这会触发CSS中的深色模式样式
                html.setAttribute('data-theme', theme);
                
                // 更新按钮图标
                if (toggle) {
                    toggle.innerHTML = isDark ? '☀️' : '🌙';
                    console.log('ThemeToggler: 按钮图标更新为', isDark ? '☀️' : '🌙');
                }
                
                console.log('ThemeToggler: 主题已应用:', theme);
            }
        }
        
        // 暴露类到全局作用域
        window.ThemeToggler = ThemeToggler;
        console.log('ThemeToggler: 类已暴露到全局作用域');
    } else {
        console.log('ThemeToggler: 类已存在，跳过创建');
    }
})();

console.log('ThemeToggler: IIFE执行完成');

// 自动初始化
console.log('ThemeToggler: 开始自动初始化');

// 自动初始化
console.log('ThemeToggler: 开始自动初始化');
if (typeof ThemeToggler !== 'undefined') {
    try {
        new ThemeToggler();
        console.log('ThemeToggler: 自动初始化成功');
    } catch (error) {
        console.error('ThemeToggler: 自动初始化失败:', error);
    }
} else {
    console.error('ThemeToggler: 类未定义，无法初始化');
}

