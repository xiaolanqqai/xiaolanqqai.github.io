// 搜索框功能优化版
function searchToggle(obj, evt) {
	var container = $(obj).closest('.search-wrapper');
	if(!container.hasClass('active')) {
		container.addClass('active');
		evt.preventDefault();
	} else if(container.hasClass('active') && $(obj).closest('.input-holder').length == 0) {
		container.removeClass('active');
		// 清空输入
		container.find('.search-input').val('');
		// 清空并隐藏结果容器
		container.find('.result-container').fadeOut(100, function() {
			$(this).empty();
		});
	}
};

function submitFn(obj, evt) {
	var value = $(obj).find('.search-input').val().trim();
	var _html = "https://www.baidu.com/";
	
	if(value.length > 0) {
		// 使用数组映射替代多重if-else判断，提高执行效率
		var searchEngines = [
			"http://192.168.1.",
			"http://192.168.2.",
			"http://192.168.",
			"https://www.baidu.com/s?wd=",
			"https://www.bing.com/search?q=",
			"https://www.google.com.hk/search?q=",
			"https://yandex.com/search/?text=",
			"https://search.bilibili.com/all?keyword=",
			"https://www.kuaidi100.com/chaxun?com=&nu="
		];
		
		// 检查oMoreB是否有效
		var engineIndex = oMoreB && oMoreB >= 0 && oMoreB < searchEngines.length ? oMoreB : 3; // 默认使用百度
		_html = searchEngines[engineIndex] + value;
	}
	
	// 打开搜索页面
	window.open(_html);
	$(obj).find('.result-container').fadeIn(100);
	evt.preventDefault();
};

// 搜索建议功能（简化版）
(function() {
	var oTxt = document.getElementById("txt");
	var oList = document.getElementById("list");
	var searchTimeout;
	
	// 防抖函数，避免频繁请求
	function debounce(func, wait) {
		return function() {
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(func, wait);
		};
	}
	
	// 搜索建议请求
	var fetchSuggestions = debounce(function() {
		var oValue = oTxt.value;
		if(oValue.trim().length === 0) {
			oList.style.display = "none";
			return;
		}
		
		oList.style.display = "block";
		var oScript = document.createElement("script");
		oScript.src = "https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su?wd=" + encodeURIComponent(oValue) + "&cb=fly";
		document.body.appendChild(oScript);
		document.body.removeChild(oScript);
	}, 200); // 200ms防抖
	
	// 绑定事件
	oTxt.addEventListener('input', fetchSuggestions);
	
	// 处理搜索建议列表的显示/隐藏
	var hideListTimeout;
	function scheduleHideList() {
		hideListTimeout = setTimeout(function() {
			oList.style.display = "none";
		}, 600);
	}
	
	oTxt.addEventListener('mouseleave', scheduleHideList);
	oList.addEventListener('mouseleave', scheduleHideList);
	
	oTxt.addEventListener('mouseover', function() { clearTimeout(hideListTimeout); });
	oList.addEventListener('mouseover', function() { clearTimeout(hideListTimeout); });
	
	oTxt.addEventListener('mousedown', function() {
		if(this.value.trim().length > 0) {
			oList.style.display = "block";
		}
	});
})();

// 搜索建议回调函数
function fly(myJson) {
	var oList = document.getElementById("list");
	var data = myJson.s || [];
	var str = "";
	for(var i=0; i<data.length; i++) {
		str += "<li><a href='https://www.baidu.com/s?wd=" + encodeURIComponent(data[i]) + "' target='_blank'>" + data[i] + "</a></li>";
	}
	oList.innerHTML = str;
}