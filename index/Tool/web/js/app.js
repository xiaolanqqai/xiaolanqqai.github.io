/* ============================================================
   MiniServer Panel — app.js v3.0
   GitHub Pages + single-file WS Bridge 模式
   ============================================================ */

// ─────────────────────────────────────────────────────────────
// 0. State
// ─────────────────────────────────────────────────────────────

let transport = null      // MiniServerSSH.SSHTransport 实例
let shell = null          // SSH Shell 实例
let isConnected = false
let currentView = 'dashboard'
let currentPath = '/'
let term = null
let fitAddon = null
let termCreated = false
let dashboardInterval = null
let connInfo = { host: '', port: 22, user: '' }

// ─────────────────────────────────────────────────────────────
// 1. Log Panel
// ─────────────────────────────────────────────────────────────

const logBody = document.getElementById('log-body')

function addLog(msg, level = '') {
  const el = document.createElement('div')
  el.className = 'log-entry' + (level ? ` log-${level}` : '')
  const t = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  el.innerHTML = `<span class="log-time">${t}</span>${escapeHtml(msg)}`
  logBody.appendChild(el)
  logBody.scrollTop = logBody.scrollHeight
}

function escapeHtml(s) {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

// ─────────────────────────────────────────────────────────────
// 2. Toast
// ─────────────────────────────────────────────────────────────

function toast(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container')
  const el = document.createElement('div')
  el.className = `toast ${type}`
  el.textContent = msg
  container.appendChild(el)
  setTimeout(() => {
    el.classList.add('toast-out')
    el.addEventListener('animationend', () => el.remove())
  }, duration)
}

// ─────────────────────────────────────────────────────────────
// 3. Modal
// ─────────────────────────────────────────────────────────────

function showModal(id) {
  document.getElementById(id).style.display = 'flex'
}

function hideModal(id) {
  document.getElementById(id).style.display = 'none'
}

// ─────────────────────────────────────────────────────────────
// 4. Navigation
// ─────────────────────────────────────────────────────────────

function navigate(viewName) {
  document.querySelectorAll('[data-view]').forEach(s => s.classList.remove('active'))
  const target = document.querySelector(`[data-view="${viewName}"]`)
  if (target) target.classList.add('active')
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'))
  const navItem = document.querySelector(`.nav-item[data-nav="${viewName}"]`)
  if (navItem) navItem.classList.add('active')
  const prev = currentView
  currentView = viewName
  onViewActivated(viewName, prev)
  onViewDeactivated(prev, viewName)
}

function onViewActivated(view, prev) {
  if (view === 'dashboard') startDashboardRefresh()
  if (view === 'guide') initGuide()
  if (view === 'terminal') initTerminal()
  if (view === 'files') listFiles(currentPath)
  if (view === 'deploy') loadSites()
  if (view === 'settings') updateSettingsView()
}

function onViewDeactivated(prev, view) {
  if (prev === 'dashboard') stopDashboardRefresh()
}

// ─────────────────────────────────────────────────────────────
// 5. Connection Management
// ─────────────────────────────────────────────────────────────

/**
 * 连接到服务器
 * @param host       Bridge 域名或服务器地址
 * @param bridgePort WSS/WS 端口
 * @param bridgeProtocol ws 或 wss
 * @param sshPort    Bridge 在本机连接的 SSH 端口
 * @param user       SSH 用户名
 * @param pass       SSH 密码
 */
async function connectServer(host, bridgePort, bridgeProtocol, sshPort, user, pass) {
  if (transport) {
    try { transport.disconnect() } catch {}
  }

  const wsProtocol = bridgeProtocol === 'wss' ? 'wss:' : 'ws:'
  const bridgeUrl = `${wsProtocol}//${host}:${bridgePort}/ssh`
  addLog(`通过 ${bridgeUrl} 连接 ${user}@127.0.0.1:${sshPort}...`)
  const socket = new MiniServerSSH.WsSocket(bridgeUrl)
  transport = new MiniServerSSH.SSHTransport(socket)

  socket.onClose(() => {
    if (isConnected) {
      addLog('连接已断开', 'warning')
      isConnected = false
      shell = null
      transport = null
      onDisconnected()
      toast('连接已断开', 'warning', 4000)
    }
  })

  try {
    await transport.connect('127.0.0.1', sshPort, user, pass)
    addLog('SSH 握手成功', 'success')
    addLog('打开 Shell...')
    shell = await transport.openShell(80, 24)
    shell.onData(data => {
      if (term) term.write(data)
    })
    isConnected = true
    connInfo = { host, port: sshPort, user }
    onConnected()
    addLog('Shell 已就绪', 'success')
  } catch (err) {
    addLog(`连接失败: ${err.message}`, 'error')
    // 连接失败时彻底清理残留状态（H4）
    isConnected = false
    shell = null
    transport = null
    const isBridgeError = /桥接|WebSocket|连接超时|连接失败|Socket/i.test(err.message)
    if (isBridgeError) {
      showBridgeError(err.message)
    } else {
      toast(err.message, 'error', 5000)
    }
    onDisconnected()
  }
}

function classifyConnectionError(message = '') {
  if (location.protocol === 'https:' && /WebSocket|Socket|连接|桥接/i.test(message)) {
    return '浏览器可能阻止了 ws:// 混合内容。请在 Chromium 的“网站设置 → 不安全内容”中选择“允许”，刷新后重试。'
  }
  if (/host key|主机密钥|fingerprint/i.test(message)) {
    return 'SSH 主机密钥发生变化。请先核对服务器指纹，确认不是中间人攻击后再更新已保存的主机密钥。'
  }
  if (/auth|password|认证|密码|permission denied/i.test(message)) {
    return 'SSH 认证失败，请检查用户名、密码以及服务器是否允许密码登录。'
  }
  if (/403|Forbidden|Origin|Token/i.test(message)) {
    return 'Bridge 拒绝了请求，请确认页面来源和固定 Token 配置。'
  }
  return '请确认 Bridge 已安装并运行、公网 Bridge 端口已放行或完成 NAT 映射、服务器 sshd 正常。'
}

function disconnectServer() {
  if (shell) { try { shell.close() } catch {} shell = null }
  if (transport) { try { transport.disconnect() } catch {} transport = null }
  onDisconnected()
}

function onConnected() {
  isConnected = true
  updateConnectionUI()
  toast('已连接到服务器', 'success')
  if (currentView === 'terminal' && term) {
    term.clear()
  }
}

function onDisconnected() {
  isConnected = false
  updateConnectionUI()
}

function updateConnectionUI() {
  const dot = document.getElementById('status-dot')
  const serverName = document.getElementById('server-name')
  const btnConnect = document.getElementById('btn-connect')
  const btnDisconnect = document.getElementById('btn-disconnect')

  if (isConnected) {
    dot.classList.add('connected')
    serverName.textContent = `${connInfo.user}@${connInfo.host}`
    btnConnect.style.display = 'none'
    btnDisconnect.style.display = 'flex'
  } else {
    dot.classList.remove('connected')
    serverName.textContent = '未连接'
    btnConnect.style.display = 'flex'
    btnDisconnect.style.display = 'none'
  }
}

// ─────────────────────────────────────────────────────────────
// 6. Exec
// ─────────────────────────────────────────────────────────────

async function execCommand(cmd) {
  if (!isConnected || !transport) return { stdout: '', stderr: '', exitCode: -1 }
  return transport.execCommand(cmd)
}

// ─────────────────────────────────────────────────────────────
// 7. Terminal
// ─────────────────────────────────────────────────────────────

function initTerminal() {
  if (termCreated) {
    setTimeout(() => {
      try { fitAddon?.fit() } catch {}
    }, 50)
    return
  }

  const container = document.getElementById('term-container')
  if (!container) return

  const TermClass = window.Terminal
  if (!TermClass) {
    toast('xterm.js 未加载，请检查网络', 'error')
    return
  }

  term = new TermClass({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: "'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace",
    theme: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      cursor: '#aeafad',
      selectionBackground: '#264f78',
      black: '#000000',
      red: '#cd3131',
      green: '#0dbc79',
      yellow: '#e5e510',
      blue: '#2472c8',
      magenta: '#bc3fbc',
      cyan: '#11a8cd',
      white: '#e5e5e5',
      brightBlack: '#666666',
      brightRed: '#f14c4c',
      brightGreen: '#23d18b',
      brightYellow: '#f5f543',
      brightBlue: '#3b8eea',
      brightMagenta: '#d670d6',
      brightCyan: '#29b8db',
      brightWhite: '#ffffff'
    }
  })

  try {
    if (window.FitAddon?.FitAddon) {
      fitAddon = new window.FitAddon.FitAddon()
    } else if (window.FitAddon) {
      fitAddon = new window.FitAddon()
    } else {
      toast('FitAddon 未加载', 'warning')
    }
  } catch {
    toast('FitAddon 初始化失败', 'warning')
  }

  if (fitAddon) {
    term.loadAddon(fitAddon)
  }

  term.open(container)

  setTimeout(() => {
    try { fitAddon?.fit() } catch {}
  }, 100)

  term.onData((data) => {
    if (shell && isConnected) {
      shell.write(data)
    }
  })

  const resizeObserver = new ResizeObserver(() => {
    try {
      fitAddon?.fit()
      if (shell && isConnected && term) {
        shell.resize(term.cols, term.rows)
      }
    } catch {}
  })
  resizeObserver.observe(container)

  termCreated = true
}

