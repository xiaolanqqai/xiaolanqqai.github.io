# Xiaolan 导航系统 Code Wiki

> **版本**: BETA 4.5.2 (2026-03-18)  
> **技术栈**: HTML5 + CSS3 + Vanilla JavaScript (ES6+) + Bootstrap 5  
> **部署平台**: GitHub Pages

---

## 目录

1. [项目概述](#1-项目概述)
2. [整体架构](#2-整体架构)
3. [目录结构](#3-目录结构)
4. [核心模块详解](#4-核心模块详解)
   - 4.1 [组件化系统 (Components)](#41-组件化系统-components)
   - 4.2 [管理系统通用层 (ManagerCommon)](#42-管理系统通用层-managercommon)
   - 4.3 [GitHub API 助手](#43-github-api-助手)
   - 4.4 [深色模式系统](#44-深色模式系统)
   - 4.5 [点击追踪系统](#45-点击追踪系统)
   - 4.6 [搜索系统](#46-搜索系统)
   - 4.7 [背景粒子系统](#47-背景粒子系统)
5. [数据结构](#5-数据结构)
   - 5.1 [导航数据 (nav-data.json)](#51-导航数据-nav-datajson)
   - 5.2 [版本历史 (version-history.json)](#52-版本历史-version-historyjson)
6. [四大管理系统](#6-四大管理系统)
7. [依赖关系](#7-依赖关系)
8. [项目运行方式](#8-项目运行方式)
9. [开发规范与最佳实践](#9-开发规范与最佳实践)
10. [性能优化策略](#10-性能优化策略)

---

## 1. 项目概述

### 1.1 项目简介

Xiaolan 是一个基于 GitHub Pages 部署的高效导航页面系统，旨在提供快速搜索和网站访问功能。项目采用现代前端技术栈开发，注重用户体验和性能优化，由 TRAE AI 辅助打造。

### 1.2 核心功能

| 功能模块 | 描述 |
|---------|------|
| **智能搜索** | 支持 AJAX 即时搜索联想（百度 JSONP），多搜索引擎切换 |
| **分类导航** | 通过标签页组织展示各类网站链接，支持拖拽排序 |
| **四大管理系统** | 导航管理、版本管理、探索管理、密码生成器 |
| **主题切换** | 支持浅色/深色主题自动切换，状态持久化 |
| **点击追踪** | 全站点击追踪，自动推荐高频访问网站 |
| **GitHub 同步** | 通过 GitHub API 实现数据云端同步 |
| **背景动画** | 交互式粒子系统 + 鱼群动画 |
| **每日诗词** | 集成今日诗词 API 展示优美诗句 |

### 1.3 技术栈

| 类别 | 技术 | 版本 |
|-----|------|------|
| 标记语言 | HTML5 | - |
| 样式 | CSS3 (Flexbox/Grid, SCSS) | - |
| 脚本 | Vanilla JavaScript (ES6+) | - |
| UI 框架 | Bootstrap | 5.3.0-alpha3 |
| 工具库 | jQuery | 3.5.1 |
| 图标库 | Font Awesome | 6.x |
| 粒子效果 | 自研 SOA 架构粒子系统 | - |
| 部署 | GitHub Pages | - |
| 分析 | Microsoft Clarity | - |

---

## 2. 整体架构

### 2.1 架构图

```
┌─────────────────────────────────────────────────────────┐
│                     表现层 (Presentation)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  首页    │  │ More页面 │  │ DD页面   │  │ 管理系统 │ │
│  │ index.html│ │ More.html│ │ DD.html  │  │  manager/│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
└───────┼──────────────┼──────────────┼───────────────┼────┘
        │              │              │               │
┌───────▼──────────────▼──────────────▼───────────────▼────┐
│                   组件层 (Components)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ header-comp │  │ search-comp │  │ background-comp │  │
│  │  (Header)   │  │  (Search)   │  │  (Particles)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐                        │
│  │ manager-comp│  │  fish.js    │                        │
│  │  (Manager)  │  │  (鱼群动画)  │                        │
│  └─────────────┘  └─────────────┘                        │
└──────────────────────────┬───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│                  业务逻辑层 (Business Logic)              │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │ ManagerCommon   │  │ GitHubAPIHelper │                │
│  │ (通用管理逻辑)   │  │  (GitHub API)   │                │
│  └─────────────────┘  └─────────────────┘                │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │ DarkMode        │  │ ClickTracker    │                │
│  │ (深色模式)       │  │  (点击追踪)      │                │
│  └─────────────────┘  └─────────────────┘                │
│  ┌─────────────────┐                                     │
│  │ SearchAJX       │                                     │
│  │ (搜索逻辑)       │                                     │
│  └─────────────────┘                                     │
└──────────────────────────┬───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│                    数据层 (Data)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ nav-data.json│  │version-history│  │   MM.json    │   │
│  │ (导航数据)    │  │ (版本历史)    │  │ (加密数据)   │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### 2.2 架构特点

1. **模块化组件设计**: 采用 IIFE (立即执行函数表达式) 封装各组件，实现代码隔离与复用
2. **数据驱动渲染**: 导航数据完全由 JSON 驱动，页面结构与数据分离
3. **渐进式加载**: 关键资源预加载，非关键资源延迟加载
4. **单例模式**: 核心功能类（DarkMode、ManagerCommon 等）采用单例模式
5. **本地优先**: LocalStorage 作为本地缓存层，GitHub 作为云端存储

---

## 3. 目录结构

```
xiaolanqqai.github.io/
├── index.html                    # 首页入口
├── README.md                     # 项目说明
├── CNAME                         # 自定义域名配置
├── favicon.ico                   # 网站图标
│
├── css/                          # 样式文件目录
│   ├── bootstrap.min.css        # Bootstrap 框架样式
│   ├── index.css                # 主样式（SCSS 编译产物）
│   ├── all.min.css              # Font Awesome 图标样式
│   ├── dark-mode.css            # 深色模式补全样式
│   ├── manager-styles.css       # 管理系统统一样式
│   ├── search-form.css          # 搜索框样式
│   ├── style-main/              # 样式标准化目录
│   │   └── index.css            # Bootstrap 样式补全
│   └── scss/                    # SCSS 源文件
│       ├── index.scss
│       └── search-form.scss
│
├── js/                           # JavaScript 文件目录
│   ├── components/               # 组件化模块
│   │   ├── header-component.js  # Header 组件（CSS/JS注入）
│   │   ├── search-component.js  # 搜索引擎组件
│   │   ├── background-component.js # 背景粒子组件
│   │   └── manager-component.js # 管理页面导航组件
│   ├── bootstrap.bundle.min.js  # Bootstrap JS（含 Popper）
│   ├── jquery-3.5.1.min.js      # jQuery 库
│   ├── manager-common.js        # 管理系统通用逻辑
│   ├── github-api-helper.js     # GitHub API 封装
│   ├── dark-mode.js             # 深色模式管理
│   ├── click-tracker.js         # 点击追踪
│   ├── search_ajx.js            # 搜索 AJAX 逻辑
│   ├── fish.js                  # 鱼群动画
│   ├── foot.js                  # 页脚逻辑
│   ├── particles.min.js         # 粒子库（备用）
│   └── simple-dark-mode.js      # 简化版深色模式（备用）
│
├── data/                         # 数据文件目录
│   ├── nav-data.json            # 导航数据（核心）
│   ├── version-history.json     # 版本历史记录
│   └── MM.json                  # 加密数据文件
│
├── img/                          # 图片资源目录
│   ├── index.png                # 默认网站图标
│   ├── login.png                # 首页 Logo
│   ├── luyou.png                # 路由器图标
│   ├── tc.png                   # 其他图标
│   └── 图床/                    # 图床资源
│
├── index/                        # 功能页面目录
│   ├── More.html                # 更多导航页
│   ├── DD.html                  # DD 导航页
│   ├── Develop.html             # 开发资源页
│   ├── Download.html            # 下载资源页
│   ├── AA.htm                   # AA 特殊页
│   ├── MM-secure.html           # MM 安全页
│   ├── manager/                 # 管理系统页面
│   │   ├── nav-manager.html     # 导航数据管理
│   │   ├── vol-manager.html     # 版本管理
│   │   ├── explore-manager.html # 探索网页管理
│   │   └── MM-generator.html    # 密码生成器
│   └── tools/                   # 工具页面
│       └── GitHub-api-mm.html
│
└── old/                          # 历史版本存档
    ├── apple/                   # Apple 风格旧版
    ├── xiaolan-v3.7/            # v3.7 旧版
    ├── xihao1/                  # 喜好1 旧版
    └── xihao2/                  # 喜好2 旧版
```

---

## 4. 核心模块详解

### 4.1 组件化系统 (Components)

项目采用模块化组件思想，将可复用的 UI 和逻辑封装为独立组件，通过 IIFE 模式注入页面。

#### 4.1.1 HeaderComponent

**文件**: [js/components/header-component.js](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/js/components/header-component.js)

**职责**: 统一管理所有页面的 `<head>` 内容，包括 meta 标签、CSS 链接、核心 JS 引用。

**核心逻辑**:

```javascript
(function() {
    // 自动计算基准路径
    let basePath;
    const path = window.location.pathname;
    if (path.includes('/index/manager/')) {
        basePath = '../../';
    } else if (path.includes('/index/')) {
        basePath = '../';
    } else {
        basePath = './';
    }
    
    // 通过 document.write 注入 head 内容
    const headContent = `
        <meta ...>
        <link rel="preload" ...>  <!-- CSS 预加载 -->
        <link rel="stylesheet" ...>
        <script src="..." defer></script>
    `;
    document.write(headContent);
})();
```

**注入内容清单**:

| 类型 | 内容 | 加载方式 |
|-----|------|---------|
| Meta | viewport, X-UA-Compatible, description | 直接 |
| CSS | bootstrap.min.css | preload + onload |
| CSS | index.css | preload + onload |
| CSS | all.min.css (Font Awesome) | preload + onload |
| CSS | style-main/index.css | 直接 |
| CSS | search-form.css | media="print" + onload |
| CSS | manager-styles.css | 直接 |
| CSS | dark-mode.css | 直接 |
| JS | dark-mode.js | defer |
| JS | click-tracker.js | defer |
| JS | Microsoft Clarity | 异步内联 |

**设计特点**:
- 智能路径检测：自动根据页面层级计算资源路径
- CSS 预加载：使用 `rel="preload"` + `onload` 技巧优化首屏
- 统一注入：所有页面共用同一套 head 配置，便于维护

---

#### 4.1.2 SearchComponent

**文件**: [js/components/search-component.js](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/js/components/search-component.js)

**职责**: 注入搜索框 UI 结构，初始化搜索引擎偏好设置。

**核心逻辑**:

```javascript
(function() {
    // 计算 basePath（同 header-component）
    
    const searchHTML = `
        <form onsubmit="submitFn(this, event);">
            <div class="search-wrapper">
                <div class="input-holder">
                    <input type="text" id="txt" class="search-input" ... />
                    <button class="search-icon" ...></button>
                </div>
                <span class="close" ...></span>
                <div class="result-container"></div>
            </div>
            <div id="search_ajx">
                <ul id="list" class="d-none"></ul>
            </div>
        </form>
    `;

    // 注入到 #search-engine-container
    const container = document.getElementById('search-engine-container');
    if (container) {
        container.innerHTML = searchHTML;
    } else {
        document.write(`<div id="search-engine-container">${searchHTML}</div>`);
    }

    // 初始化搜索引擎偏好
    if (window.localStorage && !window.oMoreB) {
        let oMoreB = localStorage.getItem("oMoreB");
        if (oMoreB == null) oMoreB = 3; // 默认百度
        else oMoreB = parseInt(oMoreB);
        window.oMoreB = oMoreB;
    }

    // 延迟加载搜索逻辑
    function loadSearchLogic() {
        if (typeof submitFn === 'function') return;
        if (window.jQuery) {
            const script = document.createElement('script');
            script.src = `${basePath}js/search_ajx.js`;
            document.body.appendChild(script);
        } else {
            setTimeout(loadSearchLogic, 50); // 等待 jQuery
        }
    }
})();
```

**关键变量**:
- `window.oMoreB`: 全局搜索引擎偏好，取值 0-8，对应不同搜索引擎

---

#### 4.1.3 BackgroundComponent

**文件**: [js/components/background-component.js](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/js/components/background-component.js)

**职责**: 管理背景动画，包括交互式粒子系统和鱼群动画。

**ParticleSystem 对象**:

```javascript
const ParticleSystem = {
    canvas: null,
    ctx: null,
    config: {
        particleCount: 1000,     // 粒子总数
        color: '#75A5B7',        // 粒子颜色
        mouseRadius: 100,        // 鼠标影响半径
        mouseForce: 2,           // 排斥力度
        baseSpeed: 1,            // 基础移动速度
        connectionRadius: 0      // 连线半径（0=不连线）
    },
    isGathering: false,          // 聚拢/排斥模式切换
    
    init() { ... },              // 初始化
    resize() { ... },            // 窗口大小调整
    createParticles() { ... },   // 创建粒子（SOA 架构）
    animate() { ... }            // 渲染循环
};
```

**性能优化亮点 (SOA 架构)**:

```javascript
// 使用 Float32Array 存储粒子数据（Structure of Arrays）
this.pX = new Float32Array(count);      // X 坐标
this.pY = new Float32Array(count);      // Y 坐标
this.pVx = new Float32Array(count);     // X 速度
this.pVy = new Float32Array(count);     // Y 速度
this.pBaseVx = new Float32Array(count); // 基础 X 速度
this.pBaseVy = new Float32Array(count); // 基础 Y 速度
this.pSize = new Float32Array(count);   // 粒子大小
```

**交互模式**:
- **排斥模式**（默认）：鼠标靠近时粒子被推开
- **聚拢模式**：点击页面切换，粒子向鼠标位置聚集

**初始化流程**:
1. 注入背景容器 DOM
2. 并行加载 foot.js、dark-mode.js、fish.js
3. 初始化自定义粒子系统
4. 初始化鱼群动画（RENDERER.init()）
5. 初始化深色模式实例

---

#### 4.1.4 ManagerComponent

**文件**: [js/components/manager-component.js](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/js/components/manager-component.js)

**职责**: 为管理系统页面提供统一的导航栏、页头、操作日志侧边栏和页脚。

**导航配置**:

```javascript
const navItems = [
    { href: 'nav-manager.html', icon: 'fa-sitemap', title: '导航数据管理' },
    { href: 'MM-generator.html', icon: 'fa-key', title: '密码生成器' },
    { href: 'vol-manager.html', icon: 'fa-code-branch', title: '版本管理' },
    { href: 'explore-manager.html', icon: 'fa-compass', title: '探索网页' }
];
```

**注入内容**:

| 组件 | 方法 | 描述 |
|-----|------|------|
| 导航栏 | `injectNav()` | 顶部导航，含首页按钮、系统切换、主题切换、日志按钮 |
| 页头标题 | `injectHeader()` | 渐变背景的大标题区域 |
| 日志侧边栏 | `injectLogOffcanvas()` | Bootstrap Offcanvas 操作日志面板 |
| 页脚 | `injectFooter()` | 版权信息和返回首页链接 |
| 脚本依赖 | `injectScripts()` | Bootstrap JS 注入 |

**主题切换绑定**:
- 不依赖 dark-mode.js 的加载顺序，使用轮询确保绑定成功
- 直接操作 `data-theme` 属性和 localStorage
- 与 `window.darkModeInstance` 保持状态同步

---

### 4.2 管理系统通用层 (ManagerCommon)

**文件**: [js/manager-common.js](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/js/manager-common.js)

**类名**: `ManagerCommon`  
**全局实例**: `window.managerCommon`

这是管理系统的核心通用类，封装了所有管理页面共用的功能。

#### 4.2.1 配置属性

```javascript
this.config = {
    iconPrefix: 'https://api.afmax.cn/so/ico/index.php?r=',  // 网站图标 API
    defaultIcon: '../../img/index.png',                       // 默认图标
    corsProxy: 'https://api.allorigins.win/raw?url='          // CORS 代理
};
this.maxLogs = 100;  // 日志条目上限
```

#### 4.2.2 核心方法

| 方法名 | 参数 | 返回值 | 描述 |
|--------|------|--------|------|
| `init()` | - | - | 初始化所有子系统 |
| `log(message, level, details)` | message: string<br>level: 'info'\|'success'\|'warning'\|'error'<br>details: string | - | 记录操作日志 |
| `showToast(message, type, duration)` | message: string<br>type: string<br>duration: number | - | 显示提示消息 |
| `showLoading(message)` | message: string | - | 显示加载遮罩 |
| `hideLoading()` | - | - | 隐藏加载遮罩 |
| `syncToGithub(path, data, message)` | path: string<br>data: Object\|string<br>message: string | Promise\<Object\> | 同步数据到 GitHub |
| `getFromGithub(path)` | path: string | Promise\<Object\> | 从 GitHub 加载数据 |
| `fetchWebsiteTitle(url)` | url: string | Promise\<string\> | 获取网站标题（通过 CORS 代理） |
| `extractSiteNameFromUrl(url)` | url: string | Promise\<string\> | 从 URL 提取网站名称 |
| `validateData(data, schema)` | data: Object<br>schema: Object | { isValid, errors } | 数据验证 |
| `debounce(func, wait)` | func: Function<br>wait: number | Function | 防抖函数 |
| `throttle(func, limit)` | func: Function<br>limit: number | Function | 节流函数 |

#### 4.2.3 GitHub 同步锁定机制

**核心逻辑**: 防止频繁同步触发 GitHub API 限流。

```javascript
initSyncLock() {
    this.syncLockKey = 'github_sync_lock_time';
    this.syncLockDuration = 5 * 60 * 1000; // 5分钟冷却
    
    // 监听 storage 事件实现跨页面同步
    window.addEventListener('storage', (e) => {
        if (e.key === this.syncLockKey) {
            this.checkSyncLock();
        }
    });
}

lockSync() {
    localStorage.setItem(this.syncLockKey, Date.now().toString());
    this.checkSyncLock();
}
```

**锁定效果**:
- 同步成功后自动锁定 5 分钟
- 同步按钮禁用 + 半透明遮罩 + 倒计时显示
- 跨页面实时同步（Storage 事件）
- 页面刷新后倒计时继续有效

#### 4.2.4 静态工具类

**ManagerCommon.Cookie** - Cookie 管理:
- `Cookie.set(name, value, days)` - 设置 Cookie
- `Cookie.get(name)` - 获取 Cookie
- `Cookie.delete(name)` - 删除 Cookie

**ManagerCommon.AES** - AES-256-CBC 加解密:
- `AES.encrypt(text, password)` - 加密（PBKDF2 密钥派生）
- `AES.decrypt(encryptedData, password)` - 解密

---

### 4.3 GitHub API 助手

**文件**: [js/github-api-helper.js](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/js/github-api-helper.js)

**类名**: `GitHubAPIHelper`  
**全局实例**: `window.githubHelper`

**职责**: 封装 GitHub Contents API，实现数据的云端读写。

#### 配置与安全

```javascript
loadConfig() {
    const _e = "1f001507190331..."; // 加密后的 Token
    const _k = localStorage.getItem('userName') || 'guest';
    
    // XOR + Hex 解密
    const _d = (hex, key) => {
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
            const charCode = parseInt(hex.substr(i, 2), 16) 
                           ^ key.charCodeAt((i / 2) % key.length);
            str += String.fromCharCode(charCode);
        }
        return str;
    };
    
    const _t = _d(_e, _k);
    return {
        token: _t,
        owner: 'xiaolanqqai',
        repo: 'xiaolanqqai.github.io',
        branch: 'master'
    };
}
```

**安全说明**:
- Token 使用 XOR 加密存储，密钥来自 `localStorage.userName`
- 仅在用户正确输入用户名时才能解密 Token
- 访客模式（userName='guest'）下 Token 无效，无法同步

#### 核心方法

| 方法 | 参数 | 描述 |
|------|------|------|
| `getFile(path)` | path: string | 获取文件内容（Base64 编码） |
| `getFileSHA(path)` | path: string | 获取文件 SHA（用于更新） |
| `updateFile(path, content, message)` | path: string<br>content: string<br>message: string | 更新或创建文件 |
| `isConfigured()` | - | 检查 Token 是否有效 |
| `getConfig()` | - | 获取配置对象 |

---

### 4.4 深色模式系统

**文件**: [js/dark-mode.js](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/js/dark-mode.js)

**类名**: `DarkMode`  
**全局实例**: `window.darkModeInstance`

#### 核心逻辑

```javascript
class DarkMode {
    constructor() {
        this.themeKey = 'dark-mode';
        this.themeAttribute = 'data-theme';
        this.btnId = 'themeToggle';
        this.iconId = 'themeIcon';
        this.init();
    }
    
    init() {
        // 读取保存的主题或系统偏好
        const savedTheme = localStorage.getItem(this.themeKey);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        this.setTheme(theme);
        
        // 绑定或创建按钮
        const bind = () => {
            let btn = document.getElementById(this.btnId);
            if (!btn) {
                this.createButton(); // 首页悬浮按钮
                btn = document.getElementById(this.btnId);
            }
            if (btn) btn.onclick = () => this.toggleTheme();
        };
    }
}
```

#### 主题判定优先级

1. `localStorage.dark-mode`（用户手动选择）
2. `prefers-color-scheme: dark`（系统偏好）
3. 默认浅色模式

#### 按钮创建策略

| 场景 | 按钮位置 | 创建者 |
|-----|---------|--------|
| 管理页面 | 顶部导航栏内 | manager-component.js |
| 首页/其他页面 | 右上角悬浮圆形按钮 | dark-mode.js 自动创建 |

#### CSS 变量体系

深色模式通过 CSS 变量实现主题切换，核心变量定义在 [manager-styles.css](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/css/manager-styles.css) 中：

| 变量 | 浅色 | 深色 |
|-----|------|------|
| `--bg-primary` | #ffffff | #2b2b2b |
| `--bg-secondary` | #f8f9fa | #333333 |
| `--text-primary` | #212529 | #f8f9fa |
| `--text-secondary` | #6c757d | #adb5bd |
| `--border-color` | #dee2e6 | #555555 |
| `--card-bg` | #ffffff | #2b2b2b |
| `--primary-color` | #388087 | #56a8b0 |

---

### 4.5 点击追踪系统

**文件**: [js/click-tracker.js](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/js/click-tracker.js)

**职责**: 追踪用户点击的链接，统计访问频率，为 History 推荐提供数据。

#### 核心机制

```javascript
// 事件委托：监听整个文档的点击
document.addEventListener('click', function(e) {
    const anchor = e.target.closest('a');
    if (anchor && anchor.href) {
        const url = anchor.href;
        if (!url || url.startsWith('javascript:') || url.startsWith('#')) return;
        const title = anchor.innerText.trim() || anchor.title;
        recordClick(url, title);
    }
}, false);

// 防抖记录
const recordClick = debounce(function(url, title) {
    let safeUrlKey;
    try {
        safeUrlKey = btoa(encodeURIComponent(url)).substring(0, 16);
    } catch (e) {
        // 回退方案：简单哈希
        safeUrlKey = url.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0).toString(16);
    }
    
    const storageKey = `nav_history_click_${safeUrlKey}`;
    let historyData = localStorage.getItem(storageKey);
    
    if (historyData) {
        historyData = JSON.parse(historyData);
        historyData.count += 1;
        historyData.lastClick = now;
    } else {
        historyData = {
            url: url,
            title: title || url,
            count: 1,
            lastClick: now
        };
    }
    localStorage.setItem(storageKey, JSON.stringify(historyData));
}, 300);
```

#### 数据结构

```javascript
// localStorage key: nav_history_click_{urlHash}
{
    url: "https://www.bilibili.com",
    title: "Bilibili",
    count: 42,
    lastClick: "2026-03-18T10:30:00.000Z"
}
```

#### History 推荐规则

- 点击次数 ≥ 2 次的网站会出现在 History 标签页
- 按点击次数降序排列
- 在 [nav-data.json](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/data/nav-data.json) 的 `index.tabs` 中，`name: "History"` 的标签页展示推荐结果

---

### 4.6 搜索系统

**文件**: [js/search_ajx.js](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/js/search_ajx.js)

**职责**: 处理搜索框交互动画、搜索提交跳转、搜索建议联想。

#### 搜索引擎映射

| oMoreB 值 | 搜索引擎 | URL 模板 |
|----------|---------|---------|
| 0 | 局域网 1.x | `http://192.168.1.{value}` |
| 1 | 局域网 2.x | `http://192.168.2.{value}` |
| 2 | 局域网通用 | `http://192.168.{value}` |
| 3 | 百度（默认） | `https://www.baidu.com/s?wd={value}` |
| 4 | Bing | `https://www.bing.com/search?q={value}` |
| 5 | Google HK | `https://www.google.com.hk/search?q={value}` |
| 6 | Yandex | `https://yandex.com/search/?text={value}` |
| 7 | B站 | `https://search.bilibili.com/all?keyword={value}` |
| 8 | 快递100 | `https://www.kuaidi100.com/chaxun?com=&nu={value}` |

#### 核心函数

| 函数名 | 描述 |
|--------|------|
| `searchToggle(obj, evt)` | 搜索框展开/收起动画 |
| `submitFn(obj, evt)` | 搜索提交，根据 oMoreB 跳转到对应搜索引擎 |
| `fly(myJson)` | 百度 JSONP 回调（备用） |

#### 搜索联想

使用百度 JSONP 接口实现实时搜索建议：

```javascript
$.ajax({
    url: "https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su",
    dataType: "jsonp",
    data: { wd: oValue },
    jsonp: "cb",
    success: function(myJson) {
        // 渲染建议列表
    }
});
```

---

### 4.7 背景粒子系统

详见 [4.1.3 BackgroundComponent](#413-backgroundcomponent)

**关键技术指标**:
- 架构: SOA (Structure of Arrays) + Float32Array
- 粒子数: PC 端 1000 个（移动端限制 1000）
- 渲染方式: Canvas 2D `ctx.rect()` 批量绘制
- 交互模式: 排斥模式（默认）/ 聚拢模式（点击切换）
- 性能优化: 
  - 平方距离比较避免 sqrt
  - 单次 beginPath + 批量 fill
  - 粒子使用方形替代圆形（视觉差异极小，性能大幅提升）

---

## 5. 数据结构

### 5.1 导航数据 (nav-data.json)

**文件**: [data/nav-data.json](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/data/nav-data.json)

这是项目的核心数据文件，驱动所有导航页面的内容。

#### 顶层结构

```json
{
  "version": {
    "web_vol": "BETA 4.3",
    "web_data": "2026.01.01"
  },
  "index": { "tabs": [...] },
  "more": { "tabs": [...], "special": {...} },
  "dd": { "tabs": [...] },
  "download": { "tabs": [...] },
  "develop": { "tabs": [...] }
}
```

#### 页面数据结构

每个页面对应一个键（index/more/dd/download/develop），包含 `tabs` 数组。

```json
{
  "tabs": [
    {
      "id": "1782626734504",     // 可选：选项卡唯一ID
      "name": "嵌入式.ESP",     // 选项卡名称
      "items": [                // 网站列表
        {
          "name": "ESPConnect", // 网站名称
          "url": "https://..."  // 网站链接
        }
      ]
    }
  ]
}
```

#### special 特殊分类（仅 more）

```json
"special": {
  "name": "小日本ポートエロ",
  "trigger": "001",    // 触发密码
  "sites": [           // 隐藏网站列表
    { "name": "...", "url": "..." }
  ]
}
```

**触发方式**: 在 More 页面搜索框输入 `001` 触发显示隐藏分类。

---

### 5.2 版本历史 (version-history.json)

**文件**: [data/version-history.json](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/data/version-history.json)

```json
{
  "dependencies": {
    "bootstrap": "BOOSTRAP_v5.3.0-alpha3",
    "jquery": "JQuery_v3.5.1",
    "particles": "Particles_v2.2.3",
    "site_data": "网站数据_2026.01.01"
  },
  "versions": [
    {
      "name": "BETA 4.5.2",
      "date": "2026-03-18",
      "changes": ["1：...", "2：...", "3：..."]
    }
  ]
}
```

---

## 6. 四大管理系统

### 6.1 导航数据管理系统 (nav-manager.html)

**文件**: [index/manager/nav-manager.html](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/index/manager/nav-manager.html)

**功能**:
- 多页面数据管理（index/more/dd/download/develop）
- 选项卡增删改、拖拽排序
- 网站卡片增删改、跨选项卡移动
- JSON 上传/下载/预览
- 本地存储与 GitHub 双向同步
- 数据版本信息展示

---

### 6.2 版本管理系统 (vol-manager.html)

**文件**: [index/manager/vol-manager.html](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/index/manager/vol-manager.html)

**功能**:
- 版本历史记录的增删改查
- 版本号、发布日期、更新内容管理
- 依赖版本信息展示
- GitHub 同步

---

### 6.3 探索网页系统 (explore-manager.html)

**文件**: [index/manager/explore-manager.html](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/index/manager/explore-manager.html)

**功能**:
- 浏览器收藏夹导入与管理
- 网站分类浏览与搜索
- 最近点击历史管理（过滤、排序、分页）
- 网站可访问性检测
- URL 格式校验
- GitHub 同步

---

### 6.4 密码生成器系统 (MM-generator.html)

**文件**: [index/manager/MM-generator.html](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/index/manager/MM-generator.html)

**功能**:
- AES-256-CBC 加密 HTML 文件生成
- 加密内容编辑与管理
- 密码强度校验
- 快捷输入模板
- 导出为独立加密 HTML 文件
- GitHub 同步加密数据

---

## 7. 依赖关系

### 7.1 外部依赖

| 库名 | 版本 | 用途 | 引入方式 |
|-----|------|------|---------|
| Bootstrap | 5.3.0-alpha3 | UI 框架、响应式布局、组件 | 本地 CSS + JS |
| jQuery | 3.5.1 | DOM 操作、AJAX、动画 | 本地 JS |
| Font Awesome | 6.x | 图标库 | 本地 all.min.css |
| 百度搜索建议 API | - | 搜索联想 JSONP | 远程 CDN |
| 今日诗词 API | v2 | 每日诗词展示 | 远程 SDK |
| Microsoft Clarity | - | 用户行为分析 | 远程脚本 |
| 一为API | - | 网站图标获取 | 远程 API |
| AllOrigins | - | CORS 代理 | 远程 API |

### 7.2 内部模块依赖

```
index.html
├── header-component.js (注入 CSS + 基础 JS)
│   ├── dark-mode.js (defer)
│   └── click-tracker.js (defer)
├── search-component.js
│   └── search_ajx.js (依赖 jQuery)
├── background-component.js
│   ├── fish.js (鱼群动画)
│   ├── foot.js (页脚逻辑)
│   └── ParticleSystem (自研粒子系统)
└── nav-data.json (数据驱动渲染)

管理页面 (manager/*.html)
├── header-component.js
├── manager-component.js (导航/页头/日志)
├── github-api-helper.js (GitHub API)
└── manager-common.js (通用逻辑)
    └── 依赖 github-api-helper.js
```

### 7.3 加载顺序优化

**首页加载策略**:
1. 同步：header-component.js（注入 CSS preload）
2. 同步：jquery-3.5.1.min.js
3. 同步：search_ajx.js（搜索逻辑，用户可能立即使用）
4. 延迟：performance-config.js
5. DOMContentLoaded 后并行：
   - bootstrap.bundle.min.js
   - 今日诗词 SDK
   - 导航数据 fetch + 渲染
6. 背景组件异步加载鱼群和粒子系统

---

## 8. 项目运行方式

### 8.1 本地运行

由于项目是纯静态网站，本地运行非常简单：

**方式一：直接打开**
```
直接双击 index.html 即可在浏览器中打开
```

**方式二：本地服务器（推荐）**

使用 Python 内置服务器：
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

使用 Node.js：
```bash
npx serve .
```

访问：`http://localhost:8000`

**方式三：VS Code Live Server**
- 安装 Live Server 扩展
- 右键 index.html → Open with Live Server

### 8.2 部署

**GitHub Pages 自动部署**：
1. 代码推送到 `master` 分支
2. 在仓库 Settings → Pages 中配置源为 `master` 分支
3. 访问 `https://xiaolanqqai.github.io`

**自定义域名**：
- 根目录 [CNAME](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/CNAME) 文件配置域名
- DNS 解析指向 GitHub Pages

### 8.3 管理系统使用

1. 访问 `/index/manager/nav-manager.html`
2. 首次使用需设置用户名（解密 GitHub Token）
3. 可直接在本地编辑数据
4. 点击同步按钮推送到 GitHub（5 分钟冷却）

---

## 9. 开发规范与最佳实践

### 9.1 代码组织

| 规范 | 说明 |
|-----|------|
| **组件化** | 可复用 UI/逻辑封装为 `js/components/*.js` |
| **IIFE 模式** | 组件使用立即执行函数，避免全局污染 |
| **单例模式** | 核心功能类全局单实例（`window.xxx`） |
| **数据驱动** | 导航内容完全由 JSON 驱动，不硬编码在 HTML 中 |
| **渐进增强** | 核心功能可用，JS 加载后增强体验 |

### 9.2 CSS 规范

- 使用 CSS 变量定义主题色，便于深色模式切换
- 管理页面样式统一在 [manager-styles.css](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/css/manager-styles.css)
- 避免内联样式和硬编码颜色值
- SCSS 源文件在 [css/scss/](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/css/scss/) 目录

### 9.3 JavaScript 规范

- 优先使用 Vanilla JS，jQuery 主要用于旧代码兼容
- 新代码使用 ES6+ 语法（class、箭头函数、模板字符串等）
- 事件委托优于逐个绑定
- 使用 `defer` / 异步加载非关键脚本
- 错误处理：全局捕获 + 日志系统记录

### 9.4 性能优化清单

- [x] CSS preload + onload 异步加载
- [x] JS defer / 异步加载
- [x] 图片懒加载（`loading="lazy"`）
- [x] 图标 API 延迟加载
- [x] 粒子系统 SOA + Float32Array 优化
- [x] 批量 Canvas 渲染（单次 beginPath）
- [x] 防抖/节流处理高频事件
- [x] LocalStorage 缓存数据
- [x] 导航数据带时间戳防缓存

---

## 10. 性能优化策略

### 10.1 加载性能

| 优化点 | 技术手段 | 效果 |
|-------|---------|------|
| CSS 预加载 | `rel="preload" as="style"` + `onload` | 不阻塞首屏渲染 |
| JS 延迟加载 | `defer` 属性 + 动态创建 script | 减少首屏 JS 体积 |
| 数据缓存 | fetch URL 加时间戳 + LocalStorage 缓存 | 避免重复请求 |
| 图片懒加载 | `loading="lazy"` + onerror 降级 | 减少初始加载数 |

### 10.2 运行性能

| 优化点 | 技术手段 | 效果 |
|-------|---------|------|
| 粒子系统 | SOA 架构 + Float32Array + 批量绘制 | 支持 1000+ 粒子 60fps |
| 事件监听 | 事件委托（document 级监听） | 减少内存占用 |
| DOM 查询 | ID 选择器优先 + 缓存查询结果 | 减少重排重绘 |
| 高频操作 | 防抖（debounce）+ 节流（throttle） | 避免过度计算 |

### 10.3 监控指标

- **Microsoft Clarity**: 用户行为分析、热图、会话回放
- **页面加载进度条**: 视觉反馈，感知性能提升
- **操作日志系统**: 开发调试与错误追踪

---

## 附录

### A. 版本历史速览

| 版本 | 日期 | 核心更新 |
|-----|------|---------|
| BETA 4.5.2 | 2026-03-18 | GitHub 同步冷却机制、跨页面同步锁定 |
| BETA 4.4 | 2026-03-17 | Clarity 集成、Base64 中文解码修复 |
| BETA 4.3 | 2026-03-02 | History 点击追踪、粒子系统 SOA 重构 |
| BETA 4.2 | 2026-01-01 | GitHub API 优化、背景动画定位修复 |
| BETA 4.1 | 2025-12-23 | 模块化架构升级、manager-common.js 整合 |
| BETA 4.0 | 2025-10-27 | 全新管理系统、四大管理页面 |

### B. 关键文件速查表

| 功能 | 文件路径 |
|-----|---------|
| 首页入口 | [index.html](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/index.html) |
| 导航数据 | [data/nav-data.json](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/data/nav-data.json) |
| 版本历史 | [data/version-history.json](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/data/version-history.json) |
| Header 组件 | [js/components/header-component.js](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/js/components/header-component.js) |
| 搜索组件 | [js/components/search-component.js](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/js/components/search-component.js) |
| 背景组件 | [js/components/background-component.js](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/js/components/background-component.js) |
| 管理组件 | [js/components/manager-component.js](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/js/components/manager-component.js) |
| 管理通用逻辑 | [js/manager-common.js](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/js/manager-common.js) |
| GitHub API | [js/github-api-helper.js](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/js/github-api-helper.js) |
| 深色模式 | [js/dark-mode.js](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/js/dark-mode.js) |
| 点击追踪 | [js/click-tracker.js](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/js/click-tracker.js) |
| 搜索逻辑 | [js/search_ajx.js](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/js/search_ajx.js) |
| 管理页样式 | [css/manager-styles.css](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/css/manager-styles.css) |
| 深色模式样式 | [css/dark-mode.css](file:///c:/Users/qq286/Documents/GitHub/xiaolanqqai.github.io/css/dark-mode.css) |

---

*本文档由 TRAE AI 基于代码库分析生成，最后更新：2026-06-28*
