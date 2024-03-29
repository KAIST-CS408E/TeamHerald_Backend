module.exports = function(app, con){

	// get_battle_info: given user_id, if user in battle return battle information, else return false
	app.get('/get_battle_info', function(req, res){
		var user_id = con.escape(req.query.user_id)
		var sql = `SELECT * FROM friends WHERE (friend1_id=${user_id} OR friend2_id=${user_id}) AND in_battle=true`
		con.query(sql, function(err, result){
			if(err){
				console.log(err)
				res.send({})
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

				// get opponent's information
				var sql = `SELECT color_1, color_2, color_3, level FROM users WHERE user_id=${con.escape(opponent_id)}`
				con.query(sql, function(err, result){
					if(err){
						console.log(err)
						res.send({})
						return
					}

					battle_obj.opp_color_1 = result[0].color_1
					battle_obj.opp_color_2 = result[0].color_2
					battle_obj.opp_color_3 = result[0].color_3
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
		var sql  = `SELECT * FROM friends WHERE ((friend1_id=${user_id} OR friend2_id=${user_id}) OR (friend1_id=${opp_id} OR friend2_id=${opp_id})) AND in_battle=true`

		con.query(sql, function(err, result){
			if(err){
				console.log(err)
				res.send({success: false})
				return
			}

			// check that user is not already in battle
			if(result.length > 0)
				res.send({success: false})
			else{
				var sql = `UPDATE friends SET in_battle=true WHERE (friend1_id=${user_id} OR friend1_id=${opp_id}) AND (friend2_id=${user_id} OR friend2_id=${opp_id})`
				con.query(sql, function(err, result){
					if(err){
						console.log(err)
						res.send({success: false})
						return
					}

					res.send({success: true})
				})
			}
		})
	})

	// fire_laser: user all of users energy_points to damage the opponent, update accordingly if user kills the opponent
	app.post('/fire_laser', function(req, res){
		var user_id = con.escape(req.body.user_id)
		var opp_id = con.escape(req.body.opp_id)

		var sql = `SELECT energy, power, lasers_fired FROM users WHERE user_id=${user_id}`
		con.query(sql, function(err, result){
			if(err || result.length == 0){
				console.log(err)
				res.send({})
				return
			}

			var power_points = result[0].power
			var energy_points = result[0].energy
			var lasers_fired = result[0].lasers_fired

			var sql = `SELECT * FROM friends WHERE (friend1_id=${user_id} OR friend2_id=${user_id}) AND in_battle=true`
			con.query(sql, function(err, result){
				if(err){
					console.log(err)
					res.send({})
					return
				}

				if(result.length != 1)
					res.send({})
				else{
					var is_friend1 = req.body.user_id == result[0].friend1_id
					var opp_hp = is_friend1 ? result[0].health2_point : result[0].health1_point
					var user_hp = is_friend1 ? result[0].health1_point : result[0].health2_point
					var new_opp_hp = opp_hp;
					new_opp_hp -= power_points
					energy_points -= 10

					// check if user killed opponent, and update wins and losses
					if(new_opp_hp <= 0){
						var sql = 
						con.query(`UPDATE users SET losses=losses+1 WHERE user_id=${opp_id}`, function(err, result){
							if(err) console.log(err)
						})

						// update user's wins and user's level: user_level=n, increase if sum of 1 to n = number of wins 
						con.query(`SELECT level, wins, losses, achievements_list FROM users WHERE user_id=${user_id}`, function(err, result){
							if(err){
								console.log(err)
								return
							}

							var achievementsList = JSON.parse(result[0].achievements_list)

							var curr_level = result[0].level
							var sum_to_level = (curr_level + 1) * curr_level / 2
							var wins = result[0].wins + 1 // increase wins
							var new_level = wins == ((curr_level + 1) * curr_level / 2) ? curr_level + 1 : curr_level
							var losses = result[0].losses

							var sql = `INSERT INTO battles (winner_id, loser_id, winner_remaining_hp) VALUES (${user_id}, ${opp_id}, ${user_hp})`
							con.query(sql, function(err, result){
								if(err) console.log(err)

								checkAndUpdateAchievements(user_id, opp_id, user_hp, wins, losses, new_level, lasers_fired, achievementsList, con)
							})
						})
					}

					// use up all of users energy
					var sql = `UPDATE users SET energy=${energy_points}, lasers_fired=lasers_fired+1 WHERE user_id=${user_id}`
					con.query(sql, function(err, result){
						if(err){
							console.log(err)
							res.send({})
							return
						}
						
						// update the opponent's health points in the battle, or finish battle
						var sql = new_opp_hp <= 0 ? 
									`UPDATE friends SET in_battle=false, health1_point=100, health2_point=100 
												WHERE (friend1_id=${user_id} OR friend2_id=${user_id}) AND in_battle=true` :
									`UPDATE friends SET health${is_friend1 ? `2` : `1`}_point=${new_opp_hp}
													WHERE (friend1_id=${user_id} OR friend2_id=${user_id}) AND in_battle=true`
						con.query(sql, function(err, result){
							if(err){
								console.log(err)
								res.send({})
								return
							}

							res.send({won_battle: new_opp_hp <= 0, remaining_hp: new_opp_hp, remaining_energy: energy_points})

							var update_info_str = con.escape(JSON.stringify({lost_battle: true, opp_id: req.body.user_id}))
							// create update_info fot loser
							if(new_opp_hp <= 0){
								var sql = `UPDATE users SET update_info=${update_info_str} WHERE user_id=${opp_id}`
								con.query(sql, function(err, result){
									if(err) console.log(err)
								})
							}
						})
					})
				}
			})
		})
	})
}

function checkAndUpdateAchievements(userId, oppId, health, wins, losses, level, lasersFired, achievements, con){
	if(wins >= 1)
		achievements = pushIfNotInclude(1, achievements) // [1, "Victory!", "Get your first win"],
	if(wins >= 3)
		achievements = pushIfNotInclude(9, achievements) // [(9), "Climbing the Ladder", "Get 10 wins"],
	if(wins >= 5)
		achievements = pushIfNotInclude(11, achievements) // [11, "Top of the World", "Get 25 wins"],
	if(wins >= 10)
		achievements = pushIfNotInclude(10, achievements) // [10, "Space Pirate", "Get 50 wins"],
	if(wins >= 50)
		achievements = pushIfNotInclude(7, achievements) // [7, "Destroyer", "Get 100 wins"],

	if(health <= 10)
		achievements = pushIfNotInclude(2, achievements) // [2, "Clutch", "Barely beat your opponent"],
	else if(health > 50)
		achievements = pushIfNotInclude(18, achievements) // [18, "Easy Peasy", "Kill an opponent with more than half your health remaining"],

	if(level == 5)
		achievements = pushIfNotInclude(12, achievements) // [12, "Leveling Up", "Get to Level 15"],

	if(wins + losses >= 10 && wins/(wins + losses) > 0.6)
		achievements = pushIfNotInclude(19, achievements) // [19, "Masterful", "Have a win/loss ratio above 60% with more than 50 battles"],

	if(lasersFired + 1 >= 50) 
		achievements = pushIfNotInclude(17, achievements) // [17, "Space Shooter", "Fire 500 times"],


	var sql = `SELECT * FROM battles WHERE winner_id=${userId} OR loser_id=${userId}`
	con.query(sql, function(err, result){
		if(err){
			console.log(err)
			return
		}

		var revenge = false
		var numTimesKilled = 0
		var opponents = []
		var killsInRow = 0
		for(var i = 0; i < result.length; i++){
			var loser = result[i].loser_id
			var winner = result[i].winner_id

			if(loser !== userId.replace(/'/g, "") && !opponents.includes(loser))
				opponents.push(loser)

			if(loser === oppId.replace(/'/g, ""))
				numTimesKilled += 1

			if(winner === oppId.replace(/'/g, ""))
				revenge = true

			if(winner === userId.replace(/'/g, ""))
				killsInRow += 1
			else
				killsInRow = 0
		}

		if(numTimesKilled >= 3) 
			achievements = pushIfNotInclude(3, achievements) // [3, "Domination", "Kill the same opponent 3 times"],

		if(revenge)
			achievements = pushIfNotInclude(4, achievements) // [4, "Revenge", "Kill an opponent that previously killed you"],

		if(opponents.length >= 5)
			achievements = pushIfNotInclude(8, achievements) // [8, "Hunter", "Kill 5 different opponents"],

		if(killsInRow >= 10)
			achievements = pushIfNotInclude(20, achievements) // [20, "Augmented Intelligence", "Get 10 kills in a row"]


		var achievementsStr = con.escape(JSON.stringify(achievements))
		var sql = `UPDATE users SET level=${level}, wins=wins+1, achievements_list=${achievementsStr} WHERE user_id=${userId}`
		con.query(sql, function(err, result){
			if(err) console.log(err)
		})
	})
}

function pushIfNotInclude(item, list){
	if(!list.includes(item))
		list.push(item)

	return list
}