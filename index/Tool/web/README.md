# MiniServer Panel — 极简服务器管理面板

> 跨平台 · 低占用 · 零依赖 · 手机电脑通用

一个面向低配 VPS（≥100MB RAM）的极简远程服务器管理面板。前端为纯静态网页部署在 GitHub Pages，服务器上运行一个单文件 C 程序（<0.5MB RAM），把 WebSocket 流量透传到 `localhost:22`。SSH 协议栈完全运行在浏览器中。

## 核心特性

- **跨平台访问** — 任何现代浏览器（含手机）均可使用，无需安装扩展
- **极低占用** — C bridge 单线程 epoll，内存 < 0.5MB，适配 100MB RAM 服务器
- **零外部依赖** — bridge.c 内联 SHA-1/Base64，静态编译后仅需 glibc
- **SSH 终端** — 基于 xterm.js 的 Web 终端，支持 PTY 与窗口大小自适应
- **仪表盘** — 实时显示 CPU、内存、磁盘、运行时间等系统信息
- **文件管理** — 浏览目录、新建文件夹、重命名、删除文件/目录
- **暗色模式** — 自动跟随系统主题切换

## 快速开始

### 1. 服务器端安装 bridge（一行命令）

```bash
curl -fsSL https://raw.githubusercontent.com/xiaolanqqai/xiaolanqqai.github.io/master/index/Tool/web/install.sh | bash
```

脚本会自动完成：下载源码 → 安装 gcc → 编译 → 启动。运行完成后会输出 Token，请记下。

> 详细说明见引导页（部署后面板侧栏 → 引导）或 [项目简介.md](项目简介.md) 8.1 节。

### 2. 前端部署到 GitHub Pages

1. 将 `web/` 目录内容推送到 GitHub 仓库
2. 仓库 Settings → Pages → 启用 GitHub Pages
3. 访问 `https://<username>.github.io/<repo>/`

### 3. 浏览器使用

打开网页后填写连接表单：

| 字段 | 填写 |
|------|------|
| 服务器地址 | 你的服务器 IP |
| Bridge 端口 | 8022 |
| Token | 第 1 步运行后输出的 Token |
| SSH 主机 | 127.0.0.1 |
| SSH 端口 | 22 |
| 用户名 / 密码 | SSH 登录凭据 |

## 目录结构

```
极简服务器面板/
├── bridge.c                     # C 单文件 WebSocket-TCP 桥接（核心）
├── install.sh                   # 一键安装脚本
├── web/                         # GitHub Pages 静态前端
│   ├── index.html
│   ├── css/style.css
│   ├── js/
│   │   ├── app.js               # 前端应用逻辑
│   │   ├── ssh-bundle.js        # SSH 协议栈 + WsSocket（已打包，运行时使用）
│   │   └── ws-socket.ts         # WsSocket 源码（TypeScript，参考用）
│   └── lib/                     # xterm.js 等库
├── 项目简介.md                   # 完整架构文档
└── 毕业论文初稿.md                # 论文初稿
```

## 技术架构

```
浏览器（手机/电脑）
  ├─ GitHub Pages 静态网页（app.js + ssh-bundle.js）
  ├─ SSH 协议栈（TypeScript，基于 Web Crypto API）
  └─ WsSocket（WebSocket 客户端）
        │
        │ WebSocket (JSON + Base64)
        ↓
服务器（Debian）
  └─ bridge.c（C，epoll 单线程）
        │
        │ TCP（仅允许 localhost）
        ↓
  本机 SSH 服务 :22
```

## 文档

- [项目简介.md](项目简介.md) — 完整架构、模块、API、运行方式说明
- [毕业论文初稿.md](毕业论文初稿.md) — 学术论文初稿

## 技术栈

- **C** — bridge.c（epoll + 内联 SHA-1/Base64）
- **TypeScript** — SSH-2 协议栈（基于 Web Crypto API）
- **JavaScript** — 前端 SPA
- **xterm.js** — 终端模拟
- **GitHub Pages** — 静态部署

## 浏览器兼容性

Chrome / Edge / Firefox / Safari 桌面端与移动端均可使用。

## 许可

MIT
