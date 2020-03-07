/*
	Description: JS for Task Timer Light
	Last Modified: Nov 11, 2010
	Author: Sherri Wheeler
	License: GPLv3
*/

// ------------- CONFIGURATION -----------------

var savingEnabled = false;	// Indicates whether to use AJAX to save and load timer date to a file on a webserver (Note: to use AJAX, the whole application must be on your webserver, not your local computer).
var serviceURL = "http://www.example.com/tasktimerlight/service.php";	// URL to the AJAX service.
//var serviceURL = "http://localhost:8000/service.php";	// URL to the AJAX service.
var serviceTimeout = 5000;  // Number of miliseconds to wait for requests to the server to be returned.

// ----------------------------------------------

window.onbeforeunload = confirmExit;   // Window event to warn users when they are leaving the page.
function confirmExit(){
	return "ALL YOUR TIMERS WILL BE RESET.";
}

// -------- Global Variables ----------

var timeInterval = 1000;
var allTimers = [];
var d = new Date();
var activeTimers = 0;
var timeout;
var request = false;

var themeList = Array();
themeList['teal'] = 1;    // Name of theme and which stylesheet index it is.
themeList['orange'] = 2;
themeList['pink'] = 3;
themeList['grey'] = 4;

/*
// Test timer:
allTimers[0] = {};
allTimers[0]["recordid"] = null; // If the timer is saved in a file, this is the record id.
allTimers[0]["started"] = false; // Indicates that a timer is currently counting up.
allTimers[0]["stopped"] = false; // Indicates that a timer has been paused/stopped.
allTimers[0]["starttime"] = 0;
allTimers[0]["accumulated"] = 0;
allTimers[0]["loggedtime"] = 0;
allTimers[0]["name"] = "A test timer";
allTimers[0]["lastlogged"] = "Never";
*/

// ------------- AJAX Setup -------------

if( savingEnabled ){
   try {
     request = new XMLHttpRequest();
   } catch (trymicrosoft) {
     try {
       request = new ActiveXObject("Msxml2.XMLHTTP");
     } catch (othermicrosoft) {
       try {
         request = new ActiveXObject("Microsoft.XMLHTTP");
       } catch (failed) {
         request = false;
       }
     }
   }

   if (!request){
     alert("Error initializing XMLHttpRequest! AJAX might not be supported by your browser.");
   }
}


// ------------- Functions ---------------

function initPage(){
	if(savingEnabled){
		loadTimers();
	}else{
		initTimers();
		updateTimes();
	}
	initTheme();
}


// Change the CSS style theme for the site. Disable/enable sheets.
function changeTheme(themename)
{
    var themeid = themeList[themename];
    var linkElements = document.getElementsByTagName("link");
    var a;

    if(linkElements.length > 1){

        for(var i=0; i < linkElements.length; i++){
            a = linkElements[i];
            if( (a.getAttribute("rel").indexOf("style") != -1) && a.getAttribute("title") && (a.getAttribute("title").indexOf("theme") != -1) ) {
                a.disabled = true;
                if(a.getAttribute("title") == ("theme"+themeid)){
                    a.disabled = false;
                }
             }
        }
        setCookie("ttltheme", themename, null);
    }
}

function initTheme(){
    var savedTheme = getCookie("ttltheme");
    if(savedTheme == "" | !themeList[savedTheme]){
        savedTheme = 'grey';
    }
    changeTheme(savedTheme);

}


// Loop through all timers and add them to the page then configure the display.
function initTimers()
{
	for(var i in allTimers){
		addTimerToList(i);
		initTimer(i);
	}
}


// Determine which buttons for a timer are to be shown. Update the logged time and last logged tstamp display.
function initTimer(id){

	if(allTimers[id]["started"]){
		document.getElementById('stopbutton'+id).style.display = "";
		activeTimers++;
	}else{
		document.getElementById('startbutton'+id).style.display = "";
	}

	if(allTimers[id]["stopped"]){
		document.getElementById('startbutton'+id).style.display = "";
        }

	document.getElementById('loggedtime'+id).innerHTML = getLoggedTimeStr(allTimers[id]["loggedtime"]);
	document.getElementById('lastlogged'+id).innerHTML = allTimers[id]["lastlogged"];

}

