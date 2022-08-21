/*	Font Adjuster
Font Adjuster is a simple, lightweight extension that allows users to adjust the size of fonts on almost any webpage. 
*/

var test_mode = ('update_url' in browser.runtime.getManifest()) ? false : true; // If loaded from Web Store instead of local folder than getManifest has update_url property
var font_times = 1; // Current multiplyer (1.2 * 100 = 120) or 1.2X is the same as 120%
var font_timer;
var timer_ms = (window.self === window.top) ? 500 : 3000; // SetTimeout 1000ms for top frame and 3000ms for iFrames. Previous was 500ms for everything
var total_elements = { // Each font function needs its own total elements count
	"save_defaults" : 0,
	"font-size" : 0,
}
var font_options = { 
	"font-size" : null	
};	
var dom_ready = false; 
if (document.readyState === 'interactive') dom_ready = true; // On fresh extension installs and content script being injected, it would not run because dom_ready was always false
if (document.readyState === 'complete') dom_ready = 2; // On fresh extension installs and content script being injected, it would not run because dom_ready was always false
var saving_defaults = false; 

function isOnScreen(el){
	// Try to keep the page view at the same location when changing font size. Don't return elements that are fixed position
	var el2 = el;
	while (typeof el2 === 'object' && !el2.nodeName.match(/^(body|#document)$/i)) {
        if (document.defaultView.getComputedStyle(el2,null).getPropertyValue('position').toLowerCase() === 'fixed') return false;
        el2 = el2.parentNode;
    }
	var rect = el.getBoundingClientRect();
	if (rect.top >= 1 && rect.left >= 1 && 
		rect.bottom <= window.innerHeight && rect.right <= window.innerWidth) 
		return el;
	else 
		return false;
}

function save_defaults(opt){
	/* 
		The reason why we have to call this function in the beginning
		is because child elements fontSizes are relative to their parents.
		So if we change their parents, then the children keep getting bigger
		and then data-default-fontsize will be greatly off.
		NOTE: I think for truly dynamic pages we will have to call save_fontsize()
		before each change_fontsize call.
	*/ 
	var options = ["font-size", "color", "background-color", "font-family"]; 
	var onScreenEl = false; 
		var elems = document.querySelectorAll('body, body *'); 
	var elems_length = elems.length;
	if (elems_length == total_elements['save_defaults'] && opt != "font-size") // Don't loop through everything if no new elements
		return; // Only need to return on ScreenEl if changing font-size
	if (test_mode) console.log("save_defaults loop. "+"elems.length="+elems_length+". total_elements['save_defaults']="+total_elements['save_defaults']);
	for (var i=0; i<elems_length; i++)
	for (var j=0; j<options.length; j++) 
	{
		saving_defaults = true;
		var el = elems[i];
		var option = options[j];
		// If the size of this element has already been saved 
		if (el.getAttribute('data-default-'+option)) // then it will have "data-default-font-size" attribute
		{
			var default_value = el.getAttribute('data-default-'+option);
		}
		else
		{
			var default_value = document.defaultView.getComputedStyle(el,null).getPropertyValue(option); 
			el.setAttribute('data-default-'+option, default_value);
		}
		if (opt == "font-size" && !onScreenEl) { 
			onScreenEl = isOnScreen(el); 
			if (onScreenEl && test_mode) { console.log("onScreenEl:"); console.log(onScreenEl); }
			if (onScreenEl && elems_length == total_elements['save_defaults']) { // Don't loop through everything if there are no new elements
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
		if  (font_times > 0.2)  { // Smaller than this is 0px
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
		if (test_mode) console.log("font-size loop. "+"elems.length="+elems_length+". total_elements['font-size']="+total_elements['font-size']);
		total_elements['font-size'] = elems.length; 
		onScreenEl = save_defaults("font-size"); // In case they have dynamic content like Google.com does 
		if (onScreenEl) { 
			onScreenElTop = onScreenEl.getBoundingClientRect().top; 
			if (test_mode) { console.log("onScreenEl.top = "+onScreenEl.getBoundingClientRect().top); }
		}
		for (var i=0; i<elems_length; i++)
		{
			var el = elems[i];
			// If the size of this element has already been changed 
			if (el.getAttribute('data-default-font-size')) // then it will have "data-default-font-size" attribute
			{
				var default_fontsize = parseFloat(el.getAttribute('data-default-font-size')); 
			}
			else
			{
				var default_fontsize = parseFloat(document.defaultView.getComputedStyle(el,null).getPropertyValue("font-size"));
				el.setAttribute('data-default-font-size', default_fontsize);
			}
			var new_fontsize = Math.round(default_fontsize * font_times);
			var old_fontsize = Math.round(parseFloat(document.defaultView.getComputedStyle(el,null).getPropertyValue("font-size")));
			{
				if (!el.isContentEditable || (el.parentNode && !el.parentNode.isContentEditable)) 
				{	
					el.style.setProperty("font-size", Math.round(default_fontsize * font_times) + "px", "important"); 
					var cur_fontsize = parseInt(document.defaultView.getComputedStyle(el,null).getPropertyValue("font-size"));
					var cur_lineheight = parseInt(document.defaultView.getComputedStyle(el,null).getPropertyValue("line-height"));
					if (cur_lineheight != "normal" && cur_lineheight <= (cur_fontsize+1))	
						el.style.setProperty("line-height", "normal", "important"); 
				}
			}
		}
	}
} // end function change_fontsize(direction)

browser.runtime.onMessage.addListener(
//necessary 
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
	/* The DOMContentLoaded event fires when the initial HTML document has been completely loaded and parsed, 
	without waiting for stylesheets, images, and subframes to finish loading. 
	*/
	if (test_mode) console.log("DOMContentLoaded");
	setTimeout(function() { dom_ready = true;}, 1000); 
});