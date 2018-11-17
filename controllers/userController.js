module.exports = function(app, con){

	// user_info: get all basic information of user given 'id' android_id
	app.get('/user_info', function(req, res){
		con.query(`SELECT * FROM users WHERE android_id=${con.escape(req.query.id)}`, function(err, result){
			if(err){
				console.log(err)
				res.send()
				return
			}

			if(result.length == 0){
				res.send(false)
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

			res.send(result[0])
		})
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
				res.send(false)
				return
			}

			res.send(true)
		})
	})
	
}