module.exports = function(app, con){
	// add friend
	app.post('/add_friend', function(req, res){
		var sql = `INSERT INTO friends (friend1_id, friend2_id) VALUES (${con.escape(req.body.user_id)}, ${con.escape(req.body.friend_id)})`
		con.query(sql, function(err, result){
			if(err){
				console.log(err)
				res.send(false)
				return
			}

			con.query('SELECT * FROM friends', function(err, result){res.send(result)})
		})
	})

	// get all friends: user_id, color_1, color_2 and level to display in frieds list
	app.get('/get_friends', function(req, res){
		var sql = `SELECT friend1_id, friend2_id FROM friends WHERE friend1_id=${con.escape(req.query.user_id)} OR friend2_id=${con.escape(req.query.user_id)}`
		con.query(sql, function(err, result){
			if(err){
				console.log(err)
				res.send(false)
				return
			}
			var friend_str = result.map(entry => entry.friend1_id === req.query.user_id ? con.escape(entry.friend2_id) : con.escape(entry.friend1_id)).join(', ')
			con.query(`SELECT user_id, color_1, color_2, level FROM users WHERE user_id IN (${friend_str})`, function(err, result){
				if(err){
					console.log(err)
					res.send(false)
					return
				}

				res.send(result)
			})
		})
	})
}