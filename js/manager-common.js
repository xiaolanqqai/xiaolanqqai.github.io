// 管理页面通用JavaScript功能

class ManagerCommon {
    constructor() {
        this.logContainer = null;
        this.maxLogs = 100; // 增加日志限制
        this.config = {
            iconPrefix: 'https://api.afmax.cn/so/ico/index.php?r=',
            defaultIcon: '../../img/index.png',
            corsProxy: 'https://api.allorigins.win/raw?url='
        };
        this.init();
    }

    init() {
        // 初始化页面加载进度条
        this.initProgressBar();
        
        // 初始化错误处理
        this.initErrorHandling();
        
        // 延迟初始化日志系统，确保DOM已加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initLogSystem());
        } else {
            this.initLogSystem();
        }
    }



    // 初始化页面加载进度条
    initProgressBar() {
        // 创建进度条元素
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        
        progressContainer.appendChild(progressBar);
        document.body.appendChild(progressContainer);
        
        // 监听页面加载进度
        window.addEventListener('load', () => {
            // 页面加载完成后完成进度条
            progressBar.style.width = '100%';
            
            // 延迟移除进度条
            setTimeout(() => {
                progressContainer.style.opacity = '0';
                setTimeout(() => {
                    progressContainer.remove();
                }, 300);
            }, 500);
        });
        
        // 模拟进度
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 70) {
                clearInterval(interval);
            }
            progressBar.style.width = `${Math.min(progress, 100)}%`;
        }, 200);
    }

    // 初始化错误处理
    initErrorHandling() {
        // 全局错误捕获
        window.addEventListener('error', (event) => {
            this.handleError(event.error || new Error(event.message), '全局JavaScript错误');
        });
        
        // Promise错误捕获
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason || new Error('未处理的Promise错误'), '未处理的Promise错误');
        });
    }

    // 初始化日志系统
    initLogSystem() {
        // 检查是否存在日志容器 (尝试寻找 ID 为 logContainer 或 log-container 的元素)
        this.logContainer = document.getElementById('logContainer') || document.getElementById('log-container');
        
        // 如果没有日志容器，且页面没有显式禁用日志系统，则尝试创建一个
        if (!this.logContainer && !document.querySelector('[data-no-log-system]')) {
            // 检查是否有 offcanvas 日志容器
            const offcanvasBody = document.querySelector('#logOffcanvas .offcanvas-body');
            if (offcanvasBody) {
                this.logContainer = document.createElement('div');
                this.logContainer.id = 'logContainer';
                this.logContainer.className = 'log-container-shared';
                offcanvasBody.insertBefore(this.logContainer, offcanvasBody.firstChild);
            }
        }

        // 绑定清空日志按钮
        const clearBtn = document.getElementById('clearLogsBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearLogs());
        }
    }

    // 清空日志
    clearLogs() {
        if (this.logContainer) {
            this.logContainer.innerHTML = '';
            this.log('日志已清空', 'info');
        }
    }

    // 共享工具：从 URL 获取网站标题
    async fetchWebsiteTitle(url) {
        try {
            const proxyUrl = this.config.corsProxy + encodeURIComponent(url);
            const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: { 'Accept': 'text/html' }
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            return titleMatch && titleMatch[1] ? titleMatch[1].trim().replace(/[\t\n\r]+/g, ' ') : null;
        } catch (error) {
            console.error('获取网站标题失败:', error);
            return null;
        }
    }

    // 共享工具：从 URL 提取网站名称
    async extractSiteNameFromUrl(url) {
        const title = await this.fetchWebsiteTitle(url);
        if (title) return title.length > 30 ? title.substring(0, 30) + '...' : title;
        
        try {
            const urlObj = new URL(url);
            let hostname = urlObj.hostname.replace(/^www\./, '');
            const parts = hostname.split('.');
            if (parts.length >= 2) {
                if (parts.length >= 3 && ['cn', 'net', 'org'].includes(parts[parts.length-1])) {
                    return parts[parts.length-3];
                }
                return parts[parts.length-2];
            }
            return hostname;
        } catch (e) {
            return url.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '').split('.')[0];
        }
    }

    // 错误处理
    handleError(error, context) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const stackTrace = error instanceof Error && error.stack ? error.stack : '';
        
        console.error(`[${context}] ${errorMessage}`, error);
        
        // 记录到日志系统
        this.log(`错误: ${context} - ${errorMessage}`, 'error', stackTrace);
        
        // 显示错误提示
        this.showToast(`发生错误: ${errorMessage}`, 'error');
    }

    // 记录日志
    log(message, level = 'info', details = '') {
        if (!this.logContainer) return;
        
        const levels = ['info', 'success', 'warning', 'error'];
        if (!levels.includes(level)) level = 'info';
        
        const timestamp = new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // 创建日志条目
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${level}`;
        logEntry.setAttribute('data-timestamp', timestamp);
        
        // 日志头部
        const logHeader = document.createElement('div');
        logHeader.className = 'log-header';
        logHeader.innerHTML = `
            <span class="log-time">${timestamp}</span>
            <span class="log-level ${level}">${this.getLevelText(level)}</span>
            <span class="log-message">${message}</span>
        `;
        
        logEntry.appendChild(logHeader);
        
        // 添加详细信息（如堆栈跟踪）
        if (details) {
            const logContent = document.createElement('div');
            logContent.className = 'log-content';
            logContent.textContent = details;
            logEntry.appendChild(logContent);
        }
        
        // 添加到日志容器（添加到顶部）
        this.logContainer.insertBefore(logEntry, this.logContainer.firstChild);
        
        // 限制日志数量
        this.limitLogEntries();
        
        // 添加动画效果
        setTimeout(() => {
            logEntry.classList.add('fade-in');
        }, 10);
    }

    // 获取日志级别文本
    getLevelText(level) {
        const levelMap = {
            info: '信息',
            success: '成功',
            warning: '警告',
            error: '错误'
        };
        return levelMap[level] || '信息';
    }

    // 限制日志条目数量
    limitLogEntries() {
        if (!this.logContainer) return;
        
        const logEntries = this.logContainer.querySelectorAll('.log-entry');
        if (logEntries.length > this.maxLogs) {
            // 移除多余的日志
            for (let i = this.maxLogs; i < logEntries.length; i++) {
                logEntries[i].remove();
            }
        }
    }

    // 显示提示信息 (别名)
    showAlert(message, type = 'info', duration = 3000) {
        this.showToast(message, type, duration);
    }

    // 显示提示信息
    showToast(message, type = 'info', duration = 3000) {
        // 创建提示元素
        const toast = document.createElement('div');
        toast.className = `feedback-toast ${type}`;
        toast.textContent = message;
        
        // 添加到页面
        document.body.appendChild(toast);
        
        // 添加动画效果
        setTimeout(() => {
            toast.classList.add('fade-in');
        }, 10);
        
        // 定时移除
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    }

    // 显示加载指示器 (别名)
    showLoadingOverlay(message = '加载中...') {
        this.showLoading(message);
    }

    // 隐藏加载指示器 (别名)
    hideLoadingOverlay() {
        this.hideLoading();
    }

    // 显示加载指示器
    showLoading(message = '加载中...') {
        // 检查是否已存在加载指示器
        let loadingOverlay = document.querySelector('.loading-overlay');
        if (!loadingOverlay) {
            // 创建加载遮罩
            loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            
            const loadingContent = document.createElement('div');
            loadingContent.className = 'loading-content';
            
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            
            const text = document.createElement('div');
            text.className = 'loading-text';
            text.textContent = message;
            
            loadingContent.appendChild(spinner);
            loadingContent.appendChild(text);
            loadingOverlay.appendChild(loadingContent);
            
            document.body.appendChild(loadingOverlay);
        } else {
            // 更新现有加载器的消息
            const text = loadingOverlay.querySelector('.loading-text');
            if (text) {
                text.textContent = message;
            }
        }
        
        // 添加显示动画
        setTimeout(() => {
            loadingOverlay.style.opacity = '1';
        }, 10);
    }

    // 隐藏加载指示器
    hideLoading() {
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.remove();
            }, 300);
        }
    }

    // 数据验证助手
    validateData(data, schema) {
        const errors = [];
        
        for (const [key, rules] of Object.entries(schema)) {
            const value = data[key];
            
            // 必填验证
            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push(`${key} 是必填项`);
                continue;
            }
            
            // 类型验证
            if (value !== undefined && value !== null && rules.type) {
                const isValidType = typeof value === rules.type;
                if (!isValidType) {
                    errors.push(`${key} 必须是 ${rules.type} 类型`);
                }
            }
            
            // 自定义验证
            if (value !== undefined && value !== null && rules.validator) {
                const result = rules.validator(value);
                if (result !== true) {
                    errors.push(typeof result === 'string' ? result : `${key} 验证失败`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Cookie 管理工具
    static Cookie = {
        set(name, value, days) {
            let expires = '';
            if (days) {
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = '; expires=' + date.toUTCString();
            }
            document.cookie = name + '=' + (value || '')  + expires + '; path=/';
        },
        
        get(name) {
            const nameEQ = name + '=';
            const ca = document.cookie.split(';');
            for(let i=0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
            }
            return null;
        },

        delete(name) {
            this.set(name, '', -1);
        }
    };

    // AES 加密解密工具
    static AES = {
        // AES-256-CBC加密
        async encrypt(text, password) {
            const encoder = new TextEncoder();
            const textData = encoder.encode(text);
            const passwordData = encoder.encode(password.padEnd(32, ' '));
            
            const iv = crypto.getRandomValues(new Uint8Array(16));
            const salt = crypto.getRandomValues(new Uint8Array(16));
            
            const key = await window.crypto.subtle.importKey(
                'raw',
                passwordData,
                { name: 'PBKDF2' },
                false,
                ['deriveKey']
            );

            const derivedKey = await window.crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                key,
                {
                    name: 'AES-CBC',
                    length: 256
                },
                false,
                ['encrypt']
            );

            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: 'AES-CBC',
                    iv: iv
                },
                derivedKey,
                textData
            );

            const encryptedData = new Uint8Array(encrypted);
            const totalLength = salt.length + iv.length + encryptedData.length;
            const combined = new Uint8Array(totalLength);
            
            combined.set(salt, 0);
            combined.set(iv, salt.length);
            combined.set(encryptedData, salt.length + iv.length);
            
            return btoa(String.fromCharCode.apply(null, combined));
        },
        
        // AES-256-CBC解密
        async decrypt(encryptedData, password) {
            const combined = new Uint8Array(atob(encryptedData).split('').map(char => char.charCodeAt(0)));
            const salt = combined.slice(0, 16);
            const iv = combined.slice(16, 32);
            const encrypted = combined.slice(32);
            
            const encoder = new TextEncoder();
            const passwordData = encoder.encode(password.padEnd(32, ' '));
            
            const key = await window.crypto.subtle.importKey(
                'raw',
                passwordData,
                { name: 'PBKDF2' },
                false,
                ['deriveKey']
            );

            const derivedKey = await window.crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                key,
                {
                    name: 'AES-CBC',
                    length: 256
                },
                false,
                ['decrypt']
            );

            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-CBC',
                    iv: iv
                },
                derivedKey,
                encrypted
            );

            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        }
    };

    // GitHub 同步助手
    async syncToGithub(path, data, commitMessage = null) {
        if (!window.githubHelper) {
            this.handleError(new Error('GitHub API Helper 未加载'), 'GitHub 同步');
            return null;
        }

        const message = commitMessage || `Update ${path} via Web Manager (${new Date().toLocaleString()})`;
        
        try {
            this.showLoading(`正在同步 ${path} 到 GitHub...`);
            this.log(`开始同步到 GitHub: ${path}`, 'info');

            const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
            const result = await window.githubHelper.updateFile(path, dataStr, message);

            this.hideLoading();
            this.showToast('数据已成功同步到 GitHub 仓库！', 'success');
            this.log('GitHub 同步成功', 'success', `文件: ${path}, SHA: ${result.content.sha}`);
            
            return result;
        } catch (error) {
            this.hideLoading();
            this.handleError(error, 'GitHub 同步');
            throw error;
        }
    }
}

// 初始化通用功能
let managerCommon = null;

document.addEventListener('DOMContentLoaded', () => {
    // 创建全局实例
    managerCommon = new ManagerCommon();
    
    // 暴露到全局供页面使用
    window.managerCommon = managerCommon;
    
    // 页面加载完成日志
    managerCommon.log('页面加载完成', 'success');
});