// Add a timer into the HTML of the page.
function addTimerToList(id){


	var timerHTML = '<li id="timeritem'+id+'"> \
							<div class="timer-data"> \
								<div id="timerdata'+id+'" class="timercount">0s</div> \
								<div id="timeroptions'+id+'" class="timeroptions" style="display:none;"><a onclick="javascript:clearTimer('+id+');return(false);">Clear</a></div> \
							</div> \
							<div class="timer-buttons"> \
								<div id="stopbutton'+id+'" class="button stopon" style="display:none;"><a onclick="javascript:stopTimer('+id+');return(false);" title="Stop/pause the timer.">Stop</a></div> \
								<div id="startbutton'+id+'" class="button starton" style="display:none;"><a onclick="javascript:startTimer('+id+');return(false);" title="Start the timer.">Start</a></div> \
								<div id="logbutton'+id+'" class="button logon" style="display:none;"><a onclick="javascript:logTimer('+id+');return(false);" title="Add the current time to the Total Accumulated Time, and reset the timer.">Log</a></div> \
								<div id="pleasewait'+id+'" class="waitmsg" style="display:none;">Please wait...</div> \
							</div> \
							<div class="timer-title">'+allTimers[id]['name']+' <a onclick="javascript:if(confirm(\'Are you sure you want to permanently delete this timer?\')){deleteTimer('+id+');}return(false);" class="deletelink" title="Delete this timer.">x</a></div> \
							<div class="timer-details">Total Logged Time: <b><span id="loggedtime'+id+'"></span></b><br />Last Logged: <b><span id="lastlogged'+id+'"></span></b></div> \
						</li> \
					';

	document.getElementById("notimersmsg").style.display="none";
	document.getElementById("timerslist").innerHTML = document.getElementById("timerslist").innerHTML + timerHTML;

}

// If we have some active running timers, loop though them and update the time message.
// This function is executed once every <timeInterval> miliseconds.
function updateTimes(){

	if(activeTimers>0){
		for(var i in allTimers){
			if(allTimers[i]!=null && allTimers[i]["started"]){
				document.getElementById('timerdata'+i).innerHTML = getTimeStr(allTimers[i]["starttime"], allTimers[i]["accumulated"]);
			}
		}
		setTimeout ( "updateTimes()", timeInterval );
	}

}

// Save the timer details to the server.
function saveTimerToServer(id){

	document.getElementById("pleasewait"+id).style.display = "";

	var timerJSON = JSON.stringify(allTimers[id]);

	var params = "input=" + escape(timerJSON);
	params = params + "&action=update";
	params = params + "&id="+id;

	request.open("POST", serviceURL, true);

	//Send the proper header information along with the request
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.setRequestHeader("Content-length", params.length);
	request.setRequestHeader("Connection", "close");

	request.onreadystatechange = savingComplete;
	request.send(params);
	timeout = setTimeout("ajaxTimeout();", serviceTimeout);


}
function savingComplete() {

	if (request.readyState == 4){
		if (request.status == 200){
			clearTimeout(timeout);
			var repStr = request.responseText;
			if( repStr.substr(0,5) != "error" && repStr != ""){
				var repInfo = repStr.split("|");
				//If a new record was created. Update the record id in the array.
				if(allTimers[repInfo[0]]['recordid'] == null){
					allTimers[repInfo[0]]['recordid'] = repInfo[1];
				}
				document.getElementById("pleasewait"+repInfo[0]).style.display = "none";
			}else{
				alert("Error: Invalid AJAX Response. The save request for a timer returned an invalid response: "+repStr);
			}
		}
	}
}
function ajaxTimeout(){
   	request.abort();
   	alert("Error: AJAX Timeout. The attempt to contact the server timed out.");
}

function loadTimers(){

	document.getElementById("loadingtimersmsg").style.display = "";

	var params = "action=retrieve";

	request.open("POST", serviceURL, true);

	//Send the proper header information along with the request
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.setRequestHeader("Content-length", params.length);
	request.setRequestHeader("Connection", "close");

	request.onreadystatechange = loadingComplete;
	request.send(params);
	timeout = setTimeout("ajaxTimeout();", serviceTimeout);
}
function loadingComplete() {

	if (request.readyState == 4){
		if (request.status == 200){
			clearTimeout(timeout);
			var arrayJSON = request.responseText;
			if( arrayJSON.substr(0,5) != "error" && arrayJSON != ""){

				allTimers = eval('(' + arrayJSON + ')');

				document.getElementById("loadingtimersmsg").style.display = "none";
				initTimers();
				updateTimes();

			}else if(arrayJSON == ""){
				allTimers = [];
				document.getElementById("loadingtimersmsg").style.display = "none";
				initTimers();
				updateTimes();
			}else{
				alert("Error: Invalid AJAX Response. The load timers request returned an error response.");
			}
		}
	}
}

