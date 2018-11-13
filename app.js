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

var colors = ['navy', 'blue', 'aqua', 'teal', 'olive', 'green', 'lime', 'yellow', 'orange', 'red', 'maroon', 'fucsia', 'purple', 'black', 'gray', 'silver']
// mysql connection configs
var con = mysql.createPool(options);

// test mysql connection
con.getConnection(function(err, connection){
	if (err) throw err;
	console.log("connected!");
	connection.release();
})

// middleware for json posts
app.use(bodyParser.json());

userController(app, con)
bikeController(app, con)
friendController(app, con)
battleController(app, con)

// start the server
app.listen(8000, function(){
	console.log('server up')
})


con.query('SHOW COLUMNS IN friends', function(err, result){
	console.log(result)
})



/*
var sql = `CREATE TABLE friends (friend1_id VARCHAR(20), friend2_id VARCHAR(20), in_battle BOOLEAN DEFAULT false, 
								health1_point INT DEFAULT 100, health2_point INT DEFAULT 100)`
con.query(sql, function(err, result){
	if(err) console.log(err)
})

var sql = `CREATE TABLE sessions (id INT AUTO_INCREMENT PRIMARY KEY, user_id VARCHAR(20), datetime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
								duration INT NOT NULL, distance INT NOT NULL, penalty JSON)`
// duration in seconds, distance in meters
con.query(sql, function(err, result){
	if(err) console.log(err)
})

var sql = `CREATE TABLE achievements (id INT AUTO_INCREMENT PRIMARY KEY, description VARCHAR(100), how_to_get VARCHAR(50), filename VARCHAR(50))`
// how to get is a coded string: dis5 (means 5 km distance), dur10 (means 10 minutes), day7 (means 7 consecutive days)
// so something like 'dis10/dur10' (means covering 10 km in 10 minutes) 
con.query(sql, function(err, result){
	if(err) console.log(err)
})
*/
