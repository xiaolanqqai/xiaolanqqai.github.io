/* Search logic - 原生 JS 实现，不依赖 jQuery */
(function() {
    const SUGGEST_ENDPOINT = 'https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su';
    const SUGGEST_DEBOUNCE = 150;   // 输入防抖，避免每次按键都打接口
    const SUGGEST_MIN_ENGINE = 3;   // 索引 0-2 是局域网 IP 前缀，不适用联想词

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
        [9, v => `https://www.alleba.com/dir.html?q=${v}`],
        [10, v => `https://search.daum.net/search?q=${v}`],
        [11, v => `https://search.goo.ne.jp/web.jsp?MT=${v}`],
        [12, v => `https://duckduckgo.com/?q=${v}`],
    ]);

    function currentEngineIndex() {
        if (window.oMoreB != null) {
            const live = parseInt(window.oMoreB, 10);
            if (!isNaN(live)) return live;
        }
        const stored = parseInt(localStorage.getItem('oMoreB'), 10);
        return isNaN(stored) ? 3 : stored;
    }

    function buildSearchUrl(engineIndex, value) {
        const build = SEARCH_ENGINES.get(engineIndex) || SEARCH_ENGINES.get(3);
        return build(value);
    }

    function submitFn(obj, evt) {
        const input = obj ? obj.querySelector('.search-input') : null;
        const fallback = document.getElementById('txt');
        const value = ((input && input.value) || (fallback && fallback.value) || '').trim();

        const url = !value ? 'https://www.baidu.com/' : buildSearchUrl(currentEngineIndex(), value);
        if (url) window.open(url, '_blank');
        if (evt) { evt.preventDefault(); evt.stopPropagation(); }
        return false;
    }

    // --- 联想词：手工 JSONP，替代 $.ajax({ dataType: 'jsonp' }) ---
    let jsonpSeq = 0;
    let latestSeq = 0;      // 请求序号，"最新请求胜出"
    let debounceTimer = null;
    let activeIndex = -1;   // 键盘高亮的候选词下标
    let composing = false;  // 输入法组合中不发请求

    function suggestEnabled() {
        return currentEngineIndex() >= SUGGEST_MIN_ENGINE;
    }

    function hideSuggestions() {
        const list = document.getElementById('list');
        if (list) {
            list.innerHTML = '';
            list.classList.add('d-none');
        }
        activeIndex = -1;
        latestSeq++;    // 让在途响应失效，避免清空后又被写回
        const input = document.getElementById('txt');
        if (input) {
            input.setAttribute('aria-expanded', 'false');
            input.removeAttribute('aria-activedescendant');
        }
    }

    function requestSuggestions(keyword, onDone) {
        const seq = ++latestSeq;
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
            try {
                if (seq === latestSeq) onDone(payload);
            } finally { cleanup(); }
        };

        script.src = `${SUGGEST_ENDPOINT}?wd=${encodeURIComponent(keyword)}&cb=${callbackName}`;
        script.async = true;
        script.onerror = cleanup;
        document.body.appendChild(script);
    }

    function renderSuggestions(items) {
        const list = document.getElementById('list');
        const input = document.getElementById('txt');
        if (!list) return;

        if (!Array.isArray(items) || !items.length) {
            hideSuggestions();
            return;
        }

        const engineIndex = currentEngineIndex();
        // 候选词文本来自第三方接口，必须转义；链接按"当前引擎"模板生成，不再写死百度
        list.innerHTML = items.map((item, i) => {
            const text = window.escapeHtml ? window.escapeHtml(item) : '';
            const raw = buildSearchUrl(engineIndex, item);
            const href = window.safeUrl ? (window.safeUrl(raw) || '#') : raw;
            return `<li role="option" id="sug-${i}" aria-selected="false">` +
                `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a></li>`;
        }).join('');

        activeIndex = -1;
        list.classList.remove('d-none');
        if (input) input.setAttribute('aria-expanded', 'true');
    }

    function updateActiveOption() {
        const list = document.getElementById('list');
        const input = document.getElementById('txt');
        if (!list) return;

        const options = list.querySelectorAll('li');
        options.forEach((li, i) => {
            const on = i === activeIndex;
            li.setAttribute('aria-selected', on ? 'true' : 'false');
            const a = li.querySelector('a');
            if (a) a.classList.toggle('active', on);
        });

        if (!input) return;
        if (activeIndex >= 0 && options[activeIndex]) {
            input.setAttribute('aria-activedescendant', 'sug-' + activeIndex);
            options[activeIndex].scrollIntoView({ block: 'nearest' });
        } else {
            input.removeAttribute('aria-activedescendant');
        }
    }

    function scheduleSuggestions() {
        const list = document.getElementById('list');
        const input = document.getElementById('txt');
        if (!input || !list) return;

        if (composing) return;  // 输入法组合期间不查询，等 compositionend

        const value = input.value.trim();
        if (!value || !suggestEnabled()) {
            hideSuggestions();
            return;
        }

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            requestSuggestions(value, payload => renderSuggestions(payload && payload.s));
        }, SUGGEST_DEBOUNCE);
    }

    function bindSuggestionInput() {
        const input = document.getElementById('txt');
        const list = document.getElementById('list');
        if (!input || !list) return;

        input.addEventListener('input', scheduleSuggestions);

        input.addEventListener('compositionstart', () => { composing = true; });
        input.addEventListener('compositionend', () => {
            composing = false;
            scheduleSuggestions();
        });

        input.addEventListener('keydown', (e) => {
            const key = e.key;
            const visible = !list.classList.contains('d-none');
            const options = visible ? list.querySelectorAll('li') : [];

            if (key === 'ArrowDown' || key === 'ArrowUp') {
                if (!options.length) return;
                e.preventDefault();
                activeIndex = key === 'ArrowDown'
                    ? (activeIndex + 1) % options.length
                    : (activeIndex - 1 + options.length) % options.length;
                updateActiveOption();
                return;
            }

            if (key === 'Escape') {
                if (visible) { e.preventDefault(); hideSuggestions(); }
                return;
            }

            if (key === 'Enter' && activeIndex >= 0 && options[activeIndex]) {
                // 把候选词写回输入框；随后的 keypress → handleKeyPress → submitFn 会按当前引擎发起搜索
                const chosen = options[activeIndex].querySelector('a');
                if (chosen) input.value = chosen.textContent;
                hideSuggestions();
            }
        });

        // 点中候选词后收起列表
        list.addEventListener('click', (e) => {
            if (e.target && e.target.closest && e.target.closest('a')) hideSuggestions();
        });

        // 点击搜索框与候选词列表之外才收起（列表是 .search-wrapper 的兄弟节点，需一并排除）
        document.addEventListener('click', (e) => {
            if (!e.target || !e.target.closest) { hideSuggestions(); return; }
            if (e.target.closest('.search-wrapper') || e.target.closest('#search_ajx')) return;
            hideSuggestions();
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
