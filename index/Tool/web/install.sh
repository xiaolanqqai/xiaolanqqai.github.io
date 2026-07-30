#!/bin/sh
# MiniServer Bridge non-interactive installer
set -eu

SOURCE_URL="${MINISERVER_SOURCE_URL:-https://raw.githubusercontent.com/xiaolanqqai/xiaolanqqai.github.io/master/index/Tool/web/bridge.c}"
BINARY_URL="${MINISERVER_BINARY_URL:-https://raw.githubusercontent.com/xiaolanqqai/xiaolanqqai.github.io/master/index/Tool/web/bin/miniserver-bridge-x86_64}"
PREFIX="${MINISERVER_PREFIX:-/usr/local}"
PORT="${MINISERVER_PORT:-8022}"
TOKEN="ssh"
BIN="$PREFIX/bin/miniserver-bridge"
SERVICE="/etc/systemd/system/mini-bridge.service"
WORKDIR="$(mktemp -d /tmp/miniserver-bridge.XXXXXX)"

cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT HUP INT TERM

log() { printf '%s\n' "[MiniServer] $*"; }
fail() { printf '%s\n' "[MiniServer] ERROR: $*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "请使用 root 运行，或在命令末尾使用 | sudo bash"
case "$PORT" in *[!0-9]*|'') fail "MINISERVER_PORT 必须是数字" ;; esac
[ "$PORT" -ge 1 ] && [ "$PORT" -le 65535 ] || fail "端口范围必须是 1-65535"

install_packages() {
  command -v gcc >/dev/null 2>&1 && return
  log "安装 C 编译器"
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -qq
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq gcc libc6-dev ca-certificates curl
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y gcc glibc-devel ca-certificates curl
  elif command -v yum >/dev/null 2>&1; then
    yum install -y gcc glibc-devel ca-certificates curl
  elif command -v apk >/dev/null 2>&1; then
    apk add --no-cache gcc musl-dev ca-certificates curl
  else
    fail "未找到 apt-get/dnf/yum/apk，请先安装 gcc"
  fi
}

download_source() {
  if [ -f "./bridge.c" ]; then
    cp "./bridge.c" "$WORKDIR/bridge.c"
    [ ! -f "./bridge.c.sha256" ] || cp "./bridge.c.sha256" "$WORKDIR/bridge.c.sha256"
  elif command -v curl >/dev/null 2>&1; then
    curl -fsSL "$SOURCE_URL" -o "$WORKDIR/bridge.c"
    curl -fsSL "${SOURCE_URL}.sha256" -o "$WORKDIR/bridge.c.sha256"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO "$WORKDIR/bridge.c" "$SOURCE_URL"
    wget -qO "$WORKDIR/bridge.c.sha256" "${SOURCE_URL}.sha256"
  else
    fail "需要 curl 或 wget 下载 bridge.c"
  fi
  [ -s "$WORKDIR/bridge.c" ] || fail "bridge.c 下载失败"
  if [ -s "$WORKDIR/bridge.c.sha256" ] && command -v sha256sum >/dev/null 2>&1; then
    (cd "$WORKDIR" && sha256sum -c bridge.c.sha256) || fail "bridge.c SHA-256 校验失败"
  else
    fail "缺少 sha256sum 或校验文件，拒绝安装未经校验的源码"
  fi
}

download_file() {
  url="$1"
  output="$2"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$url" -o "$output"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO "$output" "$url"
  else
    fail "需要 curl 或 wget 下载 Bridge"
  fi
}

ARCH="$(uname -m)"
if [ "$ARCH" = "x86_64" ] || [ "$ARCH" = "amd64" ]; then
  log "下载 42 KB 静态 Bridge（服务器无需编译器）"
  if [ -f "./bin/miniserver-bridge-x86_64" ]; then
    cp "./bin/miniserver-bridge-x86_64" "$WORKDIR/miniserver-bridge-x86_64"
    cp "./bin/miniserver-bridge-x86_64.sha256" "$WORKDIR/miniserver-bridge-x86_64.sha256"
  else
    download_file "$BINARY_URL" "$WORKDIR/miniserver-bridge-x86_64"
    download_file "${BINARY_URL}.sha256" "$WORKDIR/miniserver-bridge-x86_64.sha256"
  fi
  command -v sha256sum >/dev/null 2>&1 || fail "缺少 sha256sum"
  (cd "$WORKDIR" && sha256sum -c miniserver-bridge-x86_64.sha256) || fail "Bridge SHA-256 校验失败"
  cp "$WORKDIR/miniserver-bridge-x86_64" "$WORKDIR/miniserver-bridge"
else
  log "架构 $ARCH 暂无预编译文件，回退源码编译"
  install_packages
  download_source
  gcc -std=c11 -O2 -Wall -Wextra -Wpedantic \
    -fstack-protector-strong -D_FORTIFY_SOURCE=2 -fPIE -pie \
    -Wl,-z,relro,-z,now -o "$WORKDIR/miniserver-bridge" "$WORKDIR/bridge.c"
fi
install -d "$PREFIX/bin"
install -m 0755 "$WORKDIR/miniserver-bridge" "$BIN"

if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ]; then
  log "安装 systemd 服务"
  cat >"$SERVICE" <<EOF
[Unit]
Description=MiniServer Panel single-file WebSocket SSH bridge
After=network-online.target ssh.service sshd.service
Wants=network-online.target

[Service]
Type=simple
ExecStart=$BIN $PORT $TOKEN
Restart=on-failure
RestartSec=3
User=root
NoNewPrivileges=true
MemoryMax=16M
TasksMax=16
LimitNOFILE=128

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable --now mini-bridge.service
  systemctl is-active --quiet mini-bridge.service || fail "服务启动失败，请运行 journalctl -u mini-bridge -e"
else
  log "未检测到 systemd；请手动运行: $BIN $PORT $TOKEN"
fi

cat <<EOF

安装完成
  Bridge: ws://你的公网IP:$PORT/$TOKEN
  SSH 目标: 127.0.0.1:22
  状态: systemctl status mini-bridge
  日志: journalctl -u mini-bridge -f
  重启: systemctl restart mini-bridge
  卸载: systemctl disable --now mini-bridge; rm -f "$SERVICE" "$BIN"; systemctl daemon-reload

请在防火墙或 NAT 面板放行/映射 TCP $PORT。
GitHub Pages 中需要为本站允许“不安全内容”后才能连接 ws://。
EOF
