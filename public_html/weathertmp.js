/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
/* geolocation doesn't worl properly - especially on phone.  Try this:
 * 
 * function getGeoLocation() {
        var options = null;
        if (navigator.geolocation) {
            if (browserChrome) //set this var looking for Chrome un user-agent header
                options={enableHighAccuracy: false, maximumAge: 15000, timeout: 30000};
            else
                options={maximumAge:Infinity, timeout:0};
            navigator.geolocation.getCurrentPosition(getGeoLocationCallback,
                    getGeoLocationErrorCallback,
                   options);
        }
    }

or this bodge - call it twice

//Dummy one, which will result in a working next statement.
navigator.geolocation.getCurrentPosition(function () {}, function () {}, {});
//The working next statement.
navigator.geolocation.getCurrentPosition(function (position) {
    //Your code here
}, function (e) {
    //Your error handling here
}, {
    enableHighAccuracy: true
});

 */
var gLongitude = "";
var gLatitude="";
var gSearchTerm ="";
var gDstOffset=0;
var gRawOffset=0;
var gTimeReceived = false; // Flag to idicate time offset service has returned
var gWeatherPromise = null;

$(document).ready(function () {
  gTimeReceived = false;
  // If enter pressed whilst in text box, press the button
  $("#search-term").keyup(function(event){
    if(event.keyCode === 13){
        $("#btn-search").click();
    }
});
  
  function navigateSucess(position) {
   getWeatherWithCoords(position.coords.longitude,position.coords.latitude);
  }
  function navigateFailure(error) {
    alert(error.message);
  }
  
  var options = {
  enableHighAccuracy: true,
  timeout: 200000,
  maximumAge: 60000
};
 if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(navigateSucess, navigateFailure, options);
 }  
  var res = $("#weather-result");
  var gSunrise="";
var gSunset="";

function getWeatherWithCoords(lon, lat) {
  getWeather("lat=" + lat + "&lon=" + lon);
}
function getWeatherWithCity(city) {
  
  getWeather("q=" + city);
  }
  
  function getWeather(location) {
  var weatherPromise = $.getJSON("http://api.openweathermap.org/data/2.5/forecast?" + location + "&cnt=16&appid=cdfd2755fcf7f6b5e91ced130ef8fd2c", function(json) {

    gLongitude = json.city.coord.lon;
   gLatitude = json.city.coord.lat;
   
   /* use most current time to reflect weather background i.e. first element result */
    var backgroundImage = "./images/" + json.list[0].weather[0].icon + ".jpg";
  //  var backgroundImage = "./images/" + "50n" + ".jpg";
   $("#background").css("background-image", "url(" + backgroundImage + ")");

   
  //   
//    document.write(json.city.coord.lon + " longitude, " + json.city.coord.lat + " latitude" + "</br>");
//    
//    theDate= new Date(json.list[0].dt * 1000);
//    document.write("Date: " + theDate.toUTCString() + "</br>");
//    

//    // Need to call web service here as it depends on the weather callback execution t use the long and lat values
  var requestStr = "http://api.sunrise-sunset.org/json?lat=" + gLatitude + "&lng=" + gLongitude + "&date=today";
 $.getJSON(requestStr, function(sun) {
 
 gSunrise = sun.results.sunrise;
 gSunset = sun.results.sunset;
 
 if (sun.status === "OK") {
 $("#sunrise").text("Sunrise: " + gSunrise + " (UTC)");
 $("#sunset").text("Sunset: " + gSunset + " (UTC)");
 } else {
   $("#sunrise").text("Sunrise: unavailable");
 $("#sunset").text("Sunset: unavailable");
 }

 });
 
 
 var requestStr = "https://maps.googleapis.com/maps/api/timezone/json?location=" + gLatitude + "," + gLongitude + "&timestamp=" + json.list[0].dt + "&key=AIzaSyBhc1u7VnzfJDUrf-ZCUVgrxq3QUJeVyVQ#";
 $.getJSON(requestStr, function(time) {
  
//   "dstOffset" : 0,
//   "rawOffset" : -28800,
//   "status" : "OK",
//   "timeZoneId" : "America/Los_Angeles",
//   "timeZoneName" : "Pacific Standard Time"
   gDstOffset = time.dstOffset;
   gRawOffset = time.rawOffset;
   gTimeReceived = true;
 });
 
 $("#location").text("Weather for " + json.city.name + ", " + json.city.country);
 $("#coords").text(" [lat: " + json.city.coord.lat + ", lon: " + json.city.coord.lon + "]");
 
  $(".panel").remove(); // remove any panels that heve been dynamically put there from last time
 
  for (var count = 0; count < parseInt(json.cnt); count++ ) {
    
 var   theDate= new Date(json.list[count].dt * 1000);
   // $("#summary").html('<span>' + addLeadingZeros(theDate.getHours(),2) + ":00" + '</span>'); 
   var icon = "http://openweathermap.org/img/w/" + json.list[count].weather[0].icon + ".png";
  
  // Create button script with unique id btn(n) based on count and unique target #collapse(n) based on count and time
  // with leading and trailing zeros
  var button = '<button id="btn'+count+'" class="btn-primary btn-xs" data-toggle="collapse" data-target="#collapse' + count + '" > \
                  <img src=' + icon + '>' 
                + addLeadingZeros(theDate.getHours().toString(),2) + ":00" + theDate.getHours()+ gDstOffset / 3600 + gRawOffset / 3600 
             + '</button>';
 
    // Create script to add buttons and panels into panel group based on number of weather readings returned. Give each
    // panel a unique id based on count panel(n) so it can be referred to when changing its style to highlight on 
    // button press
    var tempC = round(json.list[count].main.temp-273,1); // Web service returns temp in Kelvins by default
    var tempF = round(tempC * 9 / 5 + 32,1);       
    var windSpeedMps = round(json.list[count].wind.speed,2);
    var windSpeedMph = round(windSpeedMps / 2.23694,2);
    var windDirection = round(json.list[count].wind.deg,2);
    
    
    
    $(".panel-group").append('\
    <div class="panel" id="panel' + count + '">  \
      <div class="panel-heading"> \
        <p class="panel-title" id="summary1"> \
        ' + button + ' \
        </p> \
      </div> \
      <div id="collapse' + count + '" class="panel-collapse collapse"> \
        <div class="panel-body" >Summary: ' + json.list[count].weather[0].description + '</div> \
       <div class="panel-body" >Temperature: ' + tempC  + '&#8451;,  ' + tempF + '&#8457;</div> \
      <div class="panel-body" >Cloud Density: ' + json.list[count].clouds.all + '%</div> \
      <div class="panel-body" >Humidity: ' + json.list[count].main.humidity + '%</div> \
      <div class="panel-body" >Air Pressure: ' + round(json.list[count].main.pressure,0) + 'hPa (mbar)</div> \
      <div class="panel-body" >Wind speed: ' + windSpeedMps + 'm/s, ' + windSpeedMph + 'mph</div> \
      <div class="panel-body" >Wind Direction: ' + getWindDirection(parseFloat(windDirection)) + '  (' + windDirection + '&#176;)</div> \
        <div class="panel-footer"></div> \
      </div> \
    </div> \
');
  }
    
}); // end getJSON
}
function getWindDirection(angle) {
  if (angle >= 348.75 && angle <= 360 || angle >= 0 && angle <= 11.25) return "N";
  if (angle > 11.25 && angle <= 33.75) return "NNE";
  if (angle > 33.75 && angle <= 56.25) return "NE";
  if (angle > 56.25 && angle <= 78.75) return "ENE";
  if (angle > 78.75 && angle <= 101.25) return "E";
  if (angle > 101.25 && angle <= 123.75) return "ESE";
  if (angle > 123.75 && angle <= 146.25) return "SE";
  if (angle > 146.25 && angle <= 168.75) return "SSE";
  if (angle > 168.75 && angle <= 191.25) return "S";
  if (angle > 191.25 && angle <= 213.75) return "SSW";
  if (angle > 213.75 && angle <= 236.25) return "SW";
  if (angle > 236.25 && angle <= 258.75) return "WSW";
  if (angle > 258.75 && angle <= 281.25) return "W";
  if (angle > 281.25 && angle <= 303.75) return "WNW";
  if (angle > 303.75 && angle <= 326.25) return "NW";
  if (angle > 326.25 && angle <= 348.75) return "NNW";
}
function round(number, decimals) { 
  return +(Math.round(number + "e+" + decimals) + "e-" + decimals); 
}

/* Trap button press and get currentTarget id as this is the button id regardless of whether the image is clicked 
   if using target ID it will be button or image depending on whereabouts the button is clicked.
   Each panel is given a unique id of panel(n) i.e. panel0, panel1 ...  Each button is given a unique id of btn(n)
   So strip the btn off the button id and add the number (n) onto #panel to get a panel number that coresponds to 
   the pressed button then use that to highlight the panel by setting the panel default class. click again and it
   goes away.  This is in sync with the panel opening and closing as a result of pressing the button so only the 
   pressed button has its panel opened. Quite complicated but can't think of an easier way to do it */
$(".panel-group").on("click","button", function(event) {
  $("#panel"+ event.currentTarget.id.substring(3)).toggleClass("panel-default"); // extract (n) fron btn(n)
});

$("#btn-search").click(function() {
 var searchTerm= $("#search-term").val();
 
 getWeatherWithCity(searchTerm);
});
 
}); // End document ready



function addLeadingZeros(str, width) {
  newStr="";
  
  for (var i=str.length; i < width; i++) {
    newStr+="0";
  }
  return newStr + str;
}
function ParseJson(JSONtext)
{
	try{
		JSONobject = JSON.parse(JSONtext); 
	}catch(e){
		ShowAlertMess('Error JSON');
		return;
	}

	if(JSONobject.cod != '200') {
		ShowAlertMess('Error '+ JSONobject.cod + ' ('+ JSONobject.message +')');
		return;
	}
	var mes = JSONobject.cod;
	if(JSONobject.calctime)
		mes = mes + ' ' + JSONobject.calctime;
	if(JSONobject.message)
		mes = mes + ' ' + JSONobject.message;
	console.log( mes );
	return JSONobject;
}

function syntaxHighlight(json) {
    if (typeof json !== 'string') {
         json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function output(inp) {
    document.body.appendChild(document.createElement('pre')).innerHTML = inp;
}