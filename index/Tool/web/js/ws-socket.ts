/**
 * WebSocket socket - 连接服务器上的 C bridge 程序
 *
 * 协议与 bridge.c 完全对称：
 *   ws://SERVER:PORT/TOKEN
 *   { type: "connect", host, port }  → 创建 TCP 连接
 *   { type: "connected" }            ← TCP 连接成功
 *   { type: "data", data: base64 }   ↔ 二进制数据
 *   { type: "disconnect" }           → 主动断开
 *   { type: "disconnected" }         ← 远端断开
 *   { type: "error", message }       ← 错误
 *
 * 注意：本文件为源码参考。运行时实际使用的是 web/js/ssh-bundle.js
 * 中已打包编译的 WsSocket 类（IIFE 模式，无需打包工具即可在浏览器运行）。
 */

export interface ITcpSocket {
  connect(host: string, port: number): Promise<void>
  send(data: Uint8Array): Promise<void>
  close(): Promise<void>
  onData(cb: (data: Uint8Array) => void): void
  onClose(cb: () => void): void
  onError(cb: (error: number) => void): void
}

export class WsSocket implements ITcpSocket {
  private ws: WebSocket | null = null
  private connected = false
  private dataCallback: ((data: Uint8Array) => void) | null = null
  private closeCallback: (() => void) | null = null
  private errorCallback: ((error: number) => void) | null = null
  private bridgeUrl: string

  /**
   * @param bridgeUrl 完整的 WebSocket URL，如 ws://1.2.3.4:8022/TOKEN
   *                   如果不传，回退到 ws://127.0.0.1:8022/ssh（本地调试）
   */
  constructor(bridgeUrl?: string) {
    this.bridgeUrl = bridgeUrl || 'ws://127.0.0.1:8022/ssh'
  }

  connect(host: string, port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.bridgeUrl)
      } catch (e: any) {
        reject(new Error(`WebSocket 创建失败: ${e.message}`))
        return
      }

      const timeout = setTimeout(() => {
        this.ws?.close()
        reject(new Error('连接桥接服务超时，请确认服务器上 bridge 已启动且 Token 正确'))
      }, 10000)

      this.ws.binaryType = 'arraybuffer'

      this.ws.onopen = () => {
        // WebSocket 握手成功后，发送 connect 指令
        this.ws!.send(JSON.stringify({ type: 'connect', host, port: String(port) }))
      }

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'connected') {
            clearTimeout(timeout)
            this.connected = true
            resolve()
          } else if (msg.type === 'data') {
            const binary = atob(msg.data)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
            this.dataCallback?.(bytes)
          } else if (msg.type === 'disconnected') {
            this.connected = false
            this.closeCallback?.()
          } else if (msg.type === 'error') {
            clearTimeout(timeout)
            if (!this.connected) {
              reject(new Error(msg.message))
            }
          }
        } catch {}
      }

      this.ws.onerror = () => {
        clearTimeout(timeout)
        reject(new Error('WebSocket 连接失败，请确认服务器地址和端口正确'))
      }

      this.ws.onclose = () => {
        clearTimeout(timeout)
        if (this.connected) {
          this.connected = false
          this.closeCallback?.()
        }
      }
    })
  }

  send(data: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws || !this.connected) {
        reject(new Error('Socket not connected'))
        return
      }
      try {
        let binary = ''
        for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i])
        this.ws.send(JSON.stringify({ type: 'data', data: btoa(binary) }))
        resolve()
      } catch (e: any) {
        reject(new Error(`Send failed: ${e.message}`))
      }
    })
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      this.connected = false
      if (this.ws) {
        try { this.ws.send(JSON.stringify({ type: 'disconnect' })) } catch {}
        this.ws.close()
        this.ws = null
      }
      resolve()
    })
  }

  onData(cb: (data: Uint8Array) => void) { this.dataCallback = cb }
  onClose(cb: () => void) { this.closeCallback = cb }
  onError(cb: (error: number) => void) { this.errorCallback = cb }
}
