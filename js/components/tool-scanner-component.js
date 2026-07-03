/**
 * Tool Scanner Component - UI shell for the Tool page
 */
(function () {
    const html = `
        <section class="tool-shell container-fluid px-4">
            <div class="tool-center-wrap">
                <div class="tool-panel shadow-lg">
                    <div class="tool-panel-header text-center">
                        <h1 class="tool-title">
                            局域网页面搜索
                            <span class="tool-info-wrap" tabindex="0" aria-label="说明">
                                <span class="tool-info-icon">i</span>
                                <span class="tool-info-pop">
                                    默认使用常见 Web 端口扫描局域网地址，并尽量只保留能读取到非空页面内容的结果。若页面从 HTTPS 打开或目标站点不允许跨域读取，浏览器可能无法识别该站点。
                                </span>
                            </span>
                        </h1>
                    </div>

                    <form id="tool-scan-form" class="tool-form">
                        <div class="tool-entry-row">
                            <button id="tool-scan-button" class="btn btn-info shadow fw-bold tool-main-button" type="submit">开始搜索</button>
                            <button id="tool-scan-cancel" class="btn btn-outline-secondary shadow-sm tool-secondary-button" type="button" disabled>停止</button>
                            <button id="tool-advanced-toggle" class="btn btn-outline-info shadow-sm tool-secondary-button" type="button" aria-expanded="false">高级</button>
                        </div>

                        <div id="tool-advanced-panel" class="tool-advanced-panel d-none">
                            <div class="row g-3">
                                <div class="col-lg-4">
                                    <label class="form-label" for="tool-subnet">网段前缀</label>
                                    <input id="tool-subnet" class="form-control shadow-sm" type="text" placeholder="192.168.1">
                                </div>
                                <div class="col-sm-6 col-lg-2">
                                    <label class="form-label" for="tool-host-start">起始主机</label>
                                    <input id="tool-host-start" class="form-control shadow-sm" type="number" min="1" max="254">
                                </div>
                                <div class="col-sm-6 col-lg-2">
                                    <label class="form-label" for="tool-host-end">结束主机</label>
                                    <input id="tool-host-end" class="form-control shadow-sm" type="number" min="1" max="254">
                                </div>
                                <div class="col-sm-6 col-lg-2">
                                    <label class="form-label" for="tool-protocol">协议</label>
                                    <select id="tool-protocol" class="form-select shadow-sm">
                                        <option value="http">HTTP</option>
                                        <option value="https">HTTPS</option>
                                        <option value="both">HTTP + HTTPS</option>
                                    </select>
                                </div>
                                <div class="col-sm-6 col-lg-2">
                                    <label class="form-label" for="tool-timeout">超时(ms)</label>
                                    <input id="tool-timeout" class="form-control shadow-sm" type="number" min="500" max="10000" value="1800">
                                </div>
                            </div>

                            <div class="row g-3 mt-1">
                                <div class="col-lg-8">
                                    <label class="form-label" for="tool-ports">搜索端口</label>
                                    <input id="tool-ports" class="form-control shadow-sm" type="text" placeholder="80,3000,8080">
                                </div>
                                <div class="col-sm-6 col-lg-2">
                                    <label class="form-label" for="tool-concurrency">并发数</label>
                                    <input id="tool-concurrency" class="form-control shadow-sm" type="number" min="1" max="64" value="24">
                                </div>
                            </div>
                        </div>
                    </form>

                    <div id="tool-scan-status" class="alert alert-info shadow tool-status" role="alert">等待开始搜索。</div>

                    <div class="tool-progress-box">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="fw-semibold">搜索进度</span>
                            <span id="tool-result-summary" class="text-secondary">尚未开始</span>
                        </div>
                        <div class="progress shadow-sm" role="progressbar" aria-label="搜索进度">
                            <div id="tool-scan-progress" class="progress-bar progress-bar-striped progress-bar-animated bg-info" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
                        </div>
                    </div>

                    <div class="tool-results-box">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h2 class="tool-result-title mb-0">发现的地址</h2>
                            <span class="badge text-bg-secondary">共 <span id="tool-result-count">0</span> 个</span>
                        </div>
                        <div id="tool-scan-results" class="tool-results-list"></div>
                    </div>
                </div>
            </div>
        </section>
    `;

    const container = document.getElementById('tool-scanner-container');
    if (container) {
        container.innerHTML = html;
    }
})();
