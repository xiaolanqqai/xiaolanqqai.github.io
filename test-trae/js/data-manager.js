/**
 * 数据管理器 - 统一管理所有网站数据
 * 负责加载、解析和缓存JSON数据，提供统一的API访问
 */
const DataManager = (function() {
  // 私有变量
  const _cache = new Map();
  const _dataLoaded = new Map();
  const _callbacks = new Map();
  const _defaultData = {
    version: '3.7.1',
    dataDate: '2025.09.28',
    navigation: {
      main: { categories: [] },
      more: { categories: [] }
    },
    quickLinks: []
  };
  
  // 配置
  const _config = {
    // 优先使用优化版数据文件
    dataFiles: [
      'js/nav-data-optimized.json',
      'js/nav-data.json' // 回退方案
    ],
    cacheExpiry: 86400000, // 1天（毫秒）
    retryCount: 2,
    retryDelay: 1000
  };
  
  /**
   * 从缓存获取数据
   * @param {string} key - 缓存键
   * @returns {Object|null} 缓存的数据或null
   */
  function _getFromCache(key) {
    const cached = _cache.get(key);
    if (!cached) return null;
    
    // 检查缓存是否过期
    if (Date.now() - cached.timestamp > _config.cacheExpiry) {
      _cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  /**
   * 保存数据到缓存
   * @param {string} key - 缓存键
   * @param {Object} data - 要缓存的数据
   */
  function _saveToCache(key, data) {
    _cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }
  
  /**
   * 加载数据文件
   * @param {string} url - 文件URL
   * @param {number} retry - 当前重试次数
   * @returns {Promise<Object>} 数据Promise
   */
  function _loadDataFile(url, retry = 0) {
    return new Promise((resolve, reject) => {
      // 先检查localStorage缓存
      const localStorageKey = `data_${url.replace(/\//g, '_')}`;
      const cachedData = localStorage.getItem(localStorageKey);
      const cacheTime = localStorage.getItem(`${localStorageKey}_time`);
      
      // 如果有缓存且未过期，直接使用缓存
      if (cachedData && cacheTime && Date.now() - parseInt(cacheTime) < _config.cacheExpiry) {
        try {
          const data = JSON.parse(cachedData);
          console.log(`从localStorage加载缓存数据: ${url}`);
          resolve(data);
          return;
        } catch (e) {
          localStorage.removeItem(localStorageKey);
          localStorage.removeItem(`${localStorageKey}_time`);
        }
      }
      
      // 使用fetch加载数据
      fetch(url, {
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json'
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`网络响应错误: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // 保存到localStorage
          try {
            localStorage.setItem(localStorageKey, JSON.stringify(data));
            localStorage.setItem(`${localStorageKey}_time`, Date.now().toString());
          } catch (e) {
            console.warn('无法保存数据到localStorage:', e);
          }
          
          // 保存到内存缓存
          _saveToCache(url, data);
          _dataLoaded.set(url, true);
          resolve(data);
        })
        .catch(error => {
          console.warn(`加载数据失败 (${url}):`, error);
          
          // 重试逻辑
          if (retry < _config.retryCount) {
            console.log(`重试加载数据 (${retry + 1}/${_config.retryCount})...`);
            setTimeout(() => {
              _loadDataFile(url, retry + 1).then(resolve).catch(reject);
            }, _config.retryDelay);
          } else {
            // 全部重试失败，使用默认数据
            console.warn(`所有重试都失败了，使用默认数据`);
            resolve(_defaultData);
          }
        });
    });
  }
  
  /**
   * 获取优化后的图标URL
   * @param {string} baseUrl - 基础URL
   * @param {string} siteUrl - 网站URL
   * @returns {string} 图标URL
   */
  function _getIconUrl(baseUrl, siteUrl) {
    // 简单的URL处理，确保正确的图标请求格式
    if (!siteUrl) return '';
    if (siteUrl.includes('?')) {
      siteUrl = siteUrl.split('?')[0];
    }
    return `${baseUrl}${encodeURIComponent(siteUrl)}`;
  }
  
  /**
   * 转换原始数据格式为优化格式
   * @param {Object} originalData - 原始数据
   * @returns {Object} 转换后的数据
   */
  function _transformData(originalData) {
    // 如果已经是优化格式，直接返回
    if (originalData.meta && originalData.navigation) {
      return originalData;
    }
    
    // 否则转换原始格式
    const transformed = {
      meta: {
        version: originalData.version?.web_vol || _defaultData.version,
        dataDate: originalData.version?.web_data || _defaultData.dataDate,
        lastUpdated: new Date().toISOString().split('T')[0]
      },
      config: {
        iconBaseUrl: 'https://api.afmax.cn/so/ico/index.php?r='
      },
      navigation: {
        main: { categories: [] },
        more: { categories: [] }
      },
      quickLinks: [],
      searchEngines: [
        {id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd='},
        {id: 'bing', name: '必应', url: 'https://cn.bing.com/search?q='},
        {id: 'google', name: '谷歌', url: 'https://www.google.com/search?q='}
      ]
    };
    
    // 转换index.tabs到main.categories
    if (originalData.index && originalData.index.tabs) {
      originalData.index.tabs.forEach((tab, index) => {
        const category = {
          id: `main_${index}`,
          name: tab.name,
          priority: index + 1,
          sites: []
        };
        
        if (tab.items) {
          tab.items.forEach((item, i) => {
            category.sites.push({
              id: `main_${index}_${i}`,
              name: item.name,
              url: item.url,
              icon: item.icon || _getIconUrl(transformed.config.iconBaseUrl, item.url)
            });
          });
        }
        
        transformed.navigation.main.categories.push(category);
      });
    }
    
    // 转换more.tabs到more.categories
    if (originalData.more && originalData.more.tabs) {
      originalData.more.tabs.forEach((tab, index) => {
        const category = {
          id: `more_${index}`,
          name: tab.name,
          sites: []
        };
        
        if (tab.items) {
          tab.items.forEach((item, i) => {
            category.sites.push({
              id: `more_${index}_${i}`,
              name: item.name,
              url: item.url,
              icon: item.icon || _getIconUrl(transformed.config.iconBaseUrl, item.url)
            });
          });
        }
        
        transformed.navigation.more.categories.push(category);
      });
    }
    
    // 保留special部分
    if (originalData.more && originalData.more.special) {
      transformed.special = originalData.more.special;
    }
    
    return transformed;
  }
  
  /**
   * 初始化数据管理器
   * @returns {Promise<void>}
   */
  async function _initialize() {
    // 注册核心数据文件
    await loadData('core', _config.dataFiles);
  }
  
  // 公共API
  return {
    /**
     * 初始化数据管理器
     */
    init: _initialize,
    
    /**
     * 加载指定的数据
     * @param {string} key - 数据键名
     * @param {string|string[]} sources - 数据源URL或URL数组
     * @returns {Promise<Object>} 数据Promise
     */
    loadData: async function(key, sources) {
      // 先检查回调
      if (!_callbacks.has(key)) {
        _callbacks.set(key, []);
      }
      
      // 如果已经加载完成，直接返回
      const cachedData = _getFromCache(key);
      if (cachedData) {
        return cachedData;
      }
      
      // 确保sources是数组
      const urls = Array.isArray(sources) ? sources : [sources];
      
      // 尝试加载每个源，直到成功
      for (const url of urls) {
        try {
          console.log(`尝试加载数据源: ${url}`);
          const data = await _loadDataFile(url);
          const transformedData = _transformData(data);
          
          // 保存到缓存
          _saveToCache(key, transformedData);
          
          // 执行所有回调
          const callbacks = _callbacks.get(key) || [];
          callbacks.forEach(callback => {
            try {
              callback(transformedData);
            } catch (e) {
              console.error('数据回调执行错误:', e);
            }
          });
          
          return transformedData;
        } catch (e) {
          console.error(`加载数据源失败 (${url}):`, e);
          // 继续尝试下一个源
        }
      }
      
      // 所有源都失败，返回默认数据
      console.warn(`所有数据源都加载失败，返回默认数据`);
      _saveToCache(key, _defaultData);
      return _defaultData;
    },
    
    /**
     * 获取数据
     * @param {string} key - 数据键名
     * @returns {Object|null} 数据或null
     */
    getData: function(key) {
      return _getFromCache(key) || null;
    },
    
    /**
     * 获取核心数据（网站导航等）
     * @returns {Promise<Object>} 核心数据Promise
     */
    getCoreData: async function() {
      return await this.loadData('core', _config.dataFiles);
    },
    
    /**
     * 获取版本信息
     * @returns {Object} 版本信息
     */
    getVersionInfo: function() {
      const coreData = _getFromCache('core');
      if (coreData && coreData.meta) {
        return {
          version: coreData.meta.version || _defaultData.version,
          dataDate: coreData.meta.dataDate || _defaultData.dataDate
        };
      }
      return {
        version: _defaultData.version,
        dataDate: _defaultData.dataDate
      };
    },
    
    /**
     * 获取导航数据
     * @param {string} section - 导航部分（'main' 或 'more'）
     * @returns {Object|null} 导航数据或null
     */
    getNavigation: function(section = 'main') {
      const coreData = _getFromCache('core');
      if (coreData && coreData.navigation && coreData.navigation[section]) {
        return coreData.navigation[section];
      }
      return null;
    },
    
    /**
     * 注册数据加载回调
     * @param {string} key - 数据键名
     * @param {Function} callback - 回调函数
     */
    onDataLoaded: function(key, callback) {
      if (typeof callback !== 'function') {
        console.error('回调必须是函数');
        return;
      }
      
      if (!_callbacks.has(key)) {
        _callbacks.set(key, []);
      }
      
      _callbacks.get(key).push(callback);
      
      // 如果数据已经加载，立即执行回调
      const cachedData = _getFromCache(key);
      if (cachedData) {
        setTimeout(() => {
          try {
            callback(cachedData);
          } catch (e) {
            console.error('数据回调执行错误:', e);
          }
        }, 0);
      }
    },
    
    /**
     * 清除缓存
     * @param {string} key - 可选，指定要清除的缓存键
     */
    clearCache: function(key = null) {
      if (key) {
        _cache.delete(key);
        localStorage.removeItem(`data_${key.replace(/\//g, '_')}`);
        localStorage.removeItem(`data_${key.replace(/\//g, '_')}_time`);
      } else {
        _cache.clear();
        // 清除所有以data_开头的localStorage项
        Object.keys(localStorage).forEach(itemKey => {
          if (itemKey.startsWith('data_')) {
            localStorage.removeItem(itemKey);
          }
        });
      }
    },
    
    /**
     * 检查数据是否已加载
     * @param {string} key - 数据键名
     * @returns {boolean} 是否已加载
     */
    isDataLoaded: function(key) {
      return _dataLoaded.has(key) && _dataLoaded.get(key);
    }
  };
})();

// 导出模块（如果支持模块系统）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataManager;
} else if (typeof window !== 'undefined') {
  window.DataManager = DataManager;
}

// 初始化数据管理器（延迟执行，避免阻塞页面加载）
setTimeout(() => {
  DataManager.init().then(() => {
    console.log('数据管理器初始化完成');
    // 触发全局事件，通知其他组件数据已准备好
    const event = new CustomEvent('dataManagerReady');
    window.dispatchEvent(event);
  }).catch(error => {
    console.error('数据管理器初始化失败:', error);
  });
}, 300);