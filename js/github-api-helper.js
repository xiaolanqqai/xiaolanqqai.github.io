/**
 * GitHub API 助手 - 用于在 GitHub Pages 上实现动态存储
 * 允许直接通过 GitHub API 将更改提交回仓库，无需手动下载上传 JSON
 */

class GitHubAPIHelper {
    constructor() {
        this.config = this.loadConfig();
    }

    /**
     * 加载保存的配置
     */
    loadConfig() {
        const saved = localStorage.getItem('github_api_config');
        return saved ? JSON.parse(saved) : {
            token: '',
            owner: '',
            repo: '',
            branch: 'main'
        };
    }

    /**
     * 保存配置
     */
    saveConfig(config) {
        this.config = { ...this.config, ...config };
        localStorage.setItem('github_api_config', JSON.stringify(this.config));
    }

    /**
     * 检查配置是否完整
     */
    isConfigured() {
        return this.config.token && this.config.owner && this.config.repo;
    }

    /**
     * 获取文件的 SHA 值
     * @param {string} path 文件路径
     */
    async getFileSHA(path) {
        const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${path}?ref=${this.config.branch}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${this.config.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`获取文件 SHA 失败: ${response.statusText}`);
        }

        const data = await response.json();
        return data.sha;
    }

    /**
     * 更新 GitHub 上的文件
     * @param {string} path 文件路径
     * @param {string} content 文件内容（字符串）
     * @param {string} message 提交信息
     */
    async updateFile(path, content, message = 'Update data via Web Manager') {
        if (!this.isConfigured()) {
            throw new Error('GitHub API 未配置，请先在设置中配置 Token、仓库所有者和仓库名。');
        }

        const sha = await this.getFileSHA(path);
        const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
        
        // 编码内容为 Base64 (处理中文字符)
        const base64Content = btoa(unescape(encodeURIComponent(content)));

        const body = {
            message: message,
            content: base64Content,
            branch: this.config.branch
        };

        if (sha) {
            body.sha = sha;
        }

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.config.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`更新文件失败: ${errorData.message || response.statusText}`);
        }

        return await response.json();
    }
}

// 导出全局实例
window.githubHelper = new GitHubAPIHelper();
