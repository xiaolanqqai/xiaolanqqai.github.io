/**
 * Tool Scanner - LAN web service discovery (best effort in browser)
 */
(function () {
    class LanToolScanner {
        constructor() {
            this.form = document.getElementById('tool-scan-form');
            this.startButton = document.getElementById('tool-scan-button');
            this.status = document.getElementById('tool-scan-status');
            this.progressBar = document.getElementById('tool-scan-progress');
            this.results = document.getElementById('tool-scan-results');
            this.resultCount = document.getElementById('tool-result-count');
            this.summary = document.getElementById('tool-result-summary');
            this.cancelButton = document.getElementById('tool-scan-cancel');
            this.advancedToggle = document.getElementById('tool-advanced-toggle');
            this.advancedPanel = document.getElementById('tool-advanced-panel');

            this.isScanning = false;
            this.abortControllers = [];
            this.foundResults = [];
            this.detectedLimits = [];
            this.storageKey = 'tool-scanner-last-results';

            if (!this.form || !this.startButton) {
                return;
            }

            this.populateDefaults();
            this.restoreLastResults();
            this.bindEvents();
        }

        bindEvents() {
            this.form.addEventListener('submit', (event) => {
                event.preventDefault();
                this.startScan();
            });

            this.cancelButton?.addEventListener('click', () => this.cancelScan());
            this.advancedToggle?.addEventListener('click', () => this.toggleAdvancedPanel());
        }

        populateDefaults() {
            const subnetInput = document.getElementById('tool-subnet');
            const portsInput = document.getElementById('tool-ports');
            const hostStart = document.getElementById('tool-host-start');
            const hostEnd = document.getElementById('tool-host-end');

            if (subnetInput) {
                subnetInput.value = this.detectSubnet();
            }
            if (portsInput) {
                portsInput.value = '80,81,88,3000,5000,7001,8000,8080,8081,8088,8888,9000,9090';
            }
            if (hostStart) {
                hostStart.value = '1';
            }
            if (hostEnd) {
                hostEnd.value = '254';
            }
        }

        detectSubnet() {
            const host = window.location.hostname || '';
            if (/^(10|172\.(1[6-9]|2\d|3[0-1])|192\.168)\./.test(host)) {
                const parts = host.split('.');
                if (parts.length === 4) {
                    return parts.slice(0, 3).join('.');
                }
            }
            return '192.168.1';
        }

        toggleAdvancedPanel() {
            if (!this.advancedPanel || !this.advancedToggle) {
                return;
            }

            const expanded = !this.advancedPanel.classList.contains('d-none');
            this.advancedPanel.classList.toggle('d-none', expanded);
            this.advancedToggle.setAttribute('aria-expanded', String(!expanded));
            this.advancedToggle.textContent = expanded ? '高级' : '收起';
        }

        restoreLastResults() {
            const raw = window.localStorage.getItem(this.storageKey);
            if (!raw) {
                this.renderResults([]);
                return;
            }

            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    this.foundResults = parsed;
                    this.renderResults(parsed, true);
                } else {
                    this.renderResults([]);
                }
            } catch (error) {
                console.warn('Failed to parse stored Tool scanner results:', error);
                this.renderResults([]);
            }
        }

        async startScan() {
            if (this.isScanning) {
                return;
            }

            const config = this.getConfig();
            if (!config.valid) {
                this.setStatus(config.message, 'danger');
                return;
            }

            this.isScanning = true;
            this.abortControllers = [];
            this.detectedLimits = [];
            this.foundResults = [];
            this.results.innerHTML = '';
            this.resultCount.textContent = '0';
            this.summary.textContent = '正在准备扫描目标...';
            this.startButton.disabled = true;
            if (this.cancelButton) {
                this.cancelButton.disabled = false;
            }

            const tasks = this.buildTargets(config);
            const total = tasks.length;
            let completed = 0;

            if (!total) {
                this.isScanning = false;
                this.startButton.disabled = false;
                this.setStatus('没有可扫描的目标，请检查高级设置。', 'warning');
                return;
            }

            this.setStatus(`开始扫描 ${config.subnet}.x，共 ${total} 个候选地址`, 'info');
            this.updateProgress(0, total);

            const onProgress = (result) => {
                completed += 1;
                this.updateProgress(completed, total);

                if (result) {
                    this.mergeResult(result);
                    this.renderResults(this.foundResults);
                }

                this.summary.textContent = `已扫描 ${completed}/${total}，发现 ${this.getGroupedCount()} 个地址`;
            };

            try {
                await this.runWithConcurrency(tasks, config.concurrency, onProgress);
                if (!this.isScanning) {
                    return;
                }

                window.localStorage.setItem(this.storageKey, JSON.stringify(this.foundResults));
                this.renderResults(this.foundResults);

                const extra = this.detectedLimits.length
                    ? `；受浏览器限制影响 ${this.detectedLimits.length} 个目标无法确认`
                    : '';
                this.setStatus(`扫描完成，发现 ${this.getGroupedCount()} 个可访问地址${extra}`, 'success');
                this.updateProgress(total, total);
                this.summary.textContent = `扫描完成，共发现 ${this.getGroupedCount()} 个地址`;
            } catch (error) {
                console.error('Tool scan failed:', error);
                this.setStatus('扫描过程中发生错误，请缩小网段或减少端口数量后重试。', 'danger');
            } finally {
                this.isScanning = false;
                this.startButton.disabled = false;
                if (this.cancelButton) {
                    this.cancelButton.disabled = true;
                }
            }
        }

        cancelScan() {
            if (!this.isScanning) {
                return;
            }

            this.isScanning = false;
            this.abortControllers.forEach((controller) => controller.abort());
            this.abortControllers = [];
            this.startButton.disabled = false;
            if (this.cancelButton) {
                this.cancelButton.disabled = true;
            }
            this.setStatus('扫描已取消。', 'warning');
            this.summary.textContent = `扫描已取消，当前已发现 ${this.getGroupedCount()} 个地址`;
        }

        mergeResult(result) {
            const exists = this.foundResults.some((item) =>
                item.ip === result.ip && item.port === result.port && item.protocol === result.protocol
            );

            if (!exists) {
                this.foundResults.push(result);
            }
        }

        getConfig() {
            const subnet = (document.getElementById('tool-subnet')?.value || '').trim();
            const hostStart = parseInt(document.getElementById('tool-host-start')?.value || '', 10);
            const hostEnd = parseInt(document.getElementById('tool-host-end')?.value || '', 10);
            const ports = this.parsePorts(document.getElementById('tool-ports')?.value || '');
            const protocol = document.getElementById('tool-protocol')?.value || 'http';
            const concurrency = parseInt(document.getElementById('tool-concurrency')?.value || '24', 10);
            const timeout = parseInt(document.getElementById('tool-timeout')?.value || '1800', 10);

            if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(subnet)) {
                return { valid: false, message: '网段格式不正确，请输入如 192.168.1' };
            }
            if (Number.isNaN(hostStart) || Number.isNaN(hostEnd) || hostStart < 1 || hostEnd > 254 || hostStart > hostEnd) {
                return { valid: false, message: '主机范围不正确，请使用 1 到 254 之间的整数' };
            }
            if (!ports.length) {
                return { valid: false, message: '请至少填写一个端口' };
            }
            if (Number.isNaN(concurrency) || concurrency < 1 || concurrency > 64) {
                return { valid: false, message: '并发数请设置在 1 到 64 之间' };
            }
            if (Number.isNaN(timeout) || timeout < 500 || timeout > 10000) {
                return { valid: false, message: '超时请设置在 500 到 10000 毫秒之间' };
            }

            return {
                valid: true,
                subnet,
                hostStart,
                hostEnd,
                ports,
                protocol,
                concurrency,
                timeout
            };
        }

        parsePorts(value) {
            return [...new Set(
                value
                    .split(',')
                    .map((item) => parseInt(item.trim(), 10))
                    .filter((port) => Number.isInteger(port) && port > 0 && port <= 65535)
            )];
        }

        buildTargets(config) {
            const protocols = config.protocol === 'both' ? ['http', 'https'] : [config.protocol];
            const tasks = [];

            for (let host = config.hostStart; host <= config.hostEnd; host += 1) {
                for (const port of config.ports) {
                    for (const protocol of protocols) {
                        tasks.push(() => this.probeTarget({
                            ip: `${config.subnet}.${host}`,
                            port,
                            protocol,
                            timeout: config.timeout
                        }));
                    }
                }
            }

            return tasks;
        }

        async runWithConcurrency(tasks, concurrency, onProgress) {
            const executing = new Set();

            for (const task of tasks) {
                if (!this.isScanning) {
                    break;
                }

                const runner = Promise.resolve()
                    .then(() => task())
                    .catch((error) => {
                        console.warn('Probe task failed:', error);
                        return null;
                    })
                    .then((result) => {
                        executing.delete(runner);
                        onProgress(result);
                    });

                executing.add(runner);

                if (executing.size >= concurrency) {
                    await Promise.race(executing);
                }
            }

            await Promise.all(executing);
        }

        async probeTarget({ ip, port, protocol, timeout }) {
            if (!this.isScanning) {
                return null;
            }

            const url = `${protocol}://${ip}:${port}`;
            const contentResult = await this.tryContentProbe(url, timeout);
            if (contentResult.discovered) {
                return this.formatResult(url, protocol, ip, port, contentResult.method, contentResult.title);
            }

            if (contentResult.limited) {
                this.detectedLimits.push(url);
            }

            return null;
        }

        async tryContentProbe(url, timeout) {
            const isMixedContentBlocked = window.location.protocol === 'https:' && url.startsWith('http://');
            if (isMixedContentBlocked) {
                return { discovered: false, limited: true, method: 'mixed-content' };
            }

            const controller = new AbortController();
            this.abortControllers.push(controller);

            const timer = window.setTimeout(() => controller.abort(), timeout);

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-store',
                    credentials: 'omit',
                    headers: {
                        Accept: 'text/html,application/xhtml+xml'
                    },
                    signal: controller.signal
                });

                if (!response.ok) {
                    return { discovered: false, limited: false, method: `status-${response.status}` };
                }

                const contentType = response.headers.get('content-type') || '';
                const text = await response.text();
                const cleanedText = text
                    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
                const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';
                const hasReadableContent = cleanedText.length > 0 || title.length > 0;
                const looksLikePage = /text\/html|application\/xhtml\+xml/i.test(contentType) || /<html|<body|<title/i.test(text);

                if (hasReadableContent && looksLikePage) {
                    return { discovered: true, limited: false, method: 'content', title };
                }

                return { discovered: false, limited: false, method: 'empty-content', title: '' };
            } catch (error) {
                if (controller.signal.aborted) {
                    return { discovered: false, limited: false, method: 'timeout' };
                }

                const message = String(error?.message || error || '');
                const limited = /private network|mixed content|https|certificate|cors|access-control|origin/i.test(message)
                    || error instanceof TypeError;
                return { discovered: false, limited, method: 'content-error' };
            } finally {
                window.clearTimeout(timer);
            }
        }

        formatResult(url, protocol, ip, port, method, title) {
            return {
                discovered: true,
                url,
                protocol,
                ip,
                port,
                method,
                title: title || '',
                label: `${ip}:${port}`,
                discoveredAt: new Date().toLocaleString('zh-CN', { hour12: false })
            };
        }

        updateProgress(completed, total) {
            if (!this.progressBar) {
                return;
            }

            const safeTotal = Math.max(total || 0, 1);
            const percent = Math.max(0, Math.min(100, Math.round((completed / safeTotal) * 100)));
            this.progressBar.style.width = `${percent}%`;
            this.progressBar.setAttribute('aria-valuenow', String(percent));
            this.progressBar.textContent = `${percent}%`;
            this.progressBar.classList.toggle('progress-bar-animated', percent < 100 && this.isScanning);
        }

        setStatus(message, type) {
            if (!this.status) {
                return;
            }
            this.status.className = `alert shadow tool-status alert-${type}`;
            this.status.textContent = message;
        }

        renderResults(results, restored = false) {
            const groupedResults = this.groupResults(results);
            this.resultCount.textContent = String(groupedResults.length);

            if (!groupedResults.length) {
                this.results.innerHTML = `
                    <div class="alert alert-secondary shadow-sm mb-0">
                        ${restored ? '没有可恢复的历史结果，请点击“开始搜索”。' : '搜索结果会显示在这里。'}
                    </div>
                `;
                return;
            }

            const items = groupedResults.map((group) => `
                    <details class="tool-result-item">
                        <summary class="tool-result-summary">
                            <div class="tool-result-main">
                                <span class="tool-result-url">${group.ip}</span>
                                <span class="tool-result-count">${group.endpoints.length} 个端口</span>
                            </div>
                            <div class="tool-result-meta">
                                <span>端口 ${group.endpoints.map((item) => item.port).join(', ')}</span>
                            </div>
                        </summary>
                        <div class="tool-port-list">
                            ${group.endpoints.map((item) => `
                                <a class="tool-port-chip" href="${item.url}" target="_blank" rel="nofollow noopener">
                                    <span>${item.protocol.toUpperCase()}</span>
                                    <span>${item.port}</span>
                                    ${item.title ? `<span class="tool-port-title">${item.title}</span>` : ''}
                                </a>
                            `).join('')}
                        </div>
                    </details>
                `)
                .join('');

            this.results.innerHTML = items;
        }

        groupResults(results) {
            const groups = new Map();

            [...results]
                .sort((a, b) => {
                    const ipCompare = this.compareIp(a.ip, b.ip);
                    if (ipCompare !== 0) {
                        return ipCompare;
                    }

                    if (a.port !== b.port) {
                        return a.port - b.port;
                    }

                    return a.protocol.localeCompare(b.protocol, 'zh-Hans-CN');
                })
                .forEach((item) => {
                    if (!groups.has(item.ip)) {
                        groups.set(item.ip, {
                            ip: item.ip,
                            endpoints: []
                        });
                    }

                    const group = groups.get(item.ip);
                    const exists = group.endpoints.some((endpoint) =>
                        endpoint.port === item.port && endpoint.protocol === item.protocol
                    );

                    if (!exists) {
                        group.endpoints.push(item);
                    }
                });

            return [...groups.values()]
                .map((group) => {
                    group.endpoints.sort((a, b) => {
                        if (a.port !== b.port) {
                            return a.port - b.port;
                        }

                        return a.protocol.localeCompare(b.protocol, 'zh-Hans-CN');
                    });

                    return group;
                })
                .sort((a, b) => this.compareIp(a.ip, b.ip));
        }

        getGroupedCount() {
            return this.groupResults(this.foundResults).length;
        }

        compareIp(left, right) {
            const leftParts = String(left).split('.').map((part) => parseInt(part, 10));
            const rightParts = String(right).split('.').map((part) => parseInt(part, 10));

            for (let index = 0; index < 4; index += 1) {
                const diff = (leftParts[index] || 0) - (rightParts[index] || 0);
                if (diff !== 0) {
                    return diff;
                }
            }

            return 0;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new LanToolScanner());
    } else {
        new LanToolScanner();
    }
})();
