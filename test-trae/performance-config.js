// 性能优化配置
window.performanceConfig = {
    // 懒加载配置
    lazyLoad: {
        enabled: true,
        threshold: 0.1,
        rootMargin: '50px'
    },
    
    // 预加载配置
    preload: {
        criticalImages: ['img/index.png', 'img/login.png'],
        deferNonCritical: true
    },
    
    // 缓存配置
    cache: {
        localStorage: true,
        sessionStorage: true,
        maxAge: 3600000 // 1小时
    },
    
    // 资源加载优先级
    resourcePriority: {
        high: ['css/bootstrap.min.css', 'css/index.css'],
        medium: ['js/bootstrap.bundle.min.js', 'js/search_ajx.js'],
        low: ['js/fish.js', 'js/particles.min.js']
    }
};

// 性能监控
window.performanceMonitor = {
    startTime: performance.now(),
    
    logLoadTime: function() {
        const loadTime = performance.now() - this.startTime;
        console.log(`页面加载完成，耗时: ${loadTime.toFixed(2)}ms`);
        
        // 发送性能数据到分析服务（可选）
        if (navigator.sendBeacon) {
            const data = new Blob([JSON.stringify({
                loadTime: loadTime,
                url: window.location.href,
                timestamp: Date.now()
            })], {type: 'application/json'});
            navigator.sendBeacon('/api/performance', data);
        }
    },
    
    // 资源加载监控
    monitorResources: function() {
        const resources = performance.getEntriesByType('resource');
        resources.forEach(resource => {
            console.log(`${resource.name} 加载耗时: ${resource.duration.toFixed(2)}ms`);
        });
    }
};

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 延迟加载非关键资源
    setTimeout(() => {
        window.performanceMonitor.logLoadTime();
        window.performanceMonitor.monitorResources();
    }, 100);
});