var express = require('express')
var app = express()

var bodyParser = require('body-parser')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));


app.get('/', function(req,res) {
	res.send("Hello, World!");
})

app.post('/', function(req,res) {
	console.log(req.body);
	res.send("Success lawl");
})

app.listen(3000, function() {
	console.log('Listening on PORT 3000');
})
