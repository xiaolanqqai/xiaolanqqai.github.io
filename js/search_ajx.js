/**
 * Search Ajax Logic
 * Handles search toggle, submission, and suggestions
 */

// Search Toggle Animation
function searchToggle(obj, evt) {
    var container = $(obj).closest('.search-wrapper');
    if (!container.hasClass('active')) {
        container.addClass('active');
        if (evt) evt.preventDefault();
    } else if (container.hasClass('active') && $(obj).closest('.input-holder').length == 0) {
        container.removeClass('active');
        // clear input
        container.find('.search-input').val('');
        // clear and hide result container when we press close
        container.find('.result-container').fadeOut(100, function() {
            $(this).empty();
        });
    }
}

// Search Submission
function submitFn(obj, evt) {
    var value = $(obj).find('.search-input').val() || $('#txt').val();
    if (value) value = value.trim();
    
    var _html = "";
    var currentMoreB = window.oMoreB;
    
    // Fallback if oMoreB is not set
    if (currentMoreB === undefined || currentMoreB === null) {
        currentMoreB = localStorage.getItem("oMoreB");
        if (currentMoreB === null) {
            currentMoreB = 3;
        } else {
            currentMoreB = parseInt(currentMoreB);
        }
        window.oMoreB = currentMoreB;
    }

    if (!value || !value.length) {
        _html = "https://www.baidu.com/";
    } else {
        switch(parseInt(currentMoreB)) {
            case 0: _html = "http://192.168.1." + value; break;
            case 1: _html = "http://192.168.2." + value; break;
            case 2: _html = "http://192.168." + value; break;
            case 3: _html = "https://www.baidu.com/s?wd=" + value; break;
            case 4: _html = "https://www.bing.com/search?q=" + value; break;
            case 5: _html = "https://www.google.com.hk/search?q=" + value; break;
            case 6: _html = "https://yandex.com/search/?text=" + value; break;
            case 7: _html = "https://search.bilibili.com/all?keyword=" + value; break;
            case 8: _html = "https://www.kuaidi100.com/chaxun?com=&nu=" + value; break;
            default: _html = "https://www.baidu.com/s?wd=" + value;
        }
    }
    
    if (_html) {
        window.open(_html, '_blank');
    }
    
    if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
    }
    return false;
}

// Search Suggestions
$(document).ready(function() {
    var oTxt = document.getElementById("txt");
    var oList = document.getElementById("list");
    var times;

    if (oTxt && oList) {
        $(oTxt).on('keyup', function(e) {
            if (e.keyCode === 13) return; 
            
            var oValue = oTxt.value;
            if (!oValue) {
                $(oList).addClass('d-none').hide();
                return;
            }
            
            $(oList).removeClass('d-none').show();
            
            // JSONP for Baidu Suggestions
            $.ajax({
                url: "https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su",
                dataType: "jsonp",
                data: { wd: oValue },
                jsonp: "cb",
                success: function(myJson) {
                    var data = myJson.s;
                    var str = "";
                    for(var i=0; i<data.length; i++){
                        str += "<li><a href='https://www.baidu.com/s?wd="+encodeURIComponent(data[i])+"' target='_blank'>"+data[i]+"</a></li>";
                    }
                    oList.innerHTML = str;
                }
            });
        });

        $(document).on('click', function(e) {
            if (!$(e.target).closest('.search-wrapper').length) {
                $(oList).addClass('d-none').hide();
            }
        });
    }
});

// Legacy callback for non-jQuery JSONP if needed
function fly(myJson) {
    var data = myJson.s;
    var oList = document.getElementById("list");
    if (!oList) return;
    
    var str = "";
    for(var i=0; i<data.length; i++){
        str += "<li><a href='https://www.baidu.com/s?wd="+encodeURIComponent(data[i])+"' target='_blank'>"+data[i]+"</a></li>";
    }
    oList.innerHTML = str;
}
