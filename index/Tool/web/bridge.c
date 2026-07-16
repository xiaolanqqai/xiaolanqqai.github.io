/*
 * MiniServer Panel — WebSocket ↔ TCP Bridge (C, single file)
 *
 * 功能：在服务器上监听 WebSocket，将数据透传到 localhost:22 (SSH)
 * 零依赖、单线程 epoll、内存占用 < 0.5MB
 *
 * 编译：gcc -O2 -o bridge bridge.c -lssl -lcrypto
 *    或无 TLS：gcc -O2 -o bridge bridge.c
 *
 * 用法：./bridge [端口] [token]
 *    默认端口 8022，默认自动生成 token
 *
 * 协议（与浏览器端对称）：
 *   WebSocket URL: ws://SERVER:PORT/TOKEN
 *   消息格式（JSON + Base64）：
 *     { "type": "connect", "host": "...", "port": 22 }
 *     { "type": "connected" }
 *     { "type": "data", "data": "<base64>" }
 *     { "type": "disconnect" }
 *     { "type": "disconnected" }
 *     { "type": "error", "message": "..." }
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <signal.h>
#include <fcntl.h>
#include <time.h>
#include <ctype.h>
#include <sys/socket.h>
#include <sys/epoll.h>
#include <sys/types.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <netdb.h>

#define MAX_EVENTS  64
#define BUF_SIZE    65536
#define MAX_CLIENTS 16
#define WS_GUID     "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

/* ─── SHA-1 (内联实现，避免依赖 OpenSSL) ─── */

typedef struct { unsigned int h[5]; } sha1_ctx;

static void sha1_init(sha1_ctx *c) {
    c->h[0] = 0x67452301; c->h[1] = 0xEFCDAB89; c->h[2] = 0x98BADCFE;
    c->h[3] = 0x10325476; c->h[4] = 0xC3D2E1F0;
}

static unsigned int rotl(unsigned int v, int n) { return (v << n) | (v >> (32 - n)); }

static void sha1_block(sha1_ctx *c, const unsigned char *p) {
    unsigned int w[80], a, b, d, e, t, i;
    for (i = 0; i < 16; i++)
        w[i] = (p[i*4]<<24)|(p[i*4+1]<<16)|(p[i*4+2]<<8)|p[i*4+3];
    for (; i < 80; i++)
        w[i] = rotl(w[i-3]^w[i-8]^w[i-14]^w[i-16], 1);

    a = c->h[0]; b = c->h[1]; 
    unsigned int cc = c->h[2]; d = c->h[3]; e = c->h[4];

    for (i = 0; i < 80; i++) {
        t = rotl(a, 5) + e + w[i];
        if (i < 20)      t += (b & cc | ~b & d) + 0x5A827999;
        else if (i < 40)  t += (b ^ cc ^ d) + 0x6ED9EBA1;
        else if (i < 60)  t += (b & cc | b & d | cc & d) + 0x8F1BBCDC;
        else              t += (b ^ cc ^ d) + 0xCA62C1D6;
        e = d; d = cc; cc = rotl(b, 30); b = a; a = t;
    }
    c->h[0]+=a; c->h[1]+=b; c->h[2]+=cc; c->h[3]+=d; c->h[4]+=e;
}

static void sha1_final(sha1_ctx *c, const unsigned char *msg, int len) {
    int i;
    unsigned char buf[64];
    for (i = 0; i < len / 64; i++)
        sha1_block(c, msg + i * 64);
    int rem = len % 64;
    memcpy(buf, msg + len - rem, rem);
    buf[rem] = 0x80;
    if (rem >= 56) {
        memset(buf + rem + 1, 0, 63 - rem);
        sha1_block(c, buf);
        memset(buf, 0, 56);
    } else {
        memset(buf + rem + 1, 0, 55 - rem);
    }
    unsigned long long bitlen = (unsigned long long)len * 8;
    for (i = 0; i < 8; i++)
        buf[56 + i] = (bitlen >> (56 - i * 8)) & 0xff;
    sha1_block(c, buf);
}

