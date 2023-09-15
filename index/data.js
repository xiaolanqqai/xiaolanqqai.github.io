function datat() {

	// 首页

	//Home
	ww(1,document.getElementById("ar1"), [
		'www.bilibili.com', 'Bilibili',
		'www.dmh8.com', '樱花动漫',
		'v.qq.com', '腾讯视频',
		'www.iqiyi.com', '爱奇艺',
		'www.taobao.com', '淘宝',
		'www.jd.com', '京东',
		'www.jianshu.com', '简书',
	])

	//Tools
	ww(1,document.getElementById("ar2"), [
		'fanyi.baidu.com', '百度翻译',
		'pan.baidu.com', '百度网盘',
		'mail.163.com', '163',
		'tinypng.com', 'TinyPNG',
		'cn.office-converter.com', 'office-converter',
		'www.ilovepdf.com/zh-cn', 'ilovepdf',
		'docs.qq.com', '腾讯文档',
		'www.zdfans.com', 'zd423',
		'www.appinn.com', '小众软件',
		'www.iconfont.cn', 'iconfont',
		'www.ghxi.com', '果壳剥壳',
		'www.yxssp.com', '异星软件',
	])

	//Tools NEW
	ww(1,document.getElementById("ar3"), [
		'msdn.itellyou.cn', '异星软件',
		'www.kuaidi100.com', '快递100',
		'brevent.sh', '黑域',
	])

	//Network
	ww(1,document.getElementById("ar4"), [
		'192.168.2.1', '主路由',
		'192.168.1.1', '次路由',
		'192.168.31.1', '小米路由',
		'192.168.2.102', '小黑',
		'192.168.2.102:8080', '小黑bt',
	])
}

