var access_token = 'eyJ0eXAiOiJKV1QiLCJub25jZSI6IkFRQUJBQUFBQUFCbmZpRy1tQTZOVGFlN0NkV1c3UWZkZlc1WVcwY0Rsa21pVWVPZVp2S2VLamM2bURxVDhubTBhdHpJN3NuN3NQQlg4RHN0bXdQczhsaUY5ajZFTXJDSnhPRE9LM1g1cHBDdFhldWY3em5MM3lBQSIsImFsZyI6IlJTMjU2IiwieDV0IjoiVldWSWMxV0QxVGtzYmIzMDFzYXNNNWtPcTVRIiwia2lkIjoiVldWSWMxV0QxVGtzYmIzMDFzYXNNNWtPcTVRIn0.eyJhdWQiOiJodHRwczovL2dyYXBoLm1pY3Jvc29mdC5jb20iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC82ZWQ0MjZlYS0xMmE2LTRhYWUtOGRkYi04N2Y4MDRhODA4MzAvIiwiaWF0IjoxNTAyMjA4OTIwLCJuYmYiOjE1MDIyMDg5MjAsImV4cCI6MTUwMjIxMjgyMCwiYWNyIjoiMSIsImFpbyI6IkFTUUEyLzhEQUFBQW5wbFNhN3RJTERFYXB3VzM5Y2RHci9IT2hDeWZZMjZSbHJXZVFQTEpWRDg9IiwiYW1yIjpbInB3ZCJdLCJhcHBfZGlzcGxheW5hbWUiOiJBcHByaW8gSHViIE1hbmFnZW1lbnQgU3lzdGVtIiwiYXBwaWQiOiI5NzYwMDdlNS04NzRmLTRkNjgtYTJkZC0wNDA2NWIwYmFkZTMiLCJhcHBpZGFjciI6IjEiLCJmYW1pbHlfbmFtZSI6IlBhcmtlciIsImdpdmVuX25hbWUiOiJNZWNjYSIsImlwYWRkciI6IjIwNy44Ny4yMDcuOTkiLCJuYW1lIjoiTWVjY2EgUGFya2VyIiwib2lkIjoiNTFiMzQ5MzYtNTQ3OC00ZGI3LTgzZGUtYzdmYzhhZDk2YWY4IiwicGxhdGYiOiIyIiwicHVpZCI6IjEwMDMwMDAwQTFFMzI2ODYiLCJzY3AiOiJDYWxlbmRhcnMuUmVhZFdyaXRlIFVzZXIuUmVhZCBVc2VyLlJlYWRXcml0ZSIsInN1YiI6InFDZ01ld3JkRTJfMnlYdWtaWUhNeGFlaEJDNFFqRzhrWWtGR3BaYkpyaTQiLCJ0aWQiOiI2ZWQ0MjZlYS0xMmE2LTRhYWUtOGRkYi04N2Y4MDRhODA4MzAiLCJ1bmlxdWVfbmFtZSI6Im1wYXJrZXJAYXBwcmlvaW5jLmNvbSIsInVwbiI6Im1wYXJrZXJAYXBwcmlvaW5jLmNvbSIsInV0aSI6IjVOUmxLNUFFckVPeWZJR3RFUzAxQUEiLCJ2ZXIiOiIxLjAifQ.ZFjfzF7RSBJEaENrMPNJcaUFn9Mhl_giyQriWcjwjRyVZb8WVS3Ano3V7m6OPD8ESaJOdwZ9jSyBQq7h-cpf1-CVrOdC_EmI38gOfuqgzctIDpUvYncwJDk4C-S4rXEoP4dU6-kVIz-Pvg6e3Rb7pndx-oksCZQ-BLpkhhyU-fp4eAZPYpdpbyWZG1EmauLSLreYqzEeh_vFrqX67e-aJBz-e11MWxaMQ80I-9EcSAy4MZIo_0T0lUsi2DzJuE3RxoS8y69JFgLWAJHWfuVtf53NRxwCLoFA8zWoXucZ9GHnYEJMlsbbCSp0Buzwq481ACash4NocTd7o7_1A1OhPQ'
// var jwt = require('jsonwebtoken');
var request = require('request')
var config = require('./config.js')
var jwkToPem = require('jwk-to-pem')

var assert = require('assert')
var fs = require('fs')
 
var RSA_PUBLIC_KEY = '-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEAwxZQBChCrsCnhy+U6jWszJNnpSwYM3nmF7iwBkp0Qa57Wz7XQLnh\nUucZe/YkEJg6hJg16XAbZ/3oZnwLqQVlArfu5ldP9IdgOgPJYFGZXamE0v3BFtf1\nK2leiHqfmt06zJ2NhHCQ5p2yRzrrMV23kjK5bz8a/gQsdkIkBW7qE9TbJFU5D3zP\nk+sbJi7SIOLx5XRI6eFwu4z1IGooBbNiRopDEdcQizJqH/7PQJuBBk+a+ntI05mZ\naEZ2nbo8DDu046TEkqA2IRJ1FIvvdxrAi5NQ6E6YcYulNWxUaxBD2e42f9jmhBTB\nYknN23p3QEmRWvhgFRyDoK+M5XFw1H0mbwIDAQAB\n-----END RSA PUBLIC KEY-----'


const express = require('express');
const app = express();
const jwt = require('express-jwt');
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
var opts = {
    secret: signingKey,
    algorithms: ['RS256']
}
const checkJwt = jwt(opts)
console.log("Checking JWT")
console.log("")
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