function resetTerminal() {
  if (term) {
    term.clear()
    term.focus()
  }
  if (shell && isConnected) {
    shell.write('\x0c')
  }
}

// ─────────────────────────────────────────────────────────────
// 8. Dashboard
// ─────────────────────────────────────────────────────────────

function startDashboardRefresh() {
  refreshDashboard()
  stopDashboardRefresh()
  dashboardInterval = setInterval(refreshDashboard, 30000)
}

function stopDashboardRefresh() {
  if (dashboardInterval) {
    clearInterval(dashboardInterval)
    dashboardInterval = null
  }
}

async function refreshDashboard() {
  if (!isConnected) return

  try {
    const [sysinfo, uptime, free, df] = await Promise.all([
      execCommand('uname -a'),
      execCommand('uptime -p'),
      execCommand('free -m'),
      execCommand('df -h /')
    ])

    await measureCpu()

    parseSysinfo(sysinfo.stdout)
    parseUptime(uptime.stdout)
    parseMemory(free.stdout)
    parseDisk(df.stdout)
  } catch (err) {
    addLog(`仪表盘刷新失败: ${err.message}`, 'error')
  }
}

async function execAsync(cmd) {
  try {
    const result = await execCommand(cmd)
    return result.stdout || ''
  } catch {
    return ''
  }
}

async function measureCpu() {
  const stat1 = await execAsync('cat /proc/stat')
  await new Promise(r => setTimeout(r, 1000))
  const stat2 = await execAsync('cat /proc/stat')
  parseCpu(stat1, stat2)
}

function parseCpu(stat1, stat2) {
  const extract = (s) => {
    const match = s?.match(/^cpu\s+([\d\s]+)/m)
    if (!match) return { idle: 0, total: 0 }
    const parts = match[1].trim().split(/\s+/).map(Number)
    const idle = parts[3]
    const total = parts.reduce((a, b) => a + b, 0)
    return { idle, total }
  }

  const s1 = extract(stat1)
  const s2 = extract(stat2)

  const idleDiff = s2.idle - s1.idle
  const totalDiff = s2.total - s1.total

  if (totalDiff === 0) return

  const usage = ((1 - idleDiff / totalDiff) * 100)
  const pct = Math.round(usage)

  document.getElementById('stat-cpu').textContent = `${pct}%`
  const bar = document.getElementById('bar-cpu')
  bar.style.width = `${Math.min(pct, 100)}%`
  bar.className = 'stat-bar-fill' + (pct > 80 ? ' danger' : pct > 50 ? ' warning' : '')
}

