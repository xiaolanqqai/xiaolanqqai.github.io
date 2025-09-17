//more的头部搜索框调用
var oTxt = document.getElementById("txt");
var oBtn = document.getElementById("btn");
var oMoreS = document.getElementById("more-s");
var oMoreC = document.getElementById("more-b");
var oMoreB = localStorage.getItem("oMoreB");
var oMoreCC = document.getElementById("more-c");

//浏览器缓存不存在情况
if (oMoreB == undefined) {
	oMoreB = 3;
	console.log("没有检查到缓存oMoreB");
}else {
	oMoreB = parseInt(oMoreB);
	console.log("检查到缓存oMoreB=" + oMoreB);
};

//清除缓存
oMoreCC.onclick = function () {
	localStorage.clear();//清除全部
	// localStorage.removeItem("oMoreB");只清除oMoreB
	oTxt.value = "";
	console.log("已清空缓存");
};

oMoreS.onclick = function () {
	if (oMoreC.style.display == "none"){
		oMoreC.style.display = "block";
		window.scrollTo(0, 0);
	}else{
		oMoreC.style.display = "none";
	};
};

//头部搜索指向缓存加载
function mots() {
	var ii = oMoreB;
	oMoreS.innerHTML = ["1.","2.","192168","Baidu","Bing","Google.hk","Yandex","BiliBili","快递100"][ii];
};

function a(i) {
	oMoreS.innerHTML = ["→1.","→2.","→192168","→Baidu","→Bing","→Google.hk","→Yandex","→BiliBili","→快递100"][i];
	oMoreB = i;
	localStorage.setItem("oMoreB", i);
};

oBtn.onclick = function () {
	var oValue = oTxt.value;
	if (oValue == "") {
		alert("???");
	}else if (oMoreB === 0) {
		//触发aa
		var aav = document.getElementById("aav");
		if (oValue === "001"){
			console.log("welcom to ポートエロ");
			aav.style.display = "block";
			window.scrollTo(0, document.documentElement.scrollHeight);
			oTxt.value = "";
		}else if (oValue === "002"){
			window.open("aa.htm");
			oTxt.value = "";
		}else if (oValue === "mm"){
			localStorage.setItem("userName", "xiaolan");
			oTxt.value = "";
		}else{
			window.open("http://192.168.1." + oValue);
			oTxt.value = "";
		};	
	}else if (oMoreB === 1) {
		window.open("http://192.168.2." + oValue);
		oTxt.value = "";
	}else if (oMoreB === 2) {
		window.open("http://192.168." + oValue);
		oTxt.value = "";
	}else if (oMoreB === 3) {
		window.open("https://www.baidu.com/s?wd=" + oValue);
		oTxt.value = "";
	}else if (oMoreB === 4) {
		window.open("https://www.bing.com/search?q=" + oValue);
		oTxt.value = "";
	}else if (oMoreB === 5) {
		window.open("https://www.google.com.hk/search?q=" + oValue);
		oTxt.value = "";
	}else if (oMoreB === 6) {
		window.open("https://yandex.com/search/?text=" + oValue);
		oTxt.value = "";
	}else if (oMoreB === 7) {
		window.open("https://search.bilibili.com/all?keyword=" + oValue);
		oTxt.value = "";
	}else if (oMoreB === 8) {
		window.open("https://www.kuaidi100.com/chaxun?com=&nu=" + oValue);
		oTxt.value = "";
	};
	
};

//控制mm的显示
var localMM = localStorage.getItem("userName");
var oMoreMM = document.getElementById("more-mm");

if (localMM == "xiaolan") {
	oMoreMM.style.display = "block";
};