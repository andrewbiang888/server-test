var URL = require('url')
var http = require('http')
var client = require('../src/redis.js')()
var buyersJson = require('../test/buyers.json')
var cuid = require('cuid')
var sendJson = require('send-data/json')
var HttpHashRouter = require('http-hash-router')
var router = HttpHashRouter()
router.set('/buyers', function(req, res) {

  parseBody(req, res, function (body) {

    if (body.buyer) {
      var buyer = body.buyer
      client.set(buyer.id, JSON.stringify(buyer))

      res.writeHead(201)
      res.end();
    } else if (body.newBuyer) {
      var newBuyer = body.newBuyer
      if (newBuyer.id != null && newBuyer.offers != null) {
        res.writeHead(201)
        res.end();
      } else {
        res.statusCode = 400
        res.end()
      }
    }
    res.writeHead(400)
    res.end();
  });
})
router.set('/buyers/:id', function (req, res, opts) {
  
  var id = JSON.stringify(opts.params.id)
  var data = buyersJson.find( function(e) {
    return e.id == opts.params.id
  })
  data = JSON.stringify(data)
  client.set(id, data)
  client.get(id, function(err, reply) {
    res.end((reply))
  })
})
router.set('/route', function (req, res, opts) {
  var timestamp = opts.query.timestamp
  var day = new Date(timestamp).getUTCDay()
  var hour = new Date(timestamp).getUTCHours()
  var state = opts.query.state
  var device = opts.query.device
  
  var asyncCounter = 0;
  client.keys('*', function (err, keys) {
    var options = []
    keys.forEach(function (data) {
      asyncCounter++;
      client.get(data, function (err, reply) {
        asyncCounter--;
        reply = JSON.parse(reply)
        var offers = reply.offers
        offers.forEach( function (offerData) {
          var deviceDb = offerData.criteria.device
          var stateDb = offerData.criteria.state
          var hourDb = offerData.criteria.hour
          var dayDb = offerData.criteria.day
          if (stateDb.includes(state) && deviceDb.includes(device) && hourDb.includes(hour) && dayDb.includes(day)) {
            if (options[0]) {
              if (options[0].value < offerData.value) {
                options[0] = {value: offerData.value, location: offerData.location}   
              }
            } 
            else {
              options[0] = {value: offerData.value, location: offerData.location}                 
            }
          }
        })
        if (asyncCounter === 0) {
          res.writeHead(302)
          res.end(options[0].location)
        }
      })

    })
  })
  
})

module.exports = function createServer () {
  return http.createServer(serverHandler)
}
function serverHandler (req, res) {
  router(req, res, { query: getQuery(req.url) }, onError.bind(null, req, res))  
}
function onError (req, res, err) {
  if (!err) return

  if (err) {
    res.statusCode = err.statusCode || 500

    sendJson(req, res, {
      error: err.message || http.STATUS_CODES[res.statusCode]
    })
  }
}
function logError (req, res, err) {
  if (process.env.NODE_ENV === 'test') return

  var logType = res.statusCode >= 500 ? 'error' : 'warn'

  console[logType]({
    err: err,
    requestId: req.id,
    statusCode: res.statusCode
  }, err.message)
}

function empty (req, res) {
  res.writeHead(204)
  res.end()
}
function parseBody (req, res, cb) {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', function (chunk) {
        body += chunk.toString()
    });
    req.on('end', function () {
      cb(JSON.parse(body))
    });
  }
}
function getQuery (url) {
  return URL.parse(url, true).query
}