function deleteTimer(id){

	if( (!savingEnabled) || (allTimers[id]['recordid']==null) ){
		removeTimer(id); // No server-side saving. Only need to remove it from the page and local array.
	}else{

		document.getElementById("pleasewait"+id).style.display = "";

		var params = "action=delete&recordid="+allTimers[id]['recordid'];
		request.open("POST", serviceURL, true);

		//Send the proper header information along with the request
		request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		request.setRequestHeader("Content-length", params.length);
		request.setRequestHeader("Connection", "close");

		request.onreadystatechange = function() {
					if (request.readyState==4){
						if (request.status==200){
							deletingComplete(id);
						}
					}
				}
		request.send(params);
		timeout = setTimeout("ajaxTimeout();", serviceTimeout);
	}
}
function deletingComplete(arrayid) {

	if (request.readyState == 4){
		if (request.status == 200){
			clearTimeout(timeout);
			var id = request.responseText;
			if( id.substr(0,5) != "error" && id != ""){
				if(!isNaN(id)){
					removeTimer(arrayid);
					document.getElementById("pleasewait"+arrayid).style.display = "none";
				}else{
					alert("Error: Invalid AJAX Response. The delete request for a timer returned an invalid response: "+id);
				}
			}else{
				alert("Error: Invalid AJAX Response. The delete request for a timer returned an invalid response: "+id);
			}
		}
	}
}
function removeTimer(arrayid){
	allTimers[arrayid] = null;
	document.getElementById("timeritem"+arrayid).style.display = "none";
}


// Get a formatted string of the current accumulated time in hours, minutes, seconds.
function getTimeStr(startSeconds, accumulatedSeconds){

	var dt = new Date();
	var nowSeconds = Math.floor(dt.getTime()/1000);

	var secondsElapsed = (nowSeconds - startSeconds) + accumulatedSeconds;

	var hours = Math.floor(secondsElapsed / (60*60));
	secondsElapsed = secondsElapsed % (60*60);

	var minutes = Math.floor(secondsElapsed / (60));
	var seconds = secondsElapsed % 60;

	return(hours+"h "+minutes+"m "+seconds+"s");
}

// Get a formatted string of the logged time. In fractions of hours or minutes (for billing).
function getLoggedTimeStr(seconds){
	if(seconds < 60){
		return(seconds+" seconds");
	}
	if(seconds < 60*60){
		return ( Math.floor(seconds/60)+" minutes" );
	}
	return( (Math.round((seconds/(60*60))*10)/10) + " hours");
}

// Start a timer counting up. Toggle button displays.
function startTimer(id){

	var dt = new Date();
	var nowSeconds = Math.floor(dt.getTime()/1000);

	allTimers[id]["started"] = true;
	allTimers[id]["starttime"] = nowSeconds;

	document.getElementById('logbutton'+id).style.display = "none";
	document.getElementById('timeroptions'+id).style.display = "none";
	document.getElementById('startbutton'+id).style.display = "none";
	document.getElementById('stopbutton'+id).style.display = "";

	allTimers[id]["stopped"] = false;

	activeTimers++;

	if(activeTimers==1){ // We have started the first timer!
		setTimeout ( "updateTimes()", timeInterval );
	}
}

// Stop a timer from counting and toggle the button displays.
function stopTimer(id){

	var dt = new Date();
	var nowSeconds = Math.floor(dt.getTime()/1000);

	allTimers[id]["started"] = false;
	allTimers[id]["accumulated"] = allTimers[id]["accumulated"] + (nowSeconds - allTimers[id]["starttime"]);
	allTimers[id]["starttime"] = 0;

	document.getElementById('logbutton'+id).style.display = "";
	document.getElementById('startbutton'+id).style.display = "";
	document.getElementById('stopbutton'+id).style.display = "none";
	document.getElementById('timeroptions'+id).style.display = "";

	allTimers[id]["stopped"] = true;

	activeTimers--;
}

// Add a new timer to the list.
function addTimer(){

	var timerName = document.getElementById("newtask").value.trim();
	timerName = timerName.replace(/[\n\t\r]/g, ""); //Remove whitespace except spaces.
	timerName = htmlentities(timerName); //Convert HTML entitles.

	if(timerName != ""){
		var posn = allTimers.length;
		allTimers[posn] = {};
		allTimers[posn]["recordid"] = null;
		allTimers[posn]["started"] = false; // Indicates that a timer is currently counting up.
		allTimers[posn]["stopped"] = false; // Indicates that a timer has been paused/stopped.
		allTimers[posn]["starttime"] = 0;
		allTimers[posn]["accumulated"] = 0;  // Accumulated timer time that has not yet been logged.
		allTimers[posn]["loggedtime"] = 0;  // Total logged time.
		allTimers[posn]["name"] = timerName;
		allTimers[posn]["lastlogged"] = "Never";

		addTimerToList(posn);
		initTimer(posn);
	}
	document.getElementById("newtask").value = "Task Name...";
}