function data() {

	// 列表
	var ff = ['平台', '工具', '图片处理', '其它处理 • PDF • 文字 • 视频', '专业工具', '视频下载 • 磁力', '视频', '漫画', '导航', '软件资源', 'JS资源 • 开发', '其它 • 开发', '树莓派 • 开发', 'Git • 项目', '论坛'];
	var ffl = document.getElementById('ff');
	var ffdata = [];
	for (var f = 0; f < ff.length; f++) {
		var index = 0;
		var ttemp = [];
		for (var s = 0; s < f; s++) {
			ffdata[index] = '<div class="mt-3 mx-3"><div class="alert alert-secondary shadow" role="alert">' + ff[s] + '</div><div id="ar' + (s + 1) + '" class="d-flex flex-wrap p-2"></div></div>';
			index++;
		};
		// console.log(ffdata[index]);
		ttemp.push(ffdata.join(''));
	}
	ffl.innerHTML = ttemp;

	//平台
	ww(2,document.getElementById("ar1"), [
		'www.jd.com', '京东',
		'www.jianshu.com', '简书',
		'www.taobao.com', '淘宝',
		'pan.baidu.com', '百度网盘',
		'mail.163.com', '163邮箱',
		'www.jd.com', '京东',
		'www.google.com.hk', '谷歌HK',
		'www.aliyun.com', '阿里云',
		'cp.aliyun.com', '万网主机管理控制台',
	])

	//工具
	ww(2,document.getElementById("ar2"), [
		'wx.qq.com', '微信网页版',
		'szfilehelper.weixin.qq.com', '微信传输',
		'baidu.kinh.cc', '百度直链',
		'www.kuaidi100.com', '快递100',
		'brevent.sh', '黑域',
		'translate.google.cn', '谷歌翻译',
		'fanyi.baidu.com', '百度翻译',
		'flowus.cn', 'flowus息流',
		'xiezuocat.com', '写作猫',
		'yiyan.baidu.com', '文心一言',
		'map.baidu.com', '百度地图',
		'www.amap.com', '高德地图',
		'docs.qq.com', '腾讯文档',
		'yandex.com', 'yandex识图',
		'trace.moe', '动漫识图',
		'yiso.fun', '易搜',
		'jujuso.com', '优聚搜',
		'www.rvso.com', '免费短信接码',
		'www.zsrq.net', '免费短信平台',
	])

	//图片处理
	ww(2,document.getElementById("ar3"), [
		'tinypng.com', 'TinyPNG',
		'www.polaxiong.com/web', '泼辣修图',
		'www.gaituya.com/ps', '改图鸭',
		'js.design', '即时设计',
		'pixlr.com.cn', 'Pixlr',
		'pc.meitu.com', '美图秀秀',
		'www.gaoding.com', '稿定设计',
		'pixso.cn', 'Pixso',
		'bigjpg.com', 'Bigjpg',
		'tiomg.org', 'tiomg',
		'www.canva.cn', '可画',
		'www.uugai.com', 'U钙',
		'zh.clippingmagic.com', 'Clipping Magic',
		'www.remove.bg/zh', 'Remove.bg',
		'imagecompressor.com/zh', 'imagecompressor',
		'zh.recompressor.com', 'Recompressor',
		'www.aconvert.com.cn', 'aconvert',
		'www.superbed.cn/', '聚合图床',
	])

	//其它处理
	ww(2,document.getElementById("ar4"), [
		'www.ilovepdf.com', 'ilovepdf',
		'tool.browser.qq.com', '帮小忙',
		'123apps.com', '123apps',
		'jianwai.youdao.com', '网易见外工作台',
		'cli.im', '草料二维码',
	])

	//专业工具
	ww(2,document.getElementById("ar5"), [
		'servicedev.tpddns.cn:8181', 'csdn下载',
		'ai-bot.cn', 'AI工具集',
		'zxxgj.net', '在线小工具',
		'tools.liumingye.cn', '刘明野的工具箱',
		'modelscope.cn/studios/damo/ai_artist/summary?from=baidu_sem', 'ai绘画',
		'www.virustotal.com/gui/home/upload', '在线查毒',
		'api.hkfx.net', '在线MD5解密',
	])

	//视频下载 • 磁力
	ww(2,document.getElementById("ar6"), [
		'btbtt16.com', 'BT之家',
		'duo123.best', '磁力多',
		'so.btlm.site', 'BT联盟',
		'clb0.top', '磁力宝',
		'clg0.biz', '磁力狗',
		'www.cilitiantang.online', '磁力天堂',
		'www.eclzz.info', '磁力蜘蛛 ',
		'www.tokyotosho.info', '东京图书馆',
		'sk.btfox.pw', '磁力狐',
		'lianjie.cilimiaomiao.xyz', '搜磁力',
		'm.laoniubt.in', '老牛BT',
		'sk.btfox.pw', '磁力狐',
		'www.dytt8.net', '电影天堂',
	])

	//视频
	ww(2,document.getElementById("ar7"), [
		'www.bilibili.com', 'Bilibili',
		'www.bimiacg4.net', 'M站',
		'www.yxdmlove.com', '怡萱动漫',
		'www.acfun.cn', 'ACfan',
		'www.dmh8.com', '樱花动漫',
		'www.yhdmp.cc', '樱花动漫',
		'www.lndayp.com', '樱花动漫',
		'v.qq.com', '腾讯视频',
		'www.iqiyi.com', '爱奇艺',
		'www.8666.tv', '樱花风车动漫',
		'www.91m.cc', '樱花动漫',
		'www.qydmz.com', '樱花风车动漫',
		'www.dm530p.net', '风车动漫',
		'www.whpaiger.com', '风车动漫',
		'www.dmdm2020.com', '哆咪动漫',
		'www.qiqidongman.com', '奇奇动漫',
		'www.zzzfun.com', 'zzzfun',
		'www.xskdm.com', '新时空动漫',
		'www.cqtvm.com', '剧浦浦',
		'www.dmdm2020.com', '哆咪动漫',
		'www.puquyy.com', '蒲趣影院',
		'80s.tw', '80s',
		'www.mhdyw.net', '麻花电影',
		'www.ttdianying.vip', '天堂电影',
		'cupfox.app', '茶杯狐',
		'ddys.pro', '低端影视',
		'www.zxzjhd.com', '在线之家',
		'aucfox.fun', 'AucFox影视',
		'www.freeok.vip', 'freeok',
		'91mjw.com', '美剧网',
		'www.liaocao88.net', '潦草网',
		'www.5060w.cc', '新视觉影院',
		'www.reinfsources.com', '人人影视',
		'www.feifei6.com', '飞飞影院',
		'www.dixidixi.com', '滴嘻滴嘻',
		'www.ysgc.cc', '影视工场',
		'www.555dianying.cc', '555电影',
		'baofa-hotel.cn', '看吧影院',
		'www.840f.com', '恐怖世界',
		'www.zuankuo.com', '钻阔电影网',
		'www.cuihuays.com', '翠花影视',
		'wandou.la', '豌豆Pro',
		'www.5yju.com', '无忧居',
		'share.dmhy.org', '动漫花园资源网',
	])

	//漫画
	ww(2,document.getElementById("ar8"), [
		'www.1kkk.com', '漫画人',
		'www.mkzhan.com', '漫客栈',
		'm.pufei.cc', '扑飞动漫',
		'm.sixmh7.com', '六漫画',
	])

	//导航
	ww(2,document.getElementById("ar9"), [
		'www.coolzhanweb.com', '酷站导航',
		'movie.coolzhanweb.com', '电影导航',
		'ltzhp.ysepan.com', '辣条杂货铺',
		'bileizhen.ysepan.com?xzpd=1', 'bileizhen的收纳箱',
		'qxnav.com', '奇心导航',
		'ago.ysepan.com?xzpd=1', '👪怸歪的网盘🔞',
	])

	//软件资源
	ww(2,document.getElementById("ar10"), [
		'www.3h3.com', '当游软件',
		'www.ypojie.com', '易破解',
		'www.appinn.com', '小众软件',
		'www.ghxi.com', '果壳剥壳',
		'www.yxssp.com', '异星软件',
		'msdn.itellyou.cn', 'msdn',
		'www.mpyit.com', '殁漂遥',
		'www.uxpc.com', '精脑汇',
		'www.wrfou.com', '挖软否',
		'www.kelongwo.com', '克隆窝',
		'www.uy5.net', '克隆窝',
		'niumaizi.cn', '牛麦子',
		'www.zdfans.com', 'ZD423',
		'www.pc6.com', 'PC6',
		'www.ittel.cn', 'IT技术之家',
		'www.mimods.com', 'MOD迷',
	])

	//JS资源 • 开发
	ww(2,document.getElementById("ar11"), [
		'owlcarousel2.github.io/OwlCarousel2', 'OwlCarousel2',
		'sscms.comdocs/v7', 'SSCMS',
	])

	//其它 • 开发
	ww(2,document.getElementById("ar12"), [
		'greasyfork.org/zh-Cn', 'Greasy Fork',
		'hkfx.net', '红客防线（网络安全）',
	])

	//树莓派 • 开发
	ww(2,document.getElementById("ar13"), [
		'shumeipai.nxez.com', '树莓派实验室',
		'wiki.friendlyelec.com/wiki/index.php/NanoPi_NEO2/zh', 'NanoPi_NEO',
	])

	//Git • 项目
	ww(2,document.getElementById("ar14"), [
		'alist.nn.ci', 'Alist',
	])

	//论坛
	ww(2,document.getElementById("ar15"), [
		'dkxuanye.cn', '玄烨品果',
		'bbs.pcbeta.com', '远景论坛',
		'bbs.kafan.cn', '卡饭论坛',
		'www.chiphell.com', 'chiphell',
	])

	//论坛
	ww(2,document.getElementById("ar16"), [
		'tom51727.com', '汤姆叔叔',
		'www.b6b33.com', '四虎影院',
		'www.nidexbb.info', '杏吧',
		'www.tokyotosho.info', '东京图书馆',
		'yj2207.click/pw', '1024xp',
		'www.aventertainments.com', 'Ave',
		'javbee.net', 'JAVbee',
		'elsb.i6xh.news', '2048xp',
		's2212v.cc', '2048xp',
		'www.nckao41.xyz', '嫩草影院',
		'avmai.xyz', 'avman',
		'www.xvideos.com', 'xvideos',
		'avmai.xyz', 'avman',
	])

}

