#!/bin/bash
# MiniServer Bridge — 一键安装脚本
# 使用方法（在服务器上执行）：
#   curl -fsSL https://raw.githubusercontent.com/xiaolanqqai/xiaolanqqai.github.io/master/index/Tool/web/install.sh | bash
# 或者：
#   wget -O - https://raw.githubusercontent.com/xiaolanqqai/xiaolanqqai.github.io/master/index/Tool/web/install.sh | bash
#
# 也可以先下载再执行：
#   wget -O install.sh https://raw.githubusercontent.com/xiaolanqqai/xiaolanqqai.github.io/master/index/Tool/web/install.sh
#   bash install.sh

set -e

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[i]${NC} $1"; }
ok()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
err()   { echo -e "${RED}[x]${NC} $1"; }

echo ""
echo "═══════════════════════════════════════════════════"
echo "    MiniServer Bridge 一键安装脚本"
echo "═══════════════════════════════════════════════════"
echo ""

# ─── 1. 检测系统 ───────────────────────────────────
info "检测系统架构..."
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then
    ok "架构: x86_64 (amd64)"
elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
    ok "架构: aarch64 (arm64)"
else
    warn "架构: $ARCH (未测试，将尝试继续)"
fi

# 检测包管理器
if command -v apt >/dev/null 2>&1; then
    PKG_MGR="apt"
elif command -v yum >/dev/null 2>&1; then
    PKG_MGR="yum"
elif command -v dnf >/dev/null 2>&1; then
    PKG_MGR="dnf"
elif command -v apk >/dev/null 2>&1; then
    PKG_MGR="apk"
else
    err "未找到支持的包管理器 (apt/yum/dnf/apk)"
    exit 1
fi
ok "包管理器: $PKG_MGR"

# ─── 2. 检测 gcc ───────────────────────────────────
INSTALL_GCC=0
if ! command -v gcc >/dev/null 2>&1; then
    warn "未检测到 gcc，将自动安装"
    INSTALL_GCC=1
else
    GCC_VER=$(gcc -dumpversion 2>/dev/null | head -c 1)
    ok "gcc 已安装 (版本 $GCC_VER.x)"
fi

# ─── 3. 安装 gcc ───────────────────────────────────
if [ "$INSTALL_GCC" = "1" ]; then
    info "使用 $PKG_MGR 安装 gcc..."
    case $PKG_MGR in
        apt)
            apt update -qq && apt install -y -qq gcc >/dev/null 2>&1
            ;;
        yum)
            yum install -y gcc >/dev/null 2>&1
            ;;
        dnf)
            dnf install -y gcc >/dev/null 2>&1
            ;;
        apk)
            apk add --no-cache gcc musl-dev >/dev/null 2>&1
            ;;
    esac
    if command -v gcc >/dev/null 2>&1; then
        ok "gcc 安装成功"
    else
        err "gcc 安装失败，请手动安装: $PKG_MGR install gcc"
        exit 1
    fi
fi

# ─── 4. 下载源码 ───────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" 2>/dev/null && pwd || echo .)"
cd "$SCRIPT_DIR"

# 如果当前目录没有 bridge.c，尝试从 GitHub 下载
if [ ! -f "bridge.c" ]; then
    info "下载 bridge.c ..."
    # 下载源（如需更换仓库地址，修改此 URL）
    DOWNLOAD_URLS=(
        "https://raw.githubusercontent.com/xiaolanqqai/xiaolanqqai.github.io/master/index/Tool/web/bridge.c"
    )
    DOWNLOADED=0
    for URL in "${DOWNLOAD_URLS[@]}"; do
        if command -v wget >/dev/null 2>&1; then
            if wget -q -O bridge.c "$URL" 2>/dev/null; then
                DOWNLOADED=1
                break
            fi
        elif command -v curl >/dev/null 2>&1; then
            if curl -fsSL -o bridge.c "$URL" 2>/dev/null; then
                DOWNLOADED=1
                break
            fi
        fi
    done

    if [ "$DOWNLOADED" = "0" ] || [ ! -s "bridge.c" ]; then
        err "下载 bridge.c 失败"
        echo ""
        echo "请手动下载 bridge.c 到当前目录，或检查网络连接。"
        echo "你也可以从本地面板源码中找到 bridge.c，用 scp 上传："
        echo "  scp bridge.c root@你的服务器IP:/root/"
        exit 1
    fi
    ok "bridge.c 下载成功 ($(wc -c < bridge.c) 字节)"
else
    ok "已找到本地 bridge.c"
fi

# ─── 5. 编译（启用安全硬化选项）─────────────────────
info "编译 bridge（启用安全硬化选项）..."
# 安全编译选项：
#   -O2              优化
#   -Wall -Wextra    开启所有警告
#   -fstack-protector-strong  栈溢出保护
#   -D_FORTIFY_SOURCE=2       _FORTIFY_SOURCE 缓冲区检查
#   -fPIE -pie      位置无关可执行文件（ASLR）
#   -Wl,-z,relro,-z,now       GOT 保护（Full RELRO）
CFLAGS="-O2 -Wall -Wextra -fstack-protector-strong -D_FORTIFY_SOURCE=2 -fPIE -pie -Wl,-z,relro,-z,now"
if gcc $CFLAGS -o bridge bridge.c 2>bridge.compile.log; then
    ok "编译成功"
