/**
 * @fileOverview Weather app for codecamp exercise. <br>
 * Some interesting time zones used for testing:<br>
 * New Delhi +5:30, Darwin +9:30, Eucla +8:45, Chatham Islands +12:45, 
 * Caracas -4:30, Newfoundland -3:30 
 * @author Tony Nicol
 * @version 1.0.0
 */
 

// Tests  
//console.log(getLocalTime(00,44,{"rawOffset":0*3600,"dstOffset":0*3600}));        // 00:44:00
//console.log(getLocalTime(00,44,{"rawOffset":-1.5*3600,"dstOffset":0*3600}));     // 23:14:00
//console.log(getLocalTime(00,44, {"rawOffset":-1.75*3600,"dstOffset":0*3600}));   // 22:59:00
//console.log(getLocalTime(23,46, {"rawOffset":1.75*3600,"dstOffset":+1*3600}));   // 02:31:00
//console.log(getLocalTime(23,44, {"rawOffset":1.75*3600,"dstOffset":+1*3600}));   // 02:29:00
//
// Enter blank string and press search to show failed screen
// Change return code from 200 to say 20 to force a fail
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

 /** 
  * Get users global locaton
  * @see http://www.w3schools.com/jsref/obj_navigator.asp
  */
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

  /**
  * Simple function to call main weather function with long and lat coords.
  * This is an entry point into the main weather function getWeather.  It uses lat and lon as the location to 
  * look up in the web service. The parameter string will be appended to the service URI
  * @function getWeatherWithCoords
  * @param {String} lon longitude positional value. e.g. -2.71667
  * @param {String} lat latitude positional value. e.g. 53.76667
  * @returns {Undefined} nothing
  */
  function getWeatherWithCoords(lon, lat) {
    getWeather("lat=" + lat + "&lon=" + lon);
  }

  /**
   * This is an entry point into the main weather function getWeather.  This uses city name and optional country as 
   * the location to look up in the web service. The parameter string will be appended to the service URI
   * e.g. london or london,uk
   * @function getWeatherWithCity
   * @param {String} city e.g. london or london,uk
   * @returns {Undefined} nothing
   */
  function getWeatherWithCity(city) {
    getWeather("q=" + city);
  }


  /**
  * The location value is added to the URI to make the service call using also the api provided app key.
  * As there are several web service calls that rely on data from this one, they are included here and promises used 
  * to synchronise them.
  * @function getWeather
  * @param {String} location e.g.  "lat=53.76667&lon=-2.71667 or  "q=penworham,uk"
  * @returns {Undefined} nothing
  * @see Weather API:
  * @see http://openweathermap.org/forecast5
  * @see Timezone API:
  * @see https://developers.google.com/maps/documentation/timezone/intro#Introduction
  * @see Sunrise/set:
  * @see http://sunrise-sunset.org/api
  */
  function getWeather(location) {
    // Not used callback approach to get response string as I need this to return before calling other two APIs so use 
    // the promise method .success listener to wait for a successful execution of the weather API call, or .error if
    // it fails.  
    var gWeatherPromise = $.getJSON("http://api.openweathermap.org/data/2.5/forecast?" + location + "&cnt=16&appid=cdfd2755fcf7f6b5e91ced130ef8fd2c").success(function () {
      $(".panel").remove(); // remove any panels that heve been dynamically put there from last time
      
      // Check there is some weather data to display and if not say so 200 indicates city found
      if (gWeatherPromise.responseJSON.cod === "200") { 
        // Weather API must have succeeded to get here so can use coords to call the other APIs and set their listeners. 
        var requestStr = "https://maps.googleapis.com/maps/api/timezone/json?location=" 
                         + gWeatherPromise.responseJSON.city.coord.lat 
                         + "," 
                         + gWeatherPromise.responseJSON.city.coord.lon 
                         + "&timestamp=" 
                         + gWeatherPromise.responseJSON.list[0].dt 
                         + "&key=AIzaSyBhc1u7VnzfJDUrf-ZCUVgrxq3QUJeVyVQ#";
               
        var  gTimePromise = $.getJSON(requestStr); // Don't use callback here, take the result in the returned promise

        // Weather API complete and timezone API listener set. Call sun times API and set its listener
        var requestStr = "http://api.sunrise-sunset.org/json?lat=" 
                         + gWeatherPromise.responseJSON.city.coord.lat 
                         + "&lng=" 
                         + gWeatherPromise.responseJSON.city.coord.lon 
                         + "&date=today&formatted=0";
               
        var gSunPromise = $.getJSON(requestStr); // Not used callback. Use promise to get string when eventually returned
      
        // Two listeners set.  Don't want to continue until they return so set this when listener to be triggered when 
        // both API calls complete. When triggered, call .done function to update the page
        $.when(gTimePromise, gSunPromise).done(function () {
          var json = gWeatherPromise.responseJSON;
          var sunResults = gSunPromise.responseJSON.results;
          var timeDiff = gTimePromise.responseJSON;

          // use first time sample of weather in list to reflect weather background i.e. first element result
          // Background images are named the same as the weather icon images but are stored in a different place
          var backgroundImage = "http://www.tonynicol.com/weather/images/" + json.list[0].weather[0].icon + ".jpg";
        
          // Copy image to page background under css control
          $("#background").css("background-image", "url(" + backgroundImage + ")");

          // Make sure the json contains sun time data. If not, write unavailable to screen
          if (gSunPromise.statusText === "OK") {
            // getSunTimes parses sunrise and timeDiff to create local and UTC time strings in an object
            var sunTimes = getSunTimes(sunResults.sunrise, timeDiff);
            $("#sunrise").html("<b>Sunrise:</b> " + sunTimes.local + ' (Local), ' + sunTimes.UTC + " (UTC)");
            sunTimes = getSunTimes(sunResults.sunset, timeDiff);
            $("#sunset").html("<b>Sunset:</b> " + sunTimes.local + ' (Local), ' + sunTimes.UTC + " (UTC)");
          } else {
              $("#sunrise").html("<b>Sunrise:</b> unavailable");
              $("#sunset").html("<b>Sunset:</b> unavailable");
            }

          // Make sure there is some time diff data to work with and output it or unavaiable
          if (timeDiff.status === "OK") {
            $("#time-diff").html("<b>Time Difference:</b> " + putTimeDiff(timeDiff) + "h" + " " + timeDiff.timeZoneName);
          } else {
            $("#time-diff").html("<b>Time Difference:</b> " + "unavailable");
          }
 
          // Output location and coordinates before creating list of buttons
          $("#location").text("Weather for " + json.city.name + ", " + json.city.country);
          $("#coords").html("<b>Lat:</b> " + json.city.coord.lat + ", <b>Lon:</b> " + json.city.coord.lon);

          for (var count = 0; count < parseInt(json.cnt); count++) {
            var theDate = new Date(json.list[count].dt * 1000); // Get date out of json response and convert to obj
            
            // Access icons directly from site. Filename for each icon returned in json
            var icon = "http://openweathermap.org/img/w/" + json.list[count].weather[0].icon + ".png";

            // Create button script with unique id btn(n) based on count and unique target #collapse(n) based on count
            var button = '<button id="btn' 
                           + count 
                           + '" class="btn-primary btn-xs" data-toggle="collapse" data-target="#collapse' 
                           + count 
                           + '" > \
                           <img src=' + icon + '>'
                          + '</button>';

            // Create script to add buttons and panels into panel group based on number of weather readings returned. 
            // Give each panel a unique id based on count panel(n) so it can be referred to when changing its style 
            // to open or close sub-panels on button press
            var tempC = round(json.list[count].main.temp - 273, 1); // Web service returns temp in Kelvins by default
            var tempF = round(tempC * 9 / 5 + 32, 1); // Convert kelvins to degrees F
            var windSpeedMps = round(json.list[count].wind.speed, 2); // 2 dp ok for wind speed in m/s
            var windSpeedMph = round(windSpeedMps / 2.23694, 2);      // convert to mph to dispay metric and imperial
            var windDirection = round(json.list[count].wind.deg, 2);  // 2 dp for degrees is ok

            $(".panel-group").append('\
              <div class="panel" id="panel' + count + '">  \
                <div class="panel-heading"> \
                  <p class="panel-title"> ' 
                    + button 
                    + '<span id="time">' 
                    + getLocalTime(1 * theDate.getHours(), 0, timeDiff) 
                    + ' (Local), ' 
                    + addLeadingZeros(theDate.getHours().toString(), 2) 
                    + ':00 (UTC) </span>  \
                  </p> \
                </div> \
                <div id="collapse' + count + '" class="panel-collapse collapse"> \
                  <div class="panel-body" >Summary: ' + json.list[count].weather[0].description + '</div> \
                  <div class="panel-body" >Temperature: ' + tempC + '&#8451;,  ' + tempF + '&#8457;</div> \
                  <div class="panel-body" >Cloud Density: ' + json.list[count].clouds.all + '%</div> \
                  <div class="panel-body" >Humidity: ' + json.list[count].main.humidity + '%</div> \
                  <div class="panel-body" >Air Pressure: ' + round(json.list[count].main.pressure, 0) + 'hPa (mbar)</div> \
                  <div class="panel-body" >Wind speed: ' + windSpeedMps + 'm/s, ' + windSpeedMph + 'mph</div> \
                  <div class="panel-body" >Wind Direction: ' 
                    + getWindDirection(parseFloat(windDirection)) 
                    + '  (' + windDirection + '&#176;) \
                  </div> \
                  <div class="panel-footer"></div> \
                </div> \
              </div> '
            ); // end panel  .append
          } // end for
        }); // end .when
      }else { // call failed so write some failed messages
         $("#background").css("background-image", "");
         $("#location").text("Weather currently unavailable");
         $("#coords").html("<b>Lat:</b> " + "unavailable" + ", <b>Lon:</b> " + "unavailable");
         $("#sunrise").html("<b>Sunrise:</b> " + "unavailable");
         $("#sunset").html("<b>Sunset:</b> " + "unavailable");
         $("#time-diff").html("<b>Time Difference:</b> " + "unavailable");
       }
    }); // end weather promise success
  } // end getWeather

  /**
   * Ignore the date and just extract the time info from the sunrise / set string.  e.g. 06:51. 
   * Call getLocalTime to get a formatted string of time based on time difference. Put timeStr and local time
   * in an object to return to the caller  
   * @function getSunTimes
   * @param {String} timeStr Time from sun web service. e.g.  "2016-03-03T06:51:41+00:00"
   * @param {Object} timeDiff json object  from time diff web service
   * @returns {Object} Object holding local and UTC time strings
   */
  function getSunTimes(timeStr, timeDiff) {
    var time = timeStr.substr(timeStr.indexOf("T") + 1, 5);
    var hour = time.substr(0, 2);
    var minutes = time.substr(3, 2);
    var times = {};

    times.UTC = time;
    times.local = getLocalTime(1 * hour, 1 * minutes, timeDiff);
    return times;
  }

   /**
   * Add any seasonal adjustnent and time zone differences to calculate the actual time difference between local and UTC
   * formatted timeDifference string with leading + if needed. Value may be fractional - some countries have n.5 or n.75
   * @function putTimeDiff
   * @param {Object} timeDiff Holds time difference data in JSON object
   * @returns {String} time difference e.g. -3.75, +2.5, -5, +7
   */
  function putTimeDiff(timeDiff) {
    var timeDifference = (timeDiff.dstOffset + timeDiff.rawOffset) / 3600;

    if (timeDifference < 0) {
      return timeDifference.toString();
    } else {
      return "+" + timeDifference.toString();
    }
  }

   /**
   * Get time diff and seasonal adjustment from timeDiff, and add to UTC hours and minutes.
   * Couldn't find  way of doing this with a time object to had to hanball it all. A neat
   * way of removing the integer part (as some time diffs are fractional) is n % 1.
   * @function getLocalTime
   * @param {String} currentHour UTC hour
   * @param {String} currentMinutes UTC minutes
   * @param {Object} timeDiff JSON object with seasonal and time difference data
   * @see Calls <b>addLeadingZeros()</b> to add leading zeros if needed
   * @returns {String}
   */
  function getLocalTime(currentHour, currentMinutes, timeDiff) {
    var seasonalAdjust = timeDiff.dstOffset / 3600;
    var timeDifference = timeDiff.rawOffset / 3600;
    var totalTimeDifference = seasonalAdjust + timeDifference;

    var localHour = 0;
    var localMinutes = 0;
    var minutesAdjust = (totalTimeDifference % 1) * 60; // get fract hour part e.g. 0.75 & turn into minutes
    var borrow = 0;
    var carry = 0;

    if (currentMinutes + minutesAdjust < 0) {
      borrow = 1;
      localMinutes = (currentMinutes + minutesAdjust + 60) % 60; // Subtract by modulo addition
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
  }

  /**
   * Get the integer part of a number. Couldn't find a javascript method for doing this
   * @function getIntPart
   * @param {Number} real The number to truncate
   * @returns {Number} The truncated integer (still a number type in javascript)
   */
  function getIntPart(real) {
    return real > 0 ? Math.floor(real) : Math.ceil(real);
  }
  
  /**
   * @function getWindDirection Convert degrees to cardinal and intercardinal direction
   * @param {Number} angle 0 to 359 degrees
   * @returns {String} Direction as NE, SSW etc based on angle
   */
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
  
  /**
   * Round a number to a set number of decimal places. Couldn't find a javascript function to do this so had 
   * to write one
   * @param {Number} number
   * @param {Number} decimals
   * @returns {Number}
   */
  // E.g. if number is 2.3335 and decimals is 3, number + "e+" + decimals becomes 2.335e3 so is multiplied by 1000 and 
  // rounded.  The result is 2336 then has e-3 concatenated so looks like 2336e-3 which is evaluated as a number due 
  // to the + unery operator i.e. +(2336e-3) so divides by 1000 to 2.336.  Rounding is ambiguous when the digit is 5. 
  // Typically this will round up so 1.5 -> 2.0.  However, this can cause problems if done many times so an 
  // alternative is bankers rounding where the number is rounded up if integer is even and down if odd to try to even 
  // things out.  Similarly need to decide what to do with negative numbers.  i.e. does -1.5 go to -2 or -1?  
  // Or use bankers rule to round to even numbers.  Any rule can be applied so it is application dependant.
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


/**
 * Add leading zeros until the string is width chars wide. 
 * @function addLeadingZeros
 * @param {String} str String, which should be a number, to make a certain width so add zeros until width reached.
 * @param {Number} width Overall number of digits to return
 * @returns {String} Zero padded string
 * 
 * @example
 * addLeadingZeros("123",8);
 * Returns "00000123"
 */
function addLeadingZeros(str, width) {
  newStr = "";

  for (var i = str.length; i < width; i++) {
    newStr += "0";
  }
  return newStr + str;
}
