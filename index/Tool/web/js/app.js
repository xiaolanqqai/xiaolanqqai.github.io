/* ============================================================
   MiniServer Panel — app.js v3.0
   纯 WebSocket 模式：通过服务器上的 C bridge 连接 SSH
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
 * @param bridgeHost bridge 所在服务器地址（通常和 SSH 同一台）
 * @param bridgePort bridge 监听端口（默认 8022）
 * @param token      bridge 认证 Token（v3.4 起固定为 'ssh'，保留参数为向后兼容）
 * @param sshHost    SSH 主机（通常 127.0.0.1，因为 bridge 在服务器本机）
 * @param sshPort    SSH 端口（默认 22）
 * @param user       SSH 用户名
 * @param pass       SSH 密码
 */
async function connectServer(bridgeHost, bridgePort, token, sshHost, sshPort, user, pass) {
  // v3.4: Token 固定为 'ssh'，忽略外部传入值（旧记录中的 token 字段也不再使用）
  token = 'ssh'
  if (transport) {
    try { transport.disconnect() } catch {}
  }

  // 根据页面协议自动选择 ws/wss，HTTPS 站点必须用 wss 避免混合内容策略阻断
  const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const bridgeUrl = `${wsProto}//${bridgeHost}:${bridgePort}/${token}`
  addLog(`连接 ${user}@${sshHost}:${sshPort} via ${bridgeHost}:${bridgePort}...`)

  const socket = new MiniServerSSH.WsSocket(bridgeUrl)
  transport = new MiniServerSSH.SSHTransport(socket)

  // 断线检测：WsSocket 触发 close 时清理状态（H6）
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
    await transport.connect(sshHost, sshPort, user, pass)
    addLog('SSH 握手成功', 'success')
    addLog('打开 Shell...')
    shell = await transport.openShell(80, 24)
    shell.onData(data => {
      if (term) term.write(data)
    })
    isConnected = true
    connInfo = { host: bridgeHost, port: sshPort, user }
    onConnected()
    addLog('Shell 已就绪', 'success')
  } catch (err) {
    addLog(`连接失败: ${err.message}`, 'error')
    // 连接失败时彻底清理残留状态（H4）
    isConnected = false
    shell = null
    transport = null
    // 检测是否为 bridge 未安装/未运行导致的连接失败
    const isBridgeError = /桥接|WebSocket|连接超时|连接失败|ECONNREFUSED|ERR_CONNECTION/i.test(err.message)
    if (isBridgeError) {
      showBridgeError(err.message)
    } else {
      toast(err.message, 'error', 5000)
    }
    onDisconnected()
  }
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

async function createSite(siteName, targetPath, portNum) {
  if (!isConnected) {
    toast('未连接到服务器', 'warning')
    return
  }

  const safeName = siteName.replace(/'/g, "'\\''")
  const safePath = targetPath.replace(/'/g, "'\\''")

  const commands = [
    `mkdir -p '${safePath}'`,
    `echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeName}</title></head><body><h1>${safeName}</h1><p>Deployed by MiniServer Panel</p></body></html>' > '${safePath}/index.html'`,
    `mkdir -p ~/.miniserver-panel`,
    `if [ -f ~/.miniserver-panel/state.json ]; then cat ~/.miniserver-panel/state.json; else echo '{}'; fi`
  ]

  try {
    const result = await execCommand(commands.join(' && '))
    if (result.stderr && !result.stdout) {
      toast(`部署失败: ${result.stderr.trim()}`, 'error')
      return
    }

    try {
      const parts = result.stdout.split('\n')
      let jsonStart = -1
      for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i].trim().startsWith('{')) {
          jsonStart = i
          break
        }
      }

      let state = {}
      if (jsonStart >= 0) {
        const jsonStr = parts.slice(jsonStart).join('\n')
        state = JSON.parse(jsonStr)
      }

      if (!state.sites) state.sites = []
      state.sites.push({
        name: siteName,
        path: targetPath,
        port: portNum,
        createdAt: new Date().toISOString()
      })

      const stateJson = JSON.stringify(state, null, 2).replace(/'/g, "'\\''")
      await execCommand(`echo '${stateJson}' > ~/.miniserver-panel/state.json`)
      toast(`站点 "${siteName}" 部署成功`, 'success')
      loadSites()
    } catch {
      toast('站点已创建，但状态更新失败', 'warning')
      loadSites()
    }
  } catch (err) {
    toast(`部署失败: ${err.message}`, 'error')
  }
}

