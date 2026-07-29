(() => {
  'use strict'

  const PAGE_SOURCE = 'miniserver-panel-page'
  const EXT_SOURCE = 'miniserver-panel-extension'
  const API_VERSION = 1
  const pending = new Map()
  const instances = new Map()

  function request(action, params = {}, timeout = 12000) {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID()
      const timer = setTimeout(() => {
        pending.delete(id)
        reject(new Error('浏览器扩展响应超时'))
      }, timeout)
      pending.set(id, { resolve, reject, timer })
      window.postMessage({ source: PAGE_SOURCE, version: API_VERSION, id, action, params }, location.origin)
    })
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== location.origin) return
    const message = event.data
    if (!message || message.source !== EXT_SOURCE || message.version !== API_VERSION) return

    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id)
      pending.delete(message.id)
      clearTimeout(item.timer)
      if (message.ok) item.resolve(message.data)
      else item.reject(new Error(message.error?.message || '扩展请求失败'))
      return
    }

    const socket = instances.get(message.socketId)
    if (!socket) return
    if (message.event === 'data') socket.dataCallback?.(Uint8Array.from(message.data || []))
    if (message.event === 'error') socket.errorCallback?.(Number(message.error || -1))
    if (message.event === 'close') {
      socket.connected = false
      instances.delete(message.socketId)
      socket.closeCallback?.()
    }
  })

  class ExtensionSocket {
    constructor() {
      this.socketId = null
      this.connected = false
      this.dataCallback = null
      this.closeCallback = null
      this.errorCallback = null
    }

    async connect(host, port) {
      const result = await request('tcp.connect', { host, port })
      this.socketId = result.socketId
      this.connected = true
      instances.set(this.socketId, this)
    }

    async send(data) {
      if (!this.connected || this.socketId === null) throw new Error('Socket not connected')
      await request('tcp.send', { socketId: this.socketId, data: Array.from(data) })
    }

    async close() {
      if (this.socketId !== null) {
        const id = this.socketId
        this.connected = false
        this.socketId = null
        instances.delete(id)
        try { await request('tcp.close', { socketId: id }, 3000) } catch {}
      }
    }

    onData(callback) { this.dataCallback = callback }
    onClose(callback) { this.closeCallback = callback }
    onError(callback) { this.errorCallback = callback }
  }

  window.MiniServerExtension = {
    ExtensionSocket,
    detect: () => request('core.ping', {}, 2000)
  }
})()
