module.exports = function(app, con){

	// user_info: get all basic information of user given 'id' android_id
	app.get('/user_info', function(req, res){
		con.query(`SELECT * FROM users WHERE android_id=${con.escape(req.query.id)}`, function(err, result){
			if(err || result.length == 0){
				console.log(err)
				res.send({})
				return
			}

			// if update_info exists, return and remove from database
			result[0].update_info = JSON.parse(result[0].update_info)
			if(result[0].update_info){
				var sql = `UPDATE users SET update_info=NULL WHERE user_id=${con.escape(result[0].user_id)}`
				con.query(sql, function(err, result){
					if(err) console.log(err)
				})
			}

			var data = {userData: result[0], friends: [], sessions: []}

			var userId = con.escape(data.userData.user_id)
			// Get list of friends
			var sql = `SELECT friend1_id, friend2_id FROM friends WHERE friend1_id=${userId} OR friend2_id=${userId}`
			con.query(sql, function(err, result){
				if(err){
					console.log(err)
					res.send(data)
					return
				}
				var friend_str = result.map(entry => entry.friend1_id === data.userData.user_id ? con.escape(entry.friend2_id) : con.escape(entry.friend1_id)).join(', ')
				con.query(`SELECT user_id, color_1, color_2, color_3, level FROM users WHERE user_id IN (${friend_str})`, function(err, result){
					if(err && friend_str !== ""){
						console.log(err)
						res.send(data)
						return
					}

					data.friends = result
					if(friend_str === "")
						data.friends = []
					var sql = `SELECT DATE_ADD(datetime, INTERVAL 9 HOUR) AS datetime, duration, distance, penalty FROM sessions WHERE user_id=${userId}`
					con.query(sql, function(err, result){
						if(err){
							console.log(err)
							res.send(data)
							return
						}

						result

						data.sessions = result
						res.send(data)
					})

				})
			})
		})
	})

	// get_user: get all user info using user_id
	app.get('/get_user', function(req, res){
		// Get user data
		con.query(`SELECT * FROM users WHERE user_id=${con.escape(req.query.id)}`, function(err, result){
			if(err || result.length == 0){
				console.log(err)
				res.send({})
				return
			}

			res.send(result[0])
		})
	})

	// verify_user_id: check that user id does not contain symbols and is not already used
	app.get('/verify_user_id', function(req, res){
		var user_id = req.query.user_id
		var format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

		if(format.test(user_id)){
			res.send({is_valid: false})	
		}else{
			con.query(`SELECT * FROM users WHERE user_id=${con.escape(user_id)}`, function(err, result){
				if(err || result.length > 0)
					res.send({is_valid: false})
				else
					res.send({is_valid: true})
			})
		}

	})

	// add_user: given android_id, user_id, color_1, color_2 add user information to database
	app.post('/add_user', function(req, res){
		var android_id = con.escape(req.body.android_id)
		var user_id = con.escape(req.body.user_id)
		var color_1 = con.escape(req.body.color_1)
		var color_2 = con.escape(req.body.color_2)
		var color_3 = con.escape(req.body.color_3)
		var sql = `INSERT INTO users (android_id, user_id, color_1, color_2, color_3, update_info) 
							  VALUES (${android_id}, ${user_id}, ${color_1}, ${color_2}, ${color_3}, NULL)`
		con.query(sql, function(err, result){
			if(err){
				console.log(err)
				res.send({success: false})
				return
			}

			res.send({success: true})
		})
	})
	
}