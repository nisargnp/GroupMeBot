var express = require('express')
var app = express()
var request = require('request');

var mongo = require('mongodb');
var monk = require('monk');

var bodyParser = require('body-parser')

var bot_id = require("./bot_id")["bot_id"]

console.log(bot_id);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

db = {};

function sendToChat(text) {
	request.post('https://api.groupme.com/v3/bots/post', {form:{'bot_id': bot_id, 'text': text}})
}


app.get('/', function(req,res) {
	res.send("Hello, World!");
})

app.post('/', function(req,res) {
;	console.log(req.body);
	// 380883 is the sender id of the bot
	if (req.body.sender_id != 380883) {
		if (req.body.text.toLowerCase().includes("dude")) {
			var name = req.body.name
			db[name] ? db[name]++ : db[name] = 1;
			sendToChat("echo: " + req.body.name + "\'s DUDE COUNT:" + db[name]);
		}
	}
	res.send("Success");
})

app.listen(3000, function() {
	console.log('Listening on PORT 3000');
})