async function loadSites() {
  if (!isConnected) {
    document.getElementById('deploy-site-list').innerHTML = '<div class="empty-state">请先连接服务器</div>'
    return
  }

  try {
    const result = await execCommand('cat ~/.miniserver-panel/state.json')
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
            <div class="deploy-site-port">端口: ${escapeHtml(String(site.port))}</div>
          </div>
          <button class="btn-danger btn-sm" data-action="remove-site" data-name="${escapeAttr(site.name)}">移除</button>
        </div>
      `).join('')
    } catch {
      container.innerHTML = '<div class="empty-state">暂无站点</div>'
    }
  } catch (err) {
    document.getElementById('deploy-site-list').innerHTML = '<div class="empty-state">加载站点失败</div>'
  }
}

async function removeSite(siteName) {
  if (!isConnected) return

  try {
    const result = await execCommand(`cat ~/.miniserver-panel/state.json`)
    try {
      const state = JSON.parse(result.stdout)
      state.sites = (state.sites || []).filter(s => s.name !== siteName)
      const stateJson = JSON.stringify(state, null, 2).replace(/'/g, "'\\''")
      await execCommand(`echo '${stateJson}' > ~/.miniserver-panel/state.json`)
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

const STORAGE_KEY = 'ms-servers'

function getServers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function setServers(servers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(servers))
}

function loadServerList() {
  const servers = getServers()
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
        <button class="file-action-btn delete" data-action="delete-server" data-index="${i}">删除</button>
      </div>
    </div>
  `).join('')
}

function saveServer(server) {
  try {
    const servers = getServers()
    const idx = servers.findIndex(s => s.id === server.id)
    if (idx >= 0) {
      servers[idx] = server
    } else {
      servers.push(server)
    }
    setServers(servers)
    toast('服务器已保存', 'success')
    loadServerList()
  } catch {
    toast('保存失败', 'error')
  }
}

function deleteServer(index) {
  try {
    const servers = getServers()
    if (index >= 0 && index < servers.length) {
      servers.splice(index, 1)
      setServers(servers)
      toast('已删除', 'success')
      loadServerList()
    } else {
      toast('删除失败', 'error')
    }
  } catch {
    toast('删除失败', 'error')
  }
}

function quickConnect(index) {
  const servers = getServers()
  const s = servers[index]
  if (!s) return
  // 密码不再持久化，每次快速连接需重新输入（C7 修复）
  const pass = prompt(`请输入 ${(s.user || s.username || 'root')}@${s.host} 的 SSH 密码：`)
  if (pass === null) return
  connectServer(s.host, s.bridgePort || 8022, s.token, s.sshHost || '127.0.0.1', s.sshPort || 22, s.user || s.username || 'root', pass)
  hideModal('connect-modal')
}

// ─────────────────────────────────────────────────────────────
// 12.6 Server Reachability Detection
// ─────────────────────────────────────────────────────────────
// 检测逻辑：ping → WebSocket 两阶段
//   ping 不通 → 红灯（status-dead）
//   ping 通但 WebSocket 失败 → 黄灯（status-ping-ok）
//   WebSocket 握手成功 → 绿灯（status-alive）
// 检测中：黄灯闪烁（status-checking）
// 未检测：灰色（status-unknown）

const STATUS_CLASS = {
  unknown: 'status-unknown',
  checking: 'status-checking',
  dead: 'status-dead',
  'ping-ok': 'status-ping-ok',
  alive: 'status-alive'
}

