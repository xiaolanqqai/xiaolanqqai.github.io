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
		'fanyi.youdao.com', '有道翻译',
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
		'msdn.itellyou.cn', 'MSDN',
		'www.kuaidi100.com', '快递100',
		'brevent.sh', '黑域',
	])

	//Work
	ww(1,document.getElementById("ar4"), [
		'www.aliyun.com', '阿里云',
		'cp.aliyun.com', '万网主机管理控制台',
		'wl.jdl.com', '京东物流工作台',
		'qiye.aliyun.com', '阿里企业邮箱',
		'www.shopify.com', 'shopify',
		'www.kickstarter.com', 'kickstarter',
		'manage.pledgebox.com', 'pledgebox',
		'manage.wix.com', 'wix',
		'myaccount.shoplazza.com', 'shoplazza',
		'www.kodai-industries.com', '官网',
		'erp.hupun.com/login', '国内-万里牛ERP',
		'g.hupun.com/login', '国外-万里牛ERP',
		
	])

	//Network
	ww(4,document.getElementById("ar5"), [
		'192.168.2.1', '主路由',
		'192.168.1.1', '光猫',
		'192.168.31.1', '小米路由',
		'192.168.66.1', '鲲鹏路由',
		'192.168.2.102', '小黑',
		'192.168.31.50', '打印机',
		'192.168.2.102:8080', '小黑bt',
	])
}

//-----------------------------------------------------------------------------------------------------------------

