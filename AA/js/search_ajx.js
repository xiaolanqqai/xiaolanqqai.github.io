function searchToggle(obj, evt) {
    const container = $(obj).closest('.search-wrapper');
    if (!container.hasClass('active')) {
        container.addClass('active');
        if (evt) evt.preventDefault();
    } else if (!$(obj).closest('.input-holder').length) {
        container.removeClass('active').find('.search-input').val('');
        container.find('.result-container').fadeOut(100, function() { $(this).empty(); });
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
    const value = ($(obj).find('.search-input').val() || $('#txt').val() || '').trim();

    let currentMoreB = window.oMoreB;
    if (currentMoreB == null) {
        currentMoreB = parseInt(localStorage.getItem('oMoreB')) || 3;
        window.oMoreB = currentMoreB;
    }

    const url = !value ? 'https://www.baidu.com/'
        : (SEARCH_ENGINES.get(parseInt(currentMoreB)) || SEARCH_ENGINES.get(3))(value);
    if (url) window.open(url, '_blank');
    if (evt) { evt.preventDefault(); evt.stopPropagation(); }
    return false;
}

$(document).ready(function() {
    const oTxt = document.getElementById('txt');
    const oList = document.getElementById('list');
    if (!oTxt || !oList) return;

    $(oTxt).on('keyup', function(e) {
        if (e.keyCode === 13 || !oTxt.value) {
            if (!oTxt.value) $(oList).addClass('d-none').hide();
            return;
        }
        $(oList).removeClass('d-none').show();
        $.ajax({
            url: "https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su",
            dataType: "jsonp", data: { wd: oTxt.value }, jsonp: "cb",
            success: (myJson) => {
                oList.innerHTML = myJson.s.map(item =>
                    `<li><a href='https://www.baidu.com/s?wd=${encodeURIComponent(item)}' target='_blank'>${item}</a></li>`
                ).join('');
            }
        });
    });

    $(document).on('click', (e) => {
        if (!$(e.target).closest('.search-wrapper').length) $(oList).addClass('d-none').hide();
    });
});

function fly(myJson) {
    const oList = document.getElementById('list');
    if (!oList) return;
    oList.innerHTML = myJson.s.map(item =>
        `<li><a href='https://www.baidu.com/s?wd=${encodeURIComponent(item)}' target='_blank'>${item}</a></li>`
    ).join('');
}
