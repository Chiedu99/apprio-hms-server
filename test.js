var access_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlZXVkljMVdEMVRrc2JiMzAxc2FzTTVrT3E1USJ9.eyJhdWQiOiI5NzYwMDdlNS04NzRmLTRkNjgtYTJkZC0wNDA2NWIwYmFkZTMiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vNmVkNDI2ZWEtMTJhNi00YWFlLThkZGItODdmODA0YTgwODMwL3YyLjAiLCJpYXQiOjE1MDIyOTM5MTgsIm5iZiI6MTUwMjI5MzkxOCwiZXhwIjoxNTAyMjk3ODE4LCJhaW8iOiJBVFFBeS84RUFBQUE1N0diSVQrdW8yWk9OdGl5OU9nY2xkUVB1N3BaMDJyY0VkUVQxTkNnd2wvU2pQY0pEd1NMQWZJN3AvaXllWWQxIiwibmFtZSI6Ik1lY2NhIFBhcmtlciIsIm9pZCI6IjUxYjM0OTM2LTU0NzgtNGRiNy04M2RlLWM3ZmM4YWQ5NmFmOCIsInByZWZlcnJlZF91c2VybmFtZSI6Im1wYXJrZXJAYXBwcmlvaW5jLmNvbSIsInN1YiI6IjBReFM4OTlqdXpXRlpDX0p6bmZKazVDZGY3YmNkUHl6dzFDa3lEdlNWWFUiLCJ0aWQiOiI2ZWQ0MjZlYS0xMmE2LTRhYWUtOGRkYi04N2Y4MDRhODA4MzAiLCJ2ZXIiOiIyLjAifQ.hh-4fBofNboQ4Ui9IiMvw7a703j2n1BB7xQQ2gs5CfwYhXY9iCZ9ENapVz3RNkrv2HKL3gy-T2lPHJIdhg5V5zLI8uv_HvhIC4LyOQy3cFYpDRhGXdv-KpR_T3GlmMIGNMh6KV7A-i2AF_sDewRChXzNKsdPhpZ7OSF62eY1ExxGyqybxuZuqhMhqgC4t3l2xWVvNP10vaUNnNlOAQAPxTgcc8IW9wtHrcnQRjVKbs4-eXdk1JLBE08rlwCnIeZhANSt8tSSt8pHkqv_8KPsF1-z5jgFtdA7KbbbuGfNfC_zAkl49rhxVnLHAwT2AMZa1vibRjpvE0FzooQqzOtXWw'
var jwt = require('jsonwebtoken');
var request = require('request')
var config = require('./config.js')
var jwkToPem = require('jwk-to-pem')

var assert = require('assert')
var fs = require('fs')
 
var RSA_PUBLIC_KEY = '-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEAwxZQBChCrsCnhy+U6jWszJNnpSwYM3nmF7iwBkp0Qa57Wz7XQLnh\nUucZe/YkEJg6hJg16XAbZ/3oZnwLqQVlArfu5ldP9IdgOgPJYFGZXamE0v3BFtf1\nK2leiHqfmt06zJ2NhHCQ5p2yRzrrMV23kjK5bz8a/gQsdkIkBW7qE9TbJFU5D3zP\nk+sbJi7SIOLx5XRI6eFwu4z1IGooBbNiRopDEdcQizJqH/7PQJuBBk+a+ntI05mZ\naEZ2nbo8DDu046TEkqA2IRJ1FIvvdxrAi5NQ6E6YcYulNWxUaxBD2e42f9jmhBTB\nYknN23p3QEmRWvhgFRyDoK+M5XFw1H0mbwIDAQAB\n-----END RSA PUBLIC KEY-----'


const express = require('express');
const app = express();
// const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const client = jwksRsa({
strictSsl: true, // Default value 
jwksUri: config.publicKeyURL
});

var kid = 'VWVIc1WD1Tksbb301sasM5kOq5Q'

client.getSigningKey(kid, (err, key) => {
console.log(err)
const signingKey = key.publicKey || key.rsaPublicKey;
console.log(signingKey)
jwt.verify(access_token, signingKey, function(err, decoded) {
    console.log(access_token)
    console.log(err)
    console.log(decoded)
    })
}) 

// function test() {
//     var decoded = jwt.decode(access_token, {complete: true})
//     var kid = decoded.header.kid
//     retrievePublicKey(kid, function(jwk) {
//         if (jwk) {
//             console.log(jwk)
//             var pem = jwkToPem(jwk)
//             console.log(pem)
//             jwt.verify(access_token, pem, { algorithms: ['RS256'] }, function(err, decoded) {
//                 if (err) {
//                     console.log(err)
//                     return
//                 }
//                 else if (decoded.name && decoded.unique_name && decoded.app_displayname && decoded.aud) {
//                     console.log("User authenticated. Continue routing...")
//                     return
//                 }
//                 else {
//                     console.log("error")
//                     return 
//                 }
//             }) 
//         }
//         else {
//             return
//         }
//     })
// }



// function retrievePublicKey(kid, completion) {
//   var options = {
//     url: config.publicKeyURL,
//     headers: {
//       'Content-Type': 'application/json'
//     }
//   }
//   request(options, function (err, res, body) {
//     var info = JSON.parse(body)
//     var keys = info["keys"]
//     for (i=0; i < keys.length; i++) {
//       var jwk = keys[i]
//       if (jwk.kid == kid) {
//         completion(jwk)
//       }
//     }
//     completion(null)
//   })
// }

// test()