// GroupMeBot


// import needed keys
var auth_info = require("./protected_data/auth");
var mr_robot_chat = auth_info.mr_robot_chat;
var naruto_chat = auth_info.naruto_chat;

// import operations
var operations = require("./operations");

// express import
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

// set up express
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));


// --- --- ---


// start cronjobs
// operations.cronDudes.start();
// operations.cronNoon.start();


// --- --- ---


function processMessage(req) {

	var text = req.body.text.toLowerCase();
	var sender_id = req.body.sender_id;
	var name = req.body.name;
	var group_id = req.body.group_id;

	if (group_id == mr_robot_chat) {

		if (text.includes("dude")) {
			operations.updateDudes(sender_id, name);
		}

	} else {

		if (group_id == naruto_chat) {
			if (!text.includes("!dude") && text.includes("dude")) {
				operations.updateDudes(sender_id, name);
			}
		}

		if (text.includes("!dude")) {

			operations.sendDudes(group_id, sender_id, name);

		} else if (text.includes("!weather")) {

			operations.sendWeather(group_id);

		} else if (text.includes("!twitch")) {

			var s = text.split(' ');
			if (s[0] == '!twitch' && s.length == 2) {
				operations.getTwitchStatus(group_id, s[1]);
			}

		} else if (/^!youtube (.*)/i.test(text)) {

			var s = RegExp.$1;
			operations.searchYouTube(group_id, s);

		} else if (text.includes("!moon")) {

			operations.sendMoon(group_id);

		} else if (text.includes("!prof")) {
			
			var s = text.split(" ");
			if (s.length > 1 && s[0] == "!prof") {
				var firstName = null;
				var lastName = null;

				if (s.length > 2) {
					firstName = s[1];
					s.splice(0, 2);
					lastName = s.join(" ");
				} 
				else {
					lastName = s[1];	
				}

				operations.getProf(group_id, firstName, lastName);
			}

		} else if (text.includes("!semester")) {
			
			var s = text.split(" ");
			if (s[0] == "!semester") { 
				operations.setSemester(group_id, text.toLowerCase().substring(10));
			}

		} else if (text.includes("!advice")) {

			operations.sendMeme(group_id, "adviceanimals");

		} else if (text.includes("!wholesomememe")) {

			operations.sendMeme(group_id, "wholesomememes");

		}

		// let's keep this disabled forever
		// else if (text.includes("!meme")) {
		// 	operations.sendMeme(group_id, "meme");
		// }

	}

}


// --- --- ---


// handle post request from groupme
app.post('/', function(req,res) {

	// get sender's type
	var sender_type = req.body.sender_type;

	// don't reply to messages from bots
	if (sender_type === "user") {
		processMessage(req);
	}

	res.end("Success.");

});

// cleanup on CTRL-C
process.on('SIGINT', function() {
	sqliteDB.close();
	process.exit();
});

// start the server
app.listen(3000, function() {
	console.log('Listening on PORT 3000');
})

