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
// var jwt = require('jsonwebtoken');
var request = require('request')
var config = require('./config.js')
var jwkToPem = require('jwk-to-pem')
const jwt = require('express-jwt');
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
          console.log(req.session)
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
          console.log(token)
          var data = {
            access_token: req.session.access_token,
            refresh_token: req.session.refresh_token,
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
    var access_token = req.session.access_token
    var refresh_token = req.session.refresh_token
    var secret = app.get("secret")
    if (access_token === undefined || refresh_token === undefined) {
      res.status(401).send({message: "No token given."})
    }
    else {
      var decoded = jwt.decode(access_token, {complete: true})
      var kid = decoded.header.kid
      retrievePublicKey(kid, function(jwk) {
        if (jwk) {
          pem = jwkToPem(jwk);
          const checkJwt = jwt({
            // Dynamically provide a signing key
            // based on the kid in the header and 
            // the singing keys provided by the JWKS endpoint.
            secret: jwksRsa.expressJwtSecret({
              cache: true,
              rateLimit: true,
              jwksRequestsPerMinute: 5,
              jwksUri: config.publicKeyURL
            }),

            algorithms: ['RS256']
          });
        //   jwt.verify(access_token, pem, { algorithms: ['RS256'] }, function(err, decoded) {
        //     if (err) {
        //       console.log(err)
        //       if (err.name === "TokenExpiredError") {
        //         refreshToken(refresh_token, function(err, token) {
        //           if (err) {
        //             console.log(err)
        //             res.status(401).send({message: "Token expired. Couldn't refresh."})
        //           }
        //           else {
        //             console.log("Token refreshed.")
        //             tokenReceived(req, res, token)
        //             next()
        //           }
        //         })
        //       }
        //       else {
        //         console.log(err)
        //         res.status(401).send({message: "Token invalid."})
        //       }
        //     }
        //     else if (decoded.name && decoded.unique_name && decoded.app_displayname && decoded.aud) {
        //       console.log("User authenticated. Continue routing...")
        //       next()
        //     }
        //     else {
        //       res.status(403).send({message: "Couldn't decode token. Token invalid."})
        //     }
        //   }) 
        // }
        else {
          res.status(401).send()
        }
      })
    }
  }
}

function retrievePublicKey(kid, completion) {
  var options = {
    url: config.publicKeyURL,
    headers: {
      'Content-Type': 'application/json'
    }
  }
  request(options, function (err, res, body) {
    var info = JSON.parse(body)
    var keys = info["keys"]
    for (i=0; i < keys.length; i++) {
      var jwk = keys[i]
      if (jwk.kid == kid) {
        completion(jwk)
      }
    }
    completion(null)
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
  req.session.access_token = token.token.access_token;
  req.session.refresh_token = token.token.refresh_token;
  req.session.user_info = getInfoFromIDToken(token.token.id_token);
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