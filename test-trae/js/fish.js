// 优化版鱼动画效果 - 降低资源占用
class OptimizedFishAnimation {
	constructor() {
		// 优化参数，降低复杂度
		this.POINT_INTERVAL = 15; // 增加点间距，减少计算量
		this.FISH_COUNT = 2;     // 减少鱼的数量
		this.isActive = false;   // 控制动画开关
		this.frameRate = 25;     // 限制帧率
		this.lastRenderTime = 0;
		this.isLowPerformance = false;
	}
	
	init() {
		// 检测设备性能
		this.checkPerformance();
		
		// 低性能设备不加载动画
		if(this.isLowPerformance) {
			console.log('低性能设备，已禁用鱼动画');
			$('#jsi-flying-fish-container').hide();
			return;
		}
		
		this.setParameters();
		this.setup();
		this.bindEvents();
		
		// 延迟启动动画，提高页面加载速度
		setTimeout(() => {
			this.isActive = true;
			this.render();
			console.log('鱼动画已启动');
		}, 1500);
	}
	
	checkPerformance() {
		// 检测是否为移动设备或低性能设备
		this.isLowPerformance = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
								(navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2);
	}
	
	setParameters() {
		this.$window = $(window);
		this.$container = $('#jsi-flying-fish-container');
		this.$canvas = $('<canvas />');
		this.context = this.$canvas.appendTo(this.$container).get(0).getContext('2d');
		this.points = [];
		this.fishes = [];
	}
	
	setup() {
		// 清空数组
		this.points.length = 0;
		this.fishes.length = 0;
		
		// 获取容器尺寸
		this.width = this.$container.width();
		this.height = this.$container.height();
		this.$canvas.attr({width: this.width, height: this.height});
		
		// 创建鱼（减少数量）
		for(let i = 0; i < this.FISH_COUNT; i++) {
			this.fishes.push(this.createFish());
		}
		
		// 创建水面点（减少点数量）
		this.createSurfacePoints();
	}
	
	createSurfacePoints() {
		const count = Math.round(this.width / this.POINT_INTERVAL);
		this.pointInterval = this.width / (count - 1);
		
		// 只创建必要的点
		for(let i = 0; i < count; i++) {
			const point = {
				x: i * this.pointInterval,
				y: this.height * 0.5,
				initY: this.height * 0.5,
				variation: 0,
				force: 0
			};
			this.points.push(point);
		}
	}
	
	createFish() {
		// 简化鱼的属性
		const direction = Math.random() < 0.5;
		const reverse = false; // 简化逻辑，移除反转功能
		return {
			direction: direction,
			x: direction ? (this.width + 100) : -100,
			y: reverse ? 
				this.getRandomValue(this.height * 0.1, this.height * 0.4) : 
				this.getRandomValue(this.height * 0.6, this.height * 0.9),
			vx: this.getRandomValue(3, 8) * (direction ? -1 : 1),
			vy: reverse ? 
				this.getRandomValue(1, 3) : 
				this.getRandomValue(-3, -1),
			ay: reverse ? 
				this.getRandomValue(0.03, 0.15) : 
				this.getRandomValue(-0.15, -0.03),
			isOut: false,
			theta: 0,
			phi: 0,
			previousY: 0
		};
	}
	
	getRandomValue(min, max) {
		return min + (max - min) * Math.random();
	}
	
