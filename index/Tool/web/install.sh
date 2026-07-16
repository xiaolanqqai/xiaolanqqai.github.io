#!/bin/bash
# MiniServer Bridge — 一键安装脚本
# 使用方法（在服务器上执行）：
#   curl -fsSL https://raw.githubusercontent.com/你的用户名/你的仓库/main/install.sh | bash
# 或者：
#   wget -O - https://raw.githubusercontent.com/你的用户名/你的仓库/main/install.sh | bash
#
# 也可以先下载再执行：
#   wget -O install.sh https://raw.githubusercontent.com/你的用户名/你的仓库/main/install.sh
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
    # 尝试多个可能的下载源（用户可替换为自己的仓库）
    DOWNLOAD_URLS=(
        "https://raw.githubusercontent.com/你的用户名/你的仓库/main/bridge.c"
        "https://raw.githubusercontent.com/你的用户名/你的仓库/master/bridge.c"
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

# ─── 5. 编译 ───────────────────────────────────────
info "编译 bridge ..."
if gcc -O2 -o bridge bridge.c 2>/dev/null; then
    ok "编译成功"
else
    err "编译失败"
    echo ""
    echo "请检查 bridge.c 是否完整，或手动执行 gcc -O2 -o bridge bridge.c 查看错误信息"
    exit 1
fi

FILE_SIZE=$(du -h bridge | cut -f1)
ok "二进制大小: $FILE_SIZE"

# ─── 6. 启动方式提示 ──────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo -e "${GREEN}  安装成功！${NC}"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Bridge 已编译完成，位于: $(pwd)/bridge"
echo ""
echo "运行方式："
echo ""
echo -e "  ${BLUE}前台运行（首次推荐，查看 Token）：${NC}"
echo "    ./bridge"
echo ""
echo -e "  ${BLUE}自定义端口和 Token：${NC}"
echo "    ./bridge 8022 mySecretToken123"
echo ""
echo -e "  ${BLUE}后台常驻运行：${NC}"
echo "    nohup ./bridge 8022 mySecretToken123 > bridge.log 2>&1 &"
echo ""
echo -e "  ${BLUE}放行防火墙端口：${NC}"
echo "    ufw allow 8022/tcp"
echo "    # 或 iptables -A INPUT -p tcp --dport 8022 -j ACCEPT"
echo ""
echo -e "${YELLOW}请记下运行后控制台输出的 Token，在面板连接时填入。${NC}"
echo ""

# ─── 7. 询问是否立即运行 ──────────────────────────
read -p "是否现在启动 bridge？[Y/n] " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    info "启动 bridge ..."
    exec ./bridge
fi

echo ""
info "稍后运行: ./bridge"
