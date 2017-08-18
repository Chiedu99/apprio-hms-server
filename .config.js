module.exports = {
	secret: "YHS5vyJKEwjgauZLukpuc2Tx7Wfmdh",
	clientID: '81b8b800-31ad-480b-9dcf-bc93a7debf08',
	clientSecret: '7oFpjrhSUwqtsMzYJ9gB8Y7',
	redirectUri: "http://localhost:8000/authorize",
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
	publicKeyURL: "https://login.microsoftonline.com/common/discovery/v2.0/keys"
}