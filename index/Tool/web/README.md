# MiniServer Panel

面向超低内存 Linux VPS 的静态服务器面板。前端部署在 GitHub Pages，服务器只
运行一个 C 单文件 WebSocket ↔ localhost SSH Bridge。

## 首次安装

用现有 SSH 客户端连接公网 SSH 地址（本例为
`ssh -p 43837 root@103.121.93.159`），然后执行：

```bash
curl -fsSL https://raw.githubusercontent.com/xiaolanqqai/xiaolanqqai.github.io/master/index/Tool/web/install.sh | sudo bash
```

脚本在 x86_64 服务器上会下载并校验 42 KB 静态二进制，不安装 GCC；其他架构
才回退源码编译。随后自动安装并启动 systemd，重复执行可安全升级。

常用命令：

```bash
systemctl status mini-bridge
journalctl -u mini-bridge -f
systemctl restart mini-bridge
```

卸载：

```bash
systemctl disable --now mini-bridge
rm -f /etc/systemd/system/mini-bridge.service /usr/local/bin/miniserver-bridge
systemctl daemon-reload
```

## 浏览器连接

1. 在防火墙或服务商 NAT 面板将公网 TCP 端口映射到服务器内部 `8022`。
2. 用桌面 Chrome/Edge 打开 GitHub Pages。
3. 在“网站设置 → 不安全内容”中选择“允许”，刷新页面。
4. 填写服务器 IP、Bridge 公网端口、内部 SSH 端口 `22`、用户名和密码。

默认连接为 `ws://103.121.93.159:8022/ssh`。公网 SSH 端口 `43837` 只用于
首次安装；Bridge 位于服务器内部，因此连接 sshd 时使用 `127.0.0.1:22`。

服务器连接信息（包括 SSH 密码）会使用 AES-256-GCM 整体加密后写入
`localStorage`，不可导出的设备密钥保存在 IndexedDB。部署状态位于
`~/.miniserver-panel/state.json`，历史位于 `history.jsonl`。

## 服务器与 Web 服务管理

- 点击页面右上角的服务器图标，可在右侧栏连接、检测、编辑或删除服务器。
- 服务器地址、端口、用户名和 SSH 密码均可加密保存；编辑或删除会同步更新密文。
- “部署”页面支持静态网站、Node.js、Python 和自定义启动命令。
- 每个服务会生成独立的 `miniserver-*.service` systemd 单元，支持开机启动和
  失败重启；从面板移除时会同步停止并删除对应单元。
- Node.js/Python 缺失时可选择自动安装。100 MB 内存服务器建议优先使用静态
  网站或已安装的运行环境，避免在业务高峰执行包管理器。

## 限制

- 普通 GitHub Pages 无法直接连接 SSH TCP，空服务器必须先执行一次安装命令。
- HTTPS 页面默认阻止 `ws://`，因此仅支持完成站点权限设置的桌面 Chromium。
- 固定路径 `/ssh` 不属于强认证；公网安全性依赖 SSH 认证、主机密钥校验以及
  Bridge 的 Origin、localhost 和资源限制。
