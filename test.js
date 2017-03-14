
/*
var cron = require('cron');
new cron.CronJob('* * 23 * * *', function() {
  console.log('You will see this message every second');
}, null, true, 'America/New_York');
*/

var weather = require('weather-js');

weather.find({search: 'College Park, MD', degreeType: 'F'}, function(err, result) {
	if (err) {
		console.log(err);
	} else {

		var day = result[0].current.shortday;
		var date = result[0].current.date;
		var temp = result[0].current.temperature;
		var sky = result[0].current.skytext;
		var feelslike = result[0].current.feelslike;
		var windspeed = result[0].current.windspeed;

		// console.log(result[0])

		var high_temp;
		var low_temp;
		var day_sky;

		result[0].forecast.forEach(function(obj) {
			if (obj.date == date) {
				high_temp = obj.high;
				low_temp = obj.low;
				day_sky = obj.skytextday;
			}
		});


		var output = "Forcast for " + day + ", " + date +":\n";

		output += "\n";

		output += "- Current Temp:        " + temp + "°F" + "\n";
		output += "- Current Feelslike:   " + feelslike + "\n";
		output += "- Current Windspeed:   " + windspeed + "\n";
		output += "- Current Forcast:     " + sky + "\n";
		
		output += "\n";

		output += "- Today's Low Temp:    " + low_temp + "°F" + "\n";
		output += "- Today's High Temp:   " + high_temp + "°F" + "\n";
		output += "- Today's Forcast:     " + day_sky;

		console.log(output);

		// console.log(JSON.stringify(result, null, 2));
	}
});





