//网页背景
window.onload = function () {
	//背景触发
	Particles.init({ selector: '.background' });
	// 去广告
	var gg = document.querySelector("body>div:last-of-type");
	gg.parentNode.removeChild(gg);

	// 设置div的初始位置

	// 定义移动的函数


	// 使用setInterval函数定期调用moveDiv函数


};


//---------------------------------------------------------------------------------

//网页编译版本显示
var uptime1 = document.getElementById('uptime1');
uptime1.innerHTML = vol;
console.log("web_vol=" + uptime1.innerHTML);
console.log("web_update time=" + bat);


//网页物理地址状态显示
function isLocalPage() {
	return window.location.protocol === 'file:';
};

var state1 = document.getElementById('state1');
// var state2 = document.getElementById('state2');

if (isLocalPage()) {
	state1.innerHTML = 'Local';
	console.log('Web page status:Local');
	// var tc = document.getElementById("tc");

	// tc.style.right = "-66px";

	// function sd() {
	// 	// 获取div的当前位置

	// 	var currentLeft = parseInt(tc.style.right);
	// 	// 计算新的位置
	// 	if (currentLeft > 0) {
	// 		var newLeft = Math.floor(currentLeft *2);
	// 		console.log(newLeft);
		
	// 	} else if (currentLeft < 0) {
	// 		var newLeft = currentLeft / 1.3;
	// 		console.log(newLeft);
	// 	} else {
	// 		var newLeft = +1;
	// 		console.log(currentLeft);
	// 	}
	// 	// 更新div的位置
	// 	tc.style.right = newLeft + "px";

	// 	// 如果到达了边界，则改变方向
	// 	if (newLeft >= 66) {
	// 		clearInterval(tcc);
	// 	};
	// };
	// var tcc = setInterval(sd, 100);
} else {
	state1.innerHTML = 'Server';
	console.log('Web page status:Server');
	// state2.style.display = 'none';
};

console.log('web_data=' + lv);//列表数据版本