// 性能优化配置
window.performanceConfig = {
  lazyLoad: { enabled: true, threshold: 0.1, rootMargin: '50px' },
  preload: { criticalImages: ['img/index.png', 'img/login.png'], deferNonCritical: true },
  cache: { localStorage: true, sessionStorage: true, maxAge: 3600000 },
  resourcePriority: {
    high: ['css/bootstrap.min.css', 'css/index.css'],
    medium: ['js/bootstrap.bundle.min.js', 'js/search_ajx.js'],
    low: ['js/fish.js', 'js/particles.min.js']
  }
};

// 性能监控
window.performanceMonitor = {
  startTime: performance.now(),
  logLoadTime() {
    const loadTime = performance.now() - this.startTime;
    console.log('页面加载完成，耗时: ' + loadTime.toFixed(2) + 'ms');
  },
  monitorResources() {
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
