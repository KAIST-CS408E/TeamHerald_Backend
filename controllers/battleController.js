module.exports = function(app, con){

	// get_battle_info: given user_id, if user in battle return battle information, else return false
	app.get('/get_battle_info', function(req, res){
		var user_id = con.escape(req.query.user_id)
		var sql = `SELECT * FROM friends WHERE (friend1_id=${user_id} OR friend2_id=${user_id}) AND in_battle=true`
		con.query(sql, function(err, result){
			if(err){
				console.log(err)
				res.send(false)
				return
			}

			// check that user is in battle
			if(result.length == 0)
				res.send({in_battle: false})
			else{
				var temp = result[0]
				var is_friend1 = req.query.user_id == temp.friend1_id
				var opponent_id = is_friend1 ? temp.friend2_id : temp.friend1_id
				var user_hp = is_friend1 ? temp.health1_point : temp.health2_point
				var battle_obj = {
									in_battle: true, 
									user_hp: user_hp,
									opp_id: opponent_id, 
									opp_hp: is_friend1 ? temp.health2_point : temp.health1_point
								 }

				// if user lost battle, reset database information and return fact that battle lost
				if(user_hp <= 0){
					battle_obj.lost_battle = true
					var sql = `UPDATE friends SET in_battle=false, health1_point=100, health2_point=100 
											WHERE (friend1_id=${user_id} OR friend2_id=${user_id}) AND in_battle=true`
					con.query(sql, function(err, result){
						if(err) console.log(err)
					})
				}

				// get opponent's information
				var sql = `SELECT color_1, color_2, level FROM users WHERE user_id=${con.escape(opponent_id)}`
				con.query(sql, function(err, result){
					if(err){
						console.log(err)
						res.send(false)
						return
					}

					battle_obj.opp_color_1 = result[0].color_1
					battle_obj.opp_color_2 = result[0].color_2
					battle_obj.opp_level = result[0].level

					res.send(battle_obj)
				})
			}
		})
	})

	// enter battle
	app.post('/start_battle', function(req, res){
		var user_id = con.escape(req.body.user_id)
		var opp_id = con.escape(req.body.opp_id)
		var sql  = `SELECT * FROM friends WHERE (friend1_id=${user_id} OR friend2_id=${user_id}) AND in_battle=true`

		con.query(sql, function(err, result){
			if(err){
				console.log(err)
				res.send(false)
				return
			}

			// check that user is not already in battle
			if(result.length > 0)
				res.send(false)
			else{
				var sql = `UPDATE friends SET in_battle=true WHERE (friend1_id=${user_id} OR friend1_id=${opp_id}) AND (friend2_id=${user_id} OR friend2_id=${opp_id})`
				con.query(sql, function(err, result){
					if(err){
						console.log(err)
						res.send(false)
						return
					}

					res.send(true)
				})
			}
		})
	})

	// fire_laser: user all of users energy_points to damage the opponent, update accordingly if user kills the opponent
	app.post('/fire_laser', function(req, res){
		var user_id = con.escape(req.body.user_id)
		var opp_id = con.escape(req.body.opp_id)
		var energy_points = con.escape(req.body.energy_points)

		var sql = `SELECT * FROM friends WHERE (friend1_id=${user_id} OR friend2_id=${user_id}) AND in_battle=true`
		con.query(sql, function(err, result){
			if(err){
				console.log(err)
				res.send(false)
				return
			}

			if(result.length != 1)
				res.send(false)
			else{
				var is_friend1 = req.query.user_id == result[0].friend1_id
				var opp_hp = is_friend1 ? result[0].health2_point : result[0].health1_point
				var new_opp_hp = opp_hp - energy_points

				// check if user killed opponent, and update wins and losses
				if(new_opp_hp <= 0){
					var sql = `UPDATE users SET losses=losses+1 WHERE user_id=${opp_id}`
					con.query(sql, function(err, result){
						if(err) console.log(err)
					})
					var sql = `UPDATE users SET wins=wins+1 WHERE user_id=${user_id}` 
					con.query(sql, function(err, result){
						if(err) console.log(err)
					})
				}

				// use up all of users energy
				// [todo] update users level if necessary
				var sql = `UPDATE users SET energy=0 WHERE user_id=${user_id}`
				con.query(sql, function(err, result){
					if(err){
						console.log(err)
						res.send(false)
						return
					}
					
					// update the opponent's health points in the battle
					var sql = `UPDATE friends SET health${is_friend1 ? `2` : `1`}_point=${new_opp_hp}
											WHERE (friend1_id=${user_id} OR friend2_id=${user_id}) AND in_battle=true`
					con.query(sql, function(err, result){
						if(err){
							console.log(err)
							res.send(false)
							return
						}

						res.send({won_battle: new_opp_hp <= 0})
					})
				})
			}
		})
	})

}