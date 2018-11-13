module.exports = function(app, con){
	// [todo] get user battle info
	app.get('/get_battle_info', function(req, res){
		var user_id = con.escape(req.query.user_id)
		var sql = `SELECT * FROM friends WHERE (friend1_id=${user_id} OR friend2_id=${user_id}) AND in_battle=true`
		con.query(sql, function(err, result){
			if(err){
				console.log(err)
				res.send(false)
				return
			}

			if(result.length == 0)
				res.send({in_battle: false})
			else{
				var temp = result[0]
				var is_friend1 = req.query.user_id == temp.friend1_id
				var opponent_id = is_friend1 ? temp.friend2_id : temp.friend1_id
				var battle_obj = {
									in_battle: true, 
									user_hp: is_friend1 ? temp.health1_point : temp.health2_point,
									opp_id: opponent_id, 
									opp_hp: is_friend1 ? temp.health2_point : temp.health1_point
								 }

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

	// [todo] enter battle

	// [todo] fire at battling person + handle battle logic (update friends table, determine if winner, change user wins/loss)

}