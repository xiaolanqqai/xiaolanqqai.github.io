class DarkMode {
    constructor() {
        this.themeKey = 'dark-mode';
        this.themeAttribute = 'data-theme';
        this.btnId = 'themeToggle';
        this.iconId = 'themeIcon';
        this.init();
    }

    init() {
        // 1. 读取保存的主题或系统偏好
        const savedTheme = localStorage.getItem(this.themeKey);
        // 默认深色模式判定：已保存 > 系统偏好 > 默认浅色
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');

        // 2. 立即应用主题
        this.setTheme(theme);

        // 3. 绑定或创建按钮（等待 DOM 加载）
        const bind = () => {
            let btn = document.getElementById(this.btnId);
            if (!btn) {
                this.createButton();
                btn = document.getElementById(this.btnId);
            }
            if (btn) {
                // 使用 onclick 覆盖可能存在的旧事件，确保单一绑定
                btn.onclick = () => this.toggleTheme();
                this.updateIcon(theme);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bind);
        } else {
            bind();
        }
    }

    setTheme(theme) {
        document.documentElement.setAttribute(this.themeAttribute, theme);
        localStorage.setItem(this.themeKey, theme);
        this.updateIcon(theme);
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute(this.themeAttribute);
        const next = current === 'dark' ? 'light' : 'dark';
        this.setTheme(next);
    }

    updateIcon(theme) {
        const icon = document.getElementById(this.iconId);
        if (icon) {
            if (this.isIconFont) {
                // FontAwesome 图标: 深色模式下显示太阳(提示可切浅色)，浅色模式下显示月亮
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            } else {
                // Emoji 图标: 保持原有逻辑
                icon.textContent = theme === 'dark' ? '☀️' : '🌙';
            }
        }
    }

    createButton() {
        // 1. 尝试查找管理页面的导航栏 (.manager-nav)
        const managerNav = document.querySelector('.manager-nav');
        
        if (managerNav) {
            // 场景 A: 集成到管理页面导航栏
            this.isIconFont = true; // 标记使用字体图标
            
            const btn = document.createElement('a');
            btn.id = this.btnId;
            btn.className = 'manager-nav-button'; // 复用管理页面按钮样式
            btn.href = 'javascript:void(0)';
            btn.title = '切换主题';
            btn.style.float = 'right'; // 浮动靠右
            btn.style.marginLeft = 'auto'; // Flex布局下的靠右
            
            const icon = document.createElement('i');
            icon.id = this.iconId;
            icon.className = 'fas fa-adjust'; // 初始占位
            
            btn.appendChild(icon);
            managerNav.appendChild(btn);
            
        } else {
            // 场景 B: 首页/其他页面 (右上角悬浮)
            // 用户要求：首页就在右上角，去除右下角兜底
            this.isIconFont = false; // 使用 Emoji
            
            const btn = document.createElement('button');
            btn.id = this.btnId;
            btn.className = 'btn btn-sm btn-outline-secondary rounded-circle shadow';
            // 固定在右上角，层级设高
            btn.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); background-color: rgba(255,255,255,0.1); border: 1px solid var(--border-color, #ccc);';
            btn.setAttribute('aria-label', '切换主题');
            
            const icon = document.createElement('span');
            icon.id = this.iconId;
            icon.style.fontSize = '1.2rem';
            btn.appendChild(icon);
            
            document.body.appendChild(btn);
        }
    }
}

// 确保单例模式
if (!window.darkModeInstance) {
    window.darkModeInstance = new DarkMode();
}