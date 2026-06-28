class ManagerCommon {
    constructor() {
        this.logContainer = null;
        this.maxLogs = 100;
        this.config = {
            iconPrefix: 'https://api.afmax.cn/so/ico/index.php?r=',
            defaultIcon: '../../img/index.png',
            corsProxy: 'https://api.allorigins.win/raw?url='
        };
        this.init();
    }

    init() {
        const setup = () => { this.initProgressBar(); this.initErrorHandling(); this.initLogSystem(); this.initSyncLock(); };
        document.readyState === 'loading'
            ? document.addEventListener('DOMContentLoaded', setup)
            : setup();
    }

    // --- 同步锁定 ---

    initSyncLock() {
        this.syncLockKey = 'github_sync_lock_time';
        this.syncLockDuration = 5 * 60 * 1000;
        this.syncLockTimer = null;
        this.checkSyncLock();
        window.addEventListener('storage', (e) => { if (e.key === this.syncLockKey) this.checkSyncLock(); });
    }

    checkSyncLock() {
        const lockTime = localStorage.getItem(this.syncLockKey);
        if (!lockTime) return this.removeSyncOverlay();

        const elapsed = Date.now() - parseInt(lockTime);
        if (elapsed < this.syncLockDuration) {
            this.applySyncOverlay(this.syncLockDuration - elapsed);
            if (this.syncLockTimer) clearInterval(this.syncLockTimer);
            this.syncLockTimer = setInterval(() => {
                const cur = Date.now() - parseInt(lockTime);
                cur >= this.syncLockDuration ? (clearInterval(this.syncLockTimer), this.removeSyncOverlay()) : this.updateSyncOverlay(this.syncLockDuration - cur);
            }, 1000);
        } else {
            this.removeSyncOverlay();
        }
    }

    lockSync() {
        localStorage.setItem(this.syncLockKey, Date.now().toString());
        this.checkSyncLock();
    }

    getSyncButtons() {
        return [document.getElementById('githubSaveBtn'), document.getElementById('syncToGithubBtn')].filter(Boolean);
    }

    applySyncOverlay(remainingMs) {
        this.getSyncButtons().forEach(btn => {
            btn.disabled = true;
            const container = btn.closest('.card') || btn.parentElement;
            if (!container) return;
            if (window.getComputedStyle(container).position === 'static') container.style.position = 'relative';

            let overlay = container.querySelector('.sync-lock-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'sync-lock-overlay';
                overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);color:white;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:1000;border-radius:inherit;backdrop-filter:blur(2px);transition:opacity 0.3s ease;pointer-events:all;';
                overlay.innerHTML = '<i class="fas fa-clock mb-2" style="font-size:1.5rem"></i><div class="sync-lock-text" style="font-weight:bold"></div><small style="opacity:0.8">同步功能冷却中</small>';
                container.appendChild(overlay);
            }
            this.updateSyncOverlay(remainingMs, overlay);
        });
    }

    updateSyncOverlay(remainingMs, specificOverlay = null) {
        const s = Math.ceil(remainingMs / 1000);
        const timeStr = `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
        const overlays = specificOverlay ? [specificOverlay] : document.querySelectorAll('.sync-lock-overlay');
        overlays.forEach(o => { const t = o.querySelector('.sync-lock-text'); if (t) t.textContent = timeStr; });
    }

    removeSyncOverlay() {
        this.getSyncButtons().forEach(btn => btn.disabled = false);
        document.querySelectorAll('.sync-lock-overlay').forEach(o => {
            o.style.opacity = '0';
            setTimeout(() => o.remove(), 300);
        });
        if (this.syncLockTimer) { clearInterval(this.syncLockTimer); this.syncLockTimer = null; }
    }

    // --- 进度条 ---

    initProgressBar() {
        const wrap = document.createElement('div');
        wrap.className = 'progress-container';
        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        wrap.appendChild(bar);
        document.body.appendChild(wrap);

        window.addEventListener('load', () => {
            bar.style.width = '100%';
            setTimeout(() => { wrap.style.opacity = '0'; setTimeout(() => wrap.remove(), 300); }, 500);
        });

        let progress = 0;
        const iv = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 70) clearInterval(iv);
            bar.style.width = `${Math.min(progress, 100)}%`;
        }, 200);
    }

    // --- 错误处理 ---

    initErrorHandling() {
        window.addEventListener('error', (e) => this.handleError(e.error || new Error(e.message), '全局JavaScript错误'));
        window.addEventListener('unhandledrejection', (e) => this.handleError(e.reason || new Error('未处理的Promise错误'), '未处理的Promise错误'));
    }

    handleError(error, context) {
        const msg = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : '';
        console.error(`[${context}] ${msg}`, error);
        this.log(`错误: ${context} - ${msg}`, 'error', stack);
        this.showToast(`发生错误: ${msg}`, 'error');
    }

    // --- 日志系统 ---

    initLogSystem() {
        this.logContainer = document.getElementById('logContainer') || document.getElementById('log-container');
        if (!this.logContainer && !document.querySelector('[data-no-log-system]')) {
            const body = document.querySelector('#logOffcanvas .offcanvas-body');
            if (body) {
                this.logContainer = document.createElement('div');
                this.logContainer.id = 'logContainer';
                this.logContainer.className = 'log-container-shared';
                body.insertBefore(this.logContainer, body.firstChild);
            }
        }
        const clearBtn = document.getElementById('clearLogsBtn');
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearLogs());
    }

    clearLogs() {
        if (this.logContainer) { this.logContainer.innerHTML = ''; this.log('日志已清空', 'info'); }
    }

    log(message, level = 'info', details = '') {
        if (!this.logContainer) return;
        const levels = ['info', 'success', 'warning', 'error'];
        level = levels.includes(level) ? level : 'info';

        const ts = new Date().toLocaleString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' });
        const entry = document.createElement('div');
        entry.className = `log-entry ${level}`;
        entry.setAttribute('data-timestamp', ts);

        const header = document.createElement('div');
        header.className = 'log-header';
        header.innerHTML = `<span class="log-time">${ts}</span><span class="log-level ${level}">${this.getLevelText(level)}</span><span class="log-message">${message}</span>`;
        entry.appendChild(header);

        if (details) {
            const content = document.createElement('div');
            content.className = 'log-content';
            content.textContent = details;
            entry.appendChild(content);
        }

        this.logContainer.insertBefore(entry, this.logContainer.firstChild);
        this.limitLogEntries();
        setTimeout(() => entry.classList.add('fade-in'), 10);
    }

    getLevelText(level) {
        return { info:'信息', success:'成功', warning:'警告', error:'错误' }[level] || '信息';
    }

    limitLogEntries() {
        if (!this.logContainer) return;
        const entries = this.logContainer.querySelectorAll('.log-entry');
        for (let i = this.maxLogs; i < entries.length; i++) entries[i].remove();
    }

    // --- UI 提示 ---

    showAlert(message, type = 'info', duration = 3000) { this.showToast(message, type, duration); }

    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `feedback-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('fade-in'), 10);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, duration);
    }

    showLoadingOverlay(message = '加载中...') { this.showLoading(message); }
    hideLoadingOverlay() { this.hideLoading(); }

    showLoading(message = '加载中...') {
        let overlay = document.querySelector('.loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="loading-content"><div class="loading-spinner"></div><div class="loading-text"></div></div>';
            document.body.appendChild(overlay);
        }
        const text = overlay.querySelector('.loading-text');
        if (text) text.textContent = message;
        setTimeout(() => overlay.style.opacity = '1', 10);
    }

    hideLoading() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 300); }
    }

    // --- 数据验证 ---

    validateData(data, schema) {
        const errors = [];
        for (const [key, rules] of Object.entries(schema)) {
            const val = data[key];
            if (rules.required && (val === undefined || val === null || val === '')) { errors.push(`${key} 是必填项`); continue; }
            if (val !== undefined && val !== null) {
                if (rules.type && typeof val !== rules.type) errors.push(`${key} 必须是 ${rules.type} 类型`);
                if (rules.validator && rules.validator(val) !== true) {
                    const r = rules.validator(val);
                    errors.push(typeof r === 'string' ? r : `${key} 验证失败`);
                }
            }
        }
        return { isValid: errors.length === 0, errors };
    }

    // --- 工具函数 ---

    debounce(fn, wait) {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
    }

    throttle(fn, limit) {
        let inThrottle;
        return (...args) => {
            if (inThrottle) return;
            fn(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        };
    }

    // --- Cookie ---

    static Cookie = {
        set(name, value, days) {
            const expires = days ? `; expires=${new Date(Date.now() + days * 864e5).toUTCString()}` : '';
            document.cookie = `${name}=${value || ''}${expires}; path=/`;
        },

        get(name) {
            const prefix = name + '=';
            for (const c of document.cookie.split(';')) {
                const trimmed = c.trim();
                if (trimmed.startsWith(prefix)) return trimmed.substring(prefix.length);
            }
            return null;
        },

        delete(name) { this.set(name, '', -1); }
    };

    // --- AES ---

    static AES = {
        async _deriveKey(password, usage) {
            const enc = new TextEncoder();
            const key = await crypto.subtle.importKey('raw', enc.encode(password.padEnd(32, ' ')), { name: 'PBKDF2' }, false, ['deriveKey']);
            return crypto.subtle.deriveKey(
                { name: 'PBKDF2', salt: usage.salt, iterations: 100000, hash: 'SHA-256' },
                key, { name: 'AES-CBC', length: 256 }, false, [usage.op]
            );
        },

        async encrypt(text, password) {
            const enc = new TextEncoder();
            const iv = crypto.getRandomValues(new Uint8Array(16));
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const derivedKey = await this._deriveKey(password, { salt, op: 'encrypt' });
            const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, derivedKey, enc.encode(text));
            const data = new Uint8Array(encrypted);
            const combined = new Uint8Array(salt.length + iv.length + data.length);
            combined.set(salt, 0);
            combined.set(iv, salt.length);
            combined.set(data, salt.length + iv.length);
            return btoa(String.fromCharCode(...combined));
        },

        async decrypt(encryptedData, password) {
            const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
            const salt = combined.slice(0, 16);
            const iv = combined.slice(16, 32);
            const derivedKey = await this._deriveKey(password, { salt, op: 'decrypt' });
            const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, derivedKey, combined.slice(32));
            return new TextDecoder().decode(decrypted);
        }
    };

    // --- GitHub 同步 ---

    async syncToGithub(path, data, message = 'Update data via Web Manager') {
        if (!window.githubHelper) { this.handleError(new Error('GitHub API 助手未加载'), 'GitHub 同步'); return null; }
        try {
            this.showLoading('正在同步到 GitHub...');
            const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
            const result = await window.githubHelper.updateFile(path, content, message);
            this.hideLoading();
            this.showToast('同步成功！数据已更新到仓库。', 'success');
            this.log('GitHub 同步成功', 'success', `路径: ${path}`);
            this.lockSync();
            return result;
        } catch (error) {
            this.hideLoading();
            this.handleError(error, 'GitHub 同步');
            return null;
        }
    }

    async getFromGithub(path) {
        if (!window.githubHelper) { this.handleError(new Error('GitHub API 助手未加载'), 'GitHub 加载'); return null; }
        try {
            this.log(`正在从 GitHub 加载: ${path}`, 'info');
            const response = await window.githubHelper.getFile(path);
            if (response?.content) {
                const bytes = Uint8Array.from(atob(response.content), c => c.charCodeAt(0));
                return JSON.parse(new TextDecoder('utf-8').decode(bytes));
            }
            return null;
        } catch (error) {
            if (error.message.includes('404')) { this.log(`GitHub 文件不存在 (404): ${path}`, 'warning'); return null; }
            this.handleError(error, 'GitHub 加载');
            return null;
        }
    }

    // --- URL 标题获取 ---

    async fetchWebsiteTitle(url) {
        try {
            const res = await fetch(this.config.corsProxy + encodeURIComponent(url), { headers: { Accept: 'text/html' } });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const m = (await res.text()).match(/<title[^>]*>([^<]+)<\/title>/i);
            return m?.[1]?.trim().replace(/[\t\n\r]+/g, ' ') || null;
        } catch (e) {
            console.error('获取网站标题失败:', e);
            return null;
        }
    }

    async extractSiteNameFromUrl(url) {
        const title = await this.fetchWebsiteTitle(url);
        if (title) return title.length > 30 ? title.substring(0, 30) + '...' : title;
        try {
            const { hostname } = new URL(url);
            const h = hostname.replace(/^www\./, '');
            const parts = h.split('.');
            if (parts.length >= 3 && ['cn', 'net', 'org'].includes(parts.at(-1))) return parts.at(-3);
            if (parts.length >= 2) return parts.at(-2);
            return h;
        } catch {
            return url.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '').split('.')[0];
        }
    }
}

const managerCommon = new ManagerCommon();
window.managerCommon = managerCommon;
window.ManagerCommon = ManagerCommon;

document.addEventListener('DOMContentLoaded', () => managerCommon.log('页面加载完成', 'success'));