function setServerStatus(index, status) {
  const light = document.querySelector(`.status-light[data-action="check-server"][data-index="${index}"]`)
  if (!light) return
  Object.values(STATUS_CLASS).forEach(c => light.classList.remove(c))
  light.classList.add(STATUS_CLASS[status] || STATUS_CLASS.unknown)
}

/** 探测 bridge 端口是否可达（浏览器无法 ICMP ping，用 no-cors fetch 替代） */
function pingServer(host, port) {
  return new Promise((resolve) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    // 加随机参数避免缓存；no-cors 模式下能收到任何响应（哪怕是 opaque）就算可达
    fetch(`http://${host}:${port}/?_=${Date.now()}`, {
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-store'
    }).then(() => {
      clearTimeout(timer)
      resolve(true)
    }).catch(() => {
      clearTimeout(timer)
      // 网络层拒绝/超时都算不可达；注意 no-cors 下跨域错误也会 reject，但
      // 只要 TCP 通了浏览器通常先触发 onopen 后才拒绝，所以这里仍视为可达兜底
      resolve(false)
    })
  })
}

/** 尝试建立 WebSocket 连接，3 秒内 onopen 算成功 */
function checkWebSocket(host, port) {
  return new Promise((resolve) => {
    let done = false
    const finish = (ok) => {
      if (done) return
      done = true
      clearTimeout(timer)
      try { ws.close() } catch {}
      resolve(ok)
    }
    const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    // v3.4: Token 固定为 ssh，检测时也用该值
    const url = `${wsProto}//${host}:${port}/ssh`
    let ws
    try {
      ws = new WebSocket(url)
    } catch {
      return resolve(false)
    }
    const timer = setTimeout(() => finish(false), 4000)
    ws.onopen = () => finish(true)
    ws.onerror = () => finish(false)
    ws.onclose = () => finish(false)
  })
}

/** 完整检测流程：ping → WebSocket */
async function detectServer(index) {
  const servers = getServers()
  const s = servers[index]
  if (!s) return
  const host = s.host
  const port = s.bridgePort || 8022
  setServerStatus(index, 'checking')
  // 阶段 1：ping
  const pingOk = await pingServer(host, port)
  if (!pingOk) {
    setServerStatus(index, 'dead')
    return
  }
  setServerStatus(index, 'ping-ok')
  // 阶段 2：WebSocket
  const wsOk = await checkWebSocket(host, port)
  setServerStatus(index, wsOk ? 'alive' : 'ping-ok')
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
  document.getElementById('connect-form').addEventListener('submit', (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const name = fd.get('name') || fd.get('host')
    const host = fd.get('host')
    const bridgePort = parseInt(fd.get('bridgePort')) || 8022
    // v3.4: Token 固定为 'ssh'，前端不再显示输入框
    const token = 'ssh'
    const sshHost = fd.get('sshHost') || '127.0.0.1'
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
      token,
      sshHost,
      sshPort,
      username: user,
      password: pass,
      lastConnected: Date.now()
    }
    saveServer(server)

    hideModal('connect-modal')
    e.target.reset()
    connectServer(host, bridgePort, token, sshHost, sshPort, user, pass)
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

    if (!siteName || !targetPath || !portNum) {
      toast('请填写完整信息', 'warning')
      return
    }

    createSite(siteName, targetPath, portNum)
    e.target.reset()
  })

  // 设置 - 添加服务器
  document.getElementById('btn-add-server').addEventListener('click', () => {
    showModal('add-server-modal')
  })

  document.getElementById('add-server-form').addEventListener('submit', (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const server = {
      id: crypto.randomUUID(),
      name: fd.get('name'),
      host: fd.get('host'),
      bridgePort: parseInt(fd.get('bridgePort')) || 8022,
      // v3.4: Token 固定为 'ssh'
      token: 'ssh',
      sshHost: fd.get('sshHost') || '127.0.0.1',
      sshPort: parseInt(fd.get('sshPort')) || 22,
      user: fd.get('user'),
      password: fd.get('pass') || ''
    }

    if (!server.name || !server.host || !server.user) {
      toast('请填写完整信息', 'warning')
      return
    }

    saveServer(server)
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
})
