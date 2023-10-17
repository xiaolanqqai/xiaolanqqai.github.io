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
	Particles.init({ selector: '.background' });//背景触发

	var gg = document.querySelector("body>div:last-of-type");
	gg.parentNode.removeChild(gg);
	// 去广告
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
}

var loca_bat = uptime2.innerHTML;
console.log("loca_bat=" + loca_bat);
console.log("git_bat=" + git_bat);
if (loca_bat < git_bat) {
	uptime1.style.color = 'red';
	uptime1.innerHTML = 'This version is old';
}
else if (loca_bat > git_bat) {
	uptime1.style.color = 'green';
	uptime1.innerHTML = 'Please upload a new version to the server!!!';
}
else {
	uptime1.innerHTML = git_vol;
}
console.log(uptime1.innerHTML);


//网页物理地址状态显示
function isLocalPage() {
	return window.location.protocol === 'file:';
};

var state1 = document.getElementById('state1');

if (isLocalPage()) {
	state1.innerHTML = 'Local';
	console.log('Web page status:Local');
} else {
	state1.innerHTML = 'Server';
	console.log('Web page status:Server');
	document.getElementById('state2').style.display = 'none';
};

console.log('web_data='+ lv);//列表数据版本

//----------------------------------------------------------------------------------

//more aa触发算法
function jav() {
	var aav = document.getElementById("aa");
	var aavt = document.getElementById("aat");
	var nnc = parseInt(Math.random() * 10000);
	console.log(nnc);
	//aa的触发规则
	var na = prompt('Please enter password !!! >>>');
	if (na === null || na === "") {
		alert('???');
		return;
	}else if (na === "123456") {
		aav.style.display = "block";
		aavt.style.display = "none";
		return;
	};
	var nn = (na + nnc) % 10;
	console.log(nn);
	if (nn === 9) {
		window.open("1.htm");
	} else if (nn === 8) {
		window.open("2.chm");
	} else if (nn === 7) {
		aav.style.display = "block";
		aavt.style.display = "block";
	} else {
		alert('???');
		return;
	};

	//aa的倒计时关闭规则
	if (aavt.style.display = "block") {
		d = 10;
		var tv = setInterval(function () {
			if (d > 0) {
				d--;
				document.getElementById("cc").innerHTML = "Stop " + d + "s";
			} else {
				document.getElementById("cc").innerHTML = "Stop";
			};
		}, 1000);

		var tt = setTimeout(function () {
			aav.style.display = "none";
			aavt.style.display = "none";
			clearTimeout(tv); clearTimeout(tt);
		}, 10000);
	};
};