/**
 * Header Component
 * Handles Meta tags, PWA config, and CSS links
 */
(function() {
    let basePath;
    const path = window.location.pathname;
    if (path.includes('/index/manager/')) {
        basePath = '../../';
    } else if (path.includes('/index/')) {
        basePath = '../';
    } else {
        basePath = './';
    }
    
    const headContent = `
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="Shortcut icon" href="${basePath}favicon.ico" loading="lazy">
        
        <!-- PWA相关配置 -->
        <link rel="manifest" href="${basePath}manifest.json">
        <meta name="theme-color" content="#3e8e41">
        <meta name="description" content="高效的导航页面，提供快速搜索和网站访问">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="导航系统">
        <link rel="apple-touch-icon" href="${basePath}img/index.png">
        
        <!-- 预加载关键CSS -->
        <link rel="preload" href="${basePath}css/bootstrap.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link rel="stylesheet" href="${basePath}css/bootstrap.min.css"></noscript>
        <link rel="preload" href="${basePath}css/index.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link rel="stylesheet" href="${basePath}css/index.css"></noscript>
        <link rel="preload" href="${basePath}css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link rel="stylesheet" href="${basePath}css/all.min.css"></noscript>
                
                <!-- Bootstrap 样式补全与标准化 -->
                <link rel="stylesheet" href="${basePath}css/style-main/index.css">
                
                <link rel="stylesheet" type="text/css" href="${basePath}css/search-form.css" media="print" onload="this.media='all'">
        
        <!-- 核心组件与管理页面样式 -->
        <link rel="stylesheet" href="${basePath}css/manager-styles.css">
        
        <!-- 深色模式样式 -->
        <link rel="stylesheet" href="${basePath}css/dark-mode.css">
    `;

    document.write(headContent);
})();
