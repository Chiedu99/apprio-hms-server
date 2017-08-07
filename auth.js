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

var oauth2 = require('simple-oauth2').create(credentials);
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');

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
    var authCode = req.query.code
    if (authCode) {
      getTokenFromCode(authCode, function(err, token) {
        if (err) {
          res.status(401).send({message: "AUTHORIZATION FAILED: Attempted to access an unauthorized resource."})
        }
        else {
          tokenReceived(req, res, token)
          res.status(200).send({success: true})
        }
      })
    }
    else {
      res.send({url: getAuthUrl()})
    }
  })

  app.get('/logincomplete', function(req, res) {
    var access_token = req.session.access_token
    var refresh_token = req.session.refresh_token
    var user_info = req.session.user_info
    if (access_token === undefined || refresh_token === undefined) {
      res.redirect('/authorize')
    }
    else {
      var data = {
        access_token: access_token,
        refresh_token: refresh_token,
        user_info: user_info
      }
      res.status(200).send(data)
    }
  })
}

function authenticate(req, res, next) {
  var access_token = req.session.access_token
  var refresh_token = req.session.refresh_token
  var authCode = req.query.code
  if (access_token === undefined || refresh_token === undefined) {
    if (authCode) {
      getTokenFromCode(authCode, function(err, token) {
          if (err) {
            res.status(403).send({message: "Could not authenticate with given token."})
          }
          else {
            tokenReceived(req, res, token)
            next()
          }
        })
      }
    else {
      res.status(401).send({message: "No authentication code given."})
    }
  }
  else {
    console.log("it worked!!!!")
    next()
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
          console.log('Access token error: ', error.message);
          completion(error, null);
        }
        else {
          var token = oauth2.accessToken.create(result);
          console.log('');
          console.log('Token created: ', token.token);
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
