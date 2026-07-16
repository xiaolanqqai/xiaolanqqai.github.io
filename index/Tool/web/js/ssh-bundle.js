var MiniServerSSH = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // exports
  var transport_exports = {};
  __export(transport_exports, {
    SSHTransport: () => SSHTransport,
    WsSocket: () => WsSocket
  });

  // =========================================================
  // web/js/ws-socket.ts — WebSocket socket 连接服务器上的 C bridge 程序
  // =========================================================
  var WsSocket = class {
    ws = null;
    connected = false;
    dataCallback = null;
    closeCallback = null;
    errorCallback = null;
    bridgeUrl;

    constructor(bridgeUrl) {
      this.bridgeUrl = bridgeUrl || "ws://127.0.0.1:8022/ssh";
    }

    connect(host, port) {
      return new Promise((resolve, reject) => {
        try {
          this.ws = new WebSocket(this.bridgeUrl);
        } catch (e) {
          reject(new Error("WebSocket 创建失败: " + e.message));
          return;
        }

        const timeout = setTimeout(() => {
          this.ws?.close();
          reject(new Error("连接桥接服务超时，请确认服务器上 bridge 已启动且 Token 正确"));
        }, 10000);

        this.ws.binaryType = "arraybuffer";

        this.ws.onopen = () => {
          this.ws.send(JSON.stringify({ type: "connect", host: host, port: String(port) }));
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "connected") {
              clearTimeout(timeout);
              this.connected = true;
              resolve();
            } else if (msg.type === "data") {
              const binary = atob(msg.data);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
              this.dataCallback?.(bytes);
            } else if (msg.type === "disconnected") {
              this.connected = false;
              this.closeCallback?.();
            } else if (msg.type === "error") {
              clearTimeout(timeout);
              if (!this.connected) {
                reject(new Error(msg.message));
              }
            }
          } catch {}
        };

        this.ws.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("WebSocket 连接失败，请确认服务器地址和端口正确"));
        };

        this.ws.onclose = () => {
          clearTimeout(timeout);
          if (this.connected) {
            this.connected = false;
            this.closeCallback?.();
          }
        };
      });
    }

    send(data) {
      return new Promise((resolve, reject) => {
        if (!this.ws || !this.connected) {
          reject(new Error("Socket not connected"));
          return;
        }
        try {
          let binary = "";
          for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i]);
          this.ws.send(JSON.stringify({ type: "data", data: btoa(binary) }));
          resolve();
        } catch (e) {
          reject(new Error("Send failed: " + e.message));
        }
      });
    }

    close() {
      return new Promise((resolve) => {
        this.connected = false;
        if (this.ws) {
          try { this.ws.send(JSON.stringify({ type: "disconnect" })); } catch {}
          this.ws.close();
          this.ws = null;
        }
        resolve();
      });
    }

    onData(cb) { this.dataCallback = cb; }
    onClose(cb) { this.closeCallback = cb; }
    onError(cb) { this.errorCallback = cb; }
  };

  // =========================================================
  // server/src/ssh/packet.ts — SSH-2 binary packet encoder/decoder
  // =========================================================
  var SSH_MSG_SERVICE_REQUEST = 5;
  var SSH_MSG_SERVICE_ACCEPT = 6;
  var SSH_MSG_KEXINIT = 20;
  var SSH_MSG_NEWKEYS = 21;
  var SSH_MSG_KEXDH_INIT = 30;
  var SSH_MSG_KEXDH_REPLY = 31;
  var SSH_MSG_USERAUTH_REQUEST = 50;
  var SSH_MSG_USERAUTH_FAILURE = 51;
  var SSH_MSG_USERAUTH_SUCCESS = 52;
  var SSH_MSG_CHANNEL_OPEN = 90;
  var SSH_MSG_CHANNEL_OPEN_CONFIRMATION = 91;
  var SSH_MSG_CHANNEL_OPEN_FAILURE = 92;
  var SSH_MSG_CHANNEL_DATA = 94;
  var SSH_MSG_CHANNEL_EXTENDED_DATA = 95;
  var SSH_MSG_CHANNEL_EOF = 96;
  var SSH_MSG_CHANNEL_CLOSE = 97;
  var SSH_MSG_CHANNEL_REQUEST = 98;
  var SSH_MSG_CHANNEL_SUCCESS = 99;
  var SSH_MSG_CHANNEL_FAILURE = 100;
  function writeUint32(n) {
    var buf = new Uint8Array(4);
    buf[0] = n >>> 24 & 255;
    buf[1] = n >>> 16 & 255;
    buf[2] = n >>> 8 & 255;
    buf[3] = n & 255;
    return buf;
  }
  function writeUint8(n) {
    return new Uint8Array([n & 255]);
  }
  function writeString(s) {
    var encoded = new TextEncoder().encode(s);
    return concat(writeUint32(encoded.length), encoded);
  }
  function writeMpint(n) {
    if (n === 0n) return writeString(new Uint8Array(0));
    var isNeg = n < 0n;
    var abs = isNeg ? -n : n;
    var bytes = [];
    while (abs > 0n) {
      bytes.unshift(Number(abs & 0xffn));
      abs >>= 8n;
    }
    if (bytes[0] & 128) bytes.unshift(isNeg ? 128 : 0);
    else if (isNeg) bytes[0] |= 128;
    return writeString(new Uint8Array(bytes));
  }
  function writeNameList(names) {
    return writeString(names.join(","));
  }
  function readUint32(buf, offset) {
    return {
      value: buf[offset] << 24 | buf[offset + 1] << 16 | buf[offset + 2] << 8 | buf[offset + 3],
      offset: offset + 4
    };
  }
  function readString(buf, offset) {
    var r = readUint32(buf, offset);
    var value = new TextDecoder().decode(buf.slice(r.offset, r.offset + r.value));
    return { value: value, offset: r.offset + r.value };
  }
  function readMpint(buf, offset) {
    var r = readUint32(buf, offset);
    if (r.value === 0) return { value: 0n, offset: r.offset };
    var raw = buf.slice(r.offset, r.offset + r.value);
    var isNeg = raw[0] & 128;
    var result = 0n;
    for (var i = 0; i < raw.length; i++) {
      result = result << 8n | BigInt(raw[i] & 255);
    }
    if (isNeg) {
      var mask = (1n << BigInt(raw.length * 8)) - 1n;
      result = -((~result & mask) + 1n);
    }
    return { value: result, offset: r.offset + r.value };
  }
  function readNameList(buf, offset) {
    var r = readString(buf, offset);
    return { value: r.value === "" ? [] : r.value.split(","), offset: r.offset };
  }
  function encodePacket(payload, blockSize) {
    var minPadding = 4;
    var overhead = 4 + 1;
    var total = overhead + payload.length + minPadding;
    var paddedLength = Math.ceil(total / blockSize) * blockSize;
    var paddingLength = paddedLength - overhead - payload.length;
    var packetLength = 1 + payload.length + paddingLength;
    return concat(writeUint32(packetLength), writeUint8(paddingLength), payload, new Uint8Array(paddingLength));
  }
  function extractPacketLength(data) {
    return data[0] << 24 | data[1] << 16 | data[2] << 8 | data[3];
  }
  function concat() {
    var parts = Array.prototype.slice.call(arguments);
    var total = parts.reduce(function(s, p) { return s + p.length; }, 0);
    var result = new Uint8Array(total);
    var pos = 0;
    for (var i = 0; i < parts.length; i++) {
      result.set(parts[i], pos);
      pos += parts[i].length;
    }
    return result;
  }

  // =========================================================
  // server/src/ssh/crypto.ts — cryptographic utilities
  // =========================================================
  var subtle = globalThis.crypto.subtle;
  async function sha256(data) {
    return new Uint8Array(await subtle.digest("SHA-256", data));
  }
  async function importHmacKey(key) {
    return subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  }
  async function hmacSha256(key, data) {
    return new Uint8Array(await subtle.sign("HMAC", await importHmacKey(key), data));
  }
  async function importAesKey(key) {
    return subtle.importKey("raw", key, { name: "AES-CTR" }, false, ["encrypt", "decrypt"]);
  }
  async function aes128CtrEncrypt(key, iv, data) {
    return new Uint8Array(await subtle.encrypt({ name: "AES-CTR", counter: iv, length: 64 }, await importAesKey(key), data));
  }
  async function aes128CtrDecrypt(key, iv, data) {
    return new Uint8Array(await subtle.decrypt({ name: "AES-CTR", counter: iv, length: 64 }, await importAesKey(key), data));
  }
  function incrementCtr(iv, count) {
    var result = new Uint8Array(16);
    result.set(iv.subarray(0, 8), 0);
    var counterBytes = iv.subarray(8);
    var c = 0n;
    for (var i = 0; i < 8; i++) c = c << 8n | BigInt(counterBytes[i]);
    var incremented = c + BigInt(count);
    var high = Number(incremented >> 32n & 0xffffffffn);
    var low = Number(incremented & 0xffffffffn);
    result[8] = high >> 24 & 255;
    result[9] = high >> 16 & 255;
    result[10] = high >> 8 & 255;
    result[11] = high & 255;
    result[12] = low >> 24 & 255;
    result[13] = low >> 16 & 255;
    result[14] = low >> 8 & 255;
    result[15] = low & 255;
    return result;
  }
  async function verifyRsaSha256(publicKeyDer, signature, data) {
    var publicKey = await subtle.importKey("spki", publicKeyDer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    return subtle.verify("RSASSA-PKCS1-v1_5", publicKey, signature, data);
  }
  function dhGenerateKeyPair(p, g) {
    var bytes = new Uint8Array(32);
    globalThis.crypto.getRandomValues(bytes);
    var x = 0n;
    for (var i = 0; i < 32; i++) x = x << 8n | BigInt(bytes[i]);
    x = x % (p - 2n) + 1n;
    return { x: x, e: g ** x % p };
  }
  function dhComputeSharedSecret(f, x, p) {
    return f ** x % p;
  }
  async function deriveKey(K, H, sessionId, letter, length) {
    var letterByte = new TextEncoder().encode(letter);
    var kBytes = bigIntToBytes(K);
    var hashInput = concat2(kBytes, H, letterByte, sessionId);
    var hash = await sha256(hashInput);
    return hash.subarray(0, length);
  }
  function bigIntToBytes(n) {
    if (n === 0n) return new Uint8Array([0]);
    var hex = n.toString(16);
    var padded = hex.length % 2 === 1 ? "0" + hex : hex;
    var bytes = new Uint8Array(padded.length / 2);
    for (var i = 0; i < bytes.length; i++) bytes[i] = parseInt(padded.substring(i * 2, i * 2 + 2), 16);
    return bytes;
  }
  function concat2() {
    var arrays = Array.prototype.slice.call(arguments);
    var totalLength = arrays.reduce(function(sum, a) { return sum + a.length; }, 0);
    var result = new Uint8Array(totalLength);
    var offset = 0;
    for (var i = 0; i < arrays.length; i++) {
      result.set(arrays[i], offset);
      offset += arrays[i].length;
    }
    return result;
  }
  async function deriveKeys(K, H, sessionId) {
    var results = await Promise.all([
      deriveKey(K, H, sessionId, "A", 16),
      deriveKey(K, H, sessionId, "B", 16),
      deriveKey(K, H, sessionId, "C", 16),
      deriveKey(K, H, sessionId, "D", 16),
      deriveKey(K, H, sessionId, "E", 32),
      deriveKey(K, H, sessionId, "F", 32)
    ]);
    return {
      cipher: {
        encryptKey: results[0],
        decryptKey: results[1],
        encryptIv: results[2],
        decryptIv: results[3]
      },
      mac: {
        sendMacKey: results[4],
        recvMacKey: results[5]
      }
    };
  }

  // =========================================================
  // server/src/ssh/kex.ts — SSH-2 key exchange
  // =========================================================
  function concat3() {
    var bufs = Array.prototype.slice.call(arguments);
    var len = bufs.reduce(function(s, b) { return s + b.length; }, 0);
    var result = new Uint8Array(len);
    var offset = 0;
    for (var i = 0; i < bufs.length; i++) {
      result.set(bufs[i], offset);
      offset += bufs[i].length;
    }
    return result;
  }
  function readBytes(buf, offset) {
    var r = readUint32(buf, offset);
    return { value: buf.slice(r.offset, r.offset + r.value), offset: r.offset + r.value };
  }
  var _P = null;
  function getP() {
    if (_P) return _P;
    _P = BigInt(
      "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AACAA68FFFFFFFFFFFFFFFF"
    );
    return _P;
  }
  var G = 2n;
  var KEX_ALGOS = ["diffie-hellman-group14-sha256"];
  var HOST_KEY_ALGOS = ["ssh-rsa", "rsa-sha2-256", "rsa-sha2-512"];
  var ENC_C2S = ["aes128-ctr"];
  var ENC_S2C = ["aes128-ctr"];
  var MAC_C2S = ["hmac-sha2-256"];
  var MAC_S2C = ["hmac-sha2-256"];
  var COMP_C2S = ["none"];
  var COMP_S2C = ["none"];
  async function performKeyExchange(sendPacket, waitForPacket, clientVersion, serverVersion) {
    var cookie = new Uint8Array(16);
    crypto.getRandomValues(cookie);
    var kexInitPayload = concat3(
      writeUint8(SSH_MSG_KEXINIT), cookie,
      writeNameList(KEX_ALGOS), writeNameList(HOST_KEY_ALGOS),
      writeNameList(ENC_C2S), writeNameList(ENC_S2C),
      writeNameList(MAC_C2S), writeNameList(MAC_S2C),
      writeNameList(COMP_C2S), writeNameList(COMP_S2C),
      writeNameList([]), writeNameList([]),
      writeUint8(0), writeUint32(0)
    );
    var clientKexInitPayload = kexInitPayload;
    await sendPacket(kexInitPayload);
    var serverKexInitPayload = await waitForPacket(SSH_MSG_KEXINIT);
    var off = 1 + 16;
    var serverKex = readNameList(serverKexInitPayload, off);
    off = serverKex.offset;
    if (!serverKex.value.includes("diffie-hellman-group14-sha256"))
      throw new Error("Server does not support diffie-hellman-group14-sha256");
    var dh = dhGenerateKeyPair(getP(), G);
    await sendPacket(concat3(writeUint8(SSH_MSG_KEXDH_INIT), writeMpint(dh.e)));
    var reply = await waitForPacket(SSH_MSG_KEXDH_REPLY);
    var r = 1;
    var ks = readBytes(reply, r);
    r = ks.offset;
    var f = readMpint(reply, r);
    r = f.offset;
    var signature = readBytes(reply, r);
    var K = dhComputeSharedSecret(f.value, dh.x, getP());
    var H = await sha256(concat3(
      writeString(clientVersion), writeString(serverVersion),
      writeString(clientKexInitPayload), writeString(serverKexInitPayload),
      writeString(ks.value), writeMpint(dh.e), writeMpint(f.value), writeMpint(K)
    ));
    var valid = await verifyRsaSha256(ks.value, signature.value, H);
    if (!valid) throw new Error("Server host key signature verification failed");
    var sessionId = H;
    var keys = await deriveKeys(K, H, sessionId);
    return { sessionId: sessionId, cipher: keys.cipher, mac: keys.mac, serverHostKey: ks.value };
  }

  // =========================================================
  // server/src/ssh/transport.ts — SSH transport layer
  // =========================================================
  var CLIENT_VERSION = "SSH-2.0-MiniServerPanel_1.0";
  var MAC_LEN = 32;
  var WIN_SIZE = 2097152;
  var MAX_PKT = 32768;
  function concat4() {
    var bufs = Array.prototype.slice.call(arguments);
    var len = bufs.reduce(function(s, b) { return s + b.length; }, 0);
    var out = new Uint8Array(len);
    var pos = 0;
    for (var i = 0; i < bufs.length; i++) {
      out.set(bufs[i], pos);
      pos += bufs[i].length;
    }
    return out;
  }
  function u32(buf, off) {
    return buf[off] << 24 | buf[off + 1] << 16 | buf[off + 2] << 8 | buf[off + 3];
  }
  function readRaw(buf, off) {
    var len = u32(buf, off);
    return { data: buf.slice(off + 4, off + 4 + len), off: off + 4 + len };
  }
  function writeBytes(data) {
    return concat4(writeUint32(data.length), data);
  }
  function byteEq(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  var SSHTransport = class {
    socket;
    state = "DISCONNECTED";
    recvBuf = new Uint8Array(0);
    cipher = null;
    mac = null;
    sendSeq = 0;
    recvSeq = 0;
    sessionId = null;
    waiters = new Map();
    dataCallbacks = [];
    serverVersion = "";
    kexInProgress = false;
    nextChanId = 0;
    channels = new Map();
    procChain = Promise.resolve();
    dataWait = null;
    constructor(socket) {
      this.socket = socket ?? new WsSocket();
    }
    async connect(host, port, username, password) {
      this.state = "CONNECTING";
      await this.socket.connect(host, port);
      this.socket.onData(function(chunk) {
        this.recvBuf = concat4(this.recvBuf, chunk);
        if (this.dataWait) {
          var r = this.dataWait;
          this.dataWait = null;
          r();
        }
      }.bind(this));
      while (true) {
        var found = -1;
        for (var i = 0; i <= this.recvBuf.length - 2; i++) {
          if (this.recvBuf[i] === 13 && this.recvBuf[i + 1] === 10) {
            found = i;
            break;
          }
        }
        if (found >= 0) {
          this.serverVersion = new TextDecoder().decode(this.recvBuf.slice(0, found));
          this.recvBuf = this.recvBuf.slice(found + 2);
          break;
        }
        await new Promise(function(r) { this.dataWait = r; }.bind(this));
      }
      await this.socket.send(new TextEncoder().encode(CLIENT_VERSION + "\r\n"));
      this.socket.onData(function(chunk) {
        this.recvBuf = concat4(this.recvBuf, chunk);
        this.kick();
      }.bind(this));
      this.kick();
      this.kexInProgress = true;
      var kex = await performKeyExchange(
        function(p) { return this.sendPayload(p); }.bind(this),
        function(t) { return this.waitForPacket(t); }.bind(this),
        CLIENT_VERSION,
        this.serverVersion
      );
      this.kexInProgress = false;
      this.sessionId = kex.sessionId;
      var nkWait = this.waitForPacket(SSH_MSG_NEWKEYS);
      await this.sendPayload(new Uint8Array([SSH_MSG_NEWKEYS]));
      await nkWait;
      this.cipher = kex.cipher;
      this.mac = kex.mac;
      await this.authenticate(username, password);
      this.state = "CONNECTED";
    }
    async sendPayload(payload) {
      if (this.cipher && this.mac) {
        var pkt = encodePacket(payload, 16);
        var macVal = await hmacSha256(this.mac.sendMacKey, concat4(writeUint32(this.sendSeq), pkt));
        var enc = await aes128CtrEncrypt(this.cipher.encryptKey, this.cipher.encryptIv, pkt);
        this.cipher.encryptIv = incrementCtr(this.cipher.encryptIv, Math.ceil(pkt.length / 16));
        await this.socket.send(concat4(enc, macVal));
      } else {
        await this.socket.send(encodePacket(payload, 8));
      }
      this.sendSeq++;
    }
    kick() {
      this.procChain = this.procChain.then(function() { return this.processBuffer(); }.bind(this));
    }
    async processBuffer() {
      while (true) {
        var payload = await this.extractPacket();
        if (!payload) return;
        this.route(payload);
      }
    }
    async extractPacket() {
      if (this.cipher && this.mac) {
        if (this.recvBuf.length < 16) return null;
        var headDec = await aes128CtrDecrypt(this.cipher.decryptKey, this.cipher.decryptIv, this.recvBuf.slice(0, 16));
        var pktLen2 = extractPacketLength(headDec);
        var wire = 4 + pktLen2 + MAC_LEN;
        if (this.recvBuf.length < wire) return null;
        var encPkt = this.recvBuf.slice(0, 4 + pktLen2);
        var rcvMac = this.recvBuf.slice(4 + pktLen2, wire);
        this.recvBuf = this.recvBuf.slice(wire);
        var dec = await aes128CtrDecrypt(this.cipher.decryptKey, this.cipher.decryptIv, encPkt);
        this.cipher.decryptIv = incrementCtr(this.cipher.decryptIv, Math.ceil((4 + pktLen2) / 16));
        var expMac = await hmacSha256(this.mac.recvMacKey, concat4(writeUint32(this.recvSeq), dec));
        if (!byteEq(expMac, rcvMac)) throw new Error("MAC verification failed");
        this.recvSeq++;
        var padLen2 = dec[4];
        return dec.slice(5, 5 + pktLen2 - 1 - padLen2);
      }
      if (this.recvBuf.length < 4) return null;
      var pktLen = extractPacketLength(this.recvBuf);
      var total = 4 + pktLen;
      if (this.recvBuf.length < total) return null;
      var pkt = this.recvBuf.slice(0, total);
      this.recvBuf = this.recvBuf.slice(total);
      this.recvSeq++;
      var padLen = pkt[4];
      return pkt.slice(5, 5 + pktLen - 1 - padLen);
    }
    route(payload) {
      var type = payload[0];
      var w = this.waiters.get(type);
      if (w) {
        this.waiters.delete(type);
        w.resolve(payload);
        return;
      }
      if (type === SSH_MSG_CHANNEL_DATA || type === SSH_MSG_CHANNEL_EXTENDED_DATA) {
        var chanId = u32(payload, 1);
        var d = readRaw(payload, 5);
        var ch = this.channels.get(chanId);
        if (ch) {
          var cbs = type === SSH_MSG_CHANNEL_DATA ? ch.dataCbs : ch.extCbs;
          for (var ci = 0; ci < cbs.length; ci++) cbs[ci](d.data);
        }
        for (var ci2 = 0; ci2 < this.dataCallbacks.length; ci2++) this.dataCallbacks[ci2](d.data);
        return;
      }
      if (type === SSH_MSG_CHANNEL_EOF) {
        var ch2 = this.channels.get(u32(payload, 1));
        if (ch2) ch2.resolveEof();
        return;
      }
      if (type === SSH_MSG_CHANNEL_CLOSE) {
        var id = u32(payload, 1);
        var ch3 = this.channels.get(id);
        if (ch3) {
          ch3.resolveClose();
          this.channels.delete(id);
        }
        return;
      }
      if (type === SSH_MSG_CHANNEL_REQUEST) {
        var chanId2 = u32(payload, 1);
        var off = 5;
        var reqLen = u32(payload, off);
        off += 4;
        var reqType = new TextDecoder().decode(payload.slice(off, off + reqLen));
        off += reqLen + 1;
        if (reqType === "exit-status") {
          var code = u32(payload, off);
          var ch4 = this.channels.get(chanId2);
          if (ch4) ch4.resolveExit(code);
        }
        return;
      }
    }
    waitForPacket(type) {
      var _this = this;
      return new Promise(function(resolve, reject) {
        _this.waiters.set(type, { resolve: resolve, reject: reject });
        _this.kick();
      });
    }
    waitForOneOf() {
      var types = Array.prototype.slice.call(arguments);
      var _this = this;
      return new Promise(function(resolve, reject) {
        var done = function() {
          for (var i = 0; i < types.length; i++) _this.waiters.delete(types[i]);
        };
        for (var i = 0; i < types.length; i++) {
          (function(t) {
            _this.waiters.set(t, {
              resolve: function(d) { done(); resolve(d); },
              reject: function(e) { done(); reject(e); }
            });
          })(types[i]);
        }
        _this.kick();
      });
    }
    async authenticate(user, pass) {
      await this.sendPayload(concat4(writeUint8(SSH_MSG_SERVICE_REQUEST), writeString("ssh-userauth")));
      await this.waitForPacket(SSH_MSG_SERVICE_ACCEPT);
      await this.sendPayload(concat4(
        writeUint8(SSH_MSG_USERAUTH_REQUEST), writeString(user),
        writeString("ssh-connection"), writeString("password"),
        writeUint8(0), writeString(pass)
      ));
      var authReply = await this.waitForOneOf(SSH_MSG_USERAUTH_SUCCESS, SSH_MSG_USERAUTH_FAILURE);
      if (authReply[0] === SSH_MSG_USERAUTH_FAILURE) {
        var methodsLen = u32(authReply, 1);
        var methods = new TextDecoder().decode(authReply.slice(5, 5 + methodsLen));
        throw new Error("Authentication failed. Available methods: " + methods);
      }
    }
    async openSessionChannel() {
      var localId = this.nextChanId++;
      var rEof, rClose, rExit;
      var eofP = new Promise(function(r) { rEof = r; });
      var closeP = new Promise(function(r) { rClose = r; });
      var exitP = new Promise(function(r) { rExit = r; });
      var ch = {
        localId: localId,
        remoteId: 0,
        dataCbs: [],
        extCbs: [],
        resolveEof: rEof,
        resolveClose: rClose,
        resolveExit: rExit,
        eofPromise: eofP,
        closePromise: closeP,
        exitPromise: exitP
      };
      this.channels.set(localId, ch);
      await this.sendPayload(concat4(
        writeUint8(SSH_MSG_CHANNEL_OPEN), writeString("session"),
        writeUint32(localId), writeUint32(WIN_SIZE), writeUint32(MAX_PKT)
      ));
      var reply = await this.waitForOneOf(SSH_MSG_CHANNEL_OPEN_CONFIRMATION, SSH_MSG_CHANNEL_OPEN_FAILURE);
      if (reply[0] === SSH_MSG_CHANNEL_OPEN_FAILURE) {
        this.channels.delete(localId);
        throw new Error("Server refused to open channel");
      }
      ch.remoteId = u32(reply, 1);
      return ch;
    }
    async openShell(cols, rows) {
      var ch = await this.openSessionChannel();
      var rid = ch.remoteId;
      await this.sendPayload(concat4(
        writeUint8(SSH_MSG_CHANNEL_REQUEST), writeUint32(rid),
        writeString("pty-req"), writeUint8(1),
        writeString("xterm"), writeUint32(cols),
        writeUint32(rows), writeUint32(0), writeUint32(0), writeString("")
      ));
      await this.waitForOneOf(SSH_MSG_CHANNEL_SUCCESS, SSH_MSG_CHANNEL_FAILURE);
      await this.sendPayload(concat4(
        writeUint8(SSH_MSG_CHANNEL_REQUEST), writeUint32(rid),
        writeString("shell"), writeUint8(1)
      ));
      var shellReply = await this.waitForOneOf(SSH_MSG_CHANNEL_SUCCESS, SSH_MSG_CHANNEL_FAILURE);
      if (shellReply[0] === SSH_MSG_CHANNEL_FAILURE) {
        await this.sendPayload(concat4(writeUint8(SSH_MSG_CHANNEL_CLOSE), writeUint32(rid)));
        throw new Error("Shell request failed");
      }
      var transport = this;
      return {
        channelId: ch.localId,
        async write(data) {
          var bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
          await transport.sendPayload(concat4(writeUint8(SSH_MSG_CHANNEL_DATA), writeUint32(rid), writeBytes(bytes)));
        },
        onData(cb) { ch.dataCbs.push(cb); },
        async resize(c, r) {
          await transport.sendPayload(concat4(
            writeUint8(SSH_MSG_CHANNEL_REQUEST), writeUint32(rid),
            writeString("window-change"), writeUint8(0),
            writeUint32(c), writeUint32(r), writeUint32(0), writeUint32(0)
          ));
        },
        async close() { await transport.sendPayload(concat4(writeUint8(SSH_MSG_CHANNEL_CLOSE), writeUint32(rid))); }
      };
    }
    async execCommand(command) {
      var ch = await this.openSessionChannel();
      var rid = ch.remoteId;
      var stdout = "";
      var stderr = "";
      var exitCode = -1;
      var origExit = ch.resolveExit;
      ch.resolveExit = function(code) { exitCode = code; origExit(code); };
      ch.dataCbs.push(function(d) { stdout += new TextDecoder().decode(d); });
      ch.extCbs.push(function(d) { stderr += new TextDecoder().decode(d); });
      await this.sendPayload(concat4(
        writeUint8(SSH_MSG_CHANNEL_REQUEST), writeUint32(rid),
        writeString("exec"), writeUint8(1), writeString(command)
      ));
      var execReply = await this.waitForOneOf(SSH_MSG_CHANNEL_SUCCESS, SSH_MSG_CHANNEL_FAILURE);
      if (execReply[0] === SSH_MSG_CHANNEL_FAILURE) {
        await this.sendPayload(concat4(writeUint8(SSH_MSG_CHANNEL_CLOSE), writeUint32(rid)));
        throw new Error("Exec request failed");
      }
      await ch.eofPromise;
      await Promise.race([ch.exitPromise, new Promise(function(r) { setTimeout(r, 500); })]);
      await ch.closePromise;
      return { stdout: stdout, stderr: stderr, exitCode: exitCode };
    }
    async openSftp() {
      var ch = await this.openSessionChannel();
      var rid = ch.remoteId;
      await this.sendPayload(concat4(
        writeUint8(SSH_MSG_CHANNEL_REQUEST), writeUint32(rid),
        writeString("subsystem"), writeUint8(1), writeString("sftp")
      ));
      var reply = await this.waitForOneOf(SSH_MSG_CHANNEL_SUCCESS, SSH_MSG_CHANNEL_FAILURE);
      if (reply[0] === SSH_MSG_CHANNEL_FAILURE) {
        this.channels.delete(ch.localId);
        throw new Error("SFTP subsystem not available");
      }
      var transport = this;
      return {
        channelId: ch.localId,
        async sendSftpPacket(payload) {
          await transport.sendPayload(concat4(writeUint8(SSH_MSG_CHANNEL_DATA), writeUint32(rid), writeBytes(payload)));
        },
        onSftpData(cb) { ch.dataCbs.push(cb); },
        async close() { await transport.sendPayload(concat4(writeUint8(SSH_MSG_CHANNEL_CLOSE), writeUint32(rid))); }
      };
    }
    disconnect() {
      for (var _i = 0, _a = Array.from(this.waiters); _i < _a.length; _i++) { _a[_i][1].reject(new Error("Disconnected")); }
      this.waiters.clear();
      this.state = "DISCONNECTED";
      this.socket.close().catch(function() {});
      this.cipher = null;
      this.mac = null;
      this.recvBuf = new Uint8Array(0);
      this.sendSeq = 0;
      this.recvSeq = 0;
      this.sessionId = null;
      this.channels.clear();
      this.dataCallbacks = [];
      this.nextChanId = 0;
    }
    getServerVersion() { return this.serverVersion; }
    isConnected() { return this.state === "CONNECTED"; }
    onChannelData(cb) { this.dataCallbacks.push(cb); }
  };

  return __toCommonJS(transport_exports);
})();