function parseSysinfo(output) {
  const el = document.getElementById('stat-sysinfo')
  if (output) {
    el.textContent = output.trim()
  }
}

function parseUptime(output) {
  const el = document.getElementById('stat-uptime')
  if (output) {
    el.textContent = output.replace(/^up\s+/i, '').trim()
  }
}

function parseMemory(output) {
  const el = document.getElementById('stat-mem')
  const bar = document.getElementById('bar-mem')

  const memMatch = output?.match(/Mem:\s+(\d+)\s+(\d+)\s+(\d+)/)
  if (memMatch) {
    const total = parseInt(memMatch[1])
    const used = parseInt(memMatch[2])
    const pct = Math.round((used / total) * 100)
    el.textContent = `${used} / ${total} MB`
    bar.style.width = `${Math.min(pct, 100)}%`
    bar.className = 'stat-bar-fill' + (pct > 85 ? ' danger' : pct > 60 ? ' warning' : '')
  }
}

function parseDisk(output) {
  const el = document.getElementById('stat-disk')
  const bar = document.getElementById('bar-disk')

  const lines = output?.trim().split('\n')
  if (lines && lines.length >= 2) {
    const parts = lines[1].trim().split(/\s+/)
    if (parts.length >= 5) {
      const usePct = parseInt(parts[4])
      el.textContent = `${parts[2]} / ${parts[1]} (${parts[4]})`
      bar.style.width = `${Math.min(usePct, 100)}%`
      bar.className = 'stat-bar-fill' + (usePct > 85 ? ' danger' : usePct > 60 ? ' warning' : '')
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 9. Files
// ─────────────────────────────────────────────────────────────

async function listFiles(path) {
  if (!isConnected) {
    document.getElementById('files-tbody').innerHTML =
      '<tr><td colspan="5" class="files-empty">请先连接服务器</td></tr>'
    return
  }

  currentPath = path || '/'
  updateBreadcrumb()

  const safePath = path.replace(/'/g, "'\\''")
  try {
    const result = await execCommand(`ls -la --time-style=long-iso '${safePath}'`)
    if (result.stderr && !result.stdout) {
      document.getElementById('files-tbody').innerHTML =
        `<tr><td colspan="5" class="files-empty">无法读取目录: ${escapeHtml(result.stderr.trim())}</td></tr>`
      return
    }
    renderFileTable(result.stdout, path)
  } catch (err) {
    document.getElementById('files-tbody').innerHTML =
      `<tr><td colspan="5" class="files-empty">读取目录出错: ${escapeHtml(err.message)}</td></tr>`
  }
}

function renderFileTable(output, basePath) {
  const tbody = document.getElementById('files-tbody')
  const lines = output?.trim().split('\n') || []

  if (lines.length <= 1) {
    tbody.innerHTML = '<tr><td colspan="5" class="files-empty">目录为空</td></tr>'
    return
  }

  let html = ''

  if (basePath && basePath !== '/') {
    const parent = basePath.split('/').slice(0, -1).join('/') || '/'
    html += `<tr>
      <td colspan="5">
        <span class="file-name" data-action="navigate" data-path="${escapeAttr(parent)}">
          <span class="file-icon">📂</span> ..
        </span>
      </td>
    </tr>`
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const match = line.match(/^([-dlcbps])([-rwxsStT]{9})\s+(\d+)\s+(\S+)\s+(\S+)\s+(\d+)\s+(\S+\s+\S+)\s+(.+)/)
    if (!match) continue

    const type = match[1]
    const perm = match[2]
    const size = match[6]
    const date = match[7]
    const name = match[8]

    const isDir = type === 'd'
    const icon = isDir ? '📁' : '📄'
    const sizeDisplay = isDir ? '-' : formatFileSize(parseInt(size))

    const dblData = isDir
      ? `data-action="navigate" data-path="${escapeAttr(basePath === '/' ? '/' + name : basePath + '/' + name)}"`
      : ''

    const actions = isDir
      ? `<button class="file-action-btn delete" data-action="delete-dir" data-name="${escapeAttr(name)}">删除</button>`
      : `<button class="file-action-btn" data-action="rename" data-name="${escapeAttr(name)}">重命名</button>
         <button class="file-action-btn delete" data-action="delete-file" data-name="${escapeAttr(name)}">删除</button>`

    html += `<tr>
      <td><span class="file-name" ${dblData}><span class="file-icon">${icon}</span>${escapeHtml(name)}</span></td>
      <td>${sizeDisplay}</td>
      <td>${perm}</td>
      <td>${date}</td>
      <td>${actions}</td>
    </tr>`
  }

  tbody.innerHTML = html
}

function formatFileSize(bytes) {
  if (isNaN(bytes) || bytes < 0) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' K'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' M'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' G'
}

function updateBreadcrumb() {
  const container = document.getElementById('files-breadcrumb')
  const parts = currentPath.split('/').filter(Boolean)

  let html = `<a class="breadcrumb-item" data-action="breadcrumb" data-path="/">/</a>`

  let accumulated = ''
  for (const part of parts) {
    accumulated += '/' + part
    html += `<span class="breadcrumb-sep">/</span>`
    html += `<a class="breadcrumb-item" data-action="breadcrumb" data-path="${escapeAttr(accumulated)}">${escapeHtml(part)}</a>`
  }

  container.innerHTML = html
}

async function mkdir(dirname) {
  if (!dirname || !isConnected) return
  const safePath = currentPath.replace(/'/g, "'\\''")
  const safeName = dirname.replace(/'/g, "'\\''")
  try {
    const result = await execCommand(`mkdir -p '${safePath}/${safeName}'`)
    if (result.stderr && !result.stdout) {
      toast(`创建失败: ${result.stderr.trim()}`, 'error')
    } else {
      toast('文件夹已创建', 'success')
      listFiles(currentPath)
    }
  } catch (err) {
    toast(`创建失败: ${err.message}`, 'error')
  }
}

async function deletePath(name, isDir) {
  if (!isConnected) return
  // 删除前必须二次确认，目录将执行 rm -rf 风险极高（H3 修复）
  const confirmMsg = isDir
    ? `确定删除文件夹 "${name}" 及其所有内容？此操作不可恢复！`
    : `确定删除文件 "${name}"？此操作不可恢复！`
  if (!confirm(confirmMsg)) return
  const safePath = currentPath.replace(/'/g, "'\\''")
  const safeName = name.replace(/'/g, "'\\''")
  const cmd = isDir
    ? `rm -rf '${safePath}/${safeName}'`
    : `rm -f '${safePath}/${safeName}'`
  try {
    const result = await execCommand(cmd)
    if (result.stderr && !result.stdout) {
      toast(`删除失败: ${result.stderr.trim()}`, 'error')
    } else {
      toast(`已删除 ${name}`, 'success')
      listFiles(currentPath)
    }
  } catch (err) {
    toast(`删除失败: ${err.message}`, 'error')
  }
}

async function renameFile(oldName) {
  const newName = prompt(`重命名 "${oldName}" 为:`, oldName)
  if (!newName || newName === oldName) return
  if (!isConnected) return

  const safePath = currentPath.replace(/'/g, "'\\''")
  const safeOld = oldName.replace(/'/g, "'\\''")
  const safeNew = newName.replace(/'/g, "'\\''")
  try {
    const result = await execCommand(`mv '${safePath}/${safeOld}' '${safePath}/${safeNew}'`)
    if (result.stderr && !result.stdout) {
      toast(`重命名失败: ${result.stderr.trim()}`, 'error')
    } else {
      toast('已重命名', 'success')
      listFiles(currentPath)
    }
  } catch (err) {
    toast(`重命名失败: ${err.message}`, 'error')
  }
}

// ─────────────────────────────────────────────────────────────
// 10. Deploy
// ─────────────────────────────────────────────────────────────

const PANEL_STATE_DIR = '$HOME/.miniserver-panel'

function toBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

async function writePanelState(state, historyEvent) {
  const stateData = toBase64Utf8(JSON.stringify(state, null, 2))
  const historyData = historyEvent ? toBase64Utf8(JSON.stringify(historyEvent)) : ''
  const historyCommand = historyData
    ? `printf '%s' '${historyData}' | base64 -d >> "${PANEL_STATE_DIR}/history.jsonl" && printf '\\n' >> "${PANEL_STATE_DIR}/history.jsonl"`
    : ':'
  return execCommand(
    `umask 077 && mkdir -p "${PANEL_STATE_DIR}" && ` +
    `tmp=$(mktemp "${PANEL_STATE_DIR}/state.XXXXXX") && ` +
    `printf '%s' '${stateData}' | base64 -d > "$tmp" && ` +
    `mv -f "$tmp" "${PANEL_STATE_DIR}/state.json" && ${historyCommand}`
  )
}

async function appendPanelHistory(event) {
  const data = toBase64Utf8(JSON.stringify(event))
  return execCommand(
    `umask 077 && mkdir -p "${PANEL_STATE_DIR}" && ` +
    `printf '%s' '${data}' | base64 -d >> "${PANEL_STATE_DIR}/history.jsonl" && printf '\\n' >> "${PANEL_STATE_DIR}/history.jsonl"`
  )
}

function shellSingleQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`
}

function runtimeInstallScript(runtime) {
  const pkg = runtime === 'node' ? 'nodejs' : 'python3'
  return `if ! command -v ${runtime === 'node' ? 'node' : 'python3'} >/dev/null 2>&1; then
  if [ "$INSTALL_RUNTIME" != "1" ]; then echo "缺少 ${pkg}，请勾选自动安装或手动安装" >&2; exit 12; fi
  if command -v apt-get >/dev/null 2>&1; then DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ${pkg};
  elif command -v apk >/dev/null 2>&1; then apk add --no-cache ${pkg};
  elif command -v dnf >/dev/null 2>&1; then dnf install -y ${pkg};
  elif command -v yum >/dev/null 2>&1; then yum install -y ${pkg};
  else echo "不支持的包管理器" >&2; exit 13; fi
fi`
}

function buildWebServiceScript(config) {
  const { siteName, targetPath, portNum, serviceType, startCommand, installRuntime } = config
  const serviceId = siteName.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
  const unitName = `miniserver-${serviceId}.service`
  let runtimeCheck = ''
  let starter = ''
  let bootstrap = ''

  if (serviceType === 'static') {
    runtimeCheck = runtimeInstallScript('python3')
    const page = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>${escapeHtml(siteName)}</title><h1>${escapeHtml(siteName)}</h1><p>MiniServer Panel 部署成功</p>`
    bootstrap = `[ -f "$TARGET/index.html" ] || printf '%s' ${shellSingleQuote(toBase64Utf8(page))} | base64 -d > "$TARGET/index.html"`
    starter = `exec python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$TARGET"`
  } else if (serviceType === 'node') {
    runtimeCheck = runtimeInstallScript('node')
    const nodeApp = `const http=require('http');const port=Number(process.env.PORT||${portNum});http.createServer((req,res)=>{res.setHeader('content-type','text/plain; charset=utf-8');res.end('${siteName.replace(/'/g, "\\'")} running\\n')}).listen(port,'0.0.0.0');`
    bootstrap = `[ -f "$TARGET/server.js" ] || printf '%s' ${shellSingleQuote(toBase64Utf8(nodeApp))} | base64 -d > "$TARGET/server.js"`
    starter = `export PORT="$PORT"\nexec node "$TARGET/server.js"`
  } else if (serviceType === 'python') {
    runtimeCheck = runtimeInstallScript('python3')
    const pyApp = `import os\nfrom http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler\nos.chdir(${JSON.stringify(targetPath)})\nThreadingHTTPServer(('0.0.0.0',int(os.environ.get('PORT','${portNum}'))),SimpleHTTPRequestHandler).serve_forever()\n`
    bootstrap = `[ -f "$TARGET/app.py" ] || printf '%s' ${shellSingleQuote(toBase64Utf8(pyApp))} | base64 -d > "$TARGET/app.py"`
    starter = `export PORT="$PORT"\nexec python3 "$TARGET/app.py"`
  } else {
    starter = `exec ${startCommand}`
  }

  const runner = `#!/bin/sh\nset -eu\ncd ${shellSingleQuote(targetPath)}\n${starter}\n`
  const unit = `[Unit]
Description=MiniServer Web Service ${siteName}
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/bin/sh ${targetPath}/.miniserver-run.sh
Restart=on-failure
RestartSec=3
MemoryMax=80M
TasksMax=64

[Install]
WantedBy=multi-user.target
`
  return `set -eu
TARGET=${shellSingleQuote(targetPath)}
PORT=${shellSingleQuote(portNum)}
INSTALL_RUNTIME=${installRuntime ? '1' : '0'}
mkdir -p "$TARGET"
${runtimeCheck}
${bootstrap}
printf '%s' ${shellSingleQuote(toBase64Utf8(runner))} | base64 -d > "$TARGET/.miniserver-run.sh"
chmod 700 "$TARGET/.miniserver-run.sh"
printf '%s' ${shellSingleQuote(toBase64Utf8(unit))} | base64 -d > "/etc/systemd/system/${unitName}"
systemctl daemon-reload
systemctl enable --now "${unitName}"
systemctl restart "${unitName}"
sleep 1
systemctl is-active --quiet "${unitName}"
`
}

async function createSite(siteName, targetPath, portNum, serviceType, startCommand, installRuntime) {
  if (!isConnected) {
    toast('未连接到服务器', 'warning')
    return
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,47}$/.test(siteName)) {
    toast('站点名称只能包含字母、数字、横线和下划线', 'warning')
    return
  }
  if (!/^\/[A-Za-z0-9_./-]+$/.test(targetPath) || targetPath.includes('..')) {
    toast('目标路径必须是安全的绝对路径', 'warning')
    return
  }
  if (serviceType === 'custom' && (!startCommand || /[\r\n]/.test(startCommand))) {
    toast('请填写单行启动命令', 'warning')
    return
  }

  try {
    const stateResult = await execCommand(`if [ -f "${PANEL_STATE_DIR}/state.json" ]; then cat "${PANEL_STATE_DIR}/state.json"; else echo '{"version":1,"sites":[]}'; fi`)
    const state = JSON.parse(stateResult.stdout || '{"version":1,"sites":[]}')
    const script = buildWebServiceScript({ siteName, targetPath, portNum, serviceType, startCommand, installRuntime })
    const result = await execCommand(`printf '%s' '${toBase64Utf8(script)}' | base64 -d | sh`)
    if (result.exitCode && result.exitCode !== 0) throw new Error(result.stderr || `安装退出码 ${result.exitCode}`)

      if (!state.sites) state.sites = []
      state.sites = state.sites.filter(site => site.name !== siteName)
      state.sites.push({
        name: siteName,
        path: targetPath,
        port: portNum,
        type: serviceType,
        service: `miniserver-${siteName.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`,
        createdAt: new Date().toISOString()
      })

      state.version = 1
      await writePanelState(state, {
        time: new Date().toISOString(),
        action: 'deploy',
        site: siteName,
        path: targetPath,
        port: portNum,
        type: serviceType,
        status: 'success'
      })
      toast(`Web 服务 "${siteName}" 已安装并启动`, 'success')
      loadSites()
  } catch (err) {
    try {
      await appendPanelHistory({
        time: new Date().toISOString(),
        action: 'deploy',
        site: siteName,
        path: targetPath,
        port: portNum,
        type: serviceType,
        status: 'error',
        error: String(err.message || err).slice(0, 300)
      })
    } catch {}
    toast(`安装失败: ${err.message}`, 'error', 6000)
  }
}

async function loadSites() {
  if (!isConnected) {
    document.getElementById('deploy-site-list').innerHTML = '<div class="empty-state">请先连接服务器</div>'
    return
  }

  try {
    const result = await execCommand(`if [ -f "${PANEL_STATE_DIR}/state.json" ]; then cat "${PANEL_STATE_DIR}/state.json"; else echo '{"version":1,"sites":[]}'; fi`)
    const container = document.getElementById('deploy-site-list')

    try {
      const state = JSON.parse(result.stdout)
      const sites = state.sites || []

      if (sites.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无站点</div>'
        return
      }

      container.innerHTML = sites.map(site => `
        <div class="deploy-site-item">
          <div class="deploy-site-info">
            <div class="deploy-site-name">${escapeHtml(site.name)}</div>
            <div class="deploy-site-path">${escapeHtml(site.path)}</div>
            <div class="deploy-site-port">${escapeHtml(site.type || 'static')} · 端口 ${escapeHtml(String(site.port))}</div>
          </div>
          <button class="btn-danger btn-sm" data-action="remove-site" data-name="${escapeAttr(site.name)}">移除</button>
        </div>
      `).join('')
    } catch {
      container.innerHTML = '<div class="empty-state">state.json 格式损坏，原文件已保留，请通过终端检查</div>'
      toast('服务器状态文件格式损坏，未覆盖原文件', 'error', 5000)
    }
  } catch (err) {
    document.getElementById('deploy-site-list').innerHTML = '<div class="empty-state">加载站点失败</div>'
  }
}

async function removeSite(siteName) {
  if (!isConnected) return

  try {
    const result = await execCommand(`cat "${PANEL_STATE_DIR}/state.json"`)
    try {
      const state = JSON.parse(result.stdout)
      const site = (state.sites || []).find(s => s.name === siteName)
      if (site?.service) {
        const service = String(site.service).replace(/\.service$/, '')
        if (!/^miniserver-[a-z0-9_-]+$/.test(service)) throw new Error('服务名称不安全')
        await execCommand(`systemctl disable --now "${service}.service" >/dev/null 2>&1 || true; rm -f "/etc/systemd/system/${service}.service"; systemctl daemon-reload`)
      }
      state.sites = (state.sites || []).filter(s => s.name !== siteName)
      await writePanelState(state, {
        time: new Date().toISOString(),
        action: 'remove',
        site: siteName,
        status: 'success'
      })
      toast(`站点 "${siteName}" 已移除`, 'success')
      loadSites()
    } catch {
      toast('操作失败', 'error')
    }
  } catch (err) {
    toast('操作失败', 'error')
  }
}

// ─────────────────────────────────────────────────────────────
// 11. Settings
// ─────────────────────────────────────────────────────────────

function updateSettingsView() {
  document.getElementById('settings-status').textContent = isConnected ? '已连接' : '未连接'
  document.getElementById('settings-host').textContent = connInfo.host || '--'
  document.getElementById('settings-user').textContent = connInfo.user || '--'
  document.getElementById('settings-port').textContent = connInfo.port || '--'
  loadServerList()
}

// ─────────────────────────────────────────────────────────────
// 12. Server List (localStorage)
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'ms-servers-encrypted'
const LEGACY_STORAGE_KEY = 'ms-servers'
const STORAGE_DB = 'miniserver-secure-storage'
const STORAGE_DB_STORE = 'keys'
const STORAGE_CRYPTO_KEY_ID = 'servers-aes-gcm'

function bytesToBase64(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBytes(value) {
  const binary = atob(value)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

function openStorageDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(STORAGE_DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORAGE_DB_STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getStorageCryptoKey() {
  const db = await openStorageDatabase()
  const existing = await new Promise((resolve, reject) => {
    const request = db.transaction(STORAGE_DB_STORE).objectStore(STORAGE_DB_STORE).get(STORAGE_CRYPTO_KEY_ID)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  if (existing) {
    db.close()
    return existing
  }

  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORAGE_DB_STORE, 'readwrite')
    transaction.objectStore(STORAGE_DB_STORE).put(key, STORAGE_CRYPTO_KEY_ID)
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error)
  })
  db.close()
  return key
}

async function setServers(servers) {
  const key = await getStorageCryptoKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = new TextEncoder().encode(JSON.stringify(servers))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: 1,
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(ciphertext))
  }))
}

async function getServers() {
  const encrypted = localStorage.getItem(STORAGE_KEY)
  if (encrypted) {
    try {
      const payload = JSON.parse(encrypted)
      const key = await getStorageCryptoKey()
      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: base64ToBytes(payload.iv) },
        key,
        base64ToBytes(payload.data)
      )
      const servers = JSON.parse(new TextDecoder().decode(plaintext))
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      return Array.isArray(servers) ? servers : []
    } catch (err) {
      addLog(`服务器配置解密失败: ${err.message}`, 'error')
      return []
    }
  }

  // 将旧版明文记录迁移为 AES-GCM 密文，迁移成功后删除旧键。
  try {
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY)
    const legacy = JSON.parse(legacyRaw || '[]')
    if (Array.isArray(legacy) && legacy.length) {
      await setServers(legacy)
    }
    if (legacyRaw !== null) localStorage.removeItem(LEGACY_STORAGE_KEY)
    if (Array.isArray(legacy) && legacy.length) return legacy
  } catch {}
  return []
}

async function loadServerList() {
  const servers = await getServers()
  renderServerList(servers)
}

function renderServerList(servers) {
  const container = document.getElementById('server-list')

  if (!servers.length) {
    container.innerHTML = '<div class="empty-state">暂无保存的服务器</div>'
    return
  }

  container.innerHTML = servers.map((s, i) => `
    <div class="server-item" data-action="quick-connect" data-index="${i}">
      <div class="server-item-info">
        <div class="server-item-name">${escapeHtml(s.name || s.host)}</div>
        <div class="server-item-detail">${escapeHtml(s.user || 'root')}@${escapeHtml(s.host)}:${s.sshPort || 22}</div>
      </div>
      <div class="server-item-actions">
        <span class="status-light status-unknown" data-action="check-server" data-index="${i}" title="点击检测连接状态"></span>
        <button class="file-action-btn" data-action="edit-server" data-index="${i}">编辑</button>
        <button class="file-action-btn delete" data-action="delete-server" data-index="${i}">删除</button>
      </div>
    </div>
  `).join('')
}

async function openServerDrawer() {
  await loadServerList()
  document.getElementById('server-drawer').classList.add('open')
  document.getElementById('server-drawer-backdrop').classList.add('open')
  document.getElementById('server-drawer').setAttribute('aria-hidden', 'false')
}

function closeServerDrawer() {
  document.getElementById('server-drawer').classList.remove('open')
  document.getElementById('server-drawer-backdrop').classList.remove('open')
  document.getElementById('server-drawer').setAttribute('aria-hidden', 'true')
}

async function openServerForm(index = null) {
  const form = document.getElementById('add-server-form')
  const field = name => form.elements.namedItem(name)
  form.reset()
  field('serverId').value = ''
  field('bridgePort').value = 8022
  field('sshPort').value = 22
  field('user').value = 'root'
  field('password').value = ''
  document.getElementById('server-form-title').textContent = '添加服务器'

  if (index !== null) {
    const server = (await getServers())[index]
    if (!server) return
    field('serverId').value = server.id
    field('name').value = server.name || ''
    field('host').value = server.host || ''
    field('bridgePort').value = server.bridgePort || 8022
    field('sshPort').value = server.sshPort || 22
    field('user').value = server.user || server.username || 'root'
    field('password').value = server.password || ''
    document.getElementById('server-form-title').textContent = '编辑服务器'
  }
  showModal('add-server-modal')
}

async function saveServer(server) {
  try {
    const servers = await getServers()
    const idx = servers.findIndex(s => s.id === server.id)
    if (idx >= 0) {
      servers[idx] = server
    } else {
      servers.push(server)
    }
    await setServers(servers)
    toast('服务器已保存', 'success')
    loadServerList()
  } catch {
    toast('保存失败', 'error')
  }
}

async function deleteServer(index) {
  try {
    const servers = await getServers()
    if (index >= 0 && index < servers.length) {
      servers.splice(index, 1)
      await setServers(servers)
      toast('已删除', 'success')
      loadServerList()
    } else {
      toast('删除失败', 'error')
    }
  } catch {
    toast('删除失败', 'error')
  }
}

async function quickConnect(index) {
  const servers = await getServers()
  const s = servers[index]
  if (!s) return
  let pass = s.password || ''
  if (!pass) {
    pass = prompt(`请输入 ${(s.user || s.username || 'root')}@${s.host} 的 SSH 密码：`)
    if (pass === null) return
  }
  const bridgeOk = await checkWebSocket(s.host, s.bridgePort || 8022, 'ws')
  if (!bridgeOk) {
    showBridgeError('WebSocket 预检失败')
    return
  }
  connectServer(s.host, s.bridgePort || 8022, 'ws', s.sshPort || 22, s.user || s.username || 'root', pass)
  hideModal('connect-modal')
}

// ─────────────────────────────────────────────────────────────
// 12.6 Server Reachability Detection

const STATUS_CLASS = {
  unknown: 'status-unknown',
  checking: 'status-checking',
  dead: 'status-dead',
  alive: 'status-alive'
}

function setServerStatus(index, status) {
  const light = document.querySelector(`.status-light[data-action="check-server"][data-index="${index}"]`)
  if (!light) return
  Object.values(STATUS_CLASS).forEach(c => light.classList.remove(c))
  light.classList.add(STATUS_CLASS[status] || STATUS_CLASS.unknown)
}

function checkWebSocket(host, port, bridgeProtocol) {
  return new Promise((resolve) => {
    let finished = false
    let socket
    let timer
    const done = (ok) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      try { socket?.close() } catch {}
      resolve(ok)
    }
    try {
      const protocol = bridgeProtocol === 'wss' ? 'wss:' : 'ws:'
      socket = new WebSocket(`${protocol}//${host}:${port}/ssh`)
    } catch {
      resolve(false)
      return
    }
    timer = setTimeout(() => done(false), 4000)
    socket.onopen = () => done(true)
    socket.onerror = () => done(false)
    socket.onclose = () => done(false)
  })
}

async function detectServer(index) {
  const servers = await getServers()
  const s = servers[index]
  if (!s) return
  const host = s.host
  const port = s.bridgePort || 8022
  setServerStatus(index, 'checking')
  const bridgeOk = await checkWebSocket(host, port, s.bridgeProtocol || 'ws')
  setServerStatus(index, bridgeOk ? 'alive' : 'dead')
}

// ─────────────────────────────────────────────────────────────
// 12.5 Guide & Bridge Error
// ─────────────────────────────────────────────────────────────

function initGuide() {
  // 引导页加载时无需特殊操作，复制按钮通过事件委托处理
}

function showBridgeError(message) {
  const modal = document.getElementById('bridge-error-modal')
  const msgEl = document.getElementById('bridge-error-msg')
  if (modal && msgEl) {
    msgEl.textContent = message
    const hint = document.getElementById('bridge-error-detail')
    if (hint) hint.textContent = classifyConnectionError(message)
    modal.style.display = 'flex'
  } else {
    toast(message, 'error', 5000)
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      toast('已复制到剪贴板', 'success', 1500)
    }).catch(() => {
      fallbackCopy(text)
    })
  } else {
    fallbackCopy(text)
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
    toast('已复制到剪贴板', 'success', 1500)
  } catch {
    toast('复制失败，请手动复制', 'error', 2000)
  }
  document.body.removeChild(ta)
}

