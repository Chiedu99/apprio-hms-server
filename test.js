var access_token = 'eyJ0eXAiOiJKV1QiLCJub25jZSI6IkFRQUJBQUFBQUFCbmZpRy1tQTZOVGFlN0NkV1c3UWZkUnVQOUM0UUFDVmcwcWZKc2l5VnU3RVMtSFJldk5UWEhXZlpyVU43ZHZPWjRVRU9GaXJtZ2VPRlNpYXFNaHJvd1ljM2hOeFNSU3V4SEotT1FXbmdub1NBQSIsImFsZyI6IlJTMjU2IiwieDV0IjoiVldWSWMxV0QxVGtzYmIzMDFzYXNNNWtPcTVRIiwia2lkIjoiVldWSWMxV0QxVGtzYmIzMDFzYXNNNWtPcTVRIn0.eyJhdWQiOiJodHRwczovL2dyYXBoLm1pY3Jvc29mdC5jb20iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC82ZWQ0MjZlYS0xMmE2LTRhYWUtOGRkYi04N2Y4MDRhODA4MzAvIiwiaWF0IjoxNTAyMjA5MTU5LCJuYmYiOjE1MDIyMDkxNTksImV4cCI6MTUwMjIxMzA1OSwiYWNyIjoiMSIsImFpbyI6IlkyWmdZTEI1N3M2d05hNTRPbnNLbjdiWE1lbkY4eTc4blNnUXFzZ2FOYXZxd01YY3QwOEIiLCJhbXIiOlsicHdkIl0sImFwcF9kaXNwbGF5bmFtZSI6IkFwcHJpbyBIdWIgTWFuYWdlbWVudCBTeXN0ZW0iLCJhcHBpZCI6Ijk3NjAwN2U1LTg3NGYtNGQ2OC1hMmRkLTA0MDY1YjBiYWRlMyIsImFwcGlkYWNyIjoiMSIsImZhbWlseV9uYW1lIjoiUGFya2VyIiwiZ2l2ZW5fbmFtZSI6Ik1lY2NhIiwiaXBhZGRyIjoiMjA3Ljg3LjIwNy45OSIsIm5hbWUiOiJNZWNjYSBQYXJrZXIiLCJvaWQiOiI1MWIzNDkzNi01NDc4LTRkYjctODNkZS1jN2ZjOGFkOTZhZjgiLCJwbGF0ZiI6IjIiLCJwdWlkIjoiMTAwMzAwMDBBMUUzMjY4NiIsInNjcCI6IkNhbGVuZGFycy5SZWFkV3JpdGUgVXNlci5SZWFkIFVzZXIuUmVhZFdyaXRlIiwic3ViIjoicUNnTWV3cmRFMl8yeVh1a1pZSE14YWVoQkM0UWpHOGtZa0ZHcFpiSnJpNCIsInRpZCI6IjZlZDQyNmVhLTEyYTYtNGFhZS04ZGRiLTg3ZjgwNGE4MDgzMCIsInVuaXF1ZV9uYW1lIjoibXBhcmtlckBhcHByaW9pbmMuY29tIiwidXBuIjoibXBhcmtlckBhcHByaW9pbmMuY29tIiwidXRpIjoiZzk1c19oTzJGMDJZbTJHbVdOTXNBQSIsInZlciI6IjEuMCJ9.L6pafcyWhr382ql2i3LUQm_u4sCJblbOzU3q3FsuH2kEQd-pgp8OWl0y_ij-47BuwfCuV_YqeT-EEqRnlJu6CvbGnXUIoXGnqGKP6Gnpe_oc73oLpsf-iE88qsYKUpCMHV-hmIgGm_PrlEfF3q4bCGGKFFRsC8RYDzg38fZCxHYLP_eAw1qNG5zFUFmlImnyldrtUPKZNADwmS5kApiPbwQRhl8KSGDLHMZ2NZB5uGBSj3i2t2LITglMtadxGwPfIiAyI9pSD2Szf9IuOwvjsE1bjsActv39WgsG5ycDmTj6dzPttKfpuYHVp98l9X0oa6oJ5GjumWdu7JwQiZNDEw'
var jwt = require('jsonwebtoken');
var request = require('request')
var config = require('./config.js')
var jwkToPem = require('jwk-to-pem')

var assert = require('assert')
var fs = require('fs')
var pem2jwk = require('pem-jwk').pem2jwk
var jwk2pem = require('pem-jwk').jwk2pem
 


function test() {
    var decoded = jwt.decode(access_token, {complete: true})
    var kid = decoded.header.kid
    retrievePublicKey(kid, function(jwk) {
    if (jwk) {
        var pem = jwk2pem(jwk)
        console.log(pem)
        jwt.verify(access_token, pem, { algorithms: ['RS256'] }, function(err, decoded) {
        if (err) {
            console.log(err)
            if (err.name === "TokenExpiredError") {
            refreshToken(refresh_token, function(err, token) {
                if (err) {
                console.log(err)
                return
                }
                else {
                console.log("Token refreshed.")
                return
                }
            })
            }
            else {
            console.log(err)
            return
            }
        }
        else if (decoded.name && decoded.unique_name && decoded.app_displayname && decoded.aud) {
            console.log("User authenticated. Continue routing...")
            return
        }
        else {
            console.log("error")
            return 
        }
        }) 
    }
    else {
        console.log('error')
        return
    }
})
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

test()