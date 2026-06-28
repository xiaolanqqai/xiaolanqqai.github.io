(function() {
    const debounce = (fn, wait) => {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
    };

    const recordClick = debounce((url, title) => {
        if (!url || url.startsWith('javascript:') || url.startsWith('#')) return;

        let safeUrlKey;
        try {
            safeUrlKey = btoa(encodeURIComponent(url)).substring(0, 16);
        } catch (e) {
            safeUrlKey = url.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) & a, 0).toString(16);
        }

        const storageKey = `nav_history_click_${safeUrlKey}`;
        try {
            const now = new Date().toISOString();
            const raw = localStorage.getItem(storageKey);
            const data = raw ? JSON.parse(raw) : { url, title: title || url, count: 0, lastClick: now };
            data.count += 1;
            data.lastClick = now;
            if (title && title !== data.title) data.title = title;
            localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (e) { /* ignore storage errors */ }
    }, 300);

    document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a');
        if (!anchor || !anchor.href) return;
        const url = anchor.href;
        if (url.startsWith('javascript:') || url.startsWith('#') || url.includes('MM-generator.html')) return;
        const title = anchor.innerText.trim() || anchor.title || anchor.getAttribute('aria-label');
        recordClick(url, title);
    }, false);
})();
