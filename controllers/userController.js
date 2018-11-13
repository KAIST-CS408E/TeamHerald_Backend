module.exports = function(app, con){
	app.get('/user_info', function(req, res){
		con.query(`SELECT * FROM users WHERE android_id=${con.escape(req.query.id)}`, function(err, result){
			if(err){
				console.log(err)
				res.send()
				return
			}

			if(result.length > 0)
				res.send(result[0])
			else
				res.send(false)
		})
	})

	app.post('/add_user', function(req, res){
		var android_id = con.escape(req.body.android_id)
		var user_id = con.escape(req.body.user_id)
		var color_1 = con.escape(req.body.color_1)
		var color_2 = con.escape(req.body.color_2)
		var sql = `INSERT INTO users (android_id, user_id, color_1, color_2, achievements_list) 
							  VALUES (${android_id}, ${user_id}, ${color_1}, ${color_2}, JSON_ARRAY())`
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