module.exports = function(app, con){

	// add_session: add session information to database and update energy levels
	app.post('/add_session', function(req, res){
		var user_id = con.escape(req.body.user_id)
		var distance = req.body.distance
		var duration = req.body.duration
		var penalties_str = con.escape('[' + req.body.penalties.map(entry => con.escape(entry)).join(', ') + ']')

		var sql = `INSERT INTO sessions (user_id, duration, distance, penalty) VALUES (${user_id}, ${distance}, ${duration}, ${penalties_str})`
		con.query(sql, function(err, result){
			if(err){
				console.log(err)
				res.send({success: false})
				return
			}

			// Energy: 20 points per 5 mins of biking - 10 points per penalty
			var new_energy = Math.floor(20 * duration/300) - 10 * req.body.penalties.length
			if(new_energy < 0) new_energy = 0
			var sql = `UPDATE users SET energy=energy + ${new_energy} WHERE user_id=${user_id}`
			con.query(sql, function(err, result){
				if(err){
					console.log(err)
					res.send({success: false})
					return
				}

				res.send({success: true})
			})
		})
	})

	app.get("/get_sessions", function(req, res){
		var sql = `SELECT datetime, duration, distance, penalty FROM sessions WHERE user_id=${con.escape(req.query.user_id)}`
		con.query(sql, function(err, result){
			if(err){
				console.log(err)
				res.send([])
				return
			}

			res.send(result)
		})
	})
	
}