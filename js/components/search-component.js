/**
 * Search Engine Component - Search box UI and logic loading
 */
(function() {
    const getBasePath = () => window.getBasePath?.()
        ?? ((window.location.pathname.includes('/index/manager/')) ? '../../'
            : (window.location.pathname.includes('/index/')) ? '../' : './');

    const searchHTML = `
<form onsubmit="submitFn(this, event);">
    <div class="search-wrapper">
        <div class="input-holder">
            <input type="text" id="txt" class="search-input" placeholder="Type to search"
                role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="list"
                aria-label="搜索" autocomplete="off"
                onkeyup="searchToggle(this, event);" onkeypress="handleKeyPress(event)" />
            <button class="search-icon" onclick="searchToggle(this, event);" aria-label="展开搜索"><span></span></button>
        </div>
        <span class="close" onclick="searchToggle(this, event);"></span>
        <div class="result-container"></div>
    </div>
    <div id="search_ajx">
        <ul id="list" class="d-none" role="listbox" aria-label="搜索候选词"></ul>
    </div>
</form>`;

    const container = document.getElementById('search-engine-container');
    if (container) {
        container.innerHTML = searchHTML;
    } else {
        document.write(`<div id="search-engine-container">${searchHTML}</div>`);
    }

    // Restore search engine preference
    if (window.localStorage && !window.oMoreB) {
        const stored = localStorage.getItem('oMoreB');
        window.oMoreB = stored == null ? 3 : parseInt(stored, 10);
    }

    // --- Load search logic ---
    const loadSearchLogic = () => {
        if (typeof submitFn === 'function') return;
        const s = document.createElement('script');
        s.src = `${getBasePath()}js/search_ajx.js`;
        document.body.appendChild(s);
    };

    const {readyState} = document;
    if (readyState === 'complete' || readyState === 'interactive') {
        loadSearchLogic();
    } else {
        window.addEventListener('DOMContentLoaded', loadSearchLogic);
    }
})();
