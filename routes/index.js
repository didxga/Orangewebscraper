var express = require('express');
var router = express.Router();
var request = require('request');
var concat = require('concat-stream');
var replaceStream = require("replacestream");
var iconv = require('iconv-lite');
var fs = require('fs');
var path = require('path');
var async = require('async');

/* GET home page. */
router.get("/", function(req, res, next) {

  write = concat(function(completeResponse) {
    // here is where you can modify the resulting response before passing it back to the client.
    var finalResponse = completeResponse.pipe();
    console.log(finalResponse);
    res.end(finalResponse);
  });
  function replaceFn(match) {
   return "<body>abc";
  }

  request.get("http://www.oschina.net/").pipe(replaceStream('<body>', replaceFn)).pipe(res);
});

router.get("/load", function(req, res, next) {
  var request = require('request');
  request('http://www.google.com', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      //console.log(body) // Show the HTML for the Google homepage.
      console.log(response);
      res.write(body);
    }
  })
});

router.get("/load1", function(req, resp, next) {
  var url = unescape(req.query.url);
  var bodyPath = path.join(__dirname, 'monkey.html');
  var headPath = path.join(__dirname, 'monkey.css');
  var write = concat(function(response) {
    async.parallel({
    body:function(done){ 
      fs.readFile(bodyPath, 'utf8', function (err,data) {
          done(err, data);
      });
     },
    head:function(done){ 
      fs.readFile(headPath, 'utf8', function (err,data) {
          done(err, data);
      });
     }
    }, function(error, result) {
      if (response != undefined) { 
      response = iconv.decode(response,'GBK');
      response = response.toString();
      response = response.replace(/<\/head/, result.head+"<\/head");
      response = response.replace(/<\/head/, result.body+"<\/body");
      response = response.replace(/<a href/g, "<a owshref");
     }
     resp.end(iconv.encode(response,'GBK'));
     //resp.end(response);
    });
    

  });

  request.get(url)
      .on('response',
        function (response) {
          //Here you can modify the headers
          resp.writeHead(response.statusCode, response.headers);
        }
      ).pipe(write);
});

router.get("*", function(req, resp, next) {
  var referer = unescape(req.headers['referer']);
  var index = referer.indexOf("load1?url");
  var originURL = referer.substring(index+10, referer.length);
  var path = req.url;
  var fullpath = originURL + path;
  request.get(fullpath)
      .on('response',
        function (response) {
          //Here you can modify the headers
          console.log(response.headers['content-type']);
          //resp.writeHead(response.statusCode, response.headers);
        }
      ).pipe(resp);
});

module.exports = router;
