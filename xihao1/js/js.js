window.onload = function() {
	// 大图轮播
var mySwiper = new Swiper('.swiper-container', {
		// 轮播图的方向，也可以是vertical方向
		direction: 'vertical',
		//播放速度
		loop: true,
		// 自动播放时间
		autoplay: true,
		// 播放的速度
		speed: 2000,

		// 如果需要分页器，即下面的小圆点
		pagination: {
			el: '.swiper-pagination',
			clickable: true,
		},
		// 这样，即使我们滑动之后， 定时器也不会被清除
		autoplayDisableOnInteraction: false,
	});
	
	// 最新动态 轮播
	var mySwiper = new Swiper('.swiper-container_1', {
		// 轮播图的方向，也可以是vertical方向
		direction: 'horizontal',
		//播放速度
		loop: true,
		// 自动播放时间
		autoplay: true,
		// 播放的速度
		speed: 1500,

		// 如果需要分页器，即下面的小圆点
		pagination: {
			el: '.swiper-pagination_1',
			clickable: true,
		},

		// 这样，即使我们滑动之后， 定时器也不会被清除
		autoplayDisableOnInteraction: false,
	});
	
	// 工程案例轮播
	var swiper = new Swiper('.swiper-container_2', {
		slidesPerView: 4,
		spaceBetween: 10,
		centeredSlides: true,
		loop: true,
		/* pagination: {
			el: '.swiper-pagination',
			clickable: true,
		}, */
		navigation: {
	    nextEl: '.swiper-button-next',
	    prevEl: '.swiper-button-prev',
	  }
	
	});
	
	// 产品展示 轮播
	var swiper = new Swiper('.swiper-container_3', {
		slidesPerView: 3,
		spaceBetween: 30,
		centeredSlides: true,
		loop: true,
		/* pagination: {
			el: '.swiper-pagination',
			clickable: true,
		}, */
		navigation: {
	    nextEl: '.swiper-button-next_3',
	    prevEl: '.swiper-button-prev_3',
	  }
	
	});

// 点击是否显示搜搜框
	var oli= document.getElementById('menu_right').getElementsByTagName('li');
	var odiv = document.getElementById("div1");
	// var oli = oul.document.getElementsByTagName('li');
	var otext = document.getElementById('menu_text');
	var i=0;
	var judge = false;
	odiv.onclick = function(){
		if(judge){
			for (i=0;i<oli.length;i++) {
			oli[i].style.display = "block";
			}
			otext.style.display = 'none';
			judge =false;
		}
		else{
			for (i=0;i<oli.length;i++) {
			oli[i].style.display = "none";
			}
			otext.style.display = 'block';
			judge =true;
		}
	}
	
	// 计算固定定位的左边边距
	
	window.onresize = function(){
		var Ocus = document.getElementById('customer');
	var Ohtml = document.getElementById('htm');
	var Oleft = Ocus.offsetLeft;
	var bodywith = document.body.clientWidth;
	var Ohtmwith = Ohtml.offsetWidth
	var Owith = (bodywith-Ohtmwith)/2+30;
	console.log(bodywith);
	console.log(Ohtmwith);
	console.log(Oleft);
	console.log(Owith);
	Ocus.style.right= Owith + "px";
	}
	
// 
	
}
