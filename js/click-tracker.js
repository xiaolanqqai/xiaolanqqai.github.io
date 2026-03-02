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

        // 使用 URL 的一部分作为 key，确保跨字符集兼容
        // 使用 encodeURIComponent 处理 URL 以防 btoa 报错
        let safeUrlKey;
        try {
            safeUrlKey = btoa(encodeURIComponent(url)).substring(0, 16);
        } catch (e) {
            // 回退方案：使用简单的哈希
            safeUrlKey = url.split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
            }, 0).toString(16);
        }
        
        const storageKey = `nav_history_click_${safeUrlKey}`;
        
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
            // 排除一些不需要追踪的情况，比如内部脚本跳转、空链接等
            const url = anchor.href;
            if (!url || url.startsWith('javascript:') || url.startsWith('#') || url.includes('MM-generator.html')) return;
            
            const title = anchor.innerText.trim() || anchor.title || anchor.getAttribute('aria-label');
            recordClick(url, title);
        }
    }, false); // 改为冒泡阶段，减少对其他捕获型监听器的干扰
})();
