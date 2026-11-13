// GitHub 仓库读写封装（管理页共用）
// - 写操作统一走 Git Data API（blobs → tree → commit → ref），一次调用只产生一个原子提交
// - 所有错误统一为 GithubApiError，携带 status / code / path，便于调用方分支处理
class GithubApiError extends Error {
    constructor(message, { status = 0, code = 'UNKNOWN', path = '', detail = null } = {}) {
        super(message);
        this.name = 'GithubApiError';
        this.status = status;
        this.code = code;
        this.path = path;
        this.detail = detail;
    }
}

class GitHubAPIHelper {
    constructor() {
        this.config = this.loadConfig();
    }

    loadConfig() {
        // 安全加固：token 不再硬编码在前端源码（原 XOR 混淆可被离线还原，具备仓库写权限）。
        // 改由管理员在“操作日志”面板保存，存 localStorage，长期有效、不进 Git 仓库。
        // 未配置时 isConfigured() 为 false。
        return {
            owner: 'xiaolanqqai',
            repo: 'xiaolanqqai.github.io',
            branch: 'master'
        };
    }

    // 每次实时读取存储的 token（localStorage 长期有效，避免构造时缓存为 null）
    _token() { return localStorage.getItem('github_token'); }

    getConfig() { return this.config; }
    isConfigured() { return !!this._token(); }

