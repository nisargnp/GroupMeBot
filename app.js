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


// ---

function sendToChat(text) {
	request.post('https://api.groupme.com/v3/bots/post', {form:{'bot_id': bot_id, 'text': text}})
}

function updateDudes(id) {
	collection.find({"id": id}, "count").then((rows) => {
		if (rows.length == 0) {
			collection.insert({"id": id, "count": 1});
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
			updateDudes(id);
		}

	}

	res.send("Success");

})

app.listen(3000, function() {
	console.log('Listening on PORT 3000');
})