function data() {

	// 列表
	// var ff = ['平台', '工具', '图片处理', '其它处理 • PDF • 文字 • 视频', '专业工具', '视频下载 • 磁力', '视频', '漫画', '导航', '软件资源', 'JS资源 • 开发', '其它 • 开发', '树莓派 • 开发', 'Git • 项目', '论坛'];
	// var ffl = document.getElementById('ff');
	// var ffdata = [];
	// for (var f = 0; f <= ff.length; f++) {
	// 	var index = 0;
	// 	var ttemp = [];
	// 	for (var s = 0; s < f; s++) {
	// 		ffdata[index] = '<div class="mt-3 mx-3"><div class="alert alert-secondary shadow" role="alert">' + ff[s] + '</div><div id="ar' + (s+1) + '" class="d-flex flex-wrap p-2"></div></div>';
	// 		index++;
	// 	};
	// 	// console.log(ffdata[index]);
	// 	ttemp.push(ffdata.join(''));
	// }
	// ffl.innerHTML = ttemp;

	var ff = ['平台','技术平台', '工具', '图片处理', 
			  '其它处理 • PDF • 文字 • 视频',
			  '专业工具', '视频下载 • 磁力',
			  '视频','影视资源链接（链接模式）', '漫画', '游戏栏目', '导航', '软件资源',
			  'JS资源 • 开发', '其它 • 开发',
			  '树莓派 • 开发', 'Git • 项目', '论坛',
			];
	var ffl = document.getElementById('ff');
    var ffn = 1;
	ffl.innerHTML = ff.map(item => `<div class="mt-3 mx-3"><div class="alert alert-secondary shadow" role="alert">${item}</div><div id="ar${ffn++}" class="d-flex flex-wrap p-2"></div></div>`).join('');

	//平台
	ww(2,document.getElementById("ar1"), [
		'www.taobao.com', '淘宝',
		'www.jd.com', '京东',
		'pan.baidu.com', '百度网盘',
		'mail.163.com', '163邮箱',
		'mail.qq.com', 'QQ邮箱',
		'www.jianshu.com', '简书',
		'www.google.com.hk', '谷歌HK',
		'explorer.globe.engineer', '可视化维基百科',
		'www.creditchina.gov.cn', '信用中国',
		'tousu.sina.com.cn', '黑猫投诉',
		'www.12365auto.com', '车质网',
	])

	//技术平台
	ww(2,document.getElementById("ar2"), [
		'www.aliyun.com', '阿里云',
		'cp.aliyun.com', '万网主机管理控制台',
		'wl.jdl.com', '京东物流工作台',
		'qiye.aliyun.com', '阿里企业邮箱',
		'www.shopify.com', 'shopify',
		'www.kickstarter.com', 'kickstarter',
		'manage.pledgebox.com', 'pledgebox',
		'manage.wix.com', 'wix',
		'myaccount.shoplazza.com', 'shoplazza',
		'kodai-industries.myshopline.com', 'shopline',
		'www.kodai-industries.com', '官网',
		'erp.hupun.com/login', '国内-万里牛ERP',
		'g.hupun.com/login', '国外-万里牛ERP',
		'wssq.sbj.cnipa.gov.cn:9443/tmsve/', '国家知识产权局商标局',
	])

	//工具
	ww(2,document.getElementById("ar3"), [
		'wx.qq.com', '微信网页版',
		'szfilehelper.weixin.qq.com', '微信传输',
		'baidu.kinh.cc', '百度直链',
		'www.kuaidi100.com', '快递100',
		'brevent.sh', '黑域',
		'translate.google.cn', '谷歌翻译',
		'fanyi.baidu.com', '百度翻译',
		'fanyi.youdao.com', '有道翻译',
		'flowus.cn', 'flowus息流',
		'www.notion.so', 'Notion',
		'xiezuocat.com', '写作猫',
		'yiyan.baidu.com', '文心一言',
		'tongyi.aliyun.com', '通义千问',
		'map.baidu.com', '百度地图',
		'www.amap.com', '高德地图',
		'docs.qq.com', '腾讯文档',
		'yandex.com', 'yandex识图',
		'trace.moe', '动漫识图',
		'yiso.fun', '易搜',
		'jujuso.com', '优聚搜',
		'www.jijidown.com', '唧唧-b站下载',
		
	])

	//图片处理
	ww(2,document.getElementById("ar4"), [
		'tinypng.com', 'TinyPNG',
		'www.iconfont.cn', 'iconfont',
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
		'www.zamzar.com', 'zamzar',
		'www.superbed.cn', '聚合图床',
		'www.iloveimg.com', 'iloveimg',
		'onlineconvertfree.com/zh/', '图片格式转换',
		'www.bitbug.net', 'ico图片格式转换',
	])

	//其它处理
	ww(2,document.getElementById("ar5"), [
		'www.ilovepdf.com', 'ilovepdf',
		'cn.office-converter.com', 'Office-Convert',
		'tool.browser.qq.com', '帮小忙',
		'123apps.com', '123apps',
		'jianwai.youdao.com', '网易见外工作台',
		'cli.im', '草料二维码',
		'tool.lu', '在线工具',
		'c.runoob.com', '菜鸟工具',
		'www.atoolbox.net', '一个工具箱',
	])

	//专业工具
	ww(2,document.getElementById("ar6"), [
		'servicedev.tpddns.cn:8181', 'csdn下载',
		'ai-bot.cn', 'AI工具集',
		'zxxgj.net', '在线小工具',
		'tools.liumingye.cn', '刘明野的工具箱',
		'modelscope.cn/studios/damo/ai_artist/summary?from=baidu_sem', 'ai绘画',
		'www.virustotal.com/gui/home/upload', '在线查毒',
		'api.hkfx.net', '在线MD5解密',
		'www.rvso.com', '免费短信接码',
		'www.zsrq.net', '免费短信平台',
		'fofa.info', 'FOFA网站测绘',
		'www.wappalyzer.com', '网站框架识别',
		'www.itdog.cn', 'IT狗-在线ping',
		'tool.chinaz.com', '站长工具',
		'zh.semrush.com', 'semrush网站数据统计',
		'test.ustc.edu.cn', '中科大测速',
		'wormhole.app', '虫洞（文件暂存）',
		'poe.com', 'POE免费chgpt3.5',
	])

	//视频下载 • 磁力
	ww(2,document.getElementById("ar7"), [
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
	ww(2,document.getElementById("ar8"), [
		'www.bilibili.com', 'Bilibili',
		'v.qq.com', '腾讯视频',
		'www.iqiyi.com', '爱奇艺',
		'www.youku.com', '优酷',
		'www.mgtv.com', '芒果TV',
		'www.tiktok.com', '斗音（海外）',
		'www.douyin.com', '斗音',
		'www.acfun.cn', 'ACfan',
		'www.bimiacg4.net', 'M站',
		'www.yxdmlove.com', '怡萱动漫',
		'www.yifeng110.com', '1樱花动漫',//new
		'www.yhdm.wang', '2樱花动漫',//new
		'www.whpaiger.com', '风车动漫',
		'www.zzzfun.com', 'zzzfun',
		'www.puquyy.com', '蒲趣影院',
		// '80s.tw', '80s',
		'dytt.dytt8.net', '电影天堂',
		'www.dytt50.com', '电影天堂',
		'cupfox.app', '茶杯狐',
		'ddys.pro', '低端影视',
		'www.zxzja.com', '在线之家',
		'aucfox.fun', 'AucFox影视',
		'www.liaocao88.net', '潦草网',
		'www.5060w.cc', '新视觉影院',
		'www.feifei6.com', '飞飞影院',
		'wandou.la', '豌豆Pro',
		'share.dmhy.org', '动漫花园资源网',
		'libvio.top', 'LIBVIO影视',
		//新更新
		'www.xiaoxiaoy.com', '小小影视',
		'duoju.vip', '多剧蓝光影院',
		'www.woaimoon.com', '月亮电影网',
		'dsxys.pro', '大师兄影视',
		'4k电影网.com', '4k电影网',
		'jx.xmflv.com/?url=', '奇心解析',
		'www.7k789.com', '7k789',
		'www.ak1080.me', '闪电影视',
		'www.newfii.com', '奈落影院',
		'www.760kan.com', '60影视',
		'ttmja.com', '天天美剧网',
		'zhuiyingmao2.com', '追影猫',
		'yoyys1.com', '悠云影视',
	])

	//影视资源链接（链接模式）
	ww(2,document.getElementById("ar9"), [
		'www.wujinzy.net', '无尽资源采集',
		'www.hdzyk.com', '优质资源库',
		'bfzy1.tv', '暴风资源',
		'feisuzy.com', '飞速资源站',
		'tiankongzy.com', '天空资源站',
		'www.6uzy.cc', '6U资源站',
	])

	//漫画
	ww(2,document.getElementById("ar10"), [
		'www.1kkk.com', '漫画人',
		'www.mkzhan.com', '漫客栈',
		'm.pufei.cc', '扑飞动漫',
		'm.sixmh7.com', '六漫画',
	])

	//游戏栏目
	ww(2,document.getElementById("ar11"), [
		'www.3dmgame.com', '3DM-GAME',
		'www.gamer520.com', 'gamer520',
		'klpbbs.com', '苦力怕bbs',
		'www.gamer520.com', 'gamer520',
	])

	//聚合导航
	ww(2,document.getElementById("ar12"), [
		'www.coolzhanweb.com', '酷站导航',
		'movie.coolzhanweb.com', '电影导航',
		'qxnav.com', '奇心导航',
		'anee.cc', '安逸影视',
		'klyingshi.com', '可乐影视',
		'ltzhp.ysepan.com', '辣条杂货铺',
		'bileizhen.ysepan.com?xzpd=1', 'bileizhen的收纳箱',
		'ago.ysepan.com?xzpd=1', '👪怸歪的网盘🔞',
	])

	//软件资源
	ww(2,document.getElementById("ar13"), [
		'www.3h3.com', '当游软件',
		'www.ypojie.com', '易破解',
		'www.appinn.com', '小众软件',
		'www.ghxi.com', '果壳剥壳',
		'www.yxssp.com', '异星软件',
		'msdn.itellyou.cn', 'MSDN',
		'next.itellyou.cn', 'NEW-MSDN',
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
		'www.bydmax.com', '迪友社区',
		'downloadlynet.ir', 'Downloadly',
		'macapp.org.cn', 'MacApp分享频道',
		'www.3kjs.com', '科技师',
		
	])

	//JS资源 • 开发
	ww(2,document.getElementById("ar14"), [
		'owlcarousel2.github.io/OwlCarousel2', 'OwlCarousel2',
		'sscms.comdocs/v7', 'SSCMS',
		'cn.vuejs.org', 'Vue.js',
		'github.com/jquery/jquery', 'jquery',
		'getbootstrap.com', 'Bootstrap',
		'www.w3school.com.cn', 'W3School',
		'jquery.asprain.cn', 'jQuery.js',
		'codyhouse.co', 'codyhouse',
		'www.lodashjs.com', 'Lodash.js',
		'www.swiper.com.cn', 'Swiper.js',
		'www.sass.hk', 'SASS',
	])

	//其它 • 开发
	ww(2,document.getElementById("ar15"), [
		'greasyfork.org/zh-Cn', 'Greasy Fork',
		'hkfx.net', '红客防线（网络安全）',
		'www.chongdiantou.com', '充电头网',
		'trollstore.app', '巨魔商店',
	])

	//树莓派 • 开发
	ww(2,document.getElementById("ar16"), [
		'shumeipai.nxez.com', '树莓派实验室',
		'wiki.friendlyelec.com/wiki/index.php/NanoPi_NEO2/zh', 'NanoPi_NEO',
	])

	//Git • 项目
	ww(2,document.getElementById("ar17"), [
		'alist.nn.ci', 'Alist',
		'github.com/seemoo-lab/openhaystack', 'openhaystack',
		'github.com/gkd-kit/gkd', 'GKD',
		'github.com/zloirock/core-js', 'core-js',
		'github.com/ckcr4lyf/EvilAppleJuice-ESP32', '邪恶苹果汁ESP32',
		'github.com/2dust/v2rayNG', 'v2rayNG',
		'vuepress.vuejs.org', 'VuePress',
		'github.com/RipplePiam/MobaXterm-Chinese-Simplified', 'MobaXterm汉化',
		'github.com/tychxn/jd-assistant', 'JD抢购脚本',
	])

	//论坛
	ww(2,document.getElementById("ar18"), [
		'dkxuanye.cn', '玄烨品果',
		'www.feng.com', '威锋',
		'bbs.pcbeta.com', '远景论坛',
		'bbs.kafan.cn', '卡饭论坛',
		'www.chiphell.com', 'chiphell',
		'www.right.com.cn', '恩山无线论坛',
	])

	//工口论坛
	ww(2,document.getElementById("ar19"), [
		'www.nidexbb.info', '杏吧',
		'www.tokyotosho.info', '东京图书馆',
		'yj2207.click/pw', '1024xp',
		'www.aventertainments.com', 'Ave',
		'javbee.net', 'JAVbee',
		's6y7f8.xyz', '2048xp',
		'snmp3x.xyz', '2048xp',
		'www.xvideos.com', 'xvideos',
		'www.missav.com', 'missav',
	])

};

function datad() {

	//dd-----------------------------------------------------------------------------------------------------------------

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
		'github.com/yiyuanjichang/dizhi', '一号机场（1元100g）',
		'https://9.234456.xyz/abc.html?t=638447306965091200', '机场推荐',
		'docs.qq.com/sheet/DQWJweHVmQUtacUFu?tab=BB08J2&scode=', 'BYD车机APP汇总',
		'jamcz.com', '晨钟网络科技',
		'momoe.link/shizuku/060248.html', '鲲鹏CC 开源固件',
		'9jgat.top/08786.html?id=5f41K5Bm2M6rNJ8E7v', '软件集合',
		'www.idc35', '香港便宜服务器',
		'baijiahao.baidu.com/s?id=1748907411897385699&wfr=spider&for=pc', 'MLCC滤波电容的选择',
	])

};

