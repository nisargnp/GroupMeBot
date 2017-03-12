var express = require('express')
var app = express()
var request = require('request');

var bodyParser = require('body-parser')

var mongo = require('mongodb');
var monk = require('monk');

var cron = require("cron");

var bot_id = require("./bot_id")["bot_id"]

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

	collection.find({}).then((rows) => {

		rows = rows.sort(function(a,b) {
			return b.count - a.count;
		});

		var totalDudes = rows.reduce(function(acc, obj) {
			return acc + obj.count;
		}, 0);

		sendToChat("Total Dudes for Today: " + totalDudes);

		sendToChat("Leaderboards:\n" + 
					"1st: " + rows[0].name + "\n" +
					"2nd: " + rows[1].name + "\n" +
					"3rd: " + rows[2].name)


	});

// display number of dudes at midnight
new cron.CronJob('0 0 23 * * *', function() {


	console.log('You will see this message every second');

}, null, true, 'America/New_York');


// say highnoon at noon
new cron.CronJob('0 0 12 * * *', function() {
  console.log('IT\'s HIGH NOON!');
}, null, true, 'America/New_York');



// ---

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
		}

	}

	res.send("Success");

})

app.listen(3000, function() {
	console.log('Listening on PORT 3000');
})
