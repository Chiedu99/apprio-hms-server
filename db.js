/* 
 * Create and export database methods
 */

var promise = require('bluebird')
var config = require('./config.js')

var options = {
  // Initialization Options
  promiseLib: promise
}

var pgp = require('pg-promise')(options)
var cn = {
			host: 'ec2-54-235-168-152.compute-1.amazonaws.com',
			port: 5432,
			database: 'd6kcqlbbrac5bn',
			user: 'mxtnxulynacpcj',
			password: 'f341e82d34b37bd59dc6b92ce133863eafa9caa80c5eccfbe06cedde1b1a59f0'
			}

var db = pgp('postgres://mxtnxulynacpcj:f341e82d34b37bd59dc6b92ce133863eafa9caa80c5eccfbe06cedde1b1a59f0@ec2-54-235-168-152.compute-1.amazonaws.com:5432/d6kcqlbbrac5bn?ssl=true'); 

var testConnection = function(completion) {
	db.connect()
	.then(function() {
		completion(null)
	})
	.catch(function(err) {
		completion(err)
	})
}

var getHubs = function(completion) {
	var query = 'SELECT h.*, (SELECT row_to_json(p.*) ' + 
				'FROM public.pi AS p WHERE h.id = p.id) ' +
				'AS pi FROM public.hub AS h'
	db.any(query)
	.then(function(data) {
		completion(null, data)
    })
	.catch(function(err) {
		completion(err, null)
    })
}

var getHub = function(id, completion) {
	var query = 'SELECT h.*, (SELECT row_to_json(p.*) ' + 
				'FROM public.pi AS p WHERE h.id = p.id) ' +
				'AS pi FROM public.hub AS h WHERE h.id = $1;'
	db.one(query, [id])
	.then(function(data) {
		completion(null, data)
    })
	.catch(function(err) {
		completion(err, null)
    })
}

var createHub = function(name, city, state, completion) {
	var params = [name, city, state]
	// Query database and return a json object of the new hub if successful, else null
	var query = 'INSERT INTO hub ' +
				'(name, city, state) ' +
				'VALUES ($1, $2, $3) ' + 
				'RETURNING id'
	db.one(query, params)
	.then(function(data) {
		completion(null, data)
	}) 
	.catch(function(err) {
		completion(err, null)
	})
}

var deleteHub = function(id, completion) {
	var params = [id]

	var query = "DELETE FROM hub WHERE id = $1; DELETE FROM pi WHERE id = $1; " +
				'SELECT h.*, (SELECT row_to_json(p.*) ' + 
				'FROM public.pi AS p WHERE h.id = p.id) ' +
				'AS pi FROM public.hub AS h'
				
	db.any(query, params)
	.then(function(hub) {
		completion(null, hub)
	})
	.catch(function(err) {
		completion(err, null)
	})
}

var editHub = function(id, name, city, state, ip_address, url, completion) {
	var params = [	id, name, city, state, ip_address, url	]
	var query = "UPDATE hub SET (name, city, state) " +
				"= ($2, $3, $4) WHERE id = $1; " + 
				"UPDATE pi SET (ip_address, url) = ($5, $6) WHERE id = $1; " +
				'SELECT h.*, (SELECT row_to_json(p.*) ' + 
				'FROM public.pi AS p WHERE h.id = p.id) ' +
				'AS pi FROM public.hub AS h'
	db.any(query, params)
	.then(function(data) {
		completion(null, data)
	})
	.catch(function(err) {
		completion(err, null)
	})
}

var changeBrightness = function(id, brightness, completion) {
	var params = [id, brightness]
	var query = "UPDATE hub SET brightness = $2 WHERE id = $1; " + 
				'SELECT h.*, (SELECT row_to_json(p.*) ' + 
				'FROM public.pi AS p WHERE h.id = p.id) ' +
				'AS pi FROM public.hub AS h'
	db.any(query, params)
	.then(function(data) {
		completion(null, data)
	})
	.catch(function(err) {
		completion(err, null)
	})
}

var changePowerState = function(id, state, completion) {
	var powerValue = 0
	switch (state) {
		case "on":
			powerValue = 5
		case "off":
			powerValue = 0
		default:
			powerValue = 0
	}
	var params = [id, powerValue]
	var query = "UPDATE hub SET power = $2 WHERE id = $1; " + 
				'SELECT h.*, (SELECT row_to_json(p.*) ' + 
				'FROM public.pi AS p WHERE h.id = p.id) ' +
				'AS pi FROM public.hub AS h'
	db.any(query, params)
	.then(function(data) {
		completion(null, data)
	})
	.catch(function(err) {
		completion(err, null)
	})
}
var changeSource = function(id, source, completion) {
	var params = [id, source]
	var query = "UPDATE hub SET source = $2 WHERE id = $1; " + 
				'SELECT h.*, (SELECT row_to_json(p.*) ' + 
				'FROM public.pi AS p WHERE h.id = p.id) ' +
				'AS pi FROM public.hub AS h'
	db.any(query, params)
	.then(function(data) {
		completion(null, data)
	})
	.catch(function(err) {
		completion(err, null)
	})
}
var createPi = function(id, ip_address, system, version, release, url, hostname, temperature, completion) {
	var params = [id, ip_address, system, version, release, url, hostname, temperature]
	var query = 'INSERT INTO pi ' +
				'(id, ip_address, system, version, release, url, hostname, temperature) ' +
				'VALUES ($1, $2, $3, $4, $5, $6, $7, $8)'
	db.none(query, params)
	.then(function() {
		getHub(id, function(err, data) {
			completion(err, data)	
		})
	})
	.catch(function(err) {
		completion(err)
	})
}
var checkHealth = function(id, ip_address, system, version, release, hostname, temperature, completion) {
	var params = [id, ip_address, system, version, release, hostname, temperature]
	var query = 'UPDATE pi ' +
				'SET (id, ip_address, system, version, release, url, hostname, temperature) ' +
				'= ($2, $3, $4, $5, $6, $7)' + 
				'WHERE id = $1' +
				'RETURNING *'
	db.one(query, params)
	.then(function(data) {
		completion(null, data)
	})
	.catch(function(err) {
		completion(err, null)
	})
}

var toggleMute = function(id, completion) {
	var params1 = [id]
	var bool
	var query1 = "SELECT is_muted FROM hub WHERE id = $1"
	db.any(query1, params1)
	.then(function(data) {
		if (data.is_muted) {
			bool = false
		}
		else {
			bool = true
		}
		var params2 = [id, bool]
		var query2 =	"UPDATE hub SET is_muted = $2 WHERE id = $1; " + 
						'SELECT h.*, (SELECT row_to_json(p.*) ' + 
						'FROM public.pi AS p WHERE h.id = p.id) ' +
						'AS pi FROM public.hub AS h'
		db.one(query2, params2)
		.then(function(data) {
			completion(null, data)
		})
		.catch(function(err) {
			completion(err, null)
		})
	})
	.catch(function(err) {
		comletion(err, null)
	})
}



var methods = {
	testConnection: testConnection,
	getHubs: getHubs,
	getHub: getHub,
	createHub: createHub, 
	deleteHub: deleteHub,
	editHub: editHub,
	changeBrightness: changeBrightness,
	changePowerState, changePowerState,
	changeSource: changeSource,
	createPi: createPi,
	checkHealth: checkHealth,
	toggleMute: toggleMute
}

module.exports = methods

