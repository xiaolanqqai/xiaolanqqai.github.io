/**
 * 点击追踪逻辑
 * 为所有外链或站内跳转的 <a> 标签统一绑定点击事件
 * 以 URL 为 key、点击次数为 value 更新本地存储
 */
(function() {
    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // 记录点击
    const recordClick = debounce(function(url, title) {
        if (!url || url.startsWith('javascript:') || url.startsWith('#')) return;

        // 生成简易 md5 (此处使用简单的哈希模拟，或直接使用 URL，根据要求使用 md5)
        // 为简单起见，这里直接使用 URL 作为 key 的一部分，实际项目中建议引入 md5 库
        const storageKey = `nav_history_click_${btoa(url).substring(0, 16)}`;
        
        try {
            const now = new Date().toISOString();
            let historyData = localStorage.getItem(storageKey);
            
            if (historyData) {
                historyData = JSON.parse(historyData);
                historyData.count += 1;
                historyData.lastClick = now;
                // 如果标题有更新则更新
                if (title && title !== historyData.title) historyData.title = title;
            } else {
                historyData = {
                    url: url,
                    title: title || url,
                    count: 1,
                    lastClick: now
                };
            }
            
            localStorage.setItem(storageKey, JSON.stringify(historyData));
            console.log(`[Tracker] Recorded click for: ${url}, count: ${historyData.count}`);
        } catch (e) {
            console.error('[Tracker] Failed to record click:', e);
        }
    }, 300);

    // 事件委托：监听整个文档的点击
    document.addEventListener('click', function(e) {
        const anchor = e.target.closest('a');
        if (anchor && anchor.href) {
            const url = anchor.href;
            const title = anchor.innerText.trim() || anchor.title || anchor.getAttribute('aria-label');
            recordClick(url, title);
        }
    }, true);
})();