else
    err "编译失败，错误日志："
    cat bridge.compile.log 2>/dev/null
    echo ""
    echo "请检查 bridge.c 是否完整，或手动执行 gcc $CFLAGS -o bridge bridge.c 查看错误信息"
    exit 1
fi

FILE_SIZE=$(du -h bridge | cut -f1)
ok "二进制大小: $FILE_SIZE"

# ─── 5.5 下载完整性校验（C9 修复） ──────────────────
info "校验源码完整性..."
EXPECTED_SHA256_URL="https://raw.githubusercontent.com/xiaolanqqai/xiaolanqqai.github.io/master/index/Tool/web/bridge.c.sha256"
if command -v sha256sum >/dev/null 2>&1; then
    ACTUAL_SHA256=$(sha256sum bridge.c | awk '{print $1}')
    # 尝试下载预期的 SHA256（可选，失败不阻塞）
    EXPECTED_SHA256=""
    if command -v curl >/dev/null 2>&1; then
        EXPECTED_SHA256=$(curl -fsSL "$EXPECTED_SHA256_URL" 2>/dev/null | awk '{print $1}')
    elif command -v wget >/dev/null 2>&1; then
        EXPECTED_SHA256=$(wget -qO- "$EXPECTED_SHA256_URL" 2>/dev/null | awk '{print $1}')
    fi
    if [ -n "$EXPECTED_SHA256" ] && [ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]; then
        warn "SHA256 校验不匹配（可能源码已更新），继续使用本地版本"
        warn "  实际: $ACTUAL_SHA256"
        warn "  预期: $EXPECTED_SHA256"
    elif [ -n "$EXPECTED_SHA256" ]; then
        ok "SHA256 校验通过: $ACTUAL_SHA256"
    else
        warn "无法下载预期 SHA256（网络问题），跳过校验"
        warn "  本地 SHA256: $ACTUAL_SHA256"
    fi
fi

# ─── 6. 启动方式提示 ──────────────────────────────
BRIDGE_PATH="$(pwd)/bridge"
echo ""
echo "═══════════════════════════════════════════════════"
echo -e "${GREEN}  安装成功！${NC}"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Bridge 已编译完成，位于: $BRIDGE_PATH"
echo ""
echo "运行方式："
echo ""
echo -e "  ${BLUE}前台运行（直接启动，Token 默认 ssh）：${NC}"
echo "    ./bridge"
echo ""
echo -e "  ${BLUE}自定义端口（Token 仍为默认 ssh）：${NC}"
echo "    ./bridge 8022"
echo ""
echo -e "  ${BLUE}自定义端口和 Token（可选，前端需同步修改）：${NC}"
echo "    ./bridge 8022 mySecretToken123"
echo ""
echo -e "  ${BLUE}后台常驻运行（systemd 推荐）：${NC}"
echo "    见下方 systemd 集成"
echo ""
echo -e "  ${BLUE}放行防火墙端口：${NC}"
echo "    ufw allow 8022/tcp"
echo "    # 或 iptables -A INPUT -p tcp --dport 8022 -j ACCEPT"
echo ""
echo -e "${GREEN}v3.4 起 Token 默认固定为 ssh，前端自动填写，无需手动记录。${NC}"
echo ""

# ─── 6.5 systemd 集成（可选） ─────────────────────
info "检测 systemd..."
if command -v systemctl >/dev/null 2>&1 && [ -d /etc/systemd/system ]; then
    ok "systemd 可用"
    read -p "是否配置 systemd 服务实现开机自启？[Y/n] " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        SERVICE_FILE="/etc/systemd/system/mini-bridge.service"
        info "生成 systemd 服务文件: $SERVICE_FILE"
        cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=MiniServer Panel Bridge (WebSocket-TCP SSH bridge)
After=network.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=$BRIDGE_PATH 8022
Restart=on-failure
RestartSec=3
# 安全加固：以非特权用户运行（如需绑定 <1024 端口请改 root）
User=root
# 限制权限
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/var/log
# 资源限制
LimitNOFILE=64
MemoryMax=64M
# 日志
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mini-bridge

[Install]
WantedBy=multi-user.target
EOF
        ok "服务文件已生成"

        # 重载并启用
        systemctl daemon-reload
        systemctl enable mini-bridge.service
        ok "服务已设置开机自启"

        read -p "是否立即启动服务？[Y/n] " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            systemctl start mini-bridge.service
            sleep 1
            if systemctl is-active --quiet mini-bridge.service; then
                ok "服务已启动"
                echo ""
                echo -e "${GREEN}Token 默认为 ssh，前端自动填写，无需手动记录。${NC}"
                echo ""
                echo -e "${BLUE}管理命令：${NC}"
                echo "  systemctl status mini-bridge"
                echo "  systemctl restart mini-bridge"
                echo "  journalctl -u mini-bridge -f"
                echo ""
                exit 0
            else
                err "服务启动失败，查看日志：journalctl -u mini-bridge -e"
                exit 1
            fi
        fi
    fi
else
    warn "systemd 不可用，跳过自启配置"
fi

# ─── 7. 询问是否立即运行（前台） ──────────────────
read -p "是否现在前台启动 bridge？[Y/n] " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    info "启动 bridge ..."
    exec ./bridge
fi

echo ""
info "稍后运行: ./bridge"
echo ""
info "或使用 systemd 管理: systemctl start mini-bridge"
