
////////////////////////////////////////////////////////////////
// Route Authorization
////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
// Imports
////////////////////////////////////////////////////////////////

var cookieParser = require('cookie-parser')
var session = require('express-session')
var bodyParser = require('body-parser')
var colors = require('colors')

var config = require('./.config.js')
var db = require('./db')
var jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');


////////////////////////////////////////////////////////////////
// Config Variables
////////////////////////////////////////////////////////////////

var clientID = process.env.CLIENT_ID || config.clientID
var clientSecret = process.env.CLIENT_SECRET || config.clientSecret
var redirectUri = process.env.REDIRECT_URI || config.redirectUri

var scopes = [
  'openid',
  'profile',
  'user.read'
]

const credentials = {
  client: {
    id: clientID,
    secret: clientSecret
  },
  auth: {
    tokenHost: process.env.TOKEN_HOST || config.tokenHost,
    authorizePath: process.env.AUTHORIZE_PATH || config.authorizePath,
    tokenPath: process.env.TOKEN_PATH || config.tokenPath
  }
};

var oauth2 = require('simple-oauth2').create(credentials)

////////////////////////////////////////////////////////////////
// Exports 
////////////////////////////////////////////////////////////////

module.exports = function(app) {

  app.use(bodyParser.json())
  app.use(cookieParser())
  app.use(session(
    { secret: process.env.SESSION_SECRET || config.secret,
      resave: false,
      saveUninitialized: false 
  }))
  app.use(bodyParser.json())
  app.set("authenticate", authenticate)
  // Set necessary headers for every request
  app.use(function(req, res, next) {
    res.set('Access-Control-Allow-Origin', '*')
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
    res.set("Access-Control-Allow-Headers", "X-Requested-With, Content-Type")
    next();
  })

  app.get('/', function(req, res) {
    res.redirect('/authorize')
  })

  // Extract token from auth code and return the authorization URL
  app.get('/authorize', function(req, res) {
    console.log('/authorize'.blue)
    var authCode = req.query.code
    if (authCode) {
      getTokenFromCode(authCode, function(err, token) {
        if (err) {
          console.log(err)
          res.status(401).send({message: err})
        }
        else {
          saveTokenData(req, token)
          verifyUser(req, res, console.log(""))
        }
      })
    }
    else {
      var url = getAuthUrl()
      console.log(url)
      res.send({url: url})
    }
  })

  // Extract user data from the token
  app.get('/getTokenData', function(req, res) {
    console.log('/getTokenData'.blue)
    var authCode = req.query.code
    if (authCode) {
      getTokenFromCode(authCode, function(err, token) {
        if (err) {
          console.log(err)
          res.status(401).send({message: err})
        }
        else {
          saveTokenData(req, token)
          var data = {
            access_token: req.session.access_token,
            refresh_token: req.session.refresh_token,
            id_token: req.session.id_token,
            user_info: req.session.user_info
          }
          console.log(data)
          res.status(200).send(data)
        }
      })
    } 
    else {
      console.log("No auth code given.")
      res.status(400).send({message: "No auth code given."})
    }
  })

  // Log a user out of the session
  app.get('/logout', function(req, res) {
    console.log('/logout'.blue)
    req.session.destroy()
    console.log("Logged out.")
    res.status(201).send()
  })

  // Authenticate user before completing route
  function authenticate(req, res, next) {
    console.log("Authenticating...")
    var id_token = req.session.id_token || req.headers.id_token
    var refresh_token = req.session.refresh_token || req.headers.refresh_token
    if (id_token === undefined || refresh_token === undefined) {
      console.log("No tokens given.")
      res.status(401).send({message: "No token given."})
    }
    else {
      // decode id_token the verify it
      console.log(id_token)
      var decoded = jwt.decode(id_token, {complete: true})
      var kid = decoded.header.kid
      verifyToken(req, res, kid, id_token, refresh_token, next)
    }
  }

}

////////////////////////////////////////////////////////////////
// Helper functions
////////////////////////////////////////////////////////////////