// Log the timer in a given timer to the Total Logged Time message.
// TODO - This will use AJAX to save the time to a file on the server.
function logTimer(id){

	var dt = new Date();
	var nowTStamp = dt.format("yyyy-mm-dd h:nnzz");

	// Add the accumulated time to the total logged time.
	allTimers[id]["loggedtime"] = allTimers[id]["loggedtime"] + allTimers[id]["accumulated"];
	allTimers[id]["accumulated"] = 0;


	// Update the logged time message.
	document.getElementById('loggedtime'+id).innerHTML = getLoggedTimeStr(allTimers[id]["loggedtime"]);

	// Update the last logged timestamp message.
	allTimers[id]["lastlogged"] = nowTStamp;
	document.getElementById('lastlogged'+id).innerHTML = allTimers[id]["lastlogged"];

	// TODO - Use AJAX to save the accumulated time and clear it from the array.
	if(savingEnabled){
		saveTimerToServer(id);
	}

	// Update the buttons and time message.
	document.getElementById('timerdata'+id).innerHTML = "0s";
	document.getElementById('logbutton'+id).style.display = "none";
	document.getElementById('startbutton'+id).style.display = "";
	document.getElementById('stopbutton'+id).style.display = "none";
	document.getElementById('timeroptions'+id).style.display = "none";
}

// Clear a timer without logging it.
function clearTimer(id){

	// Clear the accumulated time.
	allTimers[id]["accumulated"] = 0;

	// Update the buttons and time message.
	document.getElementById('timerdata'+id).innerHTML = "0s";
	document.getElementById('logbutton'+id).style.display = "none";
	document.getElementById('startbutton'+id).style.display = "";
	document.getElementById('stopbutton'+id).style.display = "none";
	document.getElementById('timeroptions'+id).style.display = "none";
}


// ---------- Library Functions ----------------
// Source: http://www.codeproject.com/KB/scripting/dateformat.aspx
Date.prototype.format = function(f)
{
	var gsMonthNames = new Array('January','February','March','April','May','June','July','August','September','October','November','December');
	var gsDayNames = new Array('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday');

    if (!this.valueOf())
        return ' ';

    var d = this;

    return f.replace(/(yyyy|mmmm|mmm|mm|dddd|ddd|dd|hh|h|nn|ss|zz)/gi,
        function($1)
        {
            switch ($1.toLowerCase())
            {
            case 'yyyy': return d.getFullYear();
            case 'mmmm': return gsMonthNames[d.getMonth()];
            case 'mmm':  return gsMonthNames[d.getMonth()].substr(0, 3);
            case 'mm':   return (d.getMonth() + 1).zf(2);
            case 'dddd': return gsDayNames[d.getDay()];
            case 'ddd':  return gsDayNames[d.getDay()].substr(0, 3);
            case 'dd':   return d.getDate().zf(2);
            case 'hh':   return ((h = d.getHours() % 12) ? h : 12).zf(2);
			case 'h':   return (h = d.getHours() % 12) ? h : 12;
            case 'nn':   return d.getMinutes().zf(2);
            case 'ss':   return d.getSeconds().zf(2);
            case 'zz':  return d.getHours() < 12 ? 'am' : 'pm';
            }
        }
    );
}

// Zero-Fill
String.prototype.zf = function(l) { return '0'.string(l - this.length) + this; }
Number.prototype.zf = function(l) { return this.toString().zf(l); }

// VB-like string
String.prototype.string = function(l) { var s = '', i = 0; while (i++ < l) { s += this; } return s; }

// String trim
String.prototype.trim = function(){  return this.replace(/^\s+|\s+$/g,"");}


// Cookie handling functions
function setCookie(cookiename, value, expiredays)
{
    var expdate=new Date();
    expdate.setDate(expdate.getDate()+expiredays);
    document.cookie=cookiename+ "=" +escape(value)+((expiredays==null) ? "" : ";expires="+expdate.toUTCString());
}
function getCookie(cookiename)
{
    if( document.cookie.length>0 )
    {
        var cookiestart=document.cookie.indexOf(cookiename + "=");
        if( cookiestart!=-1 ) {
            cookiestart = cookiestart + cookiename.length+1;
            var cookieend=document.cookie.indexOf(";",cookiestart);
            if (cookieend==-1){
                cookieend=document.cookie.length;
            }
            return unescape( document.cookie.substring(cookiestart,cookieend) );
        }
    }
    return "";
}
