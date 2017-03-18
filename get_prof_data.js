/*
Queries professor data from umd.io and stores in sqlite DB to be used by the bot later.
Default parameters are: spring 2017 semester with 30 pages of data.
Can passing in 0 or 2 parameters. First param is desired semester and year with a '-'
separting the semester and year. Second param is the max number of pages of data.

Usage - 
(Default): node get_prof_data.js
(Custom Ex.): node get_prof_data.js fall-2017 29
*/

var request = require('request');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('test.db');

// Default request variables
var url = 'http://api.umd.io/v0/professors?semester=201701&per_page=100&page='
var tableName = 'professors_spring2017';
var numPages = 30;
var data = {};

// Insert the data into sqlite db
var storeData = function() {
	db.serialize(function () {
		for (var d in data) {
			for (var prof of data[d]) {
				var s = prof['name'].split(" ");
				var fullName = s.splice(0, 1);
				fullName.push(s.join(" "));

				db.run("INSERT INTO " + tableName + " (first_name, last_name, courses) VALUES (?, ?, ?)", 
					[fullName[0], fullName[1], prof['courses'].toString()]);
			}
		}
	});
}

// Request the data for a page and store in 'data' object variable.
var getData = function(page) {
	if (page <= numPages) {
		request.get(url + page.toString(), function(err, res, body) {
			// Will return <h1> tag instead of JSON when page number goes past max...
			if (body[0] == '<') {
				storeData();
			} else if (!err) {
				var jb = JSON.parse(body);
				data[page] = jb;
				getData(page + 1);
			}
		});
	} else {
		// after finish
		storeData();
	}
}

// Delete if exists / Create table for insertion
var setup = function() {
	db.run("DROP TABLE IF EXISTS " + tableName + ";", function() {
		db.run("CREATE TABLE " + tableName + " (id INTEGER PRIMARY KEY AUTOINCREMENT, first_name TEXT, last_name TEXT, courses TEXT);", function() {
			getData(1);
		});
	});
}

// initialize variables like table name, semeseter, etc from cmd args, call setup from here.
var initialize = function() {
	// default to spring 2017 30 pages
	if (process.argv.length > 2) {
		if (process.argv.length != 4) {
			console.error("Error: Expected a 2 additional arguments: semester, and max pagination number" + 
				"\nEx. node test.js spring-2017 20");
		} else {
			var s = process.argv[2].split("-");
			if (isNaN(process.argv[3])) {
				console.error("Error: Page number must be an integer.");
			}
			else if (s.length != 2) {
				console.error("Error: Invalid semester format. Expected something like spring-2017");
			}
			else if (s[0] != 'spring' && s[0] != 'fall') {
				console.error("Error: Bad semester name, currently only spring or fall is allowed");
			}
			else if (s[1] != 2016 && s[1] != 2017) {
				console.error("Error: Currently only 2016 and 2017 years are allowed.");
			}
			else {
				// set variables
				tableName = 'professors_' + s[0] + s[1];
				numPages = Number(process.argv[3]);

				var semester = s[1] + (s[0] == 'spring' ? '01' : '08')
				url = 'http://api.umd.io/v0/professors?semester=' + semester + '&per_page=100&page=';
				
				setup();
			}
		}
	} else {
		setup();
	}
}

// start
initialize();

process.on('exit', function() {
	console.log('closing DB and cleaning up');
	db.close();
});