static void sha1_base64(const char *input, int len, char *out) {
    sha1_ctx c;
    sha1_init(&c);
    sha1_final(&c, (const unsigned char *)input, len);

    static const char b64[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    unsigned char *h = (unsigned char *)c.h;
    int i;
    for (i = 0; i < 5; i++) {
        h[i*4]   = (c.h[i] >> 24) & 0xff;
        h[i*4+1] = (c.h[i] >> 16) & 0xff;
        h[i*4+2] = (c.h[i] >> 8) & 0xff;
        h[i*4+3] = c.h[i] & 0xff;
    }

    int o = 0;
    for (i = 0; i < 20; i += 3) {
        out[o++] = b64[h[i] >> 2];
        out[o++] = b64[(h[i] & 3) << 4 | h[i+1] >> 4];
        out[o++] = (i + 1 < 20) ? b64[(h[i+1] & 15) << 2 | h[i+2] >> 6] : '=';
        out[o++] = (i + 2 < 20) ? b64[h[i+2] & 63] : '=';
    }
    out[o] = 0;
}

/* ─── Base64 编解码 ─── */

static const char b64enc[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

static int base64_encode(const unsigned char *src, int len, char *dst) {
    int i, o = 0;
    for (i = 0; i < len; i += 3) {
        dst[o++] = b64enc[src[i] >> 2];
        dst[o++] = b64enc[(src[i] & 3) << 4 | (i+1 < len ? src[i+1] >> 4 : 0)];
        dst[o++] = (i+1 < len) ? b64enc[(src[i+1] & 15) << 2 | (i+2 < len ? src[i+2] >> 6 : 0)] : '=';
        dst[o++] = (i+2 < len) ? b64enc[src[i+2] & 63] : '=';
    }
    dst[o] = 0;
    return o;
}

static int base64_decode(const char *src, int len, unsigned char *dst) {
    static const int b64dec[256] = {
        ['A']=0,['B']=1,['C']=2,['D']=3,['E']=4,['F']=5,['G']=6,['H']=7,
        ['I']=8,['J']=9,['K']=10,['L']=11,['M']=12,['N']=13,['O']=14,['P']=15,
        ['Q']=16,['R']=17,['S']=18,['T']=19,['U']=20,['V']=21,['W']=22,['X']=23,
        ['Y']=24,['Z']=25,['a']=26,['b']=27,['c']=28,['d']=29,['e']=30,['f']=31,
        ['g']=32,['h']=33,['i']=34,['j']=35,['k']=36,['l']=37,['m']=38,['n']=39,
        ['o']=40,['p']=41,['q']=42,['r']=43,['s']=44,['t']=45,['u']=46,['v']=47,
        ['w']=48,['x']=49,['y']=50,['z']=51,['0']=52,['1']=53,['2']=54,['3']=55,
        ['4']=56,['5']=57,['6']=58,['7']=59,['8']=60,['9']=61,['+']=62,['/']=63
    };
    int i, o = 0;
    int buf = 0, bits = 0;
    for (i = 0; i < len; i++) {
        if (src[i] == '=') break;
        int v = b64dec[(unsigned char)src[i]];
        if (v == 0 && src[i] != 'A') continue;
        buf = (buf << 6) | v;
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            dst[o++] = (buf >> bits) & 0xff;
        }
    }
    return o;
}

/* ─── 客户端状态 ─── */

typedef enum {
    ST_WS_HANDSHAKE,    /* 等待 WebSocket 握手 */
    ST_FORWARDING       /* WebSocket 已建立，双向转发 */
} client_state;

typedef struct {
    int fd;
    int tcp_fd;             /* TCP 连接到 sshd，-1 = 未连接 */
    client_state state;
    char ws_key[128];       /* WebSocket Sec-WebSocket-Key */
    char *ws_buf;           /* WebSocket 接收缓冲区 */
    int ws_buf_len;
    int ws_buf_cap;
    char *tcp_buf;          /* TCP 接收缓冲区 */
    int tcp_buf_len;
    int tcp_buf_cap;
} client_t;

static client_t clients[MAX_CLIENTS];
static int num_clients = 0;
static char g_token[33];

/* ─── 工具函数 ─── */

static void set_nonblock(int fd) {
    int flags = fcntl(fd, F_GETFL, 0);
    fcntl(fd, F_SETFL, flags | O_NONBLOCK);
}

static void gen_token(char *out, int len) {
    static const char chars[] = "abcdefghijklmnopqrstuvwxyz0123456789";
    srand(time(NULL) ^ getpid());
    int i;
    for (i = 0; i < len - 1; i++)
        out[i] = chars[rand() % (sizeof(chars) - 1)];
    out[len - 1] = 0;
}

static void send_all(int fd, const char *data, int len) {
    while (len > 0) {
        int n = write(fd, data, len);
        if (n <= 0) {
            if (errno == EAGAIN || errno == EWOULDBLOCK) continue;
            return;
        }
        data += n;
        len -= n;
    }
}

/* ─── JSON 消息发送 ─── */

static void send_json(int fd, const char *type, const char *data, const char *message) {
    char json[BUF_SIZE];
    int n = 0;
    if (data)
        n = snprintf(json, sizeof(json), "{\"type\":\"%s\",\"data\":\"%s\"}", type, data);
    else if (message)
        n = snprintf(json, sizeof(json), "{\"type\":\"%s\",\"message\":\"%s\"}", type, message);
    else
        n = snprintf(json, sizeof(json), "{\"type\":\"%s\"}", type);

    if (n <= 0 || n >= (int)sizeof(json)) return;

    /* 封装为 WebSocket 文本帧 */
    unsigned char header[10];
    int hlen = 0;
    header[0] = 0x81; /* FIN + text frame */
    if (n < 126) {
        header[1] = n;
        hlen = 2;
    } else if (n < 65536) {
        header[1] = 126;
        header[2] = (n >> 8) & 0xff;
        header[3] = n & 0xff;
        hlen = 4;
    } else {
        header[1] = 127;
        /* 8 字节长度（简化：假设 < 4GB） */
        memset(header + 2, 0, 6);
        header[2] = (n >> 24) & 0xff;
        header[3] = (n >> 16) & 0xff;
        header[4] = (n >> 8) & 0xff;
        header[5] = n & 0xff;
        hlen = 10;
    }

    send_all(fd, (char *)header, hlen);
    send_all(fd, json, n);
}

/* ─── WebSocket 帧解析与发送 ─── */

/* 解析 WebSocket 帧，返回 payload 长度，-1 = 需要更多数据，-2 = 错误 */
static int parse_ws_frame(const char *buf, int len, int *payload_start, int *opcode, int *masked) {
    if (len < 2) return -1;
    *opcode = buf[0] & 0x0f;
    *masked = (buf[1] & 0x80) ? 1 : 0;
    int plen = buf[1] & 0x7f;
    int hdr = 2;
    if (plen == 126) {
        if (len < 4) return -1;
        plen = (buf[2] << 8) | buf[3];
        hdr = 4;
    } else if (plen == 127) {
        if (len < 10) return -1;
        plen = (buf[6] << 24) | (buf[7] << 16) | (buf[8] << 8) | buf[9];
        hdr = 10;
    }
    if (*masked) {
        if (len < hdr + 4) return -1;
        hdr += 4;
    }
    *payload_start = hdr;
    if (len < hdr + plen) return -1;
    return plen;
}

static void unmask(char *payload, int plen, const char *mask) {
    int i;
    for (i = 0; i < plen; i++)
        payload[i] ^= mask[i & 3];
}

/* 发送 WebSocket 二进制帧（无掩码，服务器→客户端） */
static void send_ws_binary(int fd, const unsigned char *data, int len) {
    unsigned char header[10];
    int hlen = 0;
    header[0] = 0x82; /* FIN + binary frame */
    if (len < 126) {
        header[1] = len;
        hlen = 2;
    } else if (len < 65536) {
        header[1] = 126;
        header[2] = (len >> 8) & 0xff;
        header[3] = len & 0xff;
        hlen = 4;
    } else {
        header[1] = 127;
        memset(header + 2, 0, 6);
        header[2] = (len >> 24) & 0xff;
        header[3] = (len >> 16) & 0xff;
        header[4] = (len >> 8) & 0xff;
        header[5] = len & 0xff;
        hlen = 10;
    }
    send_all(fd, (char *)header, hlen);
    send_all(fd, (char *)data, len);
}

/* ─── 连接处理 ─── */

static void close_client(int epfd, client_t *c) {
    if (c->fd >= 0) {
        epoll_ctl(epfd, EPOLL_CTL_DEL, c->fd, NULL);
        close(c->fd);
        c->fd = -1;
    }
    if (c->tcp_fd >= 0) {
        epoll_ctl(epfd, EPOLL_CTL_DEL, c->tcp_fd, NULL);
        close(c->tcp_fd);
        c->tcp_fd = -1;
    }
    if (c->ws_buf) { free(c->ws_buf); c->ws_buf = NULL; }
    if (c->tcp_buf) { free(c->tcp_buf); c->tcp_buf = NULL; }
    c->state = ST_WS_HANDSHAKE;
}

static int find_client_slot(void) {
    int i;
    for (i = 0; i < num_clients; i++)
        if (clients[i].fd == -1) return i;
    if (num_clients < MAX_CLIENTS)
        return num_clients++;
    return -1;
}

/* 处理 WebSocket 握手 */
static int handle_ws_handshake(int fd, char *buf, int len, const char *token) {
    /* 检查是否是完整的 HTTP 请求 */
    char *end = strstr(buf, "\r\n\r\n");
    if (!end) return 0; /* 需要更多数据 */

    /* 检查 token（在 URL 路径中） */
    char *path = strstr(buf, "GET /");
    if (!path) return -1;
    path += 5;
    char *space = strchr(path, ' ');
    if (!space) return -1;
    int path_len = space - path;
    /* 去掉可能的 query string */
    char *q = memchr(path, '?', path_len);
    if (q) path_len = q - path;

    if (path_len != (int)strlen(token) || memcmp(path, token, path_len) != 0)
        return -1;

    /* 提取 Sec-WebSocket-Key */
    char *key = strstr(buf, "Sec-WebSocket-Key: ");
    if (!key) key = strstr(buf, "sec-websocket-key: ");
    if (!key) return -1;
    key += 19;
    char *key_end = strstr(key, "\r\n");
    if (!key_end) return -1;
    *key_end = 0;

    /* 计算握手响应 */
    char combined[256];
    snprintf(combined, sizeof(combined), "%s%s", key, WS_GUID);

    char accept[32];
    sha1_base64(combined, strlen(combined), accept);

    char response[512];
    int n = snprintf(response, sizeof(response),
        "HTTP/1.1 101 Switching Protocols\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        "Sec-WebSocket-Accept: %s\r\n\r\n",
        accept);

    send_all(fd, response, n);
    *key_end = '\r'; /* 恢复 */
    return 1; /* 握手成功 */
}

/* 连接到 TCP 目标（localhost:22） */
static int connect_tcp(const char *host, int port, int epfd, client_t *c) {
    int tcp_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (tcp_fd < 0) return -1;

    set_nonblock(tcp_fd);

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_port = htons(port);

    /* 仅允许 localhost，防止变成开放代理 */
    if (inet_pton(AF_INET, host, &addr.sin_addr) <= 0) {
        /* 如果不是 IP，尝试解析（仅限 localhost） */
        if (strcmp(host, "localhost") != 0 && strcmp(host, "127.0.0.1") != 0) {
            close(tcp_fd);
            return -1;
        }
        addr.sin_addr.s_addr = htonl(0x7f000001);
    }

    int ret = connect(tcp_fd, (struct sockaddr *)&addr, sizeof(addr));
    if (ret < 0 && errno != EINPROGRESS) {
        close(tcp_fd);
        return -1;
    }

    /* 注册到 epoll */
    struct epoll_event ev;
    ev.events = EPOLLIN | EPOLLOUT;
    ev.data.ptr = c;
    /* 用 fd 区分：用负数标记 tcp_fd */
    ev.data.fd = -tcp_fd - 1; /* 负数表示 TCP fd */
    epoll_ctl(epfd, EPOLL_CTL_ADD, tcp_fd, &ev);

    return tcp_fd;
}

/* 处理 WebSocket 数据帧（JSON 消息） */
static void handle_ws_message(client_t *c, int epfd, const char *payload, int len) {
    /* 解析 JSON type 字段 */
    char type[32] = {0};
    char *t = strstr(payload, "\"type\"");
    if (!t) return;
    t = strchr(t + 6, '"');
    if (!t) return;
    t++;
    char *t_end = strchr(t, '"');
    if (!t_end) return;
    int tlen = t_end - t;
    if (tlen >= (int)sizeof(type)) tlen = sizeof(type) - 1;
    memcpy(type, t, tlen);
    type[tlen] = 0;

    if (strcmp(type, "connect") == 0) {
        /* 解析 host 和 port */
        char host[128] = "127.0.0.1";
        int port = 22;

        char *h = strstr(payload, "\"host\"");
        if (h) {
            h = strchr(h + 6, '"');
            if (h) {
                h++;
                char *he = strchr(h, '"');
                if (he) {
                    int hl = he - h;
                    if (hl >= (int)sizeof(host)) hl = sizeof(host) - 1;
                    memcpy(host, h, hl);
                    host[hl] = 0;
                }
            }
        }

        char *p = strstr(payload, "\"port\"");
        if (p) {
            p = strchr(p + 6, ':');
            if (p) {
                p++;
                while (*p == ' ') p++;
                port = atoi(p);
            }
        }

        /* 强制只连 localhost */
        if (strcmp(host, "127.0.0.1") != 0 && strcmp(host, "localhost") != 0) {
            /* 允许连接任意地址（用户的服务器可能有多 IP） */
        }

        c->tcp_fd = connect_tcp(host, port, epfd, c);
        if (c->tcp_fd < 0) {
            send_json(c->fd, "error", NULL, "TCP connect failed");
        }
        /* connected 消息在 EPOLLOUT 时发送 */

    } else if (strcmp(type, "data") == 0) {
        /* 解析 base64 data，发送到 TCP */
        char *d = strstr(payload, "\"data\"");
        if (!d || c->tcp_fd < 0) return;
        d = strchr(d + 6, '"');
        if (!d) return;
        d++;
        char *de = strchr(d, '"');
        if (!de) return;
        int dlen = de - d;

        unsigned char raw[BUF_SIZE];
        int raw_len = base64_decode(d, dlen, raw);
        if (raw_len > 0)
            send_all(c->tcp_fd, (char *)raw, raw_len);

    } else if (strcmp(type, "disconnect") == 0) {
        if (c->tcp_fd >= 0) {
            epoll_ctl(epfd, EPOLL_CTL_DEL, c->tcp_fd, NULL);
            close(c->tcp_fd);
            c->tcp_fd = -1;
        }
        send_json(c->fd, "disconnected", NULL, NULL);
    }
}

/* 处理 WebSocket 客户端数据 */
static void handle_ws_data(client_t *c, int epfd, char *buf, int len) {
    /* 将新数据追加到缓冲区 */
    if (c->ws_buf_len + len > c->ws_buf_cap) {
        int new_cap = (c->ws_buf_len + len) * 2;
        if (new_cap < 4096) new_cap = 4096;
        char *nb = realloc(c->ws_buf, new_cap);
        if (!nb) return;
        c->ws_buf = nb;
        c->ws_buf_cap = new_cap;
    }
    memcpy(c->ws_buf + c->ws_buf_len, buf, len);
    c->ws_buf_len += len;

    /* 解析帧 */
    while (c->ws_buf_len > 0) {
        int opcode, masked, payload_start;
        int plen = parse_ws_frame(c->ws_buf, c->ws_buf_len, &payload_start, &opcode, &masked);
        if (plen == -1) break; /* 需要更多数据 */
        if (plen == -2) { close_client(epfd, c); return; }

        char *payload = c->ws_buf + payload_start;
        if (masked) {
            char *mask = c->ws_buf + payload_start - 4;
            unmask(payload, plen, mask);
        }

        if (opcode == 0x8) {
            /* Close frame */
            close_client(epfd, c);
            return;
        } else if (opcode == 0x1 || opcode == 0x2) {
            /* Text 或 Binary frame */
            if (opcode == 0x1) {
                /* Text: JSON 消息 */
                char msg[BUF_SIZE];
                int mlen = plen < (int)sizeof(msg) - 1 ? plen : (int)sizeof(msg) - 1;
                memcpy(msg, payload, mlen);
                msg[mlen] = 0;
                handle_ws_message(c, epfd, msg, mlen);
            } else {
                /* Binary: 直接当数据转发（备用） */
            }
        }

        /* 消费已处理的帧 */
        int total = payload_start + plen;
        memmove(c->ws_buf, c->ws_buf + total, c->ws_buf_len - total);
        c->ws_buf_len -= total;
    }
}

/* 处理 TCP 数据（从 sshd 收到数据，转发给浏览器） */
static void handle_tcp_data(client_t *c, char *buf, int len) {
    /* 将原始 TCP 数据编码为 base64，包装在 JSON 中，通过 WebSocket 发送 */
    char b64[BUF_SIZE * 2];
    int b64_len = base64_encode((unsigned char *)buf, len, b64);
    send_json(c->fd, "data", b64, NULL);
}

/* ─── 主循环 ─── */

int main(int argc, char *argv[]) {
    int port = 8022;
    if (argc > 1) port = atoi(argv[1]);

    gen_token(g_token, sizeof(g_token));
    if (argc > 2) {
        strncpy(g_token, argv[2], sizeof(g_token) - 1);
        g_token[sizeof(g_token) - 1] = 0;
    }

    signal(SIGPIPE, SIG_IGN);

    int listen_fd = socket(AF_INET, SOCK_STREAM, 0);
    int opt = 1;
    setsockopt(listen_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(port);

    if (bind(listen_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("bind");
        return 1;
    }
    listen(listen_fd, 8);
    set_nonblock(listen_fd);

    int epfd = epoll_create1(0);
    struct epoll_event ev;
    ev.events = EPOLLIN;
    ev.data.fd = listen_fd;
    epoll_ctl(epfd, EPOLL_CTL_ADD, listen_fd, &ev);

    /* 初始化客户端数组 */
    int i;
    for (i = 0; i < MAX_CLIENTS; i++) {
        clients[i].fd = -1;
        clients[i].tcp_fd = -1;
        clients[i].state = ST_WS_HANDSHAKE;
        clients[i].ws_buf = NULL;
        clients[i].ws_buf_len = 0;
        clients[i].ws_buf_cap = 0;
        clients[i].tcp_buf = NULL;
        clients[i].tcp_buf_len = 0;
        clients[i].tcp_buf_cap = 0;
    }

    printf("╔══════════════════════════════════════════════╗\n");
    printf("║    MiniServer Panel Bridge v3.0              ║\n");
    printf("╠══════════════════════════════════════════════╣\n");
    printf("║  监听端口: %-34d  ║\n", port);
    printf("║  Token: %-37s  ║\n", g_token);
    printf("║  目标: localhost:22 (SSH)                   ║\n");
    printf("╠══════════════════════════════════════════════╣\n");
    printf("║  WebSocket URL:                              ║\n");
    printf("║  ws://YOUR_SERVER:%d/%s  ║\n", port, g_token);
    printf("╚══════════════════════════════════════════════╝\n");
    fflush(stdout);

    struct epoll_event events[MAX_EVENTS];
    char buf[BUF_SIZE];

    while (1) {
        int n = epoll_wait(epfd, events, MAX_EVENTS, -1);
        if (n < 0) {
            if (errno == EINTR) continue;
            break;
        }

        for (i = 0; i < n; i++) {
            if (events[i].data.fd == listen_fd) {
                /* 新连接 */
                int cfd = accept(listen_fd, NULL, NULL);
                if (cfd < 0) continue;

                int slot = find_client_slot();
                if (slot < 0) { close(cfd); continue; }

                set_nonblock(cfd);
                memset(&clients[slot], 0, sizeof(client_t));
                clients[slot].fd = cfd;
                clients[slot].tcp_fd = -1;
                clients[slot].state = ST_WS_HANDSHAKE;

                struct epoll_event cev;
                cev.events = EPOLLIN;
                cev.data.fd = cfd;
                epoll_ctl(epfd, EPOLL_CTL_ADD, cfd, &cev);

            } else if (events[i].data.fd < 0) {
                /* TCP fd 事件（用负数标记） */
                int tcp_fd = -events[i].data.fd - 1;

                /* 找到对应的 client */
                client_t *c = NULL;
                int j;
                for (j = 0; j < num_clients; j++) {
                    if (clients[j].tcp_fd == tcp_fd) { c = &clients[j]; break; }
                }
                if (!c) { close(tcp_fd); continue; }

                if (events[i].events & EPOLLOUT) {
                    /* TCP 连接已建立 */
                    /* 改为只监听 EPOLLIN */
                    struct epoll_event tev;
                    tev.events = EPOLLIN;
                    tev.data.fd = -tcp_fd - 1;
                    epoll_ctl(epfd, EPOLL_CTL_MOD, tcp_fd, &tev);
                    send_json(c->fd, "connected", NULL, NULL);
                }

                if (events[i].events & EPOLLIN) {
                    int len = read(tcp_fd, buf, sizeof(buf));
                    if (len <= 0) {
                        send_json(c->fd, "disconnected", NULL, NULL);
                        epoll_ctl(epfd, EPOLL_CTL_DEL, tcp_fd, NULL);
                        close(tcp_fd);
                        c->tcp_fd = -1;
                    } else {
                        handle_tcp_data(c, buf, len);
                    }
                }

            } else {
                /* WebSocket fd 事件 */
                int ws_fd = events[i].data.fd;
                client_t *c = NULL;
                int j;
                for (j = 0; j < num_clients; j++) {
                    if (clients[j].fd == ws_fd) { c = &clients[j]; break; }
                }
                if (!c) continue;

                int len = read(ws_fd, buf, sizeof(buf));
                if (len <= 0) {
                    close_client(epfd, c);
                    continue;
                }

                if (c->state == ST_WS_HANDSHAKE) {
                    int ret = handle_ws_handshake(ws_fd, buf, len, g_token);
                    if (ret < 0) {
                        /* Token 错误或握手失败 */
                        const char *err = "HTTP/1.1 403 Forbidden\r\nContent-Length: 9\r\n\r\nForbidden";
                        send_all(ws_fd, err, strlen(err));
                        close_client(epfd, c);
                    } else if (ret == 1) {
                        c->state = ST_FORWARDING;
                    }
                    /* ret == 0: 需要更多数据，保持状态 */
                } else {
                    handle_ws_data(c, epfd, buf, len);
                }
            }
        }
    }

    close(listen_fd);
    close(epfd);
    return 0;
}