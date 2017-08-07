/* 
 * All routes for pi.
 */
var child = require("child_process")
var binPath = "/usr/bin/python"
var piDaemonPath = "../daemon/pi_daemon.py"
var db = require('../db.js')
var bodyParser = require('body-parser')
var colors = require('colors')

module.exports = function(app) {
	app.use(bodyParser.json())
	app.get("/hubs/health", checkHealth)
    app.put("/hubs/rebootpi", reboot)
    app.put("/hubs/shutdowpi", shutdown)
}

// Retrieve pi system information and return json of information.
var checkHealth = function(req, res) {
	console.log((req.url).blue)
	cmd = "health"
	id = req.body.id
	let args =  [piDaemonPath, cmd]
	// Run daemon with health command.
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
			db.checkHealth(id, function(err, data) {
				switch (err) {
					case null:
						if (data === null) {
							res.status(500).send()
							console.log("Database didn't return an object.")
						}
						else {
							res.set('Content-Type', 'application/json')
							res.status(200).send(data)
							console.log("Success.")
						}
					default:
						res.status(409).send()
						console.log(err)
				}
			})
		}
	})
}

var reboot = function(req, res) {
	console.log((req.url).blue)
	cmd = "reboot"
	id = req.body.id
	let args = [piDaemonPath, cmd]
	// Run daemon with reboot command.
	runDaemon(args, function(err, response, stderr) {
		if (err !== null) {
			res.status(500).send()
			console.log(err)
		}
		// Shouldn't return anything if successful.
	})
}

var shutdown = function(req, res) {
	console.log((req.url).blue)
	cmd = "shutdown"
	id = req.body.id
	let args = [piDaemonPath, cmd]
	// Run daemon with shutdown command.
	runDaemon(args, function(err, response, stderr) {
		if (err !== null) {
			res.status(500).send()
			console.log(err)
		}
		// Shouldn't return anything if successful.
	})
}

// Executes daemon script with given command.
function runDaemon(args, completion) {
	child.execFile(binPath, args, function (err, response, stderr) {
		completion(err, response, stderr)
	})
}

