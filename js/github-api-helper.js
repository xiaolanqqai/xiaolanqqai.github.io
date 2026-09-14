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

    async updateFile(path, content, message = 'Update data via Web Manager') {
        if (!this.isConfigured()) throw new Error('GitHub Token 未配置或无效。');
        const sha = await this.getFileSHA(path);
        const body = {
            message, content: btoa(unescape(encodeURIComponent(content))), branch: this.config.branch
        };
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
