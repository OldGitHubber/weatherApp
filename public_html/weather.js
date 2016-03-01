// Tests  
//console.log(getLocalTime(00,44,{"rawOffset":0*3600,"dstOffset":0*3600}));        // 00:44:00
//console.log(getLocalTime(00,44,{"rawOffset":-1.5*3600,"dstOffset":0*3600}));     // 23:14:00
//console.log(getLocalTime(00,44, {"rawOffset":-1.75*3600,"dstOffset":0*3600}));   // 22:59:00
//console.log(getLocalTime(23,46, {"rawOffset":1.75*3600,"dstOffset":+1*3600}));   // 02:31:00
//console.log(getLocalTime(23,44, {"rawOffset":1.75*3600,"dstOffset":+1*3600}));   // 02:29:00
//
// Test countries witout whole out time differences:
// New Delhi +5:30
// Darwin +9:30
// Eucla +8:45
// Chatham Islands +12:45
// Caracas -4:30
// Newfoundland -3:30
//


$(document).ready(function () {
  
  // If enter pressed whilst in text box, press the button and do the search
  $("#search-term").keyup(function (event) {
    if (event.keyCode === 13) {
      $("#btn-search").click();
    }
  });

  /*******************************************************************************************************************/
  // Geolocation to get user's local position
  // 
  // Details here: http://www.w3schools.com/jsref/obj_navigator.asp
  //
  /*******************************************************************************************************************/
  function navigateSucess(position) {
    getWeatherWithCoords(position.coords.longitude, position.coords.latitude);
  }

  function navigateFailure(error) {
    alert(error.message);
  }

  var options = {
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 60000
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(navigateSucess, navigateFailure, options);
  }

  /*******************************************************************************************************************/
  // getWeatherWithCoords
  // 
  //  params: two strings representing longitude and latitude
  //  
  // This is an entry point into the main weather function getWeather.  This uses lat and long as the location to 
  // look up in the web service. The parameter string will be appended to the service URI
  /*******************************************************************************************************************/
  function getWeatherWithCoords(lon, lat) {
    getWeather("lat=" + lat + "&lon=" + lon);
  }
  
  /*******************************************************************************************************************/
  // getWeatherWithCity
  //
  // Params: string holding the search term - e.g. canada, or more granular, penwortham,uk
  // 
  // This is an entry point into the main weather function getWeather.  This uses city name and optional country as 
  // the location to look up in the web service. The parameter string will be appended to the service URI
  // e.g. london or london,uk
  /*******************************************************************************************************************/
  function getWeatherWithCity(city) {
    getWeather("q=" + city);
  }


  /*******************************************************************************************************************/
  // getWeather
  //
  // Params: location.  String with the properly formed piece of the URI as determined by the API provider at :
  //                    http://openweathermap.org/forecast5
  //                    e.g.  "lat=53.76667&lon=-2.71667
  //                    or    "q=penworham,uk"
  //                    
  // The location value is added to the URI to make the service call using also the api provided app key.
  // As there are several web service calls that rely on data from this one, they are included here and promises used 
  // to synchronise them.  
  /*******************************************************************************************************************/
  function getWeather(location) {
   
    var gWeatherPromise = $.getJSON("http://api.openweathermap.org/data/2.5/forecast?" + location + "&cnt=16&appid=cdfd2755fcf7f6b5e91ced130ef8fd2c", function (json) {
      var gSunrise = "";
      var gSunset = "";
      // var gTimeDate = null;

      // gWeatherData = json;

      var requestStr = "https://maps.googleapis.com/maps/api/timezone/json?location=" + json.city.coord.lat + "," + json.city.coord.lon + "&timestamp=" + json.list[0].dt + "&key=AIzaSyBhc1u7VnzfJDUrf-ZCUVgrxq3QUJeVyVQ#";
      var gTimePromise = $.getJSON(requestStr, function (time) {

       //  gTimeDate = time;
      });

      var requestStr = "http://api.sunrise-sunset.org/json?lat=" + json.city.coord.lat + "&lng=" + json.city.coord.lon + "&date=today&formatted=0";
      var gSunPromise = $.getJSON(requestStr, function (sun) {

        //  gSunData = sun;



        $.when(gWeatherPromise, gTimePromise, gSunPromise).done(function () {
          var json = gWeatherPromise.responseJSON;
          var sunResults = gSunPromise.responseJSON.results;
          var timeDiff = gTimePromise.responseJSON;


// use first time sample of weather in list to reflect weather background i.e. first element result /
          var backgroundImage = "./images/" + json.list[0].weather[0].icon + ".jpg";
          //  var backgroundImage = "./images/" + "03n" + ".jpg";
          $("#background").css("background-image", "url(" + backgroundImage + ")");

          //getLocalTime(theDate.getHours(),timeDiff)

          if (sun.status === "OK") {
            var sunTimes = getSunTimes(sunResults.sunrise, timeDiff);
            $("#sunrise").html("<b>Sunrise:</b> " + sunTimes.local + ' (Local), ' + sunTimes.UTC + " (UTC)");
            sunTimes = getSunTimes(sunResults.sunset, timeDiff);
            $("#sunset").html("<b>Sunset:</b> " + sunTimes.local + ' (Local), ' + sunTimes.UTC + " (UTC)");
          } else {
            $("#sunrise").html("<b>Sunrise:</b> unavailable");
            $("#sunset").html("<b>Sunset:</b> unavailable");
          }

          if (timeDiff.status === "OK") {
            $("#time-diff").html("<b>Time Difference:</b> " + putTimeDiff(timeDiff) + "h");
          } else {
            $("#time-diff").html("<b>Time Difference:</b> " + "unavailable");
          }


          // gTimeDate = time;
          //   "dstOffset" : 0,
          //   "rawOffset" : -28800,
          //   "status" : "OK",
          //   "timeZoneId" : "America/Los_Angeles",
          //   "timeZoneName" : "Pacific Standard Time"
          //  gDstOffset = timeResults.dstOffset;
          //  gRawOffset = timeResults.rawOffset;
          //  gTimeReceived = true;
          //  });
          if (json.cod[0] === "2") { // 2xx codes are ok
            $("#location").text("Weather for " + json.city.name + ", " + json.city.country);
            $("#coords").html("<b>Lat:</b> " + json.city.coord.lat + ", <b>Lon:</b> " + json.city.coord.lon);

            $(".panel").remove(); // remove any panels that heve been dynamically put there from last time
          } else {
            $("#location").text("Weather currently unavailable");
          }
          for (var count = 0; count < parseInt(json.cnt); count++) {

            var theDate = new Date(json.list[count].dt * 1000);
            // $("#summary").html('<span>' + addLeadingZeros(theDate.getHours(),2) + ":00" + '</span>'); 
            var icon = "http://openweathermap.org/img/w/" + json.list[count].weather[0].icon + ".png";

            // Create button script with unique id btn(n) based on count and unique target #collapse(n) based on count and time
            // with leading and trailing zeros
            var button = '<button id="btn' + count + '" class="btn-primary btn-xs" data-toggle="collapse" data-target="#collapse' + count + '" > \
   <img src=' + icon + '>'
                    + '</button>';

            // Create script to add buttons and panels into panel group based on number of weather readings returned. Give each
            // panel a unique id based on count panel(n) so it can be referred to when changing its style to highlight on 
            // button press
            var tempC = round(json.list[count].main.temp - 273, 1); // Web service returns temp in Kelvins by default
            var tempF = round(tempC * 9 / 5 + 32, 1);
            var windSpeedMps = round(json.list[count].wind.speed, 2);
            var windSpeedMph = round(windSpeedMps / 2.23694, 2);
            var windDirection = round(json.list[count].wind.deg, 2);



            $(".panel-group").append('\
   <div class="panel" id="panel' + count + '">  \
   <div class="panel-heading"> \
   <p class="panel-title"> \
   ' + button + '<span id="time">' + getLocalTime(1 * theDate.getHours(), 0, timeDiff) + ' (Local), ' + addLeadingZeros(theDate.getHours().toString(), 2) + ':00 (UTC) </span>  \
   </p> \
   </div> \
   <div id="collapse' + count + '" class="panel-collapse collapse"> \
   <div class="panel-body" >Summary: ' + json.list[count].weather[0].description + '</div> \
   <div class="panel-body" >Temperature: ' + tempC + '&#8451;,  ' + tempF + '&#8457;</div> \
   <div class="panel-body" >Cloud Density: ' + json.list[count].clouds.all + '%</div> \
   <div class="panel-body" >Humidity: ' + json.list[count].main.humidity + '%</div> \
   <div class="panel-body" >Air Pressure: ' + round(json.list[count].main.pressure, 0) + 'hPa (mbar)</div> \
   <div class="panel-body" >Wind speed: ' + windSpeedMps + 'm/s, ' + windSpeedMph + 'mph</div> \
   <div class="panel-body" >Wind Direction: ' + getWindDirection(parseFloat(windDirection)) + '  (' + windDirection + '&#176;)</div> \
   <div class="panel-footer"></div> \
   </div> \
   </div> \
   ');
          }

        });
      });
    }).success(function() { 
      alert("Done it");
    })
      .error(function() { 
        alert("failed");
        })
      .complete(function() { 
        alert("complete");
      });
  }

  function getSunTimes(timeStr, timeDiff) {
    var time = timeStr.substr(timeStr.indexOf("T") + 1, 5);
    var hour = time.substr(0, 2);
    var minutes = time.substr(3, 2);
    // var hourDiff = (timeDiff.dstOffset + timeDiff.rawOffset) / 3600;
    var times = {};

    times.UTC = time;

    // times.local = getLocalTime(1*hour, 1*minutes, timeDiff).substr(0,2) + time.substring(2);
    //  times.local = getLocalTime(1*hour, 1*minutes, timeDiff)+time.substr(5,3); // Get hours and mins then concat original seconds
    times.local = getLocalTime(1 * hour, 1 * minutes, timeDiff);
    return times;
  }


  function putTimeDiff(timeDiff) {
    var timeDifference = (timeDiff.dstOffset + timeDiff.rawOffset) / 3600;

    if (timeDifference < 0) {
      return timeDifference.toString();
    } else {
      return "+" + timeDifference.toString();
    }
  }

  function getLocalTime(currentHour, currentMinutes, timeDiff) {
    //var currentHour = now.getHours();
    var seasonalAdjust = timeDiff.dstOffset / 3600;
    var timeDifference = timeDiff.rawOffset / 3600;
    var totalTimeDifference = seasonalAdjust + timeDifference;

    var localHour = 0;
    var localMinutes = 0;
    var minutesAdjust = (totalTimeDifference % 1) * 60;
    var borrow = 0;
    var carry = 0;

    if (currentMinutes + minutesAdjust < 0) {
      borrow = 1;
      localMinutes = (currentMinutes + minutesAdjust + 60) % 60;
    } else {
      if (currentMinutes + minutesAdjust >= 60) {
        carry = 1;
        localMinutes = (currentMinutes + minutesAdjust) % 60;
      } else {
        localMinutes = currentMinutes + minutesAdjust;
      }
    }

    if (totalTimeDifference < 0) {
      localHour = (currentHour + getIntPart(totalTimeDifference) - borrow + 24) % 24;
    } else {
      localHour = (currentHour + getIntPart(totalTimeDifference) + carry) % 24;
    }

    return addLeadingZeros(localHour.toString(), 2) + ":" + addLeadingZeros(localMinutes.toString(), 2);
    // return addLeadingZeros(localTime.toString(), 2) + ":00";
  }

  function getIntPart(real) {
    return real > 0 ? Math.floor(real) : Math.ceil(real);
  }
  function getWindDirection(angle) {
    if (angle >= 348.75 && angle <= 360 || angle >= 0 && angle <= 11.25)
      return "N";
    if (angle > 11.25 && angle <= 33.75)
      return "NNE";
    if (angle > 33.75 && angle <= 56.25)
      return "NE";
    if (angle > 56.25 && angle <= 78.75)
      return "ENE";
    if (angle > 78.75 && angle <= 101.25)
      return "E";
    if (angle > 101.25 && angle <= 123.75)
      return "ESE";
    if (angle > 123.75 && angle <= 146.25)
      return "SE";
    if (angle > 146.25 && angle <= 168.75)
      return "SSE";
    if (angle > 168.75 && angle <= 191.25)
      return "S";
    if (angle > 191.25 && angle <= 213.75)
      return "SSW";
    if (angle > 213.75 && angle <= 236.25)
      return "SW";
    if (angle > 236.25 && angle <= 258.75)
      return "WSW";
    if (angle > 258.75 && angle <= 281.25)
      return "W";
    if (angle > 281.25 && angle <= 303.75)
      return "WNW";
    if (angle > 303.75 && angle <= 326.25)
      return "NW";
    if (angle > 326.25 && angle <= 348.75)
      return "NNW";
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
  $(".panel-group").on("click", "button", function (event) {
    $("#panel" + event.currentTarget.id.substring(3)).toggleClass("panel-default"); // extract (n) fron btn(n)
  });

  $("#btn-search").click(function () {
    var searchTerm = $("#search-term").val();

    getWeatherWithCity(searchTerm);
  });

}); // End document ready



function addLeadingZeros(str, width) {
  newStr = "";

  for (var i = str.length; i < width; i++) {
    newStr += "0";
  }
  return newStr + str;
}
function ParseJson(JSONtext)
{
  try {
    JSONobject = JSON.parse(JSONtext);
  } catch (e) {
    ShowAlertMess('Error JSON');
    return;
  }

  if (JSONobject.cod != '200') {
    ShowAlertMess('Error ' + JSONobject.cod + ' (' + JSONobject.message + ')');
    return;
  }
  var mes = JSONobject.cod;
  if (JSONobject.calctime)
    mes = mes + ' ' + JSONobject.calctime;
  if (JSONobject.message)
    mes = mes + ' ' + JSONobject.message;
  console.log(mes);
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