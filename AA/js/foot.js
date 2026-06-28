window.onload = () => Particles.init({ selector: '.background' });

function loadVersionInfo(data) {
    const el = document.getElementById('uptime1');
    if (data.version) {
        if (el) el.textContent = `Beta:${data.version.web_vol || 'Unknown'}`;
    } else if (el) {
        el.textContent = 'Beta:Unknown';
    }
    checkPageStatus();
}

function checkPageStatus() {
    const el = document.getElementById('state1');
    const isLocal = window.location.protocol === 'file:';
    if (el) { el.textContent = isLocal ? 'Local' : 'Server'; el.className = `badge ${isLocal ? 'text-bg-warning' : 'text-bg-success'}`; }
}
