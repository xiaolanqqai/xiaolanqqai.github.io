# Xiaolan QuickNav — Code Wiki

> 面向开发者的结构化代码文档。基于源码仓库 `xiaolanqqai.github.io`（branch `master`）梳理而成。  
> 站点性质：**纯前端静态导航站**，无后端、无构建步骤，通过 GitHub Pages 部署。

---

## 目录

- [1. 项目概述与定位](#1-项目概述与定位)
- [2. 技术栈与外部依赖](#2-技术栈与外部依赖)
- [3. 整体架构](#3-整体架构)
- [4. 目录结构总览](#4-目录结构总览)
- [5. 模块职责](#5-模块职责)
  - [5.1 页面骨架与公共组件](#51-页面骨架与公共组件)
  - [5.2 导航与搜索模块](#52-导航与搜索模块)
  - [5.3 背景动画模块](#53-背景动画模块)
  - [5.4 主题与埋点](#54-主题与埋点)
  - [5.5 工具模块](#55-工具模块)
  - [5.6 管理系统模块](#56-管理系统模块)
  - [5.7 数据同步层](#57-数据同步层)
- [6. 关键类与函数清单](#6-关键类与函数清单)
- [7. 数据模型（data/\*.json）](#7-数据模型-datajson)
- [8. 依赖关系](#8-依赖关系)
- [9. 项目运行方式](#9-项目运行方式)
- [10. 安全设计](#10-安全设计)

---

## 1. 项目概述与定位

Xiaolan 是一个高效导航页系统，提供快速搜索、分类网站导航、局域网工具、以及站点内容的可视化管理。核心页面在首页 `index.html`，功能入口（Tool、More、Download、Develop）与管理系统集中在 `index/` 下。

**核心能力**：

- 智能搜索联想（百度 suggest JSONP）
- 分类标签导航，动态渲染 `data/nav-data.json`
- 深色/浅色主题切换并持久化
- 每日诗词、背景粒子、飞鱼动画
- 局域网 Web 服务扫描（`Network Tool`）
- 加密笔记（`MM` / mm-crypto）
- 多套管理系统：导航管理、工具管理、MM 生成、探索/聚类管理、版本管理

---

## 2. 技术栈与外部依赖

| 类别     | 名称                                                   | 版本/说明                                               |
| ------ | ---------------------------------------------------- | --------------------------------------------------- |
| UI 框架  | Bootstrap                                            | 5.3.0-alpha3（`js/bootstrap.bundle.min.js`）          |
| JS 库   | jQuery                                               | 3.5.1                                               |
| 动画     | Particles.js                                         | 2.2.3（背景粒子）                                         |
| 3D     | Three.js                                             | 0.170.0（`js/vendor/three@0.170.0/`，含 OrbitControls） |
| 图标     | Font Awesome                                         | `css/all.min.css`（按需加载，见 `data-fontawesome` 开关）     |
| 加密     | Web Crypto API                                       | AES-256-CBC + PBKDF2（原生 `crypto.subtle`，无第三方库）      |
| 数据存储   | localStorage / sessionStorage / Cookie               | 主题、点击记录、扫描结果、同步锁                                    |
| 外部 API | GitHub REST API、jinrishici（诗词）、Baidu suggest、Clarity | 见下文                                                 |

---

## 3. 整体架构

站点采用「**页面 + 公共组件 + 数据驱动**」的轻量架构，无模块打包器，全部依赖原生 `<script>` 按序加载并用全局对象（`window.*`）通信。

```
┌────────────────────────────── HTML 页面层 ─────────────────────────────┐
│ index.html   index/More/Download/Develop/tool.html   index/Tool/*       │
│ index/manager/*（管理系统页面）                                          │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │ document.write / <script>
┌──────────────────────────────▼─────────────────────────────────────────┐
│                   公共组件层 js/components/*.js                          │
│  header(全局helper/head注入) search background manager tool-scanner     │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │ 全局对象调用  window.xxx
┌──────────────────────────────▼─────────────────────────────────────────┐
│                   业务逻辑层 js/*.js                                     │
│  search_ajx  dark-mode  click-tracker  foot/fish  tool-scanner          │
│  mm-crypto  manager-common  github-api-helper                            │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │ fetch / GitHub API
┌──────────────────────────────▼─────────────────────────────────────────┐
│                   数据层 data/*.json + GitHub 仓库 + localStorage       │
└────────────────────────────────────────────────────────────────────────┘
```

**关键设计理念**：

1. **组件复用**：`header-component.js` 通过 `document.write` 注入各页 `<head>`，统一 meta/CSS/埋点，各页面只需少量脚本。
2. **数据驱动**：导航、工具列表、版本、加密内容均来自 `data/*.json`，管理系统负责改写并同步回 GitHub。
3. **安全优先**：`escapeHtml`/`safeUrl` 全局防治 XSS 与伪协议注入（详见 [§10](#10-安全设计)）。
4. **性能**：CSS 预加载、JS async/defer、图片懒加载、Font Awesome 按需关闭。

---

## 4. 目录结构总览

```
xiaolan/
├── index.html                 # 首页（导航 + 搜索 + 背景动画）
├── AI.md                      # 可直接投喂给本地 AI 的上传提示词（站点根目录）
├── CNAME / robots.txt / favicon.ico
├── performance-config.js      # 性能配置与监控（调试开关）
├── index/
│   ├── More.html Download.html Develop.html tool.html AA.htm DD.html
│   ├── MM-secure.html         # MM 加密笔记浏览（解密展示 MM.json）
│   ├── manager/               # 管理系统
│   │   ├── nav-manager.html   # 导航数据管理
│   │   ├── tool-manager.html  # 工具跳转页项目管理
│   │   ├── app-manager.html   # App 更新包管理（AppUpdater 目录）
│   │   ├── MM-generator.html  # MM 内容加密生成
│   │   ├── explore-manager.html # 探索/点击统计管理
│   │   └── vol-manager.html   # 版本管理
│   └── Tool/
│       ├── Network Tool.html  # 局域网扫描工具页
│       ├── mm加密.html        # MM 加解密工具
│       └── STP.html           # STP 文件预览
├── js/
│   ├── components/            # 公共组件（页面对应）
│   │   ├── header-component.js
│   │   ├── background-component.js
│   │   ├── search-component.js
│   │   ├── manager-component.js
│   │   └── tool-scanner-component.js
│   ├── *.js                  # 业务逻辑（见 §5/§6）
│   └── vendor/three@0.170.0/ # 本地 Three.js
├── css/                       # bootstrap/dark-mode/search-form/manager 样式
├── data/                      # 站点数据 JSON（见 §7）
├── AppUpdater/                # App 更新包目录（管理页写入，每个项目一个子文件夹）
├── img/  webfonts/            # 静态资源与图标字体
└── docs/
    ├── CODE-WIKI.md           # 本文档
    └── AI-UPLOAD-GUIDE.md     # 本地 AI 上传 AppUpdater 产物的接口引导
```

---

## 5. 模块职责

### 5.1 页面骨架与公共组件

#### `js/components/header-component.js`

站点全局入口，通过 `document.write(headContent)` 注入每个页面的 `<head>`：

- 判定页面层级并导出 `window.getBasePath()`（`./`/`../`/`../../`）
- 导出全局安全函数 `window.escapeHtml`、`window.safeUrl`
- 动态拼接 meta、favicon、Bootstrap、Font Awesome、深色主题、点击埋点脚本
- 管理页 (`isManagerPage`) 不注入 Clarity 埋点，加 `noindex`，避免采集管理态与泄漏会话

#### `js/components/search-component.js`

生成搜索表单 DOM（输入框、按钮、结果容器），`loadScript` 异步加载 `js/search_ajx.js`，确保 `submitFn`/`searchToggle` 可用。

#### `js/components/background-component.js`

注入背景容器、飞鱼容器与粒子 canvas；实现 `ParticleSystem`（粒子动画/吸附鼠标），加载 `foot.js`、`fish.js` 并初始化 `RENDERER` 与 `DarkMode`。

#### `js/components/manager-component.js`

为 `/index/manager/*` 页面生成顶部导航、主题切换按钮与操作日志入口；绑定 `dark-mode` 存储并调用 `window.darkModeInstance.setTheme` 同步背景主题。操作日志面板内附带 **GitHub Token 注入区**（`bindTokenPanel`）：保存/清除 `localStorage.github_token`、状态回显（仅前缀 + 末 4 位）、`storage` 事件跨标签页同步。

#### `js/components/tool-scanner-component.js`

工具扫描页 UI 模板：扫描表单、高级面板、状态提示、进度条。

### 5.2 导航与搜索模块

#### 首页 `index.html`（内联脚本）

- **Logo 映射**：按 `localStorage.oMoreB` 选择顶部 logo 图片。
- **`switchTab(tabId)`**：切换导航标签页（nav-tabs）。
- **`renderNavigation(navData)`**：根据 `data/nav-data.json` 渲染标签行与内容面板，图标取第三方 favicon 服务，失败回退默认图。
- **`loadNavData(retry)`**：`fetch` 读取导航 JSON，失败带 3 次重试并入错态提示；成功回调 `renderNavigation` + `loadVersionInfo`。
- 另加载 jinrishici 诗词 SDK 展示每日诗句。

#### `js/search_ajx.js`

- `SEARCH_ENGINES`：多搜索引擎 URL 模板常量表。
- `submitFn(form, event)`：按 `window.oMoreB` 选择引擎并新窗口打开搜索。
- JSONP 请求百度 suggest 实现联想搜索；`bindSuggestionInput` 绑定输入事件。
- 输出全局 `searchToggle`、`submitFn`、`SEARCH_ENGINES`。

### 5.3 背景动画模块

- `js/foot.js`：`RENDERER`，飞鱼动画渲染入口（init/setup/render），`requestAnimationFrame` 驱动主循环。
- `js/fish.js`：`FISH` 对象，鱼的方向控制、重力、边界判断与 Canvas 绘制。

### 5.4 主题与埋点

- `js/dark-mode.js`：`DarkMode`。读取 `localStorage` + `prefers-color-scheme`，写入 `<html data-theme>` 并持久化，更新切换按钮图标。
- `js/click-tracker.js`：防抖记录外部链接点击到 `localStorage`，排除 `javascript:`、`#` 与站内跳转。
- `js/click-tracker.js` 数据被 `explore-manager.html` 用于生成「最近点击」统计。

### 5.5 工具模块

详见 [§6 关键类清单] 中的对应类；关键工具：

- `js/tool-scanner.js` → `LanToolScanner`：局域网 Web 服务发现。
- `js/mm-crypto.js` → `window.MMCrypto`：站点唯一加解密实现。
- `index/Tool/mm加密.html` 复用 MMCrypto；`index/MM-secure.html` 拉取并解密 `MM.json` 展示。

### 5.6 管理系统模块

由 `js/manager-common.js`（`ManagerCommon` 单例）提供统一能力：

- 同步锁（防抖，5 分钟冷却遮罩）、进度条、错误处理、Toast/Loading、日志系统、数据校验、`debounce/throttle`、静态 `Cookie`、静态 `AES`（委托 `MMCrypto`）、`syncToGithub`/`getFromGithub`/`extractSiteNameFromUrl`。

各管理页：

- `nav-manager.html`：读写导航数据，经 `managerCommon.syncToGithub` 同步 `data/nav-data.json`。
- `tool-manager.html`：管理工具跳转页项目列表，上传单页文件并同步 `data/tool-projects.json` 到 GitHub。
- `app-manager.html`：管理 `AppUpdater/` 下的 App 更新项目。新建项目（文件夹名 = 项目名）与简介，按项目上传软件包、删除单个文件或整个项目；所有改动**先暂存**，点“同步到 GitHub”后经 Git Data API（blobs → tree → commit → ref）**一次原子提交**。每个项目的 `info.json` 记录 `mainFile`，复制按钮输出的下载直链为 `https://<站点>/AppUpdater/<项目名>/<mainFile>`（已有 `mainFile` 仍存在时保持不变，`setMain` / `setMainFile` 显式切换）。
  另含**目录识别更新**（`scanDirectory` → `buildScanPlan`）：扫描绕过管理页直接上传到仓库的内容 —— 散落在 `AppUpdater/` 根下的文件按“去扩展名同名项目”迁移进文件夹（迁移写入 + 删除源文件放在同一个提交里），缺失的 `info.json` 自动补建、主文件失效时自动更新。主文件用 `pickMainFile` 识别：已有 `mainFile` 仍存在时保持不变，否则在安装包类扩展名（`PACKAGE_EXT`）中按 `naturalCompare` 自然排序取最新（`v1.10 > v1.2`），无安装包时取全部文件中最新的一个；主文件已一致则不重写，避免无意义提交。执行前先输出变更清单二次确认。
  另含**拖拽自动归类**（`dropZone` → `handleDroppedFiles` / `resolveDropProject` / `projectNameFromFile`）：拖入文件即按文件名归入项目并暂存，无对应项目则自动新建（`pendingProjects`，简介留空），最终统一走“同步到 GitHub”。归类优先匹配已有项目名（取最长匹配，要求紧随分隔符或 `v数字`）；再从文件名去扩展名、去版本尾巴（`DROP_VERSION_TAIL`）推导项目名；若推导名 = 已有项目名 + 版本尾巴（如 `MyApp2`）则仍归入已有项目，避免误建名字相近的项目。拖拽只做归类，主文件保持已有值；新项目才从 `fileCandidates()`（线上未删 + 全部暂存）中按自然排序补选；项目卡片的“上传文件”属显式操作，会切换主文件。
  另导出 **AI 上传接口** `window.AppUpdaterAPI`（详见 [§6.11](#611-appupdaterapiapp-managerhtml) 与 [AI-UPLOAD-GUIDE.md](AI-UPLOAD-GUIDE.md)）：供本地 AI 在同标签页内直接发布产物。token 只在本机 `localStorage`，故必须由本地浏览器发起。
- `MM-generator.html`：加密生成 MM 密文。
- `explore-manager.html`：基于 `localStorage` 点击记录做「最近点击」统计，支持生成 History 类目。
- `vol-manager.html`：版本管理（对应 `data/version-history.json`）。

### 5.7 数据同步层

`js/github-api-helper.js` → `window.githubHelper`（`GitHubAPIHelper`）：

- token 由管理员在浏览器控制台一次注入 `localStorage.github_token`，源码内不含任何凭据；未注入时 `isConfigured()` 返回 false。
- `getFileSHA`/`getFile`/`updateFile`/`updateBinaryFile`/`deleteFile`/`listDir`/`deleteDir`，走 GitHub REST `contents` API，提交到 `master` 分支；写操作统一经私有入口 `_put`（存在 SHA 即覆盖，否则新建）。
- 所有 `data/*.json` 的持久化统一由此层 + `manager-common` 完成；`AppUpdater/` 的软件包上传由 `app-manager.html` 直接调用。

---

## 6. 关键类与函数清单

### 6.1 `header-component.js`

| 全局                     | 类型 | 说明                |
| ---------------------- | -- | ----------------- |
| `window.getBasePath()` | 函数 | 返回相对站点根的前缀        |
| `window.escapeHtml(v)` | 函数 | HTML 转义（防 XSS）    |
| `window.safeUrl(v)`    | 函数 | URL 协议白名单校验（防伪协议） |

### 6.2 `search_ajx.js`

| 全局                      | 说明       |
| ----------------------- | -------- |
| `SEARCH_ENGINES`        | 搜索引擎模板常量 |
| `submitFn(form, event)` | 提交搜索     |
| `searchToggle`          | 搜索框开关    |

### 6.3 `dark-mode.js` → `DarkMode`

| 方法                  | 说明                       |
| ------------------- | ------------------------ |
| `init()`            | 读存储+系统偏好，应用 `data-theme` |
| `setTheme()` / 主题切换 | 持久化并更新图标                 |

### 6.4 `background-component.js` → `ParticleSystem`

粒子数组、resize/mouse/click 事件、动画循环；启动后加载 `foot.js`+`fish.js` 初始化 `RENDERER`、`DarkMode`。

### 6.5 `foot.js` → `RENDERER`，`fish.js` → `FISH`

飞鱼动画渲染主循环与鱼个体行为（方向、重力、边界、绘制）。

### 6.6 `tool-scanner.js` → `LanToolScanner`

| 方法                                                      | 说明                                      |
| ------------------------------------------------------- | --------------------------------------- |
| `bindEvents()`                                          | 绑定表单/取消事件                               |
| `populateDefaults()` / `detectSubnet()`                 | 默认参数填充与网段探测                             |
| `toggleAdvancedPanel()`                                 | 展开高级设置                                  |
| `startScan()`                                           | 主流程：校验→生成目标→并发探测→合并→缓存→渲染               |
| `cancelScan()`                                          | 取消扫描                                    |
| `mergeResult(result)`                                   | 去重合并结果                                  |
| `getConfig()` / `parsePorts()` / `buildTargets(config)` | 配置校验、端口解析、目标生成                          |
| `probeOne(task)` / 内容识别                                 | fetch 探测，判断 content/title/mixed-content |
| `formatResult(...)`                                     | 格式化结果（去重保留有内容项）                         |
| `updateProgress` / `setStatus`                          | 进度条与状态                                  |
| `groupResults` / `compareIp`                            | 结果按 IP+端口排序分组                           |
| `restoreLastResults()`                                  | 恢复 localStorage 上次结果                    |

### 6.7 `mm-crypto.js` → `window.MMCrypto`

| 方法                        | 说明                                                 |
| ------------------------- | -------------------------------------------------- |
| `encrypt(text, password)` | PBKDF2 派生 AES-256-CBC 密钥，输出 base64(salt‖iv‖cipher) |
| `decrypt(data, password)` | 反向拆分并解密还原                                          |

常量：`SALT=16`、`IV=16`、迭代 `100000`、密钥 `256`。

### 6.8 `manager-common.js` → `window.managerCommon` / `window.ManagerCommon`

| 成员                                                           | 说明                                 |
| ------------------------------------------------------------ | ---------------------------------- |
| `initSyncLock / checkSyncLock / lockSync / applySyncOverlay` | 同步 5 分钟冷却锁                         |
| `initProgressBar`                                            | 页面级进度条                             |
| `initErrorHandling / handleError`                            | 全局错误捕获（error / unhandledrejection） |
| `initLogSystem / log / clearLogs / limitLogEntries`          | 日志面板                               |
| `showAlert / showToast / showLoading / hideLoading`          | UI 反馈                              |
| `validateData(data, schema)`                                 | schema 校验                          |
| `debounce(fn, wait)` / `throttle(fn, limit)`                 | 工具函数                               |
| `ManagerCommon.Cookie`                                       | Cookie 静态封装                        |
| `ManagerCommon.AES`                                          | 委托 `MMCrypto`                      |
| `syncToGithub(path, data, msg)` / `getFromGithub(path)`      | GitHub 双向同步                        |
| `extractSiteNameFromUrl(url)`                                | 从域名推导站点名                           |

### 6.9 `github-api-helper.js` → `window.githubHelper`

| 方法                                              | 说明              |
| ----------------------------------------------- | --------------- |
| `getConfig / isConfigured / _token / _headers / _apiUrl` | 配置与请求构造（token 实时读 `localStorage.github_token`） |
| `getFileSHA(path)` / `getFile(path)`            | 读取文件元数据/内容      |
| `_put(path, base64, msg)`                       | 统一写入口（带 SHA 合并），其余写方法委托它 |
| `updateFile(path, content, msg)`                | 文本写入（UTF-8 → base64） |
| `updateBinaryFile(path, arrayBuffer, msg)`      | 二进制写入（APK/ZIP，按字节 base64） |
| `updateFileBase64(path, base64, msg)`           | 直接写入 base64 内容（文件迁移复用已有 base64，免解码再编码） |
| `listDir(path)`                                 | 列举目录（不存在返回空数组） |
| `deleteFile(path, msg)`                         | 删除单个文件           |
| `deleteDir(path, msg)`                          | 递归删除目录下所有文件（GitHub 无目录删除接口） |
| `arrayBufferToBase64(buffer)`（静态）              | 分块字节转换，避免大文件栈溢出 |

### 6.10 `manager-component.js`

为管理页注入顶部导航、主题按钮、日志入口，并同步后台 `DarkMode`。

| 成员                                      | 说明                                              |
| --------------------------------------- | ----------------------------------------------- |
| `injectNav / injectHeader / injectFooter` | 顶部导航、页头、页脚                                      |
| `injectLogOffcanvas`                    | 操作日志面板（含辅助工具与 Token 注入区）                         |
| `bindTokenPanel`                        | 绑定 Token 保存/清除/显隐，`refreshTokenStatus` 渲染已配置状态（`github_token`） |
| `bindThemeToggle`                       | 主题切换并写入 `localStorage['dark-mode']`              |

### 6.11 `AppUpdaterAPI`（`app-manager.html`）

供本地 AI / 自动化在页面上下文内直接发布 App 产物，无需手动上传。

| 成员                                                 | 说明                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `publish({ project, fileName, text\|base64\|content\|blob, description?, setMain?, mainFile? })` | 发布单个文件；文件 + `info.json` 一次原子提交；`setMain` 默认 `false`（保持现有主文件）。返回 `bytes` / `commitSha` / `commitUrl` 等 |
| `publishFiles(project, files[], { description?, setMain?, mainFile?, onProgress? })` | 批量发布：多文件 + `info.json` 一次提交，全成功或全失败 |
| `beginUpload(fileName)` / `appendChunk(id, chunk, encoding?)` / `commitUpload(id, project, opts?)` / `abortUpload(id)` | 分块上传，最后一次性提交 |
| `publishInputFiles(project, { input?, setMain?, mainFile? })` | 读取文件输入框（默认 `#apiFileInput`，兼容 `#uploadInput`）并批量发布；结束后清空输入框 |
| `setMainFile(project, fileName)`                    | 只切换下载主文件，不改文件内容                                                     |
| `verify({ project, fileName, expectedBytes?, waitMs? })` | 直链 HEAD（带时间戳绕缓存）+ Pages 构建状态校验                                     |
| `list()`                                           | 只读：一次递归 Git tree 读取项目与文件，再并行读取各项目 `info.json`                        |
| `help()`                                           | 输出使用说明（同时 `console.log`，便于 AI 自行读取）                                  |
| `aiProjectsText()`（内部）                             | 生成【当前已有项目】清单（项目名/简介/主文件/文件数/固定直链），随 `loadProjects` 刷新并写入页面说明；供 AI 判断“已有哪些项目、已有项目该传到哪” |
| `aiPromptText()`（内部）                               | 生成可直接投喂给 AI 的提示词（指向站点根目录 `/AI.md`，并附本次已有项目摘要）；页面「复制提示词给 AI」按钮即用它 |

约定：项目名即文件夹名（白名单校验，禁 `..` 与首尾点）；`fileName` 不得含 `\ / : * ? " < > |`、`..` 或为 `info.json`；单文件本页上限 40MB、GitHub 硬上限 100MB；调用即写仓库生效，与页面“暂存 + 同步”流程相互独立；`info.json` 浅合并保留未知字段。发布/同步/目录识别时，若主文件为安装包类（`PACKAGE_EXT`），同一次原子提交内自动维护 `version.json`（`{version, file}`，版本号从主文件名 `-vX.Y.Z` 解析，解析不到沿用云端已有 `version`，都没有则不生成）；非安装包项目不会生成。
引导要求（页面说明与 [AI-UPLOAD-GUIDE.md](AI-UPLOAD-GUIDE.md) 同源）：**先确认已有项目** —— 已有项目须复用其项目名并上传进对应文件夹，禁止为同一应用另建名字相近的新项目，否则包散落多目录、App 端固定直链失效；文件名建议 `{项目名}-v{版本}.{扩展名}`，以配合主文件的自然排序识别。

---

## 7. 数据模型（data/*.json）

### `data/nav-data.json`

```json
{
  "version": { "web_vol": "BETA 4.6.4", "web_data": "2026.10.15" },
  "index": {
    "tabs": [
      { "name": "Home", "items": [ { "name": "Bilibili", "url": "..." } ] }
    ]
  }
}
```

- `index.tabs[]`：导航分类；`items[]` 为链接条目，字段 `name`/`url`（兼容 `title`）。


### `data/tool-projects.json`

```json
{ "projects": [ { "name", "description", "file", "icon", "addedAt" } ] }
```

- `file` 对应 `index/Tool/<file>` 单页工具，`icon` 为 Font Awesome 类名，`addedAt` 为日期。

### `AppUpdater/<项目名>/info.json`（非 `data/` 目录，由管理页写入）

```json
{ "name": "MyApp", "description": "简介", "mainFile": "MyApp-v1.2.apk",
  "createdAt": "2026-10-15", "updatedAt": "2026-10-15" }
```

- 项目名即文件夹名，字符集限制为字母/数字/下划线/短横线/点/中文。
- `mainFile` 为下载主文件，复制按钮输出的固定直链指向它（默认保持不变；上传时显式 `setMain` 或调用 `setMainFile()` 才切换）。
- 文件夹内其余文件即软件包本体；项目列表由一次递归 Git tree 读取得到，`info.json` 内容逐项目并行读取。
- 该文件由管理页的“目录识别更新”自动补建：直接上传文件夹/文件时无需手工维护元数据。

### `data/version-history.json`

```json
{ "dependencies": {...}, "versions": [ { "name", "date", "changes" } ] }
```

### `data/MM.json`

- 顶部为 base64 密文，内容由 `js/mm-crypto.js` 用密码解密得到站点加密数据（供 `MM-secure.html`/`MM-generator.html` 使用）。

---

## 8. 依赖关系

### 8.1 脚本加载顺序（首页 `index.html`）

```
header-component.js      # 最前，注入 <head> 与全局 helper
search_ajx.js            # 搜索引擎+联想
performance-config.js    # defer
search-component.js      # 生成搜索 DOM
background-component.js  # 背景容器 + 粒子 + 动画 + DarkMode
foot.js / fish.js        # 由 background 组件异步加载（动画依赖）
```

### 8.2 模块互调关系

- `index.html` → 依赖 `header-component`（helper/head）、`search-component`→`search_ajx`、`background-component`→`foot/fish/dark-mode`、`click-tracker`。
- 管理系统页面 → `manager-component`（导航/主题）→ `manager-common` → `github-api-helper` → GitHub。
- MM 相关页 → `mm-crypto`（`MMCrypto`）。
- 工具扫描页 → `tool-scanner-component` → `tool-scanner`（`LanToolScanner`）。

### 8.3 数据依赖

- 导航：`index.html` ← `data/nav-data.json`
- 工具列表：`index/tool.html` ← `data/tool-projects.json`
- App 更新包：`app-manager.html` ← GitHub `AppUpdater/` 目录实时列举 + 各项目 `info.json`
- 版本：`vol-manager` / 首页脚注 ← `data/version-history.json`
- MM 内容：`MM-secure.html` ← `data/MM.json`（需密码）
- 点击统计：`explore-manager.html` ← `localStorage`

### 8.4 运行时副作用

- 静态页面部分脚本用 `document.write` 注入 head（依赖页面静态引入，不能用于 `async`）。
- GitHub token 存于 `localStorage.github_token`，可经管理页“操作日志”面板注入；未配置时 `isConfigured()` 为 false 会抛错。
- 同步写库有 `github_sync_lock_time` 全局冷却锁（`app-manager.html` 为批量提交，不参与此锁）。

---

## 9. 项目运行方式

### 构建

- **无需构建**：纯静态站点，仓库直接可作为 GitHub Pages 站点。

### 本地运行

任选一种静态文件服务：

```bash
# Python
python -m http.server 8080

# Node
npx serve .
# 或 VS Code Live Server
```

> **建议**：`Network Tool` 需访问局域网 `http://192.168.x.x:port`，一律通过局域网内本地 HTTP 服务访问；从公网 `https://` 打开时，浏览器会拦截对局域网 `http://` 的主动探测。

### 部署（GitHub Pages）

- 仓库：`xiaolanqqai/xiaolanqqai.github.io`，分支 `master`，站点根即仓库根。
- 提交后由 GitHub Actions / Pages 自动发布；`CNAME` 提供自定义域名。
- 数据更新以「页面管理系统」提交，走 `github-api-helper` 直接写仓库分支。

### 常用功能入口

| 功能      | 入口                                |
| ------- | --------------------------------- |
| 导航管理    | `index/manager/nav-manager.html`  |
| 工具管理    | `index/manager/tool-manager.html` |
| App 更新管理 | `index/manager/app-manager.html`  |
| Token 注入  | 任意管理页 → 顶部“操作日志”面板 → GitHub Token 注入区 |
| AI 上传接口 | `index/manager/app-manager.html` → `window.AppUpdaterAPI`（现成提示词：[`/AI.md`](../AI.md)，细节：[接口引导](AI-UPLOAD-GUIDE.md)） |
| MM 加密生成 | `index/manager/MM-generator.html` |
| MM 加密浏览 | `index/MM-secure.html`（输入密码）      |
| 局域网扫描   | `index/Tool/Network Tool.html`    |
| 工具跳转页   | `index/tool.html`                 |

---

## 10. 安全设计

1. **XSS 防护**：所有来自 JSON/外部数据拼进 `innerHTML` 前统一走 `window.escapeHtml`。
2. **伪协议阻断**：`window.safeUrl` 仅放行 `http/https`、锚点与站内相对路径，拦截 `javascript:`/`data:`。
3. **凭据不落源码**：GitHub token 不再硬编码/混淆在源码中，改由管理员通过管理页“操作日志”面板的 Token 注入区（或控制台）写入 `localStorage.github_token`，不进 Git 仓库；面板状态仅回显前缀与末 4 位。
4. **敏感页面隔离**：管理页 `noindex` 且不注入流量埋点，避免采集管理态与泄漏会话。
5. **referrer 策略**：`strict-origin-when-cross-origin` 收紧引用来源。
6. **第三方代理下线**：站点名提取改为纯域名推导，不再经 CORS 代理抓取页面，避免 URL 泄露给第三方。

---

*本文档随仓库同步维护。数据/接口变更后请更新对应章节。*
