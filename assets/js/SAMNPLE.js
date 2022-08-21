var test_mode = ('update_url' in browser.runtime.getManifest()) ? false : true; 
var font_times = 1; 
var font_timer;
var timer_ms = (window.self === window.top) ? 500 : 3000; 
var total_elements = { 
	"save_defaults" : 0,
	"font-size" : 0,
}
var font_options = { 
	"font-size" : null	
};	
var dom_ready = false; 
if (document.readyState === 'interactive') dom_ready = true; 
if (document.readyState === 'complete') dom_ready = 2; 
var saving_defaults = false; 

function isOnScreen(el){
var el2 = el;
while (typeof el2 === 'object' && !el2.nodeName.match(/^(body|#document)$/i)) {
	if (document.defaultView.getComputedStyle(el2,null).getPropertyValue('position').toLowerCase () === 'fixed') return false;
	el2 = el2.parentNode;
}
var rect = el.getBoundingClientRect();
	if (rect.top >= 1 && rect.left >= 1 && 
		rect.bottom <= window.innerHeight && rect.right <= window.innerWidth) 
		return el;
	else 
		return false;
	}
	function save_defaults(opt) { 
	var options = ["font-size"]; 
	var onScreenEl = false; 
		var elems = document.querySelectorAll('body, body *'); 
	var elems_length = elems.length;
	if (elems_length == total_elements['save_defaults'] && opt != "font-size") 
		return; 
	if (test_mode) console.log("save_defaults loop. "+"elems.length="+elems_length+". 
	total_elements['save_defaults']="+total_elements['save_defaults']);
	for (var i=0; i<elems_length; i++)
	for (var j=0; j<options.length; j++) {
		saving_defaults = true;
		var el = elems[i];
		var option = options[j];
		if (el.getAttribute('data-default-'+option)) {
			var default_value = el.getAttribute('data-default-'+option);
		}
		else {
			var default_value = document.defaultView.getComputedStyle(el,null).getPropertyValue 
			(option); 
			el.setAttribute('data-default-'+option, default_value);
		}
		if (opt == "font-size" && !onScreenEl) { 
			onScreenEl = isOnScreen(el); 
			if (onScreenEl && test_mode) { console.log("onScreenEl:"); console.log(onScreenEl); 
			}
			if (onScreenEl && elems_length == total_elements['save_defaults']) { 
				saving_defaults = false;
				return (onScreenEl);
			}
		}
	} 
	total_elements['save_defaults'] = elems_length; 
	saving_defaults = false;
	return (onScreenEl); 
	} 
	function change_fontsize(direction){
	if (!dom_ready || saving_defaults) {
		setTimeout(function() { change_fontsize(direction); } , 10);
		return;
	}
	var old_font_times = font_times;
	var onScreenEl = false; 
	var onScreenElTop = false; 
	clearTimeout(font_timer);
	if (direction == "up") {
		font_times = Math.round((font_times + 0.1) * 10) / 10; 
	}
	else if (direction == "down") {	
		if  (font_times > 0.2)  { 
			font_times = Math.round((font_times - 0.1) * 10) / 10;
		}
		else return;
	}
	else if (direction == "default")
		font_times = 1;
	else if (!isNaN(direction)) 
		font_times = direction;
	var elems = document.querySelectorAll('body, body *'); 
	var elems_length = elems.length;
	if (elems_length != total_elements['font-size'] || font_times != font_options["font-size"] || document.readyState != "complete") 
	{ 
		if (test_mode) console.log("font-size loop. "+"elems.length="+elems_length+". total_ 
		elements['font-size']="+total_elements['font-size']);
		total_elements['font-size'] = elems.length; 
		onScreenEl = save_defaults("font-size"); 
		if (onScreenEl) { 
			onScreenElTop = onScreenEl.getBoundingClientRect().top; 
			if (test_mode) { console.log("onScreenEl.top = "+onScreenEl.getBoundingClientRect 
			().top); }
		}
		for (var i=0; i<elems_length; i++) {
			var el = elems[i]; 
			if (el.getAttribute('data-default-font-size')) {
				var default_fontsize = parseFloat(el.getAttribute('data-default-font-size')); 
			}
			else {
				var default_fontsize = parseFloat(document.defaultView.getComputedStyle(el, 
				null).getPropertyValue("font-size"));
				el.setAttribute('data-default-font-size', default_fontsize);
			}
			var new_fontsize = Math.round(default_fontsize * font_times);
			var old_fontsize = Math.round(parseFloat(document.defaultView.getComputedStyle(el, 
			null).getPropertyValue("font-size"))); 	{
				if (!el.isContentEditable || (el.parentNode && !el.parentNode.isContentEditab 
				le)) {	
					el.style.setProperty("font-size", Math.round(default_fontsize * font_times) 
					+ "px", "important"); 
					var cur_fontsize = parseInt(document.defaultView.getComputedStyle(el, 
					null).getPropertyValue("font-size"));
					var cur_lineheight = parseInt(document.defaultView.getComputedStyle(el, 
					null).getPropertyValue("line-height"));
					if (cur_lineheight != "normal" && cur_lineheight <= (cur_fontsize+1))	
						el.style.setProperty("line-height", "normal", "important"); 
				}
			}
		}
	}
} 
browser.runtime.onMessage.addListener(
	function(obj, sender, sendResponse) {
		if (obj.hasOwnProperty("button")) 
		{
			if (obj["button"] == "up") change_fontsize("up");
			else if (obj["button"] == "down") change_fontsize("down");
			else if (obj["button"] == "default") change_fontsize("default");	
		}
		if (obj.hasOwnProperty("font_times"))
		{
			change_fontsize(parseFloat(obj["font_times"])); 
		}	
  });
document.addEventListener('DOMContentLoaded', function(event) { 
	if (test_mode) console.log("DOMContentLoaded");
	setTimeout(function() { dom_ready = true;}, 1000); 
});
