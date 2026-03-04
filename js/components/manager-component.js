/**
 * Manager Component
 * Modularizes Navigation and Header for Management Pages
 */
(function() {
    const path = window.location.pathname;
    const page = path.split('/').pop();
    
    // 导航配置
    const navItems = [
        { href: '../../index.html', icon: 'fa-home', title: '返回首页', id: 'home' },
        { href: 'nav-manager.html', icon: 'fa-sitemap', title: '导航数据管理', id: 'nav-manager.html' },
        { href: 'MM-generator.html', icon: 'fa-key', title: '密码生成器', id: 'MM-generator.html' },
        { href: 'vol-manager.html', icon: 'fa-code-branch', title: '版本管理', id: 'vol-manager.html' },
        { href: 'explore-manager.html', icon: 'fa-compass', title: '探索网页', id: 'explore-manager.html' }
    ];

    // 标题配置
    const headerData = {
        'nav-manager.html': { title: '导航数据管理系统', desc: '管理您的网站导航选项卡内容' },
        'MM-generator.html': { title: '密码生成器系统', desc: '上传、编辑并下载加密 HTML 文件' },
        'vol-manager.html': { title: '版本管理系统', desc: '加载版本历史记录，添加新版本信息' },
        'explore-manager.html': { title: '探索网页系统', desc: '发现新的有趣网站，开拓您的网络视野' }
    };

    const currentHeader = headerData[page] || { title: document.title, desc: '' };

    /**
     * 创建并注入导航栏
     */
    function injectNav() {
        const navDiv = document.createElement('div');
        navDiv.className = 'manager-nav';
        
        let navHtml = navItems.map(item => `
            <a href="${item.href}" class="manager-nav-button ${page === item.id ? 'active' : ''}" title="${item.title}">
                <i class="fas ${item.icon}"></i>
            </a>
        `).join('');
        
        navHtml += `
            <button class="manager-nav-button bg-warning" title="操作日志" data-bs-toggle="offcanvas" data-bs-target="#logOffcanvas">
                <i class="fas fa-exclamation-circle"></i>
            </button>
        `;
        
        navDiv.innerHTML = navHtml;
        document.body.prepend(navDiv);
    }

    /**
     * 创建并注入头部大标题
     */
    function injectHeader() {
        const headerDiv = document.createElement('div');
        headerDiv.className = 'manager-header header-gradient py-4 mb-4';
        
        headerDiv.innerHTML = `
            <div class="container">
                <h1 class="text-center mb-2 text-light">${currentHeader.title}</h1>
                <p class="text-center mb-0 text-light opacity-75">${currentHeader.desc}</p>
            </div>
        `;

        // 寻找注入位置：始终在 body 的最前面（导航栏之后）
        // 这样可以确保所有页面的布局一致
        const firstContainer = document.querySelector('.container, .container-fluid');
        if (firstContainer) {
            firstContainer.parentNode.insertBefore(headerDiv, firstContainer);
        } else {
            document.body.appendChild(headerDiv);
        }
    }

    /**
     * 创建并注入操作日志 Offcanvas
     */
    function injectLogOffcanvas() {
        // 如果已经存在则不注入
        if (document.getElementById('logOffcanvas')) return;

        const offcanvasDiv = document.createElement('div');
        offcanvasDiv.className = 'offcanvas offcanvas-end';
        offcanvasDiv.id = 'logOffcanvas';
        offcanvasDiv.tabIndex = -1;
        offcanvasDiv.setAttribute('aria-labelledby', 'logOffcanvasLabel');
        
        offcanvasDiv.innerHTML = `
            <div class="offcanvas-header border-bottom">
                <h5 class="offcanvas-title" id="logOffcanvasLabel">
                    <i class="fas fa-history me-2"></i>操作日志
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div class="offcanvas-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="text-muted small">系统实时操作记录</span>
                    <button class="btn btn-sm btn-outline-danger" id="clearLogsBtn">
                        <i class="fas fa-trash-alt me-1"></i>清空
                    </button>
                </div>
                
                <!-- 日志容器 -->
                <div id="logContainer" class="log-container-shared"></div>
                
                <div id="emptyLogMessage" class="text-center text-muted py-5 d-none">
                    <i class="fas fa-clipboard-list fa-3x mb-3 opacity-25"></i>
                    <p>暂无操作日志</p>
                </div>

                <!-- 工具功能 (可选) -->
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
            </div>
        `;
        
        document.body.appendChild(offcanvasDiv);
    }

    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectNav();
            injectHeader();
            injectLogOffcanvas();
        });
    } else {
        injectNav();
        injectHeader();
        injectLogOffcanvas();
    }
})();
