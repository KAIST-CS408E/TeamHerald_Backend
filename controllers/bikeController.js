module.exports = function(app, con){

	// add_session: add session information to database and update energy levels
	app.post('/add_session', function(req, res){
		var android_id = con.escape(req.body.android_id)
		var sql = `SELECT user_id, achievements_list FROM users WHERE android_id=${android_id}`
		con.query(sql, function(err, result){
			if(err || result.length == 0){
				console.log(err)
				res.send({success: false})
				return
			}

			var user_id = con.escape(result[0].user_id)
			var achievementsList = JSON.parse(result[0].achievements_list)

			var distance = req.body.distance
			var duration = req.body.duration
			var truePenaltyArray = []
			var laneFound = false
			for(var i = 0; i < req.body.penalty.length; i++){
				if(req.body.penalty[i] === "lane")
					laneFound = true
				else
					truePenaltyArray.push(req.body.penalty[i])
			}
			if(!laneFound)
				truePenaltyArray.push("lane")

			var penalties_str = con.escape('[' + truePenaltyArray.map(entry => con.escape(entry)).join(', ') + ']')

			var log_str = con.escape('[]')
			if(req.body.log)
				var log_str = con.escape('[' + req.body.log.map(entry => con.escape(entry)).join(', ') + ']')

			var sql = `INSERT INTO sessions (user_id, duration, distance, penalty, log) VALUES (${user_id}, ${distance}, ${duration}, ${penalties_str}, ${log_str})`
			con.query(sql, function(err, result){
				if(err){
					console.log(err)
					res.send({success: false})
					return
				}
				var changePowerStr = "power"
				if(req.body.duration >= 300 & truePenaltyArray.length == 0)
					changePowerStr = "IF(power+2 > 10, 10, power+2)"
				else if(truePenaltyArray.length > 0)
					changePowerStr = "IF(power-2 < 1, 1, power-2)"

				checkAchievements(user_id, truePenaltyArray.length == 0, achievementsList, con)

				// Energy: 20 points per 5 mins of biking - 10 points per penalty
				var new_energy = Math.floor(20 * duration/300) - 10 * truePenaltyArray.length
				if(new_energy < 0) new_energy = 0
				var sql = `UPDATE users SET energy=IF(energy+${new_energy}>100, 100, energy+${new_energy}), power=${changePowerStr} WHERE user_id=${user_id}`
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
	})

	app.get("/get_sessions", function(req, res){
		var sql = `SELECT DATE_ADD(datetime, INTERVAL 9 HOUR), duration, distance, penalty FROM sessions WHERE user_id=${con.escape(req.query.user_id)}`
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

function checkAchievements(userId, isSafe, achievements, con){
	if(isSafe)
		achievements = pushIfNotInclude(5, achievements) // [5, "Smooth Riding", "Have a perfectly safe biking session"],

	var sql = `SELECT * FROM sessions WHERE user_id=${userId}`
	con.query(sql, function(err, result){
		if(err){
			console.log(err)
			return
		}

		if(result.length >= 10)
			achievements = pushIfNotInclude(13, achievements) // [13, "Hobbyist", "Log 500 biking sessions"],
		var safeSessions = result.filter(obj => obj.penalty === "[]")
		if(safeSessions.length >= 5)
			achievements = pushIfNotInclude(14, achievements) // [14, "Better Safe than Sorry", "Log 250 biking safe sessions"],

		var numSafe = 0
		for(var i = 0; i < result.length; i++){
			var session = result[i]
			var list = JSON.parse(session.penalty.replace(/'/g, '"'))
			if(list.length == 0)
				numSafe += 1
			else
				numSafe = 0
		}

		if(numSafe >= 10)
			achievements = pushIfNotInclude(15, achievements) // [15, "Safe Landing", "Get 50 consecutive safe sessions"],
		else if(numSafe >= 5)
			achievements = pushIfNotInclude(16, achievements) // [16, "Getting There", "Get 10 consecutive safe sessions"],


		var achievementsStr = con.escape(JSON.stringify(achievements))
		var sql = `UPDATE users SET achievements_list=${achievementsStr} WHERE user_id=${userId}`
		con.query(sql, function(err, result){
			if(err){
				console.log(err)
				return
			}
		})
	})
}

function pushIfNotInclude(item, list){
	if(!list.includes(item))
		list.push(item)

	return list
}

/* Not possible yet
    [6, "Perfection", "Kill an opponent with only safe sessions"],
*/