function datade() {

	//develop-----------------------------------------------------------------------------------------------------------------

	ww(2,document.getElementById("ar1"), [
		'v5.bootcss.com', 'Bootstrap_v5',
		'codegeex.cn', 'CodeGeeX',
		'jquery.com', 'Jquery.js',
		'github.com/marcbruederlin/particles.js', 'Particles.js',
		'api.afmax.cn', 'afmax API',
		'freewha.com', 'FreeWHA',
		'www.aliyun.com', '阿里云',
		'github.com/xiaolanqqai/xiaolanqqai.github.io', 'GitHub',
	])

};

//-----------------------------------------------------------------------------------------------------------------

function datadow() {
	var ff = ['系统下载', '系统激活工具', '系统安装', '系统基础库与优化', 
			  '系统基础软件',
			  '注册机', '漫画', '游戏栏目', '导航', '软件资源',
			  'JS资源 • 开发', '其它 • 开发',
			  '树莓派 • 开发', 'Git • 项目', '论坛',
			];
	var ffl = document.getElementById('ff');
    var ffn = 1;
	ffl.innerHTML = ff.map(item => `<div class="mt-3 mx-3"><div class="alert alert-secondary shadow" role="alert">${item}</div><div id="ar${ffn++}" class="d-flex flex-wrap p-2"></div></div>`).join('');

	//系统下载
	ww(2,document.getElementById("ar1"), [
		'www.jd.com', 'win7',
		'www.ghxi.com/wenqiwin7.html', 'win7吻妻精简',
		'www.123pan.com/s/HQeA-Pb1Sh', 'win10',
		'www.123pan.com/s/HQeA-w71Sh', 'win10果壳精简',
		'www.alipan.com/s/Ze27EbU3jeX', 'win10吻妻精简',
		'www.123pan.com/s/HQeA-NW1Sh', 'win11',
		'mail.163.com', 'win11精简',
		'www.jd.com', '京东',
		'www.google.com.hk', '谷歌HK',
		'www.aliyun.com', '阿里云',
		'cp.aliyun.com', '万网主机管理控制台',
		'www.creditchina.gov.cn', '信用中国',
		'tousu.sina.com.cn', '黑猫投诉',
		'www.12365auto.com', '车质网',
	])

	//系统激活工具
	ww(2,document.getElementById("ar2"), [
		'www.yishimei.cn/network/319.html', '神龙kms',
		'www.ghxi.com/hwidgen.html', 'win10数字',
		'www.12365auto.com', '车质网',
	])

	//系统安装
	ww(2,document.getElementById("ar3"), [
		'www.123pan.com/s/HQeA-kD1Sh', '傲梅分区助手',
		'www.123pan.com/s/HQeA-Zn1Sh', 'WinNTSetup',
		'www.12365auto.com', '车质网',
	])

	//系统基础库与优化
	ww(2,document.getElementById("ar4"), [
		'www.123pan.com/s/HQeA-zP1Sh', '微软运行库',
		'tousu.sina.com.cn', '黑猫投诉',
		'www.ghxi.com/dotnet.html', '.net Framework',
		'www.ghxi.com/javajdk.html', 'JAVA JDK',
		'www.ghxi.com/dism.html', 'Dism++',
		'www.52pojie.cn/thread-1122388-1-1.html', '魔方',
		'www.ghxi.com/wpd.html', 'WPD(隐私优化)',
		'www.ghxi.com/winupdatec.html', '联想关闭Win10更新',
		'iknow.lenovo.com.cn/detail/172545.html', '联想小工具',
		'www.ghxi.com/ccleanerpro.html', 'CCleaner',
		'www.ghxi.com/revouninstaller.html', 'Revo Uninstaller',
	])

	//系统基础软件
	ww(2,document.getElementById("ar5"), [
		'www.123pan.com/s/HQeA-T81Sh', 'Winrar压缩',
		'www.ghxi.com/wps2019zfb.html', 'WPS2019政府专业版',
		'www.ghxi.com/thunderxjb.html', '迅雷x',
		'www.ghxi.com/pcidm.html', 'IDM',
		'www.huorong.cn', '火绒',
		'bbs.kafan.cn/thread-2244866-1-1.html', '卡巴',
	])
};

