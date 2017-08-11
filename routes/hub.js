////////////////////////////////////////////////////////////////
// All routes for humb
////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
// Imports 
////////////////////////////////////////////////////////////////

var child = require("child_process")
var binPath = "/usr/bin/python"
var daemonPath = "../apprio-hms-daemon/sp_daemon.py"
var piDaemonPath = "../apprio-hms-daemon/pi_daemon.py"
var db = require('../db.js')
var pi = require('./pi.js')
var colors = require('colors')

module.exports = function(app) {
	var authenticate = app.get("authenticate")
	app.get("/hubs", authenticate, getHubs)
	app.get("/hub", authenticate, getHub)
	app.post("/hubs/create", authenticate, createHub)
	app.delete("/hubs/delete", authenticate, deleteHub)
	app.put("/hubs/edit", authenticate, editHub)
	app.put("/hubs/brightness", authenticate, changeBrightness)
	app.put("/hubs/volume", authenticate, changeVolume)
	app.put("/hubs/powerstate", authenticate, changePowerState)
	app.put("/hubs/source", authenticate, changeSource)
	app.put("/hubs/mute", authenticate, toggleMute)
}

////////////////////////////////////////////////////////////////
// Exports
////////////////////////////////////////////////////////////////

// Retrieve array of json objects containing all hub info
var getHubs = function(req, res) {
	console.log((req.url).blue)
	db.getHubs(function(err, data) {
		switch (err) {
			case null:
				res.status(200).send(data)
				console.log(data)
				break
			default:
				res.status(409).send()
				console.log(err)
		}
	})
}

// Retrieve a single hub's information as json
var getHub = function(req, res) {
	console.log((req.url).blue)
	id = req.query.id || req.body.id
	// Request hub information from database based on id. 
	db.getHub(id, function(err, data) {
		// Return response based on whether there's a database error or not.
		switch (err) {
			case null:
				if (data !== null) {
					res.set('Content-Type', 'application/json')
					res.status(200).send(data)
					console.log(data)
				}
				else {
					res.status(500).send()
					console.log("Database didn't return an object.")
				}
				break
			default:
				res.status(409).send()
				console.log(err)
		}
	}) 
}

// Create a single hub and return a new hub as json.
var createHub = function(req, res) {
	console.log((req.url).blue)
	var name = req.body.name
	var city = req.body.city
	var state = req.body.state
	var url = req.body.url
	cmd = "health"
	let args =  [piDaemonPath, cmd]
	runDaemon(args, function(err, response, stderr) {
		if (err !== null) {
			res.status(500).send()
			console.log(err)
		}
		else if (response === null) {
			res.status(500).send()
			console.log("No response received from script.")
		}
		else {
			// Update database if health is retrieved successfully.
			var responseJSON = JSON.parse(response)
			ip_address = responseJSON.ip_address
			system = responseJSON.system
			version = responseJSON.version
			release = responseJSON.release
			hostname = responseJSON.hostname
			temperature = responseJSON.temperature
			db.createHub(name, city, state, function(err, data) {
				// If there's an error, don't respond with the new hub json.
				// If there's no error, return new hub json.
				switch (err) {
					case null:
						if (data === null) {
							res.status(500).send()
							console.log("Database didn't return an object.")
						}
						else {
							// Send new hub values to database.
							let id = data.id
							db.createPi(id, ip_address, system, version, release, url, hostname, temperature, function(err, data) {
								switch (err) {
									case null:
										if (data === null) {
											res.status(500).send()
											console.log("Database didn't return an object.")
										}
										else {
											res.set('Content-Type', 'application/json')
											res.status(200).send(data)
											console.log(data)
										}
										break
									default:
										res.status(409).send()
										console.log(err)
								}
							})
						}
						break
					default:
						res.status(409).send()
						console.log(err)
				}
			})
		}
	})
}

var editHub = function(req, res) {
	console.log((req.url).blue)
	var id = req.body.id
	var name = req.body.name
	var city = req.body.city
	var state = req.body.state
	var ip_address = req.body.pi.ip_address
	var url = req.body.pi.url
	console.log(url)
	db.editHub(id, name, city, state, ip_address, url, function(err, data) {
		switch (err) {
			case null:
				if (data === null) {
					res.status(500).send()
				}
				else {
					res.status(200).send(data)
					console.log(data)
				}
			default:
				res.status(409).send()
				console.log(err)
		}
	})
}

// Change brightness of hub and return new brightness value.
var changeBrightness = function(req, res) {
	console.log((req.url).blue)
	var operator = req.body.operator
	var id = req.body.id
	var cmd = "brightness" + operator
	var args =  [daemonPath, cmd]
	var brightness = null
	// Execute daemon script
	runDaemon(args, function(err, response, stderr) {
		// Case when theres no error with script.
		if (err === null) {
			switch (response) {
			// If no response is returned, brightness has reached an extreme (0 or 100)
			// so update the database, then return response depending on operator.
			case "\n":
				switch (operator) {
					case "+":
						brightness = 100
						db.changeBrightness(id, brightness, function(err, data) {
							switch (err) {
								case null:
									if (data !== null) {
										res.set('Content-Type', 'application/json')
										res.status(200).send(data)
										console.log(data)
									}
									else {
										res.status(500).send()
										console.log("Data returned null.")
									}
								default:
									res.status(500).send()
									console.log(err)
							}
						})
						break
					case "-":
						brightness = 0
						db.changeBrightness(id, brightness, function(err) {
							switch (err) {
								case null:
									res.status(200).send({
										brightness: brightness
										})
								default:
									res.status(409).send()
									console.log(err)
							}
						})
						break
					default:
						res.status(500).send()
						console.log('Unknown operator.')
				}
				break
			// If an integer is returned, update the database and return that value.
			default:
				if (response.includes("error")) {
					res.status(500).send()
					console.log("Serial error.")
				}
				else {
					brightness = parseInt(response)
					db.changeBrightness(id, brightness, function(err, data) {
						switch (err) {
							case null:
								res.set('Content-Type', 'application/json')
								res.status(200).send(data)
								console.log(data)
								break
							default:
								res.status(409).send()
								console.log(err)
						}
					})
				}	
			}
		}
		// Case when there is an error with script. 
		else {
			res.status(500).send()
			console.log(err)
		}
	})
}

