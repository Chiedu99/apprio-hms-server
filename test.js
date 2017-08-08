
var publicKeyURL = "https://login.microsoftonline.com/common/discovery/keys"
var request = require('request')
var options = {
  url: publicKeyURL,
  headers: {
    'Content-Type': 'application/json'
  }
}
request(options, function (err, res, body) {
    var info = JSON.parse(body)
    var keys = info["keys"]
    for (i=0; i < keys.length; i++) {
        var key = keys[i]
        console.log(key.x5c)
        // if (key.kid == kid) {
        //   console.log(key.x5c)
        // }
    }
    //   var keys = body["keys"]
    //   console.log(keys)
    //   for (i = 0; i < keys.length; i++) {
    //     var key = keys[i]
    //     console.log(key)
    //     if (key.kid == kid) {
    //       console.log(key.x5c)
    //     }
    //   }

});
