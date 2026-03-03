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
        'MM-generator.html': { title: 'MM-generator', desc: '上传、编辑并下载HTML文件' },
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

        // 寻找注入位置
        const mainContainer = document.querySelector('.container-main') || document.querySelector('.container');
        if (mainContainer) {
            if (page === 'MM-generator.html') {
                // MM-generator 结构稍有不同，放在容器内部最上方
                mainContainer.prepend(headerDiv);
            } else {
                // 其他页面放在容器上方
                mainContainer.parentNode.insertBefore(headerDiv, mainContainer);
            }
        } else {
            document.body.prepend(headerDiv);
        }
    }

    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectNav();
            injectHeader();
        });
    } else {
        injectNav();
        injectHeader();
    }
})();