function datad() {

	//dd

	ww(3,document.getElementById("ar1"), [
		'www.wolai.com/qianye/guVVV3qJLbrFQQVu3SqLiP', 'PikPak Win&Mac_By_Shimily电脑版更新日志',
		'sumingyd.github.io/OpenCore-Install-Guide', 'OpenCore的安装指南',
		'lfoo.top', 'Domon网络资源聚合',
		'zhuangzhuang.io', '壮壮博客',
		'189.zheng98.com', 'adobe下载',
		'flowery-espadrille-695.notion.site/7e52fb27108d4b7099aa6245a4d1d9eb', '应用集导航',
		'orangefox.download/zh-CN/device/dipper', '小米8第三方twrp',
		'bbs.kafan.cn/thread-2244866-1-1.html', '卡巴免费15年',
		'github.com/aiboboxx/v2rayfree', '免费节点',
		'xxxxx525.com', 'switch游戏',
		'zhuanlan.zhihu.com/p/617025808', '设计师的 Midjourney 入门真保姆级教程',
		'xn--1-948a43hd5x.com', '一号机场（1元100g）',
		'bbs.kafan.cn/thread-2244866-1-1.html', '卡巴免费15年',
	])

}

function datade() {

	//develop

	ww(2,document.getElementById("ar1"), [
		'v5.bootcss.com', 'Bootstrap_v5',
		'codegeex.cn', 'CodeGeeX',
		'jquery.com', 'Jquery.js',
		'github.com/marcbruederlin/particles.js', 'Particles.js',
		'api.iowen.cn', 'One for API',
		'freewha.com', 'FreeWHA',
		'github.com/xiaolanqqai/xiaolanqqai.github.io', 'GitHub',
	])

}

// 通用调用程序

function ww(top, ar1, arr1) {
	var arrdtat = [];
	for (var j = 0; j < arr1.length; j++) {
		var index = 0;
		var temp = [];
		for (var i = 0; i < arr1.length; i += 2) {
			var url = '<a href="https://' + arr1[i]+ '" rel="nofollow" target="_blank" class="';
			var title = arr1[i + 1]+ '</h6></a>';
			var imgSrc = 'src="https://api.iowen.cn/favicon/' + arr1[i] + '.png" loading="lazy">';
			var className = 'my-2 p-1 text-center text-black-50';
 
			if (top === 1) {
				arrdtat[index] = url +'col'+ className +' kuaijie-a"><img class="border rounded-circle w"' + imgSrc + '<h6 class="t1">' + title;
			} else if (top === 2) {
				arrdtat[index] = url + className +' kuaijie-a-1"><img class="border rounded-circle w"' + imgSrc + '<h6 class="t1">' + title;
			} else if (top === 3) {
				arrdtat[index] = url + className +'"><img class="border rounded-circle w2"' + imgSrc + '<h6 class="t2">' + title;
			}
			index++;
		}
		temp.push(arrdtat.join(""));
	}
	ar1.innerHTML = temp;
}

//data数据版本
var lv = '0.5_20230915';
