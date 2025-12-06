//网页背景
window.onload = function () {
	//背景触发
	Particles.init({ selector: '.background' });
};

//---------------------------------------------------------------------------------

//网页编译版本显示 - 从JSON数据中获取版本信息
function loadVersionInfo(data) {
    if (data.version) {
        // 更新版本信息显示
        const uptime1 = document.getElementById('uptime1');
        if (uptime1) {
            uptime1.textContent = `Beta:${data.version.web_vol || 'Unknown'}`;
        }
        
        // 更新控制台输出
        console.log("web_vol=" + (data.version.web_vol || 'Unknown'));
        console.log('web_data=' + (data.version.web_data || 'Unknown'));
    } else {
        console.warn('JSON文件中未找到版本信息');
        document.getElementById('uptime1').textContent = 'Beta:Unknown';
    }
    
    // 原有的页面状态检测保持不变
    checkPageStatus();
}

// 原有的页面状态检测函数
function checkPageStatus() {
    function isLocalPage() {
        return window.location.protocol === 'file:';
    }

    var state1 = document.getElementById('state1');
    if (isLocalPage()) {
        state1.textContent = 'Local';
        state1.className = 'badge text-bg-warning';
        console.log('Web page status:Local');
    } else {
        state1.textContent = 'Server';
        state1.className = 'badge text-bg-success';
        console.log('Web page status:Server');
    }
}