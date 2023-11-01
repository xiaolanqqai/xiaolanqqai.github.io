function searchToggle(obj, evt){
	var container = $(obj).closest('.search-wrapper');
	if(!container.hasClass('active')){
		  container.addClass('active');
		  evt.preventDefault();
	}
	else if(container.hasClass('active') && $(obj).closest('.input-holder').length == 0){
		  container.removeClass('active');
		  // clear input
		  container.find('.search-input').val('');
		  // clear and hide result container when we press close
		  container.find('.result-container').fadeOut(100, function(){$(this).empty();});
	}
};
function submitFn(obj, evt){
	value = $(obj).find('.search-input').val().trim();
	_html = "Yup yup! Your search text sounds like this: ";
	if(!value.length){
		_html = "https://www.baidu.com/";
	}else {
		if (oMoreB == 0) {
			_html ="http://192.168.1." + value;
		} else if (oMoreB == 1) {
			_html ="http://192.168.2." + value;
		} else if (oMoreB == 2) {
			_html ="https://www.baidu.com/s?wd=" + value;
		} else if (oMoreB == 3) {
			_html ="https://search.bilibili.com/all?keyword=" + value;
		} else if (oMoreB == 4) {
			_html ="https://www.bing.com/search?q=" + value;
		} else if (oMoreB == 5) {
			_html ="https://www.google.com.hk/search?q=" + value;
		} else if (oMoreB == 6) {
			_html ="https://yandex.com/search/?text=" + value;
		} else if (oMoreB == 7) {
			_html ="https://www.kuaidi100.com/chaxun?com=&nu=" + value;
		};
	}
	$(obj).find('.result-container').html(window.open(_html));
	$(obj).find('.result-container').fadeIn(100);
	evt.preventDefault();
};

//-------------------------------------------------------------------------------------
//搜索框预加载

var oTxt = document.getElementById("txt");
var oList = document.getElementById("list");
var oBox = document.getElementById("box");

var times
//键盘按键松开时发生：
oTxt.onkeyup = function(){
	oList.style.display = "block";
	var oValue = oTxt.value;
	var oScript = document.createElement("script");
	oScript.src = "https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su?wd="+oValue+"&cb=fly";
	document.body.appendChild(oScript);
	document.body.removeChild(oScript);
};

//当从搜索框或者列表移开时，如果600毫秒内移回列表或者搜索框则关闭定时器，否则隐藏列表
oTxt.onmouseleave = oList.onmouseleave = function(){
	oList.onmouseover = oTxt.onmouseover = function() {
		clearTimeout(times);
	}
	times=setTimeout(function() {
		oList.style.display = "none";
	},600)
	
};

//当单击搜索框是发生，显示列表
oTxt.onmousedown = function(){
	oList.style.display = "block";
};
//通过for循环遍历获得的数据
function fly(myJson){
	var data = myJson.s;
	var str = "";
	for(var i=0; i<data.length; i++){
		str += "<li><a href='https://www.baidu.com/s?wd="+data[i]+"' target='_blank'>"+data[i]+"</a></li>";
	}
	oList.innerHTML = str;
};

window.onload =function()
{
	var Odiv1 = document.getElementById('kj_z');
	var Odiv2 = Odiv1.getElementsByTagName('ul');
	var Oul1 = document.getElementById('ul1').getElementsByTagName('li');
	var i=0;
	var j=0;
	
	for (i=0;Oul1.length>i;i++) {
		Oul1[i].index=i;
		
		Oul1[i].onmousemove = function()
		{
			for (j=0;Oul1.length>j;j++) {
				if (j==i) {
					continue;
				}
				Odiv2[j].className='top11';
				Odiv2[j].style.display='none';
			}
			
			Odiv2[this.index].className='';
			Odiv2[this.index].style.display='block';
		}
	}

}