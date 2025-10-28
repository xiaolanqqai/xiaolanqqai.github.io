// 管理页面通用JavaScript功能

class ManagerCommon {
    constructor() {
        this.logContainer = null;
        this.maxLogs = 50;
        this.init();
    }

    init() {
        // 初始化主题切换
        this.initThemeToggle();
        
        // 初始化页面加载进度条
        this.initProgressBar();
        
        // 初始化错误处理
        this.initErrorHandling();
        
        // 延迟初始化日志系统，确保DOM已加载
        setTimeout(() => {
            this.initLogSystem();
        }, 100);
    }

    // 主题切换功能
    initThemeToggle() {
        // 创建或获取主题切换按钮
        this.createThemeToggleButton();
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            // 设置初始主题
            this.applySavedTheme();
            
            // 绑定主题切换事件
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }
    
    // 创建主题切换按钮
    createThemeToggleButton() {
        // 检查是否已存在主题切换按钮
        let themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) {
            themeToggle = document.createElement('button');
            themeToggle.id = 'themeToggle';
            themeToggle.className = 'theme-toggle';
            themeToggle.title = '切换主题';
            
            const themeIcon = document.createElement('i');
            themeIcon.id = 'themeIcon';
            themeIcon.className = 'fas';
            
            themeToggle.appendChild(themeIcon);
            document.body.appendChild(themeToggle);
        }
    }

    // 应用保存的主题
    applySavedTheme() {
        const savedTheme = localStorage.getItem('manager-theme') || 'light';
        const finalTheme = savedTheme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', finalTheme);
        this.updateThemeIcon();
        
        // 应用主题颜色转换
        this.applyThemeColors(finalTheme);
    }

    // 切换主题
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // 应用新主题
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('manager-theme', newTheme);
        
        // 更新图标
        this.updateThemeIcon();
        
        // 处理颜色类和硬编码颜色值
        this.applyThemeColors(newTheme);
        
        // 添加过渡动画
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        
        // 记录主题切换日志
        this.log(`主题已切换为${newTheme === 'dark' ? '深色' : '浅色'}模式`, 'info');
        
        // 显示提示
        this.showToast(`主题已切换为${newTheme === 'dark' ? '深色' : '浅色'}模式`, 'success');
    }
    
    // 应用主题颜色转换
    applyThemeColors(theme) {
        const isDark = theme === 'dark';
        
        // 处理Bootstrap颜色类
        this.processBootstrapColorClasses(isDark);
        
        // 处理硬编码的颜色值
        this.processHardcodedColors(isDark);
    }
    
    // 处理Bootstrap颜色类
    processBootstrapColorClasses(isDark) {
        // 背景颜色类映射
        const bgClassMap = {
            'bg-light': 'bg-dark',
            'bg-white': 'bg-dark',
            'bg-warning': 'bg-warning', // 警告色在两种主题中保持不变
            'bg-success': 'bg-success',
            'bg-danger': 'bg-danger',
            'bg-info': 'bg-info',
            'bg-primary': 'bg-primary',
            'bg-secondary': 'bg-secondary'
        };
        
        // 反向映射，用于从深色切换到浅色
        const bgClassReverseMap = {
            'bg-dark': 'bg-light',
            'bg-warning': 'bg-warning',
            'bg-success': 'bg-success',
            'bg-danger': 'bg-danger',
            'bg-info': 'bg-info',
            'bg-primary': 'bg-primary',
            'bg-secondary': 'bg-secondary'
        };
        
        // 文本颜色类映射
        const textClassMap = {
            'text-dark': 'text-light',
            'text-white': 'text-light'
        };
        
        // 反向映射，用于从深色切换到浅色
        const textClassReverseMap = {
            'text-light': 'text-dark'
        };
        
        // 处理背景类
        if (isDark) {
            // 从浅色切换到深色
            for (const [lightClass, darkClass] of Object.entries(bgClassMap)) {
                const elements = document.querySelectorAll(`.${lightClass.split(' ').join('.')}`);
                elements.forEach(el => {
                    el.classList.remove(lightClass);
                    el.classList.add(darkClass);
                });
            }
        } else {
            // 从深色切换到浅色
            for (const [darkClass, lightClass] of Object.entries(bgClassReverseMap)) {
                const elements = document.querySelectorAll(`.${darkClass.split(' ').join('.')}`);
                elements.forEach(el => {
                    el.classList.remove(darkClass);
                    el.classList.add(lightClass);
                });
            }
        }
        
        // 处理文本类
        if (isDark) {
            // 从浅色切换到深色
            for (const [lightClass, darkClass] of Object.entries(textClassMap)) {
                const elements = document.querySelectorAll(`.${lightClass.split(' ').join('.')}`);
                elements.forEach(el => {
                    el.classList.remove(lightClass);
                    el.classList.add(darkClass);
                });
            }
        } else {
            // 从深色切换到浅色
            for (const [darkClass, lightClass] of Object.entries(textClassReverseMap)) {
                const elements = document.querySelectorAll(`.${darkClass.split(' ').join('.')}`);
                elements.forEach(el => {
                    el.classList.remove(darkClass);
                    el.classList.add(lightClass);
                });
            }
        }
    }
    
    // 处理硬编码颜色值
    processHardcodedColors(isDark) {
        // 获取所有有内联样式的元素
        const elements = document.querySelectorAll('[style*="color:"]');
        
        elements.forEach(el => {
            const style = el.style;
            const color = style.color;
            
            // 检查是否是浅色主题下的深色文本
            if (!isDark && (color.includes('#212529') || color.includes('#6c757d'))) {
                style.color = 'var(--text-primary)';
            }
            // 检查是否是深色主题下的浅色文本
            else if (isDark && (color.includes('#ffffff') || color.includes('#f8f9fa'))) {
                style.color = 'var(--text-primary)';
            }
        });
        
        // 处理背景颜色
        const bgElements = document.querySelectorAll('[style*="background-color:"]');
        
        bgElements.forEach(el => {
            const style = el.style;
            const bgColor = style.backgroundColor;
            
            // 检查是否是浅色背景
            if (!isDark && (bgColor.includes('#ffffff') || bgColor.includes('#f8f9fa') || bgColor.includes('#e9ecef'))) {
                style.backgroundColor = 'var(--bg-primary)';
            }
            // 检查是否是深色背景
            else if (isDark && (bgColor.includes('#212529') || bgColor.includes('#343a40'))) {
                style.backgroundColor = 'var(--bg-primary)';
            }
        });
    }

    // 更新主题图标
    updateThemeIcon() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = document.getElementById('themeIcon');
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            
            if (icon) {
                // 移除所有图标类
                icon.className = '';
                
                // 添加适当的图标
                icon.classList.add('fas');
                icon.classList.add(isDark ? 'fa-sun' : 'fa-moon');
                
                // 动画效果
                icon.classList.add('spin');
                setTimeout(() => {
                    icon.classList.remove('spin');
                }, 500);
            }
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
        // 检查是否存在日志容器
        this.logContainer = document.getElementById('log-container');
        
        // 如果没有日志容器，尝试创建一个默认的
        if (!this.logContainer) {
            const logSection = document.createElement('div');
            logSection.className = 'manager-card';
            logSection.style.display = 'none'; // 默认隐藏
            
            const logHeader = document.createElement('div');
            logHeader.className = 'manager-card-header';
            logHeader.textContent = '操作日志';
            
            const logBody = document.createElement('div');
            logBody.className = 'manager-card-body';
            
            this.logContainer = document.createElement('div');
            this.logContainer.id = 'log-container';
            this.logContainer.className = 'log-container';
            
            logBody.appendChild(this.logContainer);
            logSection.appendChild(logHeader);
            logSection.appendChild(logBody);
            
            // 将日志部分添加到页面底部
            const mainContent = document.querySelector('.container-main') || document.body;
            mainContent.appendChild(logSection);
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