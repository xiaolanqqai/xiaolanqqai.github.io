// Service Worker for PWA support
const CACHE_NAME = 'nav-manager-v1';
const STATIC_ASSETS = [
  '/test-trae/index.html',
  '/test-trae/css/bootstrap.min.css',
  '/test-trae/css/all.min.css',
  '/test-trae/css/index.css',
  '/test-trae/css/manager-styles.css',
  '/test-trae/js/jquery-3.5.1.min.js',
  '/test-trae/js/bootstrap.bundle.min.js',
  '/test-trae/js/foot.js',
  '/test-trae/favicon.ico',
  '/test-trae/img/index.png',
  '/test-trae/index/manager/nav-manager.html',
  '/test-trae/index/manager/MM-generator.html',
  '/test-trae/index/manager/vol-manager.html',
  '/test-trae/manifest.json'
];

// 安装Service Worker，预缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('缓存打开成功');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()) // 强制新Service Worker立即激活
  );
});

// 激活Service Worker，清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME && cacheName.startsWith('nav-manager-');
        }).map((cacheName) => {
          console.log('删除旧缓存:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim()) // 立即控制所有客户端
  );
});

// 缓存优先的网络请求策略
self.addEventListener('fetch', (event) => {
  // 只缓存GET请求
  if (event.request.method !== 'GET') return;
  
  // 忽略浏览器扩展和Chrome开发工具请求
  if (event.request.url.startsWith('chrome-extension://') || 
      event.request.url.includes('chrome-devtools://')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // 如果找到缓存，返回缓存响应
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // 否则发起网络请求
        return fetch(event.request)
          .then((networkResponse) => {
            // 检查响应是否有效
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // 克隆响应，因为响应流只能使用一次
            const responseToCache = networkResponse.clone();
            
            // 将新的响应添加到缓存
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return networkResponse;
          })
          .catch(() => {
            // 如果网络请求失败，对于HTML请求返回缓存的首页
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/test-trae/index.html');
            }
            
            // 其他资源请求失败则返回null
            return null;
          });
      })
  );
});

// 后台同步支持
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-nav-data') {
    event.waitUntil(syncNavData());
  }
});

// 消息处理，支持与客户端通信
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 实现后台同步逻辑
async function syncNavData() {
  // 这里可以实现数据同步逻辑，比如将本地修改的数据同步到服务器
  console.log('执行后台数据同步');
  // 实际项目中可以在这里调用API进行数据同步
}

// 推送通知支持
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || '有新的更新',
      icon: '/test-trae/img/index.png',
      badge: '/test-trae/img/index.png',
      data: {
        url: data.url || '/test-trae/index.html'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || '导航管理系统', options)
    );
  } catch (error) {
    console.error('推送通知处理失败:', error);
  }
});

// 通知点击事件处理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});