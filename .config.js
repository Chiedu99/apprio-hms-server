module.exports = {
	secret: "YHS5vyJKEwjgauZLukpuc2Tx7Wfmdh",
	clientID: '976007e5-874f-4d68-a2dd-04065b0bade3',
	clientSecret: 'CRove2sVeFmFNFuoPFYtLS2',
	redirectUri: 'http://localhost:8000/authorize', //"https://apprio-pi-server-heroku.herokuapp.com/authorize",
	tokenHost: "https://login.microsoftonline.com",
	authorizePath: '/common/oauth2/v2.0/authorize',
	tokenPath: '/common/oauth2/v2.0/token',
	port: 8000,
	dbURL: 'postgres://mxtnxulynacpcj:f341e82d34b37bd59dc6b92ce133863eafa9caa80c5eccfbe06cedde1b1a59f0@ec2-54-235-168-152.compute-1.amazonaws.com:5432/d6kcqlbbrac5bn?ssl=true',
	cn: {
		host: 'ec2-54-235-168-152.compute-1.amazonaws.com',
		port: 5432,
		database: 'd6kcqlbbrac5bn',
		user: 'mxtnxulynacpcj',
		password: 'f341e82d34b37bd59dc6b92ce133863eafa9caa80c5eccfbe06cedde1b1a59f0'
	},
	publicKeyURL: "http://login.microsoftonline.com/common/discovery/keys"
}