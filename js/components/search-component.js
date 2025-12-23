/**
 * Search Engine Component
 * Handles the search box UI and loading search logic
 */
(function() {
    let basePath;
    const path = window.location.pathname;
    if (path.includes('/index/manager/')) {
        basePath = '../../';
    } else if (path.includes('/index/')) {
        basePath = '../';
    } else {
        basePath = './';
    }
    
    const searchHTML = `
        <form onsubmit="submitFn(this, event);">
            <div class="search-wrapper">
                <div class="input-holder">
                    <input type="text" id="txt" class="search-input" placeholder="Type to search"
                        onkeyup="searchToggle(this, event);" onkeypress="handleKeyPress(event)" />
                    <button class="search-icon" onclick="searchToggle(this, event);"><span></span></button>
                </div>
                <span class="close" onclick="searchToggle(this, event);"></span>
                <div class="result-container"></div>
            </div>
            <div id="search_ajx">
                <ul id="list" class="d-none"></ul>
            </div>
        </form>
    `;

    // Inject HTML into the container
    const container = document.getElementById('search-engine-container');
    if (container) {
        container.innerHTML = searchHTML;
    } else {
        // Fallback: if container not found, inject at script location
        document.write(`<div id="search-engine-container">${searchHTML}</div>`);
    }

    // Initialize search engine preference (oMoreB)
    if (window.localStorage && !window.oMoreB) {
        let oMoreB = localStorage.getItem("oMoreB");
        if (oMoreB == null) {
            oMoreB = 3;
        } else {
            oMoreB = parseInt(oMoreB);
        }
        window.oMoreB = oMoreB;
    }

    // Load search logic - Removed redundant loading since it's now in index.html
    // but kept for compatibility with other pages if any
    function loadSearchLogic() {
        if (typeof submitFn === 'function') return; // Already loaded
        
        if (window.jQuery) {
            const script = document.createElement('script');
            script.src = `${basePath}js/search_ajx.js`;
            document.body.appendChild(script);
        } else {
            // Wait for jQuery
            setTimeout(loadSearchLogic, 50);
        }
    }
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        loadSearchLogic();
    } else {
        window.addEventListener('DOMContentLoaded', loadSearchLogic);
    }
})();
