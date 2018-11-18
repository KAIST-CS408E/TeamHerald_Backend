module.exports = function(app, con){

	// add_friend: add user_id, friend_id friendship to database
	app.post('/add_friend', function(req, res){
		var sql = `SELECT * FROM users WHERE user_id=${con.escape(req.body.friend_id)}`
		con.query(sql, function(err, result){
			if (err || result.length == 0){
				console.log(err)
				res.send({is_success: false})
				return;
			}else{
				var sql = `INSERT INTO friends (friend1_id, friend2_id) VALUES (${con.escape(req.body.user_id)}, ${con.escape(req.body.friend_id)})`
				con.query(sql, function(err, result){
					if(err){
						console.log(err)
						res.send({is_success: false})
						return
					}

					res.send({is_success: true})
				})
			}
		})
	})

	// get_friends: get user_id, color_1, color_2 and level for all of user_id friends
	app.get('/get_friends', function(req, res){
		var sql = `SELECT friend1_id, friend2_id FROM friends WHERE friend1_id=${con.escape(req.query.user_id)} OR friend2_id=${con.escape(req.query.user_id)}`
		con.query(sql, function(err, result){
			if(err){
				console.log(err)
				res.send([])
				return
			}
			var friend_str = result.map(entry => entry.friend1_id === req.query.user_id ? con.escape(entry.friend2_id) : con.escape(entry.friend1_id)).join(', ')
			con.query(`SELECT user_id, color_1, color_2, color_3, level FROM users WHERE user_id IN (${friend_str})`, function(err, result){
				if(err){
					console.log(err)
					res.send([])
					return
				}

				res.send(result)
			})
		})
	})

	app.get("/get_all_users", function(req, res){
		con.query(`SELECT user_id, color_1, color_2, color_3, level FROM users`, function(err, result){
			res.send(result)
		})
	})
	
}