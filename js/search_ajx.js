/* Search logic - 原生 JS 实现，不依赖 jQuery */
(function() {
    const SUGGEST_ENDPOINT = 'https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su';

    function getSearchWrapper(element) {
        return element && element.closest ? element.closest('.search-wrapper') : null;
    }

    function searchToggle(obj, evt) {
        const container = getSearchWrapper(obj);
        if (!container) return;

        if (!container.classList.contains('active')) {
            container.classList.add('active');
            if (evt) evt.preventDefault();
            return;
        }

        if (obj.closest && !obj.closest('.input-holder')) {
            container.classList.remove('active');
            const input = container.querySelector('.search-input');
            if (input) input.value = '';
            const result = container.querySelector('.result-container');
            if (result) {
                result.style.display = 'none';
                result.innerHTML = '';
            }
        }
    }

    const SEARCH_ENGINES = new Map([
        [0, v => `http://192.168.1.${v}`],
        [1, v => `http://192.168.2.${v}`],
        [2, v => `http://192.168.${v}`],
        [3, v => `https://www.baidu.com/s?wd=${v}`],
        [4, v => `https://www.bing.com/search?q=${v}`],
        [5, v => `https://www.google.com.hk/search?q=${v}`],
        [6, v => `https://yandex.com/search/?text=${v}`],
        [7, v => `https://search.bilibili.com/all?keyword=${v}`],
        [8, v => `https://www.kuaidi100.com/chaxun?com=&nu=${v}`],
    ]);

    function submitFn(obj, evt) {
        const input = obj ? obj.querySelector('.search-input') : null;
        const fallback = document.getElementById('txt');
        const value = ((input && input.value) || (fallback && fallback.value) || '').trim();

        let currentMoreB = window.oMoreB;
        if (currentMoreB == null) {
            currentMoreB = parseInt(localStorage.getItem('oMoreB'), 10) || 3;
            window.oMoreB = currentMoreB;
        }

        const build = SEARCH_ENGINES.get(parseInt(currentMoreB, 10)) || SEARCH_ENGINES.get(3);
        const url = !value ? 'https://www.baidu.com/' : build(value);
        if (url) window.open(url, '_blank');
        if (evt) { evt.preventDefault(); evt.stopPropagation(); }
        return false;
    }

    // --- 联想词：手工 JSONP，替代 $.ajax({ dataType: 'jsonp' }) ---
    let jsonpSeq = 0;

    function requestSuggestions(keyword, onDone) {
        const callbackName = `baiduSug_${Date.now()}_${jsonpSeq++}`;
        const script = document.createElement('script');
        let finished = false;

        const cleanup = () => {
            if (finished) return;
            finished = true;
            try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; }
            if (script.parentNode) script.parentNode.removeChild(script);
        };

        window[callbackName] = (payload) => {
            try { onDone(payload); } finally { cleanup(); }
        };

        script.src = `${SUGGEST_ENDPOINT}?wd=${encodeURIComponent(keyword)}&cb=${callbackName}`;
        script.async = true;
        script.onerror = cleanup;
        document.body.appendChild(script);
    }

    function renderSuggestions(items) {
        const list = document.getElementById('list');
        if (!list) return;
        if (!Array.isArray(items) || !items.length) {
            list.innerHTML = '';
            list.classList.add('d-none');
            return;
        }
        // 联想词来自第三方接口，必须转义后再拼接
        list.innerHTML = items.map(item => {
            const text = window.escapeHtml ? window.escapeHtml(item) : '';
            return `<li><a href="https://www.baidu.com/s?wd=${encodeURIComponent(item)}" target="_blank" rel="noopener noreferrer">${text}</a></li>`;
        }).join('');
    }

    // 兼容旧的 JSONP 回调名
    window.fly = (payload) => renderSuggestions(payload && payload.s);

    function bindSuggestionInput() {
        const input = document.getElementById('txt');
        const list = document.getElementById('list');
        if (!input || !list) return;

        input.addEventListener('keyup', (e) => {
            if (e.keyCode === 13 || !input.value) {
                if (!input.value) {
                    list.classList.add('d-none');
                    list.style.display = 'none';
                }
                return;
            }
            list.classList.remove('d-none');
            list.style.display = 'block';
            requestSuggestions(input.value, payload => renderSuggestions(payload && payload.s));
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest || !e.target.closest('.search-wrapper')) {
                list.classList.add('d-none');
                list.style.display = 'none';
            }
        });
    }

    window.searchToggle = searchToggle;
    window.submitFn = submitFn;
    window.SEARCH_ENGINES = SEARCH_ENGINES;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindSuggestionInput);
    } else {
        bindSuggestionInput();
    }
})();
