//首页栏目切换算法
var aTop = document.getElementsByClassName('nav-top');
var aBan = document.getElementsByClassName('nav-ban');
var i = 0;
for (i = 0; i < aTop.length - 1; i++) {
	aTop[i].index = i;
	aTop[i].onmouseenter = function () {
		for (i = 0; i < aBan.length; i++) {
			aTop[i].className = 'nav-link btn nav-top';
			aBan[i].style.display = 'none';
		};
		aBan[this.index].style.display = 'block';
		this.className = 'nav-link btn nav-top active';
	};
};

//--------------------------------------------------------------

//首页搜索框跳转指向算法
var indexing = document.getElementById("indexing");
var oMoreB = localStorage.getItem("oMoreB");

//浏览器缓存不存在情况
if (oMoreB == undefined) {
	oMoreB = 2;
	console.log("没有检查到缓存oMoreB");
} else {
	oMoreB = parseInt(oMoreB);
	console.log("检查到缓存oMoreB=" + oMoreB);
};

if (oMoreB == 0) {
	indexing.setAttribute("src", "img/1.jpg");
} else if (oMoreB == 1) {
	indexing.setAttribute("src", "img/1.jpg");
} else if (oMoreB == 2) {
	indexing.setAttribute("src", "img/baidu.gif");
} else if (oMoreB == 3) {
	indexing.setAttribute("src", "img/bilibili.png");
} else if (oMoreB == 4) {
	indexing.setAttribute("src", "img/bing.jpg");
} else if (oMoreB == 5) {
	indexing.setAttribute("src", "img/google.webp");
} else if (oMoreB == 6) {
	indexing.setAttribute("src", "img/yandex.jpg");
} else if (oMoreB == 7) {
	indexing.setAttribute("src", "img/kd100.png");
};

//--------------------------------------------------------------

//加载错误图片替换
$('img').on("error", function () {
	$(this).attr('src', 'img/index.png');  // 替换为默认图片
});

//--------------------------------------------------------------

//剪贴板内容跳转百度搜索
function getClipboardText() {
	return new Promise((resolve, reject) => {
		navigator.clipboard.readText().then(text => {
			resolve(text);
		}).catch(err => {
			reject(err);
		});
	});
}

getClipboardText().then(text => {
	window.open("https://www.baidu.com/s?word=" + text, "_self");
}).catch(err => {
	console.error('获取剪贴板文本失败：', err);
});