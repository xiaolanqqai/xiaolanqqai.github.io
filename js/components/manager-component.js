/**
 * Manager Component - Navigation, Header, Offcanvas for Management Pages
 */
(function () {
    const page = window.location.pathname.split('/').pop();

    const navItems = [
        { href: 'nav-manager.html', icon: 'fa-sitemap', title: '导航数据管理' },
        { href: 'MM-generator.html', icon: 'fa-key', title: '密码生成器' },
        { href: 'vol-manager.html', icon: 'fa-code-branch', title: '版本管理' },
        { href: 'explore-manager.html', icon: 'fa-compass', title: '探索网页' },
        { href: 'tool-manager.html', icon: 'fa-tools', title: '工具项目管理' },
        { href: 'app-manager.html', icon: 'fa-mobile-alt', title: 'App 更新管理' }
    ];

    const headerData = {
        'nav-manager.html': { title: '导航数据管理系统', desc: '管理您的网站导航选项卡内容' },
        'MM-generator.html': { title: '密码生成器系统', desc: '加密 HTML 文件导出、编辑与管理' },
        'vol-manager.html': { title: '版本管理系统', desc: '加载版本历史记录，同步最新发布信息' },
        'explore-manager.html': { title: '探索网页系统', desc: '管理您的浏览器收藏夹、发现有趣的网站' },
        'tool-manager.html': { title: '工具项目管理系统', desc: '管理工具跳转页面的单页工具项目' },
        'app-manager.html': { title: 'App 更新管理系统', desc: '管理 AppUpdater 目录下的软件包与下载主文件' }
    };

    const currentHeader = headerData[page] || { title: document.title, desc: '' };

    // --- Footer ---
    const injectFooter = () => {
        if (document.querySelector('.manager-footer')) return;
        const div = document.createElement('div');
        div.className = 'manager-footer py-3 mt-4';
        div.innerHTML = `
<div class="container text-center">
    <p class="mb-1 text-muted">${currentHeader.title} &copy; 2026 Xiaolan</p>
    <p class="mb-0 small"><a href="../../index.html" class="text-decoration-none text-secondary">返回首页</a></p>
</div>`;
        document.body.appendChild(div);
    };

    // --- Navigation ---
    const injectNav = () => {
        const div = document.createElement('div');
        div.className = 'manager-nav';
        div.innerHTML = `
<div class="nav-group-start">
    <a href="../../index.html" class="manager-nav-button" title="返回首页">
        <i class="fas fa-home"></i>
    </a>
</div>
<div class="nav-group-center">
    ${navItems.map(item => `
        <a href="${item.href}" class="manager-nav-button ${page === item.href ? 'active' : ''}" title="${item.title}">
            <i class="fas ${item.icon}"></i>
        </a>`).join('')}
</div>
<div class="nav-group-end">
    <button id="themeToggle" class="manager-nav-button" title="切换主题">
        <i id="themeIcon" class="fas fa-adjust"></i>
    </button>
    <button class="manager-nav-button bg-warning" title="操作日志" data-bs-toggle="offcanvas" data-bs-target="#logOffcanvas">
        <i class="fas fa-exclamation-circle"></i>
    </button>
</div>`;
        document.body.prepend(div);
        bindThemeToggle();
    };

    // --- Theme toggle ---
    const updateThemeIcon = theme => {
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    };

    const bindThemeToggle = () => {
        const btn = document.getElementById('themeToggle');
        if (!btn) return;

        btn.onclick = () => {
            const next = (document.documentElement.getAttribute('data-theme') || 'light') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('dark-mode', next);
            updateThemeIcon(next);
            if (window.darkModeInstance) window.darkModeInstance.setTheme(next);
        };

        const currentTheme = localStorage.getItem('dark-mode')
            || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateThemeIcon(currentTheme);
    };

    // --- Page header ---
    const injectHeader = () => {
        if (document.querySelector('.manager-header')) return;
        const div = document.createElement('div');
        div.className = 'manager-header header-gradient py-4 mb-4';
        div.innerHTML = `
<div class="container">
    <h1 class="text-center mb-2 text-light">${currentHeader.title}</h1>
    <p class="text-center mb-0 text-light opacity-75">${currentHeader.desc}</p>
</div>`;
        const target = document.querySelector('.container, .container-fluid');
        (target ? target.parentNode : document.body)[target ? 'insertBefore' : 'appendChild'](
            div, target || null
        );
    };

    // --- Log Offcanvas ---
    const injectLogOffcanvas = () => {
        if (document.getElementById('logOffcanvas')) return;
        const div = document.createElement('div');
        div.className = 'offcanvas offcanvas-end';
        div.id = 'logOffcanvas'; div.tabIndex = -1;
        div.setAttribute('aria-labelledby', 'logOffcanvasLabel');
        div.innerHTML = `
<div class="offcanvas-header border-bottom">
    <h5 class="offcanvas-title" id="logOffcanvasLabel"><i class="fas fa-history me-2"></i>操作日志</h5>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
</div>
<div class="offcanvas-body">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="text-muted small">系统实时操作记录</span>
        <button class="btn btn-sm btn-outline-danger" id="clearLogsBtn">
            <i class="fas fa-trash-alt me-1"></i>清空
        </button>
    </div>
    <div id="logContainer" class="log-container-shared"></div>
    <div id="emptyLogMessage" class="text-center text-muted py-5 d-none">
        <i class="fas fa-clipboard-list fa-3x mb-3 opacity-25"></i>
        <p>暂无操作日志</p>
    </div>
    <div class="mt-5 p-3 bg-light rounded border">
        <h6 class="text-muted mb-3 small fw-bold"><i class="fas fa-tools me-2"></i>辅助工具</h6>
        <div class="d-grid gap-2">
            <button class="btn btn-sm btn-outline-primary text-start" id="checkUrlBtn">
                <i class="fas fa-link me-2 w-20px"></i>检查 URL 格式
            </button>
            <button class="btn btn-sm btn-outline-success text-start" id="checkAccessibilityBtn">
                <i class="fas fa-check-circle me-2 w-20px"></i>检查可访问性
            </button>
        </div>
    </div>
    <div class="mt-4 p-3 bg-light rounded border">
        <h6 class="text-muted mb-3 small fw-bold"><i class="fas fa-key me-2"></i>GitHub Token 注入</h6>
        <div id="tokenStatus" class="alert alert-warning py-2 small mb-2">
            <i class="fas fa-exclamation-triangle me-1"></i>未配置，无法同步到 GitHub
        </div>
        <div class="input-group input-group-sm mb-2">
            <input type="password" class="form-control" id="githubTokenInput" placeholder="github_pat_..." autocomplete="off" aria-label="GitHub Token">
            <button class="btn btn-outline-secondary" type="button" id="toggleTokenBtn" title="显示/隐藏 Token">
                <i class="fas fa-eye"></i>
            </button>
        </div>
        <div class="d-grid gap-2">
            <button class="btn btn-sm btn-outline-primary text-start" id="saveTokenBtn">
                <i class="fas fa-save me-2 w-20px"></i>保存 Token
            </button>
            <button class="btn btn-sm btn-outline-danger text-start" id="clearTokenBtn">
                <i class="fas fa-trash-alt me-2 w-20px"></i>清除 Token
            </button>
        </div>
        <div class="form-text small mt-2">仅保存于本机 localStorage，不写入源码与仓库；保存后无需刷新即可生效。</div>
    </div>
</div>`;
        document.body.appendChild(div);

        // Clean up residual backdrop on hide
        div.addEventListener('hidden.bs.offcanvas', () => {
            document.querySelectorAll('.offcanvas-backdrop').forEach(el => el.remove());
            document.body.classList.remove('offcanvas-open');
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('padding-right');
        });
    };

    // --- GitHub Token 注入面板 ---
    // token 只存本机 localStorage，不写入源码与仓库，所以需要一个可视化入口，替代手动开控制台注入。
    const TOKEN_KEY = 'github_token';

    // 仅暴露前缀与末 4 位用于确认是哪一枚 token，不回显完整凭据
    const maskToken = token => token.length > 16 ? `${token.slice(0, 12)}...${token.slice(-4)}` : '****';

    const refreshTokenStatus = () => {
        const el = document.getElementById('tokenStatus');
        if (!el) return;
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            el.className = 'alert alert-success py-2 small mb-2';
            el.innerHTML = `<i class="fas fa-check-circle me-1"></i>已配置：${escapeHtml(maskToken(token))}`;
        } else {
            el.className = 'alert alert-warning py-2 small mb-2';
            el.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i>未配置，无法同步到 GitHub';
        }
    };

    const notify = (message, type) => {
        if (window.managerCommon) window.managerCommon.showAlert(message, type);
        else window.alert(message);
    };

    const bindTokenPanel = () => {
        const input = document.getElementById('githubTokenInput');
        const toggleBtn = document.getElementById('toggleTokenBtn');
        const saveBtn = document.getElementById('saveTokenBtn');
        const clearBtn = document.getElementById('clearTokenBtn');
        if (!input || !saveBtn) return;

        saveBtn.onclick = () => {
            const value = input.value.trim();
            if (!value) { notify('请输入 GitHub Token', 'danger'); return; }
            if (!/^(github_pat_|ghp_)/.test(value)) {
                notify('Token 格式不正确，应以 github_pat_ 或 ghp_ 开头', 'danger');
                return;
            }
            localStorage.setItem(TOKEN_KEY, value);
            input.value = '';   // 保存后立即清空，避免明文长期留在 DOM 中
            refreshTokenStatus();
            notify('Token 已保存，无需刷新即可生效', 'success');
        };

        clearBtn.onclick = () => {
            if (!localStorage.getItem(TOKEN_KEY)) { notify('当前没有已保存的 Token', 'warning'); return; }
            if (!window.confirm('确定清除本机保存的 GitHub Token 吗？清除后将无法同步到仓库。')) return;
            localStorage.removeItem(TOKEN_KEY);
            refreshTokenStatus();
            notify('Token 已清除', 'warning');
        };

        toggleBtn.onclick = () => {
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            toggleBtn.querySelector('i').className = show ? 'fas fa-eye-slash' : 'fas fa-eye';
        };

        // 打开面板时刷新（覆盖其他标签页改动），storage 事件用于跨标签页实时同步
        document.getElementById('logOffcanvas').addEventListener('show.bs.offcanvas', refreshTokenStatus);
        window.addEventListener('storage', e => { if (e.key === TOKEN_KEY) refreshTokenStatus(); });

        refreshTokenStatus();
    };

    const initAll = () => { injectNav(); injectHeader(); injectLogOffcanvas(); injectFooter(); bindTokenPanel(); };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
})();