    _headers() {
        return {
            'Authorization': `Bearer ${this._token()}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };
    }

    _apiUrl(path) {
        return `${this._repoUrl(`/contents/${path}`)}?ref=${this.config.branch}`;
    }

    _repoUrl(path) {
        return `https://api.github.com/repos/${this.config.owner}/${this.config.repo}${path}`;
    }

    assertReady() {
        if (!this.isConfigured()) {
            throw new GithubApiError('GitHub Token 未配置：请在本页“操作日志”面板保存 Token 后再试', { code: 'TOKEN_MISSING' });
        }
    }

    // 状态码 → 可判定的错误码
    static errorCode(status, detail) {
        const raw = (detail && detail.message) || '';
        if (status === 401) return 'TOKEN_INVALID';
        if (status === 403) return /rate limit/i.test(raw) ? 'RATE_LIMITED' : 'FORBIDDEN';
        if (status === 404) return 'NOT_FOUND';
        if (status === 409) return 'CONFLICT';
        if (status === 413) return 'PAYLOAD_TOO_LARGE';
        if (status === 422) return 'VALIDATION_FAILED';
        return 'HTTP_ERROR';
    }

    // 状态码 → 可直接照做的提示语
    static hint(status, detail, statusText) {
        const raw = (detail && detail.message) || statusText || `HTTP ${status}`;
        if (status === 401) return `${raw}｜Token 无效或已过期：请在“操作日志”面板重新保存 GitHub Token`;
        if (status === 403) {
            return /rate limit/i.test(raw)
                ? `${raw}｜触发 GitHub 限流：请稍后重试（批量发布已合并为一次提交）`
                : `${raw}｜Token 缺少该仓库 Contents 写权限，请检查 fine-grained token（Contents: Read and write）`;
        }
        if (status === 404) return `${raw}｜目标不存在，或 Token 无权访问该仓库`;
        if (status === 409) return `${raw}｜仓库在提交过程中被其他操作修改，请重试`;
        if (status === 422) return `${raw}｜参数或路径不合法，请检查项目名/文件名`;
        return raw;
    }

    // 统一请求：禁用缓存；非 2xx 解析出结构化错误（响应非 JSON 时按状态码兜底）
    async _request(url, options = {}) {
        let response;
        try {
            response = await fetch(url, {
                ...options,
                cache: 'no-store',
                headers: { ...this._headers(), ...(options.headers || {}) }
            });
        } catch (error) {
            throw new GithubApiError(`网络请求失败：${error.message}`, { code: 'NETWORK_ERROR', path: url, detail: error });
        }
        if (response.ok) return response;

        let detail = null;
        try { detail = await response.json(); } catch { detail = null; }
        throw new GithubApiError(GitHubAPIHelper.hint(response.status, detail, response.statusText), {
            status: response.status,
            code: GitHubAPIHelper.errorCode(response.status, detail),
            path: url,
            detail
        });
    }

    async _json(url, options) {
        return (await this._request(url, options)).json();
    }

    _jsonBody(method, body) {
        return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
    }

    // --- 读取 ---

    async getFileSHA(path) {
        // 禁用缓存：SHA 必须与仓库当前状态一致；文件不存在返回 null
        try {
            const data = await this._json(this._apiUrl(path));
            return (data && data.sha) || null;
        } catch (error) {
            if (error.status === 404) return null;
            throw error;
        }
    }

    async getFile(path) {
        this.assertReady();
        try {
            return await this._json(this._apiUrl(path));
        } catch (error) {
            if (error.status === 404) return null;   // 仅“不存在”返回 null，其余错误向上抛
            throw error;
        }
    }

    // 列举目录内容；路径不存在时返回空数组（Contents API 对目录返回数组，对文件返回对象）
    async listDir(path) {
        this.assertReady();
        try {
            const data = await this._json(this._apiUrl(path));
            return Array.isArray(data) ? data : [data];
        } catch (error) {
            if (error.status === 404) return [];
            throw error;
        }
    }

    // 当前 HEAD：一次拿提交 SHA 与根树 SHA（原子提交需要 base_tree / parent）
    async getHead() {
        this.assertReady();
        const ref = await this._json(this._repoUrl(`/git/ref/heads/${encodeURIComponent(this.config.branch)}`));
        const commit = await this._json(this._repoUrl(`/git/commits/${ref.object.sha}`));
        return { commitSha: ref.object.sha, treeSha: commit.tree.sha };
    }

    // 递归读取整个文件树（一次请求列出全部路径，替代逐目录列举）
    async getTree(ref) {
        this.assertReady();
        const target = ref || (await this.getHead()).treeSha;
        const tree = await this._json(this._repoUrl(`/git/trees/${target}?recursive=1`));
        if (tree.truncated) {
            throw new GithubApiError('仓库文件树过大（响应被截断），无法一次读取', { code: 'TREE_TRUNCATED' });
        }
        return tree;
    }

    // --- 写入（统一原子提交） ---

    // 内容编码：支持 text / base64 / ArrayBuffer / Uint8Array
    static encodeChange(change) {
        if (typeof change.base64 === 'string' && change.base64.trim()) {
            const base64 = change.base64.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
            return { base64, bytes: GitHubAPIHelper.base64ByteLength(base64) };
        }
        if (typeof change.text === 'string') {
            const base64 = GitHubAPIHelper.textToBase64(change.text);
            return { base64, bytes: GitHubAPIHelper.base64ByteLength(base64) };
        }
        const content = change.content !== undefined ? change.content : change.bytes;
        if (content && typeof content.arrayBuffer === 'function') {
            return GitHubAPIHelper.encodeBytes(null, content);   // Blob/File，异步
        }
        if (content && typeof content.byteLength === 'number') {
            const base64 = GitHubAPIHelper.arrayBufferToBase64(content);
            return { base64, bytes: content.byteLength };
        }
        if (typeof content === 'string') {
            const base64 = GitHubAPIHelper.textToBase64(content);
            return { base64, bytes: GitHubAPIHelper.base64ByteLength(base64) };
        }
        throw new GithubApiError('缺少文件内容：请提供 text / base64 / content(ArrayBuffer|string) / blob(File)', { code: 'NO_CONTENT' });
    }

    // 兼容 Blob/File 的异步编码入口
    static async encodeChangeAsync(change) {
        const content = change.content !== undefined ? change.content : change.bytes;
        if (!(typeof change.base64 === 'string' && change.base64.trim()) && typeof change.text !== 'string'
            && content && typeof content.arrayBuffer === 'function') {
            const buffer = await content.arrayBuffer();
            return { base64: GitHubAPIHelper.arrayBufferToBase64(buffer), bytes: buffer.byteLength };
        }
        return GitHubAPIHelper.encodeChange(change);
    }

    // 原子提交：changes = [{ path, text|base64|content } | { path, delete: true }]
    // 全成功或全失败；一次提交只触发一次 Pages 构建
    async commitChanges(changes, message, options = {}) {
        this.assertReady();
        const list = (changes || []).filter(Boolean);
        if (!list.length) throw new GithubApiError('没有需要提交的更改', { code: 'NO_CHANGES' });
        return this._commitOnce(list, message || 'Update via Web Manager', options.retry !== false);
    }

    async _commitOnce(list, message, allowRetry) {
        const { commitSha, treeSha } = await this.getHead();

        // 同一路径以最后一条为准（先上传后删除等场景）
        const merged = new Map();
        list.forEach(change => merged.set(change.path, change));

        const entries = [];
        for (const change of merged.values()) {
            if (change.delete) {
                entries.push({ path: change.path, mode: '100644', type: 'blob', sha: null });
                continue;
            }
            const { base64 } = await GitHubAPIHelper.encodeChangeAsync(change);
            const blob = await this._json(this._repoUrl('/git/blobs'), this._jsonBody('POST', { content: base64, encoding: 'base64' }));
            entries.push({ path: change.path, mode: '100644', type: 'blob', sha: blob.sha });
        }

        const tree = await this._json(this._repoUrl('/git/trees'), this._jsonBody('POST', { base_tree: treeSha, tree: entries }));
        // 内容与当前树完全一致（例如仅刷新了等值字段）时不产生空提交
        if (tree.sha === treeSha) {
            return {
                commitSha,
                treeSha,
                commitUrl: `https://github.com/${this.config.owner}/${this.config.repo}/commit/${commitSha}`,
                changed: 0,
                unchanged: true
            };
        }

        const commit = await this._json(this._repoUrl('/git/commits'), this._jsonBody('POST', { message, tree: tree.sha, parents: [commitSha] }));
        try {
            await this._request(this._repoUrl(`/git/refs/heads/${encodeURIComponent(this.config.branch)}`),
                this._jsonBody('PATCH', { sha: commit.sha, force: false }));
        } catch (error) {
            // 引用被并发修改：重取 HEAD 后整体重试一次
            if (allowRetry && (error.status === 409 || error.status === 422 || error.code === 'CONFLICT')) {
                return this._commitOnce(list, message, false);
            }
            throw error;
        }

        return {
            commitSha: commit.sha,
            treeSha: tree.sha,
            commitUrl: `https://github.com/${this.config.owner}/${this.config.repo}/commit/${commit.sha}`,
            changed: merged.size,
            unchanged: false
        };
    }

    async updateFile(path, content, message = 'Update data via Web Manager') {
        return this.commitChanges([{ path, text: content }], message);
    }

    async updateFileBase64(path, base64Content, message = 'Update file via Web Manager') {
        return this.commitChanges([{ path, base64: base64Content }], message);
    }

    // 上传二进制文件（APK/ZIP 等）：必须按字节编码，不能按文本处理，否则文件损坏
    async updateBinaryFile(path, arrayBuffer, message = 'Upload binary via Web Manager') {
        return this.commitChanges([{ path, content: arrayBuffer }], message);
    }

    async deleteFile(path, message = 'Delete file via Web Manager') {
        this.assertReady();
        const sha = await this.getFileSHA(path);
        if (!sha) return null;
        return this.commitChanges([{ path, delete: true }], message);
    }

    // 删除目录：用递归树一次找出全部文件，在同一个提交里全部删除（GitHub 无“删除文件夹”接口）
    async deleteDir(path, message = 'Delete dir via Web Manager') {
        this.assertReady();
        const prefix = `${path.replace(/\/+$/, '')}/`;
        const tree = await this.getTree();
        const paths = (tree.tree || [])
            .filter(entry => entry.type === 'blob' && entry.path.startsWith(prefix))
            .map(entry => entry.path);
        if (!paths.length) return 0;
        await this.commitChanges(paths.map(p => ({ path: p, delete: true })), message);
        return paths.length;
    }

    // --- 发布后校验 ---

    // 直链 HEAD 校验：加时间戳绕过 CDN/浏览器缓存，尽量比对字节数
    async verifyFile(url, expectedBytes) {
        const target = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
        let response;
        try {
            response = await fetch(target, { method: 'HEAD', cache: 'no-store' });
        } catch (error) {
            return { ok: false, status: 0, bytes: null, error: error.message, url: target };
        }
        const length = Number(response.headers.get('Content-Length') || 0) || null;
        const sizeOk = !expectedBytes || !length || length === expectedBytes;
        return { ok: response.ok && sizeOk, status: response.status, bytes: length, url: target };
    }

    // 最近一次 Pages 构建状态；无权限或未启用 Pages 时返回 null
    async getPagesBuild() {
        this.assertReady();
        try {
            return await this._json(this._repoUrl('/pages/builds/latest'));
        } catch (error) {
            if (error.status === 404 || error.status === 403) return null;
            throw error;
        }
    }

    // --- 编码工具 ---

    // 分块转换，避免大文件一次性 fromCharCode 触发调用栈参数上限
    static arrayBufferToBase64(buffer) {
        const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        return btoa(binary);
    }

    // 文本 → base64：用 TextEncoder 分块编码，替代已废弃的 unescape(encodeURIComponent)
    static textToBase64(text) {
        return GitHubAPIHelper.arrayBufferToBase64(new TextEncoder().encode(String(text)));
    }

    // base64 实际字节数（去掉填充带来的偏差）
    static base64ByteLength(base64) {
        const value = String(base64).replace(/\s/g, '');
        const padding = value.endsWith('==') ? 2 : (value.endsWith('=') ? 1 : 0);
        return Math.max(0, Math.floor(value.length * 3 / 4) - padding);
    }
}

window.GithubApiError = GithubApiError;
window.githubHelper = new GitHubAPIHelper();
