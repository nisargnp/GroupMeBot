// GroupMeBot

// import needed keys
var bot_ids = require("./protected_info").bot_ids;
var client_id = require("./protected_info").client_id;
var bots_list = require("./protected_info").bots_list;
var mr_robot_chat = require("./protected_info").mr_robot_chat;
var naruto_chat = require("./protected_info").naruto_chat;
var yt_key = require("./protected_info").yt_key;

// express import
var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');

// mongodb import
var mongo = require('mongodb');
var monk = require('monk');

// cron import
var cron = require("cron");

// weather import
var weather = require('weather-js')

// youtube import
var YouTube = require('youtube-node');
var youtube = new YouTube();
youtube.setKey(yt_key);

// moon import
var moonmoji = require('moonmoji');

// set up express
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

// set up mongo
const url = "localhost:27017/narutodb"
const db = monk(url)
db.then(() => {
	console.log("Connected to mongodb server.")
});

const collection = db.get("dude");

// --- --- ---

// display dude leaderboards at midnight
new cron.CronJob('0 0 0 * * *', function() {

	var group_id = naruto_chat;

	collection.find({}).then((rows) => {

		rows = rows.sort(function(a,b) {
			return b.count - a.count;
		});

		var totalDudes = rows.reduce(function(acc, obj) {
			return acc + obj.count;
		}, 0);

		sendToChat(group_id, "Total Dudes: " + totalDudes);

		sendToChat(group_id, "Leaderboards:\n" + 
					"1st: " + rows[0].name + " ~ " + rows[0].count + "\n" +
					"2nd: " + rows[1].name + " ~ " + rows[1].count + "\n" +
					"3rd: " + rows[2].name + " ~ " + rows[2].count);


	});

}, null, true, 'America/New_York');

// say highnoon at noon
new cron.CronJob('0 0 12 * * *', function() {
	var group_id = naruto_chat;
	sendToChat(group_id, 'IT\'S HIGH NOON!');
}, null, true, 'America/New_York');

// --- --- ---

// send text to groupme chat
function sendToChat(group_id, text) {
	var bot_id = bot_ids[group_id];
	request.post('https://api.groupme.com/v3/bots/post', {form:{'bot_id': bot_id, 'text': text}})
}

// report the current weather along with weather forcast for that day to chat
function sendWeather(group_id) {

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

			output += "- Current Temp: " + temp + "°F" + "\n";
			output += "- Current Feelslike: " + feelslike + "°F" + "\n";
			output += "- Current Windspeed: " + windspeed + "\n";
			output += "- Current Forcast: " + sky + "\n";
			
			output += "\n";

			output += "- Today's Low Temp: " + low_temp + "°F" + "\n";
			output += "- Today's High Temp: " + high_temp + "°F" + "\n";
			output += "- Today's Forcast: " + day_sky;

			sendToChat(group_id, output);

		}

	});

}

// determine if twitch.tv streamer is online
function getTwitchStatus(group_id, name) {
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
				var msg = name + " is currently offline."
				if (body.stream) {
					msg = body.stream.channel.display_name + " is currently LIVE.\nPlaying " + body.stream.game + " for " + body.stream.viewers + " viewers.\n"+ body.stream.channel.url
				}
				sendToChat(group_id, msg);
			});
		}
	);
}

// search for a youtube video, send first one to chat
function searchYouTube(group_id, text) {
	youtube.search(text, 1, function(error, result) {
		if (error) {
		  console.log(error);
		} else {
		  var vidId = result.items[0].id.videoId
		  sendToChat (group_id, "https://www.youtube.com/watch?v=" + vidId)
		}
	});
}

// send the current moon phase to chat
function sendMoon(group_id) {
	var msg = "Tonight's moon is " + moonmoji().name + ". " + moonmoji().emoji;
	sendToChat(group_id, msg);
}

// update the count of dudes
function updateDudes(sender_id, name) {
	collection.find({"id": sender_id}, "count").then((rows) => {
		if (rows.length == 0) {
			collection.insert({"id": sender_id, "name": name, "count": 1});
		} else {
			collection.update({"id": sender_id}, {$set: {"count": rows[0].count + 1}});
		}
	});
}

// send the count of dudes for the particular user
function sendDudes(group_id, sender_id, name) {
	collection.find({"id": sender_id}, "").then((rows) => {
		var count = rows[0].count;
		sendToChat(group_id, "Dude count for " + name + ": " + count);
	});
}

// handle post request from groupme
app.post('/', function(req,res) {

	// get the sender's id
	var sender_id = parseInt(req.body.sender_id);

	// don't reply to messages from bots
	if (bots_list.indexOf(sender_id) === -1) {

		var text = req.body.text.toLowerCase();
		var sender_id = req.body.sender_id;
		var name = req.body.name;

		var group_id = req.body.group_id;

		if (group_id == mr_robot_chat) {

			if (text.includes("dude")) {
				updateDudes(sender_id, name);
			}

		} else {

			if (text.includes("!dude")) {

				sendDudes(group_id, sender_id, name);

			} else if (text.includes("!weather")) {

				sendWeather(group_id);

			} else if (text.includes("!twitch")) {

				var s = text.split(' ');
				if (s[0] == '!twitch' && s.length == 2) {
					getTwitchStatus(group_id, s[1]);
				}

			} else if (/^!youtube (.*)/i.test(text)) {

				var s = RegExp.$1;
				searchYouTube(group_id, s);

			} else if (text.includes("!moon")) {

				sendMoon(group_id);

			}
		
		}
		
	}

	res.send("Success.");

})

// start the server
app.listen(3000, function() {
	console.log('Listening on PORT 3000');
})
