var clientID = '976007e5-874f-4d68-a2dd-04065b0bade3';
var clientSecret = 'CRove2sVeFmFNFuoPFYtLS2';
var redirectUri = 'https://apprio-pi-server-heroku.herokuapp.com/authorize';

var scopes = [
  'openid',
  'profile',
  'user.read'
];

const credentials = {
  client: {
    id: clientID,
    secret: clientSecret
  },
  auth: {
    tokenHost: 'https://login.microsoftonline.com',
    authorizePath: '/common/oauth2/v2.0/authorize',
    tokenPath: '/common/oauth2/v2.0/token'
  }
};

var oauth2 = require('simple-oauth2').create(credentials)
var cookieParser = require('cookie-parser')
var session = require('express-session')
var bodyParser = require('body-parser')
var colors = require('colors')
var jwt = require('jsonwebtoken');
var config = require('./config.js')

const jwksRsa = require('jwks-rsa');


module.exports = function(app) {
  // Need JSON body parser for most API responses
  app.use(bodyParser.json());

  // Set up cookies and sessions to save tokens
  app.use(cookieParser());

  app.use(session(
    { secret: '81b8b800-31ad-480b-9dcf-bc93a7debf08',
      resave: false,
      saveUninitialized: false 
  }));

  app.use(bodyParser.json())

  app.use(function(req, res, next) {
      res.set('Access-Control-Allow-Origin', '*')
      res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
      res.set("Access-Control-Allow-Headers", "X-Requested-With, Content-Type")
      next();
  })

  app.set('authenticate', authenticate)

  app.get('/', function(req, res) {
    res.redirect('/authorize')
  })

  app.get('/authorize', function(req, res) {
    console.log((req.url).blue)
    var authCode = req.query.code
    if (authCode) {
      getTokenFromCode(authCode, function(err, token) {
        if (err) {
          console.log(err)
          res.status(401).send({message: err})
        }
        else {
          tokenReceived(req, res, token)
          console.log(token)
          res.status(200).send({success: true})
        }
      })
    }
    else {
      var url = getAuthUrl()
      console.log(url)
      res.send({url: url})
    }
  })

  app.get('/getTokenData', function(req, res) {
    console.log((req.url).blue)
    var authCode = req.query.code
    if (authCode) {
      getTokenFromCode(authCode, function(err, token) {
        if (err) {
          console.log(err)
          res.status(401).send({message: err})
        }
        else {
          tokenReceived(req, res, token)
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
      console.log("No auth token given.")
      res.status(400).send()
    }
  })

  app.get('/logout', function(req, res) {
    console.log((req.url).blue)
    req.session.destroy()
    console.log("Logged out.")
    res.status(201).send()
  })

  function authenticate(req, res, next) {
    console.log("Authenticating...")
    var id_token = req.session.id_token || req.headers.authorization
    console.log(id_token)
    var refresh_token = req.session.refresh_token
    if (id_token === undefined || refresh_token === undefined) {
      console.log("No tokens given")
      res.status(401).send({message: "No token given."})
    }
    else {
      var decoded = jwt.decode(id_token, {complete: true})
      var kid = decoded.header.kid
      verifyToken(req, res, kid, id_token, next)
    }
  }

}

function verifyToken(req, res, kid, id_token, next) {
  var clientOpts = {
      strictSsl: true, 
      jwksUri: process.env.PUBLIC_KEY_URL || config.publicKeyURL
    }
  const client = jwksRsa(clientOpts)
  client.getSigningKey(kid, (err, key) => {
    if (err) {
      console.log(err)
      res.status(401).send({message: err})
    }
    else {
      const signingKey = key.publicKey || key.rsaPublicKey;
      jwt.verify(id_token, signingKey, { algorithms: ['RS256'] }, function(err, decoded) {
        if (err) {
          console.log(err)
          if (err.name === "TokenExpiredError") {
            refreshToken(refresh_token, function(err, token) {
              if (err) {
                console.log(err)
                res.status(401).send({message: "Token expired. Couldn't refresh."})
              }
              else {
                console.log("Token refreshed.")
                tokenReceived(req, res, token)
                next()
              }
            })
          }
          else {
            res.status(401).send({message: "Token invalid."})
          }
        }
        else if (decoded.name && decoded.iss && decoded.aud) {
          console.log("User authenticated. Continue routing...")
          next()
        }
        else {
          res.status(401).send({message: "Couldn't decode token. Token invalid."})
        }
      }) 
    }
  })
}

function refreshToken(refresh_token, completion) {
  if (refresh_token === undefined) {
    var err = "No refresh token in session."
    completion(err, null)
  }
  else {
    getTokenFromRefreshToken(refresh_token, function(err, token) {
      completion(err, token)
    })
  }
}

function getAuthUrl() {
  var returnVal = oauth2.authorizationCode.authorizeURL({
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    state:"123"
  });
  return returnVal;
}

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

function tokenReceived(req, res, token) {
  // save tokens in session
  req.session.access_token = token.token.access_token
  req.session.refresh_token = token.token.refresh_token
  req.session.id_token = token.token.id_token
  req.session.user_info = getInfoFromIDToken(token.token.id_token)
}

function getInfoFromIDToken(id_token) {
  // JWT is in three parts, separated by a '.'
  var token_parts = id_token.split('.');
  // Token content is in the second part, in urlsafe base64
  var encoded_token = new Buffer(token_parts[1].replace('-', '+').replace('_', '/'), 'base64');

  var decoded_token = encoded_token.toString();

  var jwt = JSON.parse(decoded_token);

  // Info is stored in JSON web token
  var userInfo = {
      name: jwt.name,
      email: jwt.preferred_username,
  }
  return userInfo
}


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