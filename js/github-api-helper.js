/**
 * GitHub API 助手 - 用于在 GitHub Pages 上实现动态存储
 * 允许直接通过 GitHub API 将更改提交回仓库，无需手动下载上传 JSON
 */

class GitHubAPIHelper {
    constructor() {
        this.config = this.loadConfig();
    }

    /**
     * 加载配置 (内置 Token - 已加密)
     */
    loadConfig() {
        // 加密后的 Token 字符串
        const _e = "1f001507190331080815305d502f3c5f223e3c205e400f141d162839021a570d023e57221d0a2808065d2120542c0d39563f01070159003c200337232059561a275138361216485f301d3e1424332d2d2029553d36300305580605211f";
        
        // 获取解密密钥 (从浏览器缓存的 userName 获取)
        // 默认值设为 'guest' 以防止报错，但此时 Token 解密将失败
        const _k = localStorage.getItem('userName') || 'guest';

        // 解密函数 (XOR + Hex)
        const _d = (hex, key) => {
            let str = '';
            for (let i = 0; i < hex.length; i += 2) {
                const charCode = parseInt(hex.substr(i, 2), 16) ^ key.charCodeAt((i / 2) % key.length);
                str += String.fromCharCode(charCode);
            }
            return str;
        };

        const _t = _d(_e, _k);

        return {
            token: _t,
            owner: 'xiaolanqqai',
            repo: 'xiaolanqqai.github.io',
            branch: 'master'
        };
    }

    /**
     * 获取配置
     */
    getConfig() {
        return this.config;
    }

    /**
     * 检查配置是否完整
     */
    isConfigured() {
        return !!this.config.token;
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
            throw new Error('GitHub Token 未配置或无效。');
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