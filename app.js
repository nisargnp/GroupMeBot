var express = require('express')
var app = express()
var request = require('request');
var bodyParser = require('body-parser')

var mongo = require('mongodb');
var monk = require('monk');

var cron = require("cron");
var weather = require('weather-js')

var bot_id = require("./bot_id")["bot_id"]
var client_id = require("./bot_id")["client_id"]

var yt_key = require("./youtube_key")["yt_key"]
var YouTube = require('youtube-node');
var youtube = new YouTube();
youtube.setKey(yt_key);

const url = "localhost:27017/narutodb"
const db = monk(url)

db.then(() => {
	console.log("Connected to mongodb server.")
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

const collection = db.get("dude");

// ---

// display number of dudes at midnight
new cron.CronJob('0 0 0 * * *', function() {

	collection.find({}).then((rows) => {

		rows = rows.sort(function(a,b) {
			return b.count - a.count;
		});

		var totalDudes = rows.reduce(function(acc, obj) {
			return acc + obj.count;
		}, 0);

		sendToChat("Total Dudes: " + totalDudes);

		sendToChat("Leaderboards:\n" + 
					"1st: " + rows[0].name + " ~ " + rows[0].count + "\n" +
					"2nd: " + rows[1].name + " ~ " + rows[1].count + "\n" +
					"3rd: " + rows[2].name + " ~ " + rows[2].count);


	});

}, null, true, 'America/New_York');


// say highnoon at noon
new cron.CronJob('0 0 12 * * *', function() {
  sendToChat('IT\'S HIGH NOON!');
}, null, true, 'America/New_York');



// ---

function sendWeather() {
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
			output += "- Current Feelslike:   " + feelslike + "°F" + "\n";
			output += "- Current Windspeed:   " + windspeed + "\n";
			output += "- Current Forcast:     " + sky + "\n";
			
			output += "\n";

			output += "- Today's Low Temp:    " + low_temp + "°F" + "\n";
			output += "- Today's High Temp:   " + high_temp + "°F" + "\n";
			output += "- Today's Forcast:     " + day_sky;

			sendToChat(output);

		}
	});
}

function getTwitchStatus(name) {
	request.get(
		{
			'baseUrl': 'https://api.twitch.tv/kraken/',
			'url': 'search/channels?query=' + name + '&limit=1', 
			'headers': {
				'Accept': 'Accept: application/vnd.twitchtv.v5+json',
				'Client-ID': client_id
			},
			json: true
		}, 
		function(err, res, body) {
			//console.log(body)
			if (body.channels.length == 0)
				return;

			var id = body.channels[0]._id
			request.get(
			{
				'baseUrl': 'https://api.twitch.tv/kraken/',
				'url': 'streams/' + id, 
				'headers': {
					'Accept': 'Accept: application/vnd.twitchtv.v5+json',
					'Client-ID': client_id
				},
				json: true
			}, 
			function(err, res, body) {
				//console.log(body)
				var msg = name + " is currently offline"
				if (body.stream) {
					msg = body.stream.channel.display_name + " is currently LIVE\nPlaying " + body.stream.game + " for " + body.stream.viewers + " viewers\n"+ body.stream.channel.url
				}
				sendToChat(msg);
			});
		}
	);
}

function searchYouTube(text) {
	youTube.search(text, 1, function(error, result) {
		if (error) {
		  console.log(error);
		}
		else {
		  var vidId = result.items[0].id.videoid
		  sendToChat ("https://www.youtube.com/watch?v=" + vidId)
		}
	});
}

function sendToChat(text) {
	request.post('https://api.groupme.com/v3/bots/post', {form:{'bot_id': bot_id, 'text': text}})
}

function updateDudes(id, name) {
	collection.find({"id": id}, "count").then((rows) => {
		if (rows.length == 0) {
			collection.insert({"id": id, "name": name, "count": 1});
		} else {
			collection.update({"id": id}, {$set: {"count": rows[0].count + 1}});
		}
	});
}

function dudesEcho(id, name) {
	collection.find({"id": id}, "count").then((rows) => {
		sendToChat("Dude count for " + name + ": " + rows[0].count);
	});
}

app.get('/', function(req,res) {
	res.send("Hello, World!");
})

app.post('/', function(req,res) {

	// 380883 is the sender id of the bot
	if (req.body.sender_id != 380883) {
		var body = req.body.text.toLowerCase();

		var id = req.body.sender_id;
		var name = req.body.name;
		
		if (body.includes("!dude")) {
			dudesEcho(id, name);
		} else if (body.includes("dude")) {
			updateDudes(id, name);
		} else if (body.includes("!weather")) {
			sendWeather();
		} else if (body.includes("!twitch")) {
			var s = body.split(' ');
			if (s[0] == '!twitch' && s.length == 2) {
				getTwitchStatus(s[1]);
			}
		}

	}

	res.send("Success");

})

app.listen(3000, function() {
	console.log('Listening on PORT 3000');
})
