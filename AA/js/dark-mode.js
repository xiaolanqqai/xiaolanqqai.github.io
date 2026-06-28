if (typeof DarkMode === 'undefined') {
    class DarkMode {
        constructor() {
            this.themeKey = 'dark-mode';
            this.themeAttribute = 'data-theme';
            this.btnId = 'themeToggle';
            this.iconId = 'themeIcon';
            this.init();
        }

        init() {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const theme = localStorage.getItem(this.themeKey) || (prefersDark ? 'dark' : 'light');
            this.setTheme(theme);

            const bind = () => {
                let btn = document.getElementById(this.btnId);
                if (!btn) { this.createButton(); btn = document.getElementById(this.btnId); }
                if (btn) { btn.onclick = () => this.toggleTheme(); this.updateIcon(theme); }
            };

            document.readyState === 'loading'
                ? document.addEventListener('DOMContentLoaded', bind)
                : bind();
        }

        setTheme(theme) {
            document.documentElement.setAttribute(this.themeAttribute, theme);
            localStorage.setItem(this.themeKey, theme);
            this.updateIcon(theme);
        }

        toggleTheme() {
            const current = document.documentElement.getAttribute(this.themeAttribute);
            this.setTheme(current === 'dark' ? 'light' : 'dark');
        }

        updateIcon(theme) {
            const icon = document.getElementById(this.iconId);
            if (!icon) return;
            icon.classList.contains('fas')
                ? icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'
                : icon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }

        createButton() {
            const isManagerPage = window.location.pathname.includes('/manager/');
            if (isManagerPage || document.querySelector('.manager-nav')) return;

            const btn = document.createElement('button');
            btn.id = this.btnId;
            btn.className = 'btn btn-sm btn-outline-secondary rounded-circle shadow';
            btn.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); background-color: rgba(255,255,255,0.1); border: 1px solid var(--border-color, #ccc);';
            btn.setAttribute('aria-label', '切换主题');

            const icon = document.createElement('span');
            icon.id = this.iconId;
            icon.style.fontSize = '1.2rem';
            btn.appendChild(icon);
            document.body.appendChild(btn);
        }
    }

    if (!window.darkModeInstance) window.darkModeInstance = new DarkMode();
}