// ─────────────────────────────────────────────────────────────
// 13. Utility
// ─────────────────────────────────────────────────────────────

function escapeAttr(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"')
}

// ─────────────────────────────────────────────────────────────
// 14. Event Binding & Init
// ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Log panel toggle
  document.getElementById('btn-toggle-log').addEventListener('click', () => {
    const p = document.getElementById('log-panel')
    p.classList.toggle('collapsed')
    document.getElementById('btn-toggle-log').textContent = p.classList.contains('collapsed') ? '展开' : '收起'
  })
  document.getElementById('log-header').addEventListener('dblclick', () => {
    const p = document.getElementById('log-panel')
    p.classList.toggle('collapsed')
    document.getElementById('btn-toggle-log').textContent = p.classList.contains('collapsed') ? '展开' : '收起'
  })
  document.getElementById('btn-clear-log').addEventListener('click', () => {
    logBody.innerHTML = ''
  })

  addLog('页面加载完成')
  addLog(`xterm: ${window.Terminal ? '已加载' : '未加载'}`)
  addLog(`FitAddon: ${window.FitAddon ? '已加载' : '未加载'}`)

  // 侧栏切换
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar')
    const main = document.querySelector('.main')
    sidebar.classList.toggle('collapsed')
    main.classList.toggle('sidebar-collapsed')
  })

  // 侧栏导航
  document.querySelectorAll('.nav-item[data-nav]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault()
      navigate(item.dataset.nav)
    })
  })

  // 连接按钮
  document.getElementById('btn-connect').addEventListener('click', () => {
    showModal('connect-modal')
  })

  // 断开按钮
  document.getElementById('btn-disconnect').addEventListener('click', () => {
    disconnectServer()
    toast('已断开连接', 'info')
  })

  // 连接表单
  document.getElementById('connect-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const name = fd.get('name') || fd.get('host')
    const host = fd.get('host')
    const bridgePort = parseInt(fd.get('bridgePort')) || 8022
    const bridgeProtocol = 'ws'
    const sshPort = parseInt(fd.get('sshPort')) || 22
    const user = fd.get('user') || 'root'
    const pass = fd.get('pass') || ''

    if (!host) {
      toast('请填写服务器地址', 'warning')
      return
    }

    const server = {
      id: crypto.randomUUID(),
      name, host,
      bridgePort,
      bridgeProtocol,
      sshPort,
      username: user,
      user,
      password: pass,
      lastConnected: Date.now()
    }
    const bridgeOk = await checkWebSocket(host, bridgePort, 'ws')
    if (!bridgeOk) {
      hideModal('connect-modal')
      showBridgeError('WebSocket 预检失败')
      return
    }
    await saveServer(server)
    hideModal('connect-modal')
    connectServer(host, bridgePort, bridgeProtocol, sshPort, user, pass)
  })

  // 取消连接
  document.getElementById('btn-cancel-connect').addEventListener('click', () => {
    hideModal('connect-modal')
  })

  // 点击遮罩关闭模态框
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none'
      }
    })
  })

  // 仪表盘刷新
  document.getElementById('btn-refresh-dashboard').addEventListener('click', () => {
    refreshDashboard()
  })

  // 终端重置
  document.getElementById('btn-term-reset').addEventListener('click', resetTerminal)

  // 文件 - 新建文件夹
  document.getElementById('btn-mkdir').addEventListener('click', () => {
    showModal('mkdir-modal')
  })

  document.getElementById('mkdir-form').addEventListener('submit', (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const dirname = fd.get('dirname')
    if (dirname) {
      mkdir(dirname)
      hideModal('mkdir-modal')
      e.target.reset()
    }
  })

  document.getElementById('btn-cancel-mkdir').addEventListener('click', () => {
    hideModal('mkdir-modal')
  })

  // 文件 - 刷新
  document.getElementById('btn-reload-files').addEventListener('click', () => {
    listFiles(currentPath)
  })

  // 部署表单
  document.getElementById('deploy-form').addEventListener('submit', (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const siteName = fd.get('siteName')
    const targetPath = fd.get('targetPath')
    const portNum = parseInt(fd.get('port'))
    const serviceType = fd.get('serviceType')
    const startCommand = fd.get('startCommand')
    const installRuntime = fd.get('installRuntime') === 'on'

    if (!siteName || !targetPath || !portNum) {
      toast('请填写完整信息', 'warning')
      return
    }

    createSite(siteName, targetPath, portNum, serviceType, startCommand, installRuntime)
    e.target.reset()
    document.getElementById('deploy-command-group').hidden = true
  })

  document.getElementById('deploy-service-type').addEventListener('change', (e) => {
    document.getElementById('deploy-command-group').hidden = e.target.value !== 'custom'
  })

  document.getElementById('btn-server-drawer').addEventListener('click', openServerDrawer)
  document.getElementById('btn-close-server-drawer').addEventListener('click', closeServerDrawer)
  document.getElementById('server-drawer-backdrop').addEventListener('click', closeServerDrawer)

  // 服务器侧栏 - 添加或编辑
  document.getElementById('btn-add-server').addEventListener('click', () => {
    openServerForm()
  })

  document.getElementById('add-server-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const server = {
      id: fd.get('serverId') || crypto.randomUUID(),
      name: fd.get('name'),
      host: fd.get('host'),
      bridgePort: parseInt(fd.get('bridgePort')) || 8022,
      bridgeProtocol: 'ws',
      sshPort: parseInt(fd.get('sshPort')) || 22,
      user: fd.get('user'),
      password: fd.get('password') || ''
    }

    if (!server.name || !server.host || !server.user) {
      toast('请填写完整信息', 'warning')
      return
    }

    await saveServer(server)
    hideModal('add-server-modal')
    e.target.reset()
  })

  document.getElementById('btn-cancel-add-server').addEventListener('click', () => {
    hideModal('add-server-modal')
  })

  // 事件委托
  document.addEventListener('click', (e) => {
    // 复制按钮
    const copyBtn = e.target.closest('.btn-copy')
    if (copyBtn && copyBtn.dataset.copy) {
      e.stopPropagation()
      copyToClipboard(copyBtn.dataset.copy)
      return
    }

    const target = e.target.closest('[data-action]')
    if (!target) return
    const action = target.dataset.action

    if (action === 'navigate' || action === 'breadcrumb') {
      e.preventDefault()
      listFiles(target.dataset.path)
    } else if (action === 'delete-dir') {
      e.stopPropagation()
      deletePath(target.dataset.name, true)
    } else if (action === 'delete-file') {
      e.stopPropagation()
      deletePath(target.dataset.name, false)
    } else if (action === 'rename') {
      e.stopPropagation()
      renameFile(target.dataset.name)
    } else if (action === 'remove-site') {
      e.stopPropagation()
      removeSite(target.dataset.name)
    } else if (action === 'quick-connect') {
      e.stopPropagation()
      const idx = parseInt(target.dataset.index)
      quickConnect(idx)
    } else if (action === 'check-server') {
      e.stopPropagation()
      e.preventDefault()
      const idx = parseInt(target.dataset.index)
      detectServer(idx)
    } else if (action === 'delete-server') {
      e.stopPropagation()
      e.preventDefault()
      const idx = parseInt(target.dataset.index)
      deleteServer(idx)
    } else if (action === 'edit-server') {
      e.stopPropagation()
      e.preventDefault()
      openServerForm(parseInt(target.dataset.index))
    }
  })

  document.addEventListener('dblclick', (e) => {
    const target = e.target.closest('[data-action="navigate"]')
    if (target) listFiles(target.dataset.path)
  })

  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => {
        m.style.display = 'none'
      })
      closeServerDrawer()
    }
  })

  // 引导页 — 去连接按钮
  const guideConnectBtn = document.getElementById('btn-guide-connect')
  if (guideConnectBtn) {
    guideConnectBtn.addEventListener('click', () => {
      showModal('connect-modal')
    })
  }

  const guideConnectBtn2 = document.getElementById('btn-guide-connect-2')
  if (guideConnectBtn2) {
    guideConnectBtn2.addEventListener('click', () => {
      showModal('connect-modal')
    })
  }

  // Bridge 错误提示 — 查看引导
  const gotoGuideBtn = document.getElementById('btn-goto-guide')
  if (gotoGuideBtn) {
    gotoGuideBtn.addEventListener('click', () => {
      hideModal('bridge-error-modal')
      navigate('guide')
    })
  }

  // Bridge 错误提示 — 关闭
  const closeBridgeErrorBtn = document.getElementById('btn-close-bridge-error')
  if (closeBridgeErrorBtn) {
    closeBridgeErrorBtn.addEventListener('click', () => {
      hideModal('bridge-error-modal')
    })
  }

  // 初始化
  updateConnectionUI()
  loadServerList()
})
