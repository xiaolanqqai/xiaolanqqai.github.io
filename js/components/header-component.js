/**
 * Header Component - Meta tags, CSS links, global helpers
 */
(function() {
    // --- Global basePath helper (shared across components) ---
    const basePath = (window.location.pathname.includes('/index/manager/')) ? '../../'
        : (window.location.pathname.includes('/index/Tool/')) ? '../../'
        : (window.location.pathname.includes('/index/')) ? '../' : './';
    window.getBasePath = () => basePath;

    const headContent = `
<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="Shortcut icon" href="${basePath}favicon.ico" loading="lazy">
<meta name="description" content="快速搜索与网站导航">
<!-- Critical CSS -->
<link rel="preload" href="${basePath}css/bootstrap.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${basePath}css/bootstrap.min.css"></noscript>
<link rel="preload" href="${basePath}css/index.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${basePath}css/index.css"></noscript>
<link rel="preload" href="${basePath}css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${basePath}css/all.min.css"></noscript>
<!-- Styles -->
<link rel="stylesheet" href="${basePath}css/style-main/index.css">
<link rel="stylesheet" type="text/css" href="${basePath}css/search-form.css" media="print" onload="this.media='all'">
<link rel="stylesheet" href="${basePath}css/manager-styles.css">
<link rel="stylesheet" href="${basePath}css/dark-mode.css">
<!-- Logic -->
<script src="${basePath}js/bootstrap.bundle.min.js"></script>
<script src="${basePath}js/dark-mode.js" defer></script>
<script src="${basePath}js/click-tracker.js" defer></script>
<!-- Microsoft Clarity -->
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "vx0ai1ey2z");
</script>`;

    document.write(headContent);
})();
