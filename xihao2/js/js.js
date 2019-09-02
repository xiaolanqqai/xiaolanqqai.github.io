window.onload = function() {
	function $$(id) {
		return document.getElementById(id)
	};

	function scroll() {
		var marquee1 = new Marquee("scroll1");
		marquee1.Direction = "left";
		marquee1.Step = 1;
		// marquee1.Width = $(window).width();
		marquee1.Width = 1860;
		marquee1.Height = 495;
		marquee1.Timer = 80;
		marquee1.DelayTime = 0;
		marquee1.WaitTime = 200;
		marquee1.ScrollStep = 1;
		marquee1.BckStep = marquee1.Step;
		marquee1.Start();
	
		$$("Lctr").onmouseover = function() {
			marquee1.Direction = 3;
			marquee1.Step = marquee1.BckStep + 5;
		};
	
		$$("Lctr").onmouseout = function() {
			marquee1.Step = marquee1.BckStep;
			marquee1.Direction = 2;
		};
		$$("Rctr").onmouseover = function() {
			marquee1.Direction = 2;
			marquee1.Step = marquee1.BckStep + 5;
		};
		$$("Rctr").onmouseout = function() {
			marquee1.Step = marquee1.BckStep
		};
	}
	scroll()

}