// Verify id_token and refresh it if it's expired
function verifyToken(req, res, kid, id_token, refresh_token, next) {
  var clientOpts = {
      strictSsl: true, 
      jwksUri: process.env.PUBLIC_KEY_URL || config.publicKeyURL
    }
  const client = jwksRsa(clientOpts)
  // retrieve pem public key from Microsoft api
  client.getSigningKey(kid, (err, key) => {
    if (err) {
      console.log(err)
      res.status(401).send({message: err})
    }
    else {
      const signingKey = key.publicKey || key.rsaPublicKey;
      // verify/refresh token
      jwt.verify(id_token, signingKey, { algorithms: ['RS256'] }, function(err, decoded) {
        if (err) {
          console.log(err)
          if (err.name === "TokenExpiredError") {
            refreshToken(req, res, next, refresh_token) 
          }
          else {
            res.status(401).send({message: "Token invalid."})
          }
        }
        else if (decoded.name && decoded.iss && decoded.aud) {
          console.log("Authenticated!")
          next()
        }
        else {
          res.status(401).send({message: "Couldn't decode token. Token invalid."})
        }
      }) 
    }
  })
}

// Refresh the token 
function refreshToken(req, res, next, refresh_token) {
  if (refresh_token === undefined) {
    console.log("No refresh token given.")
    res.status(401).send({message: "No refresh token given."})
  }
  else {
    getTokenFromRefreshToken(refresh_token, function(err, token) {
      if (err) {
        console.log("Token expired and we culdn't refresh it.")
        res.status(401).send({message: "Token expired. Couldn't refresh."})
      }
      else {
        console.log("Token refreshed.")
        saveTokenData(req, token)
        verifyUser(req, res, next)
      }
    })
  }
}

// Ensure user is in the authorized user database
function verifyUser(req, res, next) {
  var userInfo = req.session.user_info
  var email =  userInfo ? userInfo.email : req.headers.email
  db.retrieveUsers(function(err, data) {
    if (err) {
      res.status(500).send({message: "Coudln't retrieve user list from database."})
    }
    else {
      var allowedUsers = data[0].array
      var allowed = allowedUsers.indexOf(email) >= 0 
      if (allowed) {
        next()
      }
      else {
        res.status(403).send({message: "User logged in successfully but does not have sufficient permission."})
      }
    }
  })
}

// Get authorization url 
function getAuthUrl() {
  var returnVal = oauth2.authorizationCode.authorizeURL({
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    state:"123"
  });
  return returnVal;
}

// Create token from authorization code
function getTokenFromCode(authCode, completion) {
  oauth2.authorizationCode.getToken({
    code: authCode,
    redirect_uri: redirectUri,
    scope: scopes.join(' ')
    }, 
    function (error, result) {
        if (error) {
          completion(error, null);
        }
        else {
          var token = oauth2.accessToken.create(result);
          completion(null, token);
        }
    });
}

// Save tokens in session
function saveTokenData(req, token) {
  req.session.access_token = token.token.access_token
  req.session.refresh_token = token.token.refresh_token
  req.session.id_token = token.token.id_token
  req.session.user_info = getInfoFromIDToken(token.token.id_token)
}


// Parse token and return user information
function getInfoFromIDToken(id_token) {
  var token_parts = id_token.split('.');
  var encoded_token = new Buffer(token_parts[1].replace('-', '+').replace('_', '/'), 'base64');
  var decoded_token = encoded_token.toString();
  var jwt = JSON.parse(decoded_token);
  var userInfo = {
      name: jwt.name,
      email: jwt.preferred_username,
  }
  return userInfo
}

// Create a new token from the refresh token 
function getTokenFromRefreshToken(refresh_token, completion) {
  var token = oauth2.accessToken.create({ refresh_token: refresh_token, expires_in: 0});
  token.refresh(function(err, result) {
    if (err) {
      completion(err, null)
    }
    else {
      completion(null, result)
    }
  })
}