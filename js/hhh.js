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