	bindEvents() {
		// 窗口调整大小时重新设置（增加防抖）
		let resizeTimeout;
		this.$window.on('resize', () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				this.setup();
			}, 500); // 增加延迟时间
		});
		
		// 鼠标移动时产生波浪效果（简化计算）
		this.$container.on('mousemove', (event) => {
			if(!this.isActive) return;
			this.createWave(event);
		});
		
		// 页面可见性变化时控制动画
		document.addEventListener('visibilitychange', () => {
			this.toggleActive(!document.hidden);
		});
	}
	
	createWave(event) {
		const rect = this.$container[0].getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		const THRESHOLD = 120;
		
		// 简化波浪计算，只影响附近的点
		const nearestIndex = Math.round(x / this.pointInterval);
		const influenceRange = 2; // 只影响附近几个点
		
		for(let i = Math.max(0, nearestIndex - influenceRange); 
			i < Math.min(this.points.length, nearestIndex + influenceRange); 
			i++) {
			const point = this.points[i];
			const distance = Math.abs(point.x - x);
			if(distance < THRESHOLD) {
				const ratio = (THRESHOLD - distance) / THRESHOLD;
				point.force += ratio * ratio * 15 * (this.height - y) / this.height;
			}
		}
	}
	
	update() {
		// 更新水面点（简化计算）
		this.points.forEach(point => {
			if(point.force !== 0) {
				point.variation += point.force;
				point.force *= 0.75; // 更快地衰减
				point.variation *= 0.75;
			}
			point.y = point.initY + point.variation;
		});
		
		// 更新鱼的位置
		this.fishes.forEach(fish => {
			this.updateFish(fish);
		});
	}
	
	updateFish(fish) {
		const GRAVITY = 0.3;
		const INIT_HEIGHT_RATE = 0.5;
		
		fish.previousY = fish.y;
		fish.x += fish.vx;
		fish.y += fish.vy;
		fish.vy += fish.ay;
		
		// 简化边界检查
		const surfaceY = this.height * INIT_HEIGHT_RATE;
		if(fish.y < surfaceY) {
			fish.vy += GRAVITY;
			fish.isOut = true;
		} else {
			if(fish.isOut) {
				fish.ay = this.getRandomValue(-0.15, -0.03);
			}
			fish.isOut = false;
		}
		
		// 简化动画计算
		if(!fish.isOut) {
			fish.theta += Math.PI / 30; // 降低旋转速度
			fish.theta %= Math.PI * 2;
			fish.phi += Math.PI / 40;
			fish.phi %= Math.PI * 2;
		}
		
		// 边界重置
		if(fish.vx > 0 && fish.x > this.width + 100 || fish.vx < 0 && fish.x < -100) {
			// 复用现有鱼对象，减少内存分配
			const direction = Math.random() < 0.5;
			fish.direction = direction;
			fish.x = direction ? (this.width + 100) : -100;
			fish.y = this.getRandomValue(this.height * 0.6, this.height * 0.9);
			fish.vx = this.getRandomValue(3, 8) * (direction ? -1 : 1);
			fish.vy = this.getRandomValue(-3, -1);
			fish.ay = this.getRandomValue(-0.15, -0.03);
		}
	}
	
	draw() {
		// 清空画布
		this.context.clearRect(0, 0, this.width, this.height);
		
		// 绘制鱼（简化版）
		this.fishes.forEach(fish => {
			this.drawFish(fish);
		});
		
		// 绘制水面（简化版，降低透明度）
		this.drawWaterSurface();
	}
	
	drawFish(fish) {
		const {context} = this;
		
		context.save();
		context.translate(fish.x, fish.y);
		context.rotate(Math.PI + Math.atan2(fish.vy, fish.vx));
		context.scale(1, fish.direction ? 1 : -1);
		
		// 使用简单的形状代替复杂的贝塞尔曲线
		context.beginPath();
		context.moveTo(-25, 0);
		context.quadraticCurveTo(-10, 12, 30, 0);
		context.quadraticCurveTo(-10, -12, -25, 0);
		context.fillStyle = 'rgba(100, 180, 220, 0.8)';
		context.fill();
		
		// 简化尾部绘制
		context.save();
		context.translate(30, 0);
		context.scale(0.8 + 0.15 * Math.sin(fish.theta), 1);
		context.beginPath();
		context.moveTo(0, 0);
		context.quadraticCurveTo(4, 8, 15, 6);
		context.quadraticCurveTo(8, 3, 7, 0);
		context.quadraticCurveTo(8, -3, 15, -6);
		context.quadraticCurveTo(4, -8, 0, 0);
		context.fillStyle = 'rgba(80, 160, 200, 0.8)';
		context.fill();
		context.restore();
		
		context.restore();
	}
	
	drawWaterSurface() {
		const {context} = this;
		
		// 降低透明度，减少绘制开销
		context.save();
		context.fillStyle = 'rgba(135, 206, 235, 0.2)';
		context.beginPath();
		context.moveTo(0, this.height);
		context.lineTo(this.points[0].x, this.height - this.points[0].y);
		
		// 每隔一个点绘制一次，减少绘制点数
		for(let i = 1; i < this.points.length; i += 2) {
			context.lineTo(this.points[i].x, this.height - this.points[i].y);
		}
		
		// 确保最后一个点被绘制
		if(this.points.length > 0) {
			const lastPoint = this.points[this.points.length - 1];
			context.lineTo(lastPoint.x, this.height - lastPoint.y);
		}
		
		context.lineTo(this.width, this.height);
		context.closePath();
		context.fill();
		context.restore();
	}
	
	// 限制帧率的渲染函数
	render(timestamp) {
		if(!this.isActive) {
			// 如果动画暂停，仍然需要请求下一帧以响应状态变化
			requestAnimationFrame(this.render.bind(this));
			return;
		}
		
		// 控制帧率
		const deltaTime = timestamp - this.lastRenderTime;
		const frameInterval = 1000 / this.frameRate;
		
		if(deltaTime > frameInterval) {
			this.lastRenderTime = timestamp - (deltaTime % frameInterval);
			this.update();
			this.draw();
		}
		
		requestAnimationFrame(this.render.bind(this));
	}
	
	// 暂停/恢复动画的方法
	toggleActive(active) {
		if(active !== undefined) {
			this.isActive = active;
		} else {
			this.isActive = !this.isActive;
		}
	}
}

// 初始化优化版鱼动画
$(function() {
	try {
		const fishAnimation = new OptimizedFishAnimation();
		fishAnimation.init();
	} catch (error) {
		console.error('鱼动画初始化失败:', error);
		// 发生错误时隐藏容器
		$('#jsi-flying-fish-container').hide();
	}
});