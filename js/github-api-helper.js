class GitHubAPIHelper {
    constructor() {
        this.config = this.loadConfig();
    }

    loadConfig() {
        // 安全加固：token 不再硬编码在前端源码（原 XOR 混淆可被离线还原，具备仓库写权限）。
        // 改由管理员在浏览器控制台注入一次，存 localStorage，长期有效、不进 Git 仓库：
        //   localStorage.setItem('github_token', 'github_pat_xxx')
        // 未注入时 isConfigured() 为 false。
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
        return { 'Authorization': `token ${this._token()}`, 'Accept': 'application/vnd.github.v3+json' };
    }

    _apiUrl(path) {
        return `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${path}?ref=${this.config.branch}`;
    }

    async getFileSHA(path) {
        const response = await fetch(this._apiUrl(path), { headers: this._headers() });
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`获取文件 SHA 失败: ${response.statusText}`);
        }
        return (await response.json()).sha;
    }

    async getFile(path) {
        if (!this.isConfigured()) throw new Error('GitHub Token 未配置或无效。');
        const response = await fetch(this._apiUrl(path), { headers: this._headers() });
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`获取文件失败: ${response.statusText}`);
        }
        return await response.json();
    }

    // 统一的写文件入口：sha 存在即覆盖，否则新建
    async _put(path, base64Content, message) {
        const sha = await this.getFileSHA(path);
        const body = { message, content: base64Content, branch: this.config.branch };
        if (sha) body.sha = sha;

        const response = await fetch(this._apiUrl(path).split('?')[0], {
            method: 'PUT',
            headers: { ...this._headers(), 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const { message: msg } = await response.json();
            throw new Error(`更新文件失败: ${msg || response.statusText}`);
        }
        return await response.json();
    }

    async updateFile(path, content, message = 'Update data via Web Manager') {
        if (!this.isConfigured()) throw new Error('GitHub Token 未配置或无效。');
        return this._put(path, btoa(unescape(encodeURIComponent(content))), message);
    }

    // 直接以 base64 内容写入：文件迁移时内容本就取自 getFile 的 base64，无需解码再编码
    async updateFileBase64(path, base64Content, message = 'Update file via Web Manager') {
        if (!this.isConfigured()) throw new Error('GitHub Token 未配置或无效。');
        return this._put(path, base64Content, message);
    }

    // 上传二进制文件（APK/ZIP 等）：必须按字节编码，不能走文本的 encodeURIComponent 路径，否则文件损坏
    async updateBinaryFile(path, arrayBuffer, message = 'Upload binary via Web Manager') {
        if (!this.isConfigured()) throw new Error('GitHub Token 未配置或无效。');
        return this._put(path, GitHubAPIHelper.arrayBufferToBase64(arrayBuffer), message);
    }

    // 分块转换，避免大文件一次性 fromCharCode 触发调用栈参数上限
    static arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        return btoa(binary);
    }

    // 列举目录内容；路径不存在时返回空数组（Contents API 对目录返回数组，对文件返回对象）
    async listDir(path) {
        if (!this.isConfigured()) throw new Error('GitHub Token 未配置或无效。');
        const response = await fetch(this._apiUrl(path), { headers: this._headers() });
        if (!response.ok) {
            if (response.status === 404) return [];
            throw new Error(`读取目录失败: ${response.statusText}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [data];
    }

    // 递归删除目录：GitHub 不支持删除文件夹，只能逐层列出后删除其中的文件
    async deleteDir(path, message = 'Delete dir via Web Manager') {
        const entries = await this.listDir(path);
        let count = 0;
        for (const entry of entries) {
            if (entry.type === 'dir') count += await this.deleteDir(entry.path, message);
            else { await this.deleteFile(entry.path, message); count++; }
        }
        return count;
    }

    async deleteFile(path, message = 'Delete file via Web Manager') {
        if (!this.isConfigured()) throw new Error('GitHub Token 未配置或无效。');
        const sha = await this.getFileSHA(path);
        if (!sha) return null;

        const response = await fetch(this._apiUrl(path).split('?')[0], {
            method: 'DELETE',
            headers: { ...this._headers(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, sha, branch: this.config.branch })
        });

        if (!response.ok) {
            const { message: msg } = await response.json();
            throw new Error(`删除文件失败: ${msg || response.statusText}`);
        }
        return await response.json();
    }
}

window.githubHelper = new GitHubAPIHelper();
