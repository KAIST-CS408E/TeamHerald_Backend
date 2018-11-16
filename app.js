// GLOBALS
var colors = ['navy', 'blue', 'aqua', 'teal', 'olive', 'green', 'lime', 'yellow', 'orange', 'red', 'maroon', 'fucsia', 'purple', 'black', 'gray', 'silver']

// necessary packages
var express = require('express');
var mysql = require('mysql');
var bodyParser = require("body-parser");

var userController = require('./controllers/userController.js')
var bikeController = require('./controllers/bikeController.js')
var friendController = require('./controllers/friendController.js')
var battleController = require('./controllers/battleController.js')

var options = require('./options.js')

var app = express();

// mysql connection configs
var con = mysql.createPool(options);

// test mysql connection
con.getConnection(function(err, connection){
	if (err) throw err;
	connection.release();
})

// middleware for json posts
app.use(bodyParser.json());

// set up all controllers
userController(app, con)
bikeController(app, con)
friendController(app, con)
battleController(app, con)

app.get('/', function(req, res){
	res.send("heroku working")
})

// start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});

con.query('SELECT * FROM friends', function(err, result){
	console.log(result)
})