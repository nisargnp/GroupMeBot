
// import needed keys
var auth_info = require("./protected_data/auth");
var bot_ids = auth_info.bot_ids;
var client_id = auth_info.client_id;
var mr_robot_chat = auth_info.mr_robot_chat;
var naruto_chat = auth_info.naruto_chat;
var yt_key = auth_info.yt_key;

// request import
var request = require('request');

// cron import
var CronJob = require("cron").CronJob;

// weather import
var weather = require('weather-js')

// moon import
var moonmoji = require('moonmoji');

// youtube import
var YouTube = require('youtube-node');
var youtube = new YouTube();
youtube.setKey(yt_key);

// mongodb import
var mongo = require('mongodb');
var monk = require('monk');

// sqlite import
var sqlite3 = require('sqlite3').verbose();
var sqliteDB = new sqlite3.Database('./protected_data/prof.db');
var semester = "Spring 2017";
var tableName = "professors_spring2017";

// set up mongo
const url = "localhost:27017/narutodb";
const db = monk(url);
db.then(() => {
	console.log("Connected to mongodb server.")
});
const collection = db.get("dude");


// --- --- ---

// display dude leaderboards at midnight on Saturday and Tuesday
var cronDudes = new CronJob({
	cronTime: '0 0 0 * * 6,2',
	onTick: function() {
		var group_id = naruto_chat;

		collection.find({}).then((rows) => {

			rows = rows.sort(function(a,b) {
				return b.count - a.count;
			});

			var totalDudes = rows.reduce(function(acc, obj) {
				return acc + obj.count;
			}, 0);

			// sendTextToChat(group_id, "Total Dudes: " + totalDudes + "\n" + 
			// 			group_id, "Leaderboards:\n" + 
			// 			"1st: " + rows[0].name + " ~ " + rows[0].count + "\n" +
			// 			"2nd: " + rows[1].name + " ~ " + rows[1].count + "\n" +
			// 			"3rd: " + rows[2].name + " ~ " + rows[2].count);

			console.log("Total Dudes: " + totalDudes + "\n" + 
						group_id, "Leaderboards:\n" + 
						"1st: " + rows[0].name + " ~ " + rows[0].count + "\n" +
						"2nd: " + rows[1].name + " ~ " + rows[1].count + "\n" +
						"3rd: " + rows[2].name + " ~ " + rows[2].count);

		});
	},
	start: false,
	timeZone: 'America/New_York'
});

// say "IT's HIGH NOON" at noon
var cronNoon = new CronJob({
	cronTime: '0 0 12 * * *',
	onTick: function() {
		var group_id = naruto_chat;
		// sendTextToChat(group_id, 'IT\'S HIGH NOON!');
		console.log("noon");
	},
	start: false,
	timeZone: 'America/New_York'
});

// testing cron
var cronTesting = new CronJob({
  cronTime: '* * * * * *',
  onTick: function() {
    console.log("running");
  },
  start: false,
  timeZone: 'America/New_York'
});
// job.start();


// --- --- ---


function sendTextToChat(group_id, text) {
	var bot_id = bot_ids[group_id];
	request.post('https://api.groupme.com/v3/bots/post', 
		{
			form: {
				'bot_id': bot_id,
				'text': text, 
			}
		}
	);
}

function sendImageToChat(group_id, text, imgURL) {
	var bot_id = bot_ids[group_id];
	request.post('https://api.groupme.com/v3/bots/post', 
		{
			form: {
				"bot_id"  : bot_id,
				"text"    : text,
				"picture_url": imgURL
			}
		}
	);
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

			sendTextToChat(group_id, output);

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
				sendTextToChat(group_id, msg);
			});
		}
	);
}

// Get data above what classes a professor is teaching
function getProf(group_id, first, last) {
	if (/^[a-zA-Z\-]*$/.test(first) == false || /^[a-zA-Z\-]*$/.test(last) == false)
		return;

	var stmt = "";
	if (first)
		stmt = "SELECT * FROM " + tableName + " WHERE first_name = \"" + first + "\" COLLATE NOCASE AND last_name = \"" + last + "\" COLLATE NOCASE;"
	else
		stmt = "SELECT * FROM " + tableName + " WHERE last_name = \"" + last + "\" COLLATE NOCASE;"	

	var data = [];
	var msg = "";
	sqliteDB.serialize(function () {
		sqliteDB.each(stmt, 
			function (err, row) {
				// callback after each row is fetched
				if (!err) {
					data.push({first: row.first_name, last: row.last_name, classes: row.courses});
				}
			},
			function (err, count) {
				// callback after entire statement finished
				if (!err) {
					if (count > 0) {
						msg = "Professor " + data[0].first + " " + data[0].last + " is teaching: \n" +
							data[0].classes.replace(/,/g, ", ") + "\n" +
							"for the " + semester + " semester.";
					} 
					else {
						msg = "No info for Professor" + (first ? " " + first : "") + " " + last + " was found."
					}
					sendTextToChat(group_id, msg);
				}
			}
		);
	});
}

// Change semester for the umd related commands
function setSemester(group_id, newSemester) {
	var msg = "";
	console.log(newSemester);
	if (/^(spring|fall) (2016|2017)$/.test(newSemester)) {
		// set globals
		semester = newSemester;
		tableName = "professors_" + newSemester.replace(" ", "");

		msg = "Semester changed to " + newSemester;
	} else {
		msg = "Invalid semester name. Currently accepted Semester names are: \n" +
			"Spring 2016, Fall 2016, Spring 2017, Fall 2017";
	}
	sendTextToChat(group_id, msg);
}

// search for a youtube video, send first one to chat
function searchYouTube(group_id, text) {
	youtube.search(text, 1, function(error, result) {

		if (error) {

			console.log(error);

		} else {

			if (result.items.length === 0) {

				sendTextToChat(group_id, "No results for " + text);

			} else {

				var yt_url;

				var videoId = result.items[0].id.videoId;
				if (videoId != undefined) {
					yt_url = "https://www.youtube.com/watch?v=" + videoId;
				} else {
					yt_url = "https://www.youtube.com/channel/" + result.items[0].id.channelId;
				}

				sendTextToChat(group_id, yt_url);
			
			}

		}

	});
}

// send the current moon phase to chat
function sendMoon(group_id) {
	var msg = "Tonight's moon is " + moonmoji().name + ". " + moonmoji().emoji;
	sendTextToChat(group_id, msg);
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
		sendTextToChat(group_id, "Dude count for " + name + ": " + count);
	});
}

function sendMeme(group_id, meme_type) {
	var reddit_url = 'https://reddit.com/r/' + meme_type + '/random.json';
	request(reddit_url, function(err, res, body) {
	
		if (res.statusCode !== 200) {
			return console.log(err);
		}

		var body = JSON.parse(body);

		if (body[0] != undefined) {
			var title = body[0].data.children[0].data.title;
			var imgURL = body[0].data.children[0].data.url;
			imgURL = imgURL.replace(/&amp;/g, '&'); // remove escaped ampersand
			sendTextToChat(group_id, title);
			sendTextToChat(group_id, imgURL);
			// sendImageToChat(group_id, title, imgURL);
		} else {
			sendTextToChat("Please try again.");
		}

	});
}


module.exports = {
	cronDudes: cronDudes,
	cronNoon: cronNoon,
	sendWeather: sendWeather,
	getTwitchStatus: getTwitchStatus,
	getProf: getProf,
	setSemester: setSemester,
	searchYouTube: searchYouTube,
	sendMoon: sendMoon,
	updateDudes: updateDudes,
	sendDudes: sendDudes,
	sendMeme: sendMeme
}