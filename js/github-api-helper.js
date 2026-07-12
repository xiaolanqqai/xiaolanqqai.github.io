class GitHubAPIHelper {
    constructor() {
        this.config = this.loadConfig();
    }

    loadConfig() {
        const _e = "1f001507190331080815305d502f3c5f223e3c205e320105200b2e042d0e375d053e282d042c163a330b1119040a35313d2831572b36195b4e3c151b19250c0f0b333518331c29183b291f05192d25313e24202a3e1b111a5526092023";
        const _k = localStorage.getItem('userName') || 'guest';
        const _d = (hex, key) => {
            let str = '';
            for (let i = 0; i < hex.length; i += 2) {
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16) ^ key.charCodeAt((i / 2) % key.length));
            }
            return str;
        };

        return { token: _d(_e, _k), owner: 'xiaolanqqai', repo: 'xiaolanqqai.github.io', branch: 'master' };
    }

    getConfig() { return this.config; }
    isConfigured() { return !!this.config.token; }

    _headers() {
        return { 'Authorization': `token ${this.config.token}`, 'Accept': 'application/vnd.github.v3+json' };
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
