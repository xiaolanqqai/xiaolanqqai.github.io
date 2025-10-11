//优化版foot.js - 提高加载速度和代码效率
$(function() {
  // 核心功能对象
  const pageManager = {
    // 初始化所有功能
    init: function() {
      // 延迟执行非关键功能，提高首屏加载速度
      this.initCriticalFeatures();
      setTimeout(() => {
        this.initNonCriticalFeatures();
      }, 500);
    },
    
    // 初始化关键功能（快速加载）
    initCriticalFeatures: function() {
      // 背景初始化
      if (typeof Particles !== 'undefined') {
        Particles.init({ selector: '.background' });
      }
      
      // 简化版去广告
      this.simplifiedAdBlock();
      
      // 错误处理
      this.setupErrorHandling();
    },
    
    // 初始化非关键功能（延迟加载）
    initNonCriticalFeatures: function() {
      // 尝试获取版本信息
      this.fetchVersionInfo();
      
      // 检查页面状态
      this.checkPageStatus();
    },
    
    // 简化的去广告功能
    simplifiedAdBlock: function() {
      try {
        // 移除最后一个div元素作为广告
        var gg = document.querySelector("body>div:last-of-type");
        if (gg) {
          gg.parentNode.removeChild(gg);
        }
      } catch(e) {
        console.log('Ad removal skipped or failed');
      }
    },
    
    // 获取版本信息
    fetchVersionInfo: function() {
      // 检查是否有缓存的版本信息
      const cachedVersion = localStorage.getItem('appVersion');
      const cacheTime = localStorage.getItem('cacheVersionTime');
      const now = Date.now();
      
      // 如果有缓存且缓存时间不超过1天，使用缓存数据
      if (cachedVersion && cacheTime && (now - parseInt(cacheTime) < 86400000)) {
        this.updateVersionInfo({version: {web_vol: cachedVersion}});
        return;
      }
      
      // 尝试加载JSON数据
      try {
        // 这里假设data是全局可用的，如果需要从服务器获取可以取消下面注释
        /*
        fetch('path/to/version.json')
          .then(response => response.ok ? response.json() : {version: {web_vol: 'Unknown'}})
          .then(data => {
            this.updateVersionInfo(data);
          })
          .catch(() => {
            this.updateVersionInfo({version: {web_vol: 'Unknown'}});
          });
        */
        
        // 保持原有逻辑兼容性
        if (typeof window.versionData !== 'undefined') {
          this.updateVersionInfo(window.versionData);
        }
      } catch(e) {
        console.error('Error fetching version info:', e);
        this.updateVersionInfo({version: {web_vol: 'Unknown'}});
      }
    },
    
    // 更新版本信息
    updateVersionInfo: function(data) {
      if (data.version) {
        const webVersion = data.version.web_vol || 'Unknown';
        
        // 更新版本信息显示
        const uptime1 = document.getElementById('uptime1');
        if (uptime1) {
          uptime1.textContent = `Beta:${webVersion}`;
        }
        
        // 更新控制台输出
        console.log("web_vol=" + webVersion);
        console.log('web_data=' + (data.version.web_data || 'Unknown'));
        
        // 缓存版本信息
        localStorage.setItem('appVersion', webVersion);
        localStorage.setItem('cacheVersionTime', Date.now().toString());
      } else {
        console.warn('版本信息不完整');
        if (document.getElementById('uptime1')) {
          document.getElementById('uptime1').textContent = 'Beta:Unknown';
        }
      }
    },
    
    // 检查页面状态
    checkPageStatus: function() {
      function isLocalPage() {
        return window.location.protocol === 'file:';
      }

      const state1 = document.getElementById('state1');
      if (state1) {
        if (isLocalPage()) {
          state1.textContent = 'Local';
          state1.className = 'badge text-bg-warning';
          console.log('Web page status:Local');
        } else {
          state1.textContent = 'Server';
          state1.className = 'badge text-bg-success';
          console.log('Web page status:Server');
        }
      }
    },
    
    // 错误处理
    setupErrorHandling: function() {
      // 全局错误捕获
      window.addEventListener('error', event => {
        console.error('页面错误:', event.error?.message || event);
      });
      
      // Promise拒绝处理
      window.addEventListener('unhandledrejection', event => {
        console.error('未处理的Promise拒绝:', event.reason);
      });
    }
  };
  
  // 初始化页面管理器
  pageManager.init();
});