// Change volume of hub. Does not return new hub volume value.
var changeVolume = function(req, res) {
	console.log((req.url).blue)
	var operator = req.body.operator
	var id = req.body.id
	var cmd = "volume" + operator
	var args =  [daemonPath, cmd]
	var volume = null
	// Run daemon with volume command.
	runDaemon(args, function(err, response, stderr) {
		if (err === null) {
			if (response.includes("error")) {
				res.status(500).send()
				console.log("Serial error.")
			}
			else {
				// Update database
				db.getHub(id, function(err, data) {
					if (data !== null) {
						res.set('Content-Type', 'application/json')
						res.status(200).send(data)
						console.log(data)
					}
					else {
						res.status(500).send()
						console.log("No data returned.")
					}
				})
			}
		}
		else {
			res.status(500).send()
			console.log(err)
		}
	})
}

// Change powerstate of hub and return new power state value.
var changePowerState = function(req, res) {
	console.log((req.url).blue)
	var id = req.body.id
	var cmd = "Power?"
	var args =  [daemonPath, cmd]
	// Run daemon to query power state.
	runDaemon(args, function(err, response, stderr) {
		console.log(response)
		if (err === null) {
			if (response.includes("error")) {
				res.status(500).send()
				console.log("Serial error.")
				return
			}
			else {
				var cmd
				var state
				switch (response[0]) {
					case "0":
					case "1":
					case "2":
					case "3":
					case "4":
						cmd = "PowerOn"
						state = "5"
						break
					case "5":
						cmd = "PowerOff"
						state = "0"
						break
					default:
						res.status(500).send()
						console.log("Serial error.")
						return 
				}
				args = [daemonPath, cmd]
				// Run daemon with power on or off command.
				runDaemon(args, function(err, response, stderr) {
					if (err === null) {
						console.log(response)
						if (response.includes("error")) {
							res.status(500).send()
							console.log("Serial error.")
						}
						else {
							// Update hub with power state.
							db.changePowerState(id, state, function(err, data) {
								switch (err) {
									case null:
										res.set('Content-Type', 'application/json')
										res.status(200).send(data)
										console.log(data)
										break
									default:
										res.status(500).send()
										console.log(err)
								}
							})
						}
					}
					else {
						res.status(500).send()
						console.log(err)
					}
				})
			}
		}
		else {
			res.status(500).send()
			console.log(err)
		}
	})
}

// Change video output source of hub and return new video output source value.
var changeSource = function(req, res) {
	console.log((req.url).blue)
	var id = req.body.id
	var source = req.body.source
	var cmd = "source=" + source
	var args =  [daemonPath, cmd]
	// Run daemon with set source command.
	runDaemon(args, function(err, response, stderr) {
		if (err === null) {
			if (response.includes("error")) {
				res.status(500).send()
				console.log("Serial error.")
			}
			else {
				// Update database with new value.
				db.changeSource(id, parseInt(source), function(err, data) {
					switch (err) {
						case null:
							if (data !== null) {
								res.set('Content-Type', 'application/json')
								res.status(200).send(data)
								console.log(data)
							}
							else {
								res.status(500).send()
								console.log("No data returned.")
							}
							break
						default:
							res.status(409).send()
							console.log(err)
					}
				})
			}
			
		}
		else {
			res.status(500).send()
			console.log(err)
		}
	})
}

var toggleMute = function(req, res) {
	console.log((req.url).blue)
	var id = req.body.id
	var cmd = "AudioMute+"
	args = [daemonPath, cmd]
	runDaemon(args, function(err, response, stderr) {
		if (err === null) {
			if (response.includes("error")) {
				res.status(500).send()
				console.log("Serial error.")
			}
			else {
				db.toggleMute(id, function(err, data) {
					switch (err) {
						case null:
							if (data !== null) {
								res.set('Content-Type', 'application/json')
								res.status(200).send(data)
								console.log(data)
							}
							else {
								res.status(500).send()
								console.log("No data returned.")
							}
							break
						default: 
							res.status(409).send()
							console.log(err)
					}
				})
			}
		}
		else {
			res.status(500).send()
			console.log(err)
		}
	})
}

var deleteHub = function(req, res) {
	console.log((req.url).blue)
	var id = req.query.id
	db.deleteHub(id, function(err, data) {
		console.log(data)
		switch (err) {
			case null:
				if (data === null) {
					res.status(500).send({})
					console.log("No data returned.")
				}
				else { 
					res.status(201).send(data)
					console.log('Deleted hub ', id)
				}
				break
			default: 
				res.status(500).send()
				console.log(err)
		}
	})
}

////////////////////////////////////////////////////////////////
// Helper functions
////////////////////////////////////////////////////////////////

// Executes daemon script with given command.
function runDaemon(args, completion) {
	child.execFile(binPath, args, function (err, response, stderr) {
		completion(err, response, stderr)
	})
}


