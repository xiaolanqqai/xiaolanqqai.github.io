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
                        onkeyup="searchToggle(this, event);" />
                    <button class="search-icon" onclick="searchToggle(this, event);"><span></span></button>
                </div>
                <span class="close" onclick="searchToggle(this, event);"></span>
                <div class="result-container"></div>
            </div>
            <div id="search_ajx">
                <ul id="list" style="display:none;"></ul>
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

    // Load search logic
    const script = document.createElement('script');
    script.src = `${basePath}js/search_ajx.js`;
    document.body.appendChild(script);
})();
