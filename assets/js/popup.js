var test_mode = ('update_url' in browser.runtime.getManifest()) ? false : true; // If loaded from Web Store instead of local folder than getManifest has update_url property
var running_script = "popup";
var tab_id = false;

// Get current url
browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
	var tab = tabs[0];
	var url = tab.url;
	var title = tab.title;
  	tab_id = tab.id;
  	if (test_mode) console.log(tab_id + " : " + url);
});

function send_to_content(obj, to_frame) {
	to_frame = to_frame || null;
	if (test_mode) console.log(tab_id);
    browser.tabs.sendMessage(tab_id, obj, to_frame, function(response) { 
    	if (browser.runtime.lastError) {
            console.log('ERROR: ' + browser.runtime.lastError.message);	
		}
  	});
}
// Add onclick to toggle switch because popup.html can't have any javascript in it
document.getElementById('up').addEventListener("click", function() { send_to_content({ "button" : "up" }) }, false);
document.getElementById('down').addEventListener("click", function() { send_to_content({ "button" : "down" }) }, false);
document.getElementById('default').addEventListener("click", function() { send_to_content({ "button" : "default" }) }, false);
document.getElementById('fontcolor').addEventListener("input", function() { font_color(); }, false);
document.getElementById('bgcolor').addEventListener("input", function() { bg_color(); }, false);