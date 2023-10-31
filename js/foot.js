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

//----------------------------------------------------------------------------------

//网页背景
window.onload = function () {
	//背景触发
	Particles.init({ selector: '.background' });
	// 去广告
	var gg = document.querySelector("body>div:last-of-type");
	gg.parentNode.removeChild(gg);
};

//---------------------------------------------------------------------------------

//网页编译版本显示
var uptime1 = document.getElementById('uptime1');
var uptime2 = document.getElementById('uptime2');

uptime1.onmouseover = function () {
	uptime2.style.display = 'block';
};
uptime1.onmouseout = function () {
	uptime2.style.display = 'none';
};

var loca_bat = uptime2.innerHTML;
console.log("loca_bat=" + loca_bat);
console.log("git_bat=" + git_bat);
if (loca_bat < git_bat) {
	uptime1.style.color = 'red';
	uptime1.innerHTML = 'This version is old';
} else if (loca_bat > git_bat) {
	uptime1.style.color = 'green';
	uptime1.innerHTML = 'Please upload a new version to the server!!!';
} else {
	uptime1.innerHTML = git_vol;
};
console.log(uptime1.innerHTML);


//网页物理地址状态显示
function isLocalPage() {
	return window.location.protocol === 'file:';
};

var state1 = document.getElementById('state1');
var state2 = document.getElementById('state2');

if (isLocalPage()) {
	state1.innerHTML = 'Local';
	console.log('Web page status:Local');
} else {
	state1.innerHTML = 'Server';
	console.log('Web page status:Server');
	state2.style.display = 'none';
};

console.log('web_data='+ lv);//列表数据版本


//----------------------------------------------------------------------------------


//more的头部搜索框调用
var oTxt = document.getElementById("txt");
var oBtn = document.getElementById("btn");
var oMoreS = document.getElementById("more-s");
var oMoreC = document.getElementById("more-b");
var oMoreB = localStorage.getItem("oMoreB");

//浏览器缓存不存在情况
if (oMoreB == undefined) {
	oMoreB = 2;
	console.log("没有检查到缓存oMoreB");
}else {
	oMoreB = parseInt(oMoreB);
	console.log("检查到缓存oMoreB=" + oMoreB);
};

oMoreS.onclick = function () {
	if (oMoreC.style.display == "none"){
		oMoreC.style.display = "block";
	}else{
		oMoreC.style.display = "none";
	};
};

//头部搜索指向缓存加载
function mots() {
	var ii = oMoreB;
	oMoreS.innerHTML = [ ".1.", ".2.","Baidu", "BiliBili", "Bing", "Google.hk", "Yandex", "快递100"][ii];
};

function a(i) {
	oMoreS.innerHTML = [ "→.1.", "→.2.","→Baidu", "→BiliBili", "→Bing", "→Google.hk", "→Yandex", "→快递100"][i];
	oMoreB = i;
	localStorage.setItem("oMoreB", i);
};

oBtn.onclick = function () {
	var oValue = oTxt.value;
	if (oValue == "") {
		alert("???");
	}else if (oMoreB == 0) {
		//触发aa
		var aav = document.getElementById("aav");
		if (oValue == "001"){
			console.log("welcom to ポートエロ");
			aav.style.display = "block";
		}else if (oValue == "002"){
			window.open("aa.htm");
		}else if (oValue == "003"){
			window.open("aa.chm");
		}else{
			window.open("http://192.168.1." + oValue);
		};	
	}else if (oMoreB == 1) {
		window.open("http://192.168.2." + oValue);
	}else if (oMoreB == 2) {
		window.open("https://www.baidu.com/s?wd=" + oValue);
	}else if (oMoreB == 3) {
		window.open("https://search.bilibili.com/all?keyword=" + oValue);
	}else if (oMoreB == 4) {
		window.open("https://www.bing.com/search?q=" + oValue);
	}else if (oMoreB == 5) {
		window.open("https://www.google.com.hk/search?q=" + oValue);
	}else if (oMoreB == 6) {
		window.open("https://yandex.com/search/?text=" + oValue);
	}else if (oMoreB == 7) {
		window.open("https://www.kuaidi100.com/chaxun?com=&nu=" + oValue);
	};
	
};