// 通用调用程序-----------------------------------------------------------------------------------------------------------------

function ww(top, ar1, arr1) {
	var arrdtat = [];
	for (var j = 0; j < arr1.length; j++) {
		var index = 0;
		var temp = [];
		for (var i = 0; i < arr1.length; i += 2) {
			var url = '<a href="https://' + arr1[i]+ '" rel="nofollow" target="_blank" class="';
			var url1 = '<a href="http://' + arr1[i]+ '" rel="nofollow" target="_blank" class="';
			var title = arr1[i + 1]+ '</h6></a>';
			var imgSrc = 'src="https://api.afmax.cn/so/ico/index.php?r=https://' + arr1[i] + '" loading="lazy">';
			var className = 'my-2 p-1 text-center text-black-50';
 
			if (top === 1) {
				arrdtat[index] = url +'col '+ className +' kuaijie-a"><img class="border rounded-circle w"' + imgSrc + '<h6 class="t1">' + title;
				//首页
			} else if (top === 2) {
				//<a href="https://xx" rel="nofollow" target="_blank" class="col my-2 p-1 text-center text-black-50 kuaijie-a-1"><img class="border rounded-circle w" src="https://api.iowen.cn/favicon/xx.png" loading="lazy"><h6 class="t1">xx</h6></a>
				arrdtat[index] = url + className +' kuaijie-a-1"><img class="border rounded-circle w"' + imgSrc + '<h6 class="t1">' + title;
				//more，develop
			} else if (top === 3) {
				arrdtat[index] = url + className +'"><img class="border rounded-circle w2"' + imgSrc + '<h6 class="t2">' + title;
				//dd
			} else if (top === 4) {
				arrdtat[index] = url1 +'col '+ className +' kuaijie-a"><img class="border rounded-circle w"' + imgSrc + '<h6 class="t1">' + title;
				//http跳转，局域网专用
			};
			index++;
		}
		temp.push(arrdtat.join(""));
	}
	ar1.innerHTML = temp;
}

//data数据版本
var lv = 'v1.0_20240227';
var bat = 20240227;
var vol = "Beta:3.7.1";
