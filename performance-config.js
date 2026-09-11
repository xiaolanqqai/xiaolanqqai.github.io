// 性能优化配置（仅供调试时开启，默认不输出任何日志）
window.performanceConfig = {
  debug: false,
  lazyLoad: { enabled: true, threshold: 0.1, rootMargin: '50px' },
  preload: { criticalImages: ['img/index.png', 'img/login.png'], deferNonCritical: true },
  cache: { localStorage: true, sessionStorage: true, maxAge: 3600000 },
  resourcePriority: {
    high: ['css/bootstrap.min.css', 'css/style-main/index.css'],
    medium: ['js/bootstrap.bundle.min.js'],
    low: ['js/fish.js']
  }
};

// 性能监控：仅在 performanceConfig.debug 为 true 时输出
window.performanceMonitor = {
  startTime: performance.now(),
  logLoadTime() {
    if (!window.performanceConfig.debug) return;
    const loadTime = performance.now() - this.startTime;
    console.log('页面加载完成，耗时: ' + loadTime.toFixed(2) + 'ms');
  },
  monitorResources() {
    if (!window.performanceConfig.debug) return;
    performance.getEntriesByType('resource').forEach(r => {
      console.log(r.name + ' 加载耗时: ' + r.duration.toFixed(2) + 'ms');
    });
  }
};

document.addEventListener('DOMContentLoaded', function () {
  setTimeout(() => {
    window.performanceMonitor.logLoadTime();
    window.performanceMonitor.monitorResources();
  }, 100);
});
