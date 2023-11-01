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
// var state2 = document.getElementById('state2');

if (isLocalPage()) {
	state1.innerHTML = 'Local';
	console.log('Web page status:Local');
} else {
	state1.innerHTML = 'Server';
	console.log('Web page status:Server');
	// state2.style.display = 'none';
};

console.log('web_data='+ lv);//列表数据版本