const fs = require('fs');
const path = require('path');
const os = require('os');

function getBookmarksPaths() {
    const home = os.homedir();
    const paths = [];

    if (process.platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA;
        // Chrome
        paths.push({
            browser: 'Chrome',
            path: path.join(localAppData, 'Google/Chrome/User Data/Default/Bookmarks')
        });
        // Edge
        paths.push({
            browser: 'Edge',
            path: path.join(localAppData, 'Microsoft/Edge/User Data/Default/Bookmarks')
        });
    } else if (process.platform === 'darwin') {
        // Chrome
        paths.push({
            browser: 'Chrome',
            path: path.join(home, 'Library/Application Support/Google/Chrome/Default/Bookmarks')
        });
        // Edge
        paths.push({
            browser: 'Edge',
            path: path.join(home, 'Library/Application Support/Microsoft Edge/Default/Bookmarks')
        });
    }

    return paths;
}

function parseBookmarks(node) {
    if (node.type === 'folder') {
        const children = (node.children || [])
            .map(parseBookmarks)
            .filter(Boolean);
        return {
            title: node.name,
            children: children
        };
    } else if (node.type === 'url') {
        return {
            title: node.name,
            url: node.url
        };
    }
    return null;
}

function main() {
    console.log('正在查找浏览器收藏夹...');
    const paths = getBookmarksPaths();
    
    const allBookmarks = {
        title: '本地浏览器收藏夹',
        children: []
    };
    
    let foundAny = false;
    for (const p of paths) {
        if (fs.existsSync(p.path)) {
            console.log(`找到 ${p.browser} 收藏夹: ${p.path}`);
            try {
                const data = JSON.parse(fs.readFileSync(p.path, 'utf-8'));
                const roots = data.roots || {};
                const browserRoot = {
                    title: p.browser,
                    children: []
                };
                
                ['bookmark_bar', 'other', 'synced'].forEach(key => {
                    if (roots[key]) {
                        const parsed = parseBookmarks(roots[key]);
                        if (parsed && parsed.children && parsed.children.length > 0) {
                            browserRoot.children.push(parsed);
                        }
                    }
                });
                
                if (browserRoot.children.length > 0) {
                    allBookmarks.children.push(browserRoot);
                    foundAny = true;
                }
            } catch (e) {
                console.error(`解析 ${p.browser} 收藏夹失败:`, e.message);
            }
        } else {
            console.log(`未找到 ${p.browser} 收藏夹路径: ${p.path}`);
        }
    }

    if (foundAny) {
        const outputDir = path.join(__dirname, '../data');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const outputPath = path.join(outputDir, 'local-bookmarks.json');
        fs.writeFileSync(outputPath, JSON.stringify(allBookmarks, null, 4), 'utf-8');
        
        console.log(`\n成功! 收藏夹已导出至: ${path.resolve(outputPath)}`);
        console.log('您现在可以在管理页面中点击“本地同步”按钮查看这些收藏夹了。');
    } else {
        console.log('\n未能找到任何支持的浏览器收藏夹。');
    }
}

main();
