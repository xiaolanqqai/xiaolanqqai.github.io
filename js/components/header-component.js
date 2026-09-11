/**
 * Header Component - Meta tags, CSS links, global helpers
 */
(function() {
    // --- Global basePath helper (shared across components) ---
    const path = window.location.pathname;
    const isManagerPage = path.includes('/index/manager/');
    const basePath = (isManagerPage || path.includes('/index/Tool/')) ? '../../'
        : path.includes('/index/') ? '../' : './';
    window.getBasePath = () => basePath;

    // --- Shared security helpers (available site-wide, before any page script runs) ---
    // 转义 HTML 特殊字符，用于把外部数据拼进 innerHTML 时阻断注入
    window.escapeHtml = function(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    // 协议白名单：仅放行 http/https 与站内相对路径，阻断 javascript:/data: 等伪协议
    window.safeUrl = function(value) {
        if (!value) return '';
        const raw = String(value).trim();
        if (raw === '') return '';
        // 锚点与站内相对路径（./ ../ / 开头）直接放行
        if (raw.charAt(0) === '#' || /^\.{0,2}\//.test(raw)) return raw;
        try {
            const parsed = new URL(raw, window.location.origin);
            return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? raw : '';
        } catch (error) {
            return '';
        }
    };

    // 管理页面不注入流量分析，避免采集携带管理操作与会话状态的页面
    const claritySnippet = isManagerPage ? '' : `
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "vx0ai1ey2z");
</script>`;

    // Font Awesome 按需加载：少数公开页面完全不使用图标（经像素级比对确认），
    // 在 <html> 上写 data-fontawesome="off" 可省去约 102KB 的样式表。
    // 若该页面新增了 fa-* 图标，删除该属性即可恢复加载。
    const needsFontAwesome = document.documentElement.getAttribute('data-fontawesome') !== 'off';
    const fontAwesomeSnippet = needsFontAwesome ? `
<link rel="preload" href="${basePath}css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${basePath}css/all.min.css"></noscript>` : '';

    const headContent = `
<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="referrer" content="strict-origin-when-cross-origin">
${isManagerPage ? '<meta name="robots" content="noindex, nofollow">' : ''}
<link rel="Shortcut icon" href="${basePath}favicon.ico">
<meta name="description" content="快速搜索与网站导航">
<!-- Critical CSS -->
<link rel="preload" href="${basePath}css/bootstrap.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${basePath}css/bootstrap.min.css"></noscript>${fontAwesomeSnippet}
<!-- Styles -->
<link rel="stylesheet" href="${basePath}css/style-main/index.css">
<link rel="stylesheet" type="text/css" href="${basePath}css/search-form.css" media="print" onload="this.media='all'">
<link rel="stylesheet" href="${basePath}css/manager-styles.css">
<link rel="stylesheet" href="${basePath}css/dark-mode.css">
<!-- Logic -->
<script src="${basePath}js/bootstrap.bundle.min.js"></script>
<script src="${basePath}js/dark-mode.js" defer></script>
<script src="${basePath}js/click-tracker.js" defer></script>${claritySnippet}`;

    document.write(headContent);
})();
