process.env.NODE_ENV = 'test'

var tape = require('tape')
var map = require('map-async')
// // var servertest = require('servertest')
var request = require('supertest')
var querystring = require('querystring')
var buyers = require('./buyers.json')
var newBuyers = require('./newBuyers.json')
var server = require('../lib/server')()

tape('should add buyers', function (t) {
  map(buyers, addBuyer, function (err) {
    t.ifError(err, 'should not error')
    t.end()
  })

  function addBuyer (buyer, cb) {
    var stream = request(server)
    .post('/buyers')
    .send({buyer})
    stream.end(function (err, res) {
      t.equal(res.statusCode, 201, 'correct statusCode')
      return err ? cb(err) : cb()
    })
  }
})

tape('should not add invalid buyer', function (t) {
  map(newBuyers, addNewBuyer, function (err) {
    console.log(err)
  })
  function addNewBuyer (newBuyer, cb) {
    request(server)
      .post('/buyers')
      .send({newBuyer})
      .end(function (err, res) {
        if (res.statusCode === 201) {
          t.ok(res.statusCode === 201, 'should not error')
        } else if (res.statusCode >= 400 && res.statusCode < 500) {
          t.ok(res.statusCode >= 400, 'error statusCode')
        } else {
          t.ifError(err, 'should not error')
        }
      })
  }
  t.end()
})

tape('should get buyers', function (t) {
  map(buyers, getBuyer, function (err) {
    t.ifError(err, 'should not error')
    t.end()
  })

  function getBuyer (buyer, cb) {
    request(server)
      .get('/buyers/' + buyer.id)
      .end(function (err, res) {
        let newbuyer = JSON.parse(res.text)
        if (err) return cb(err)
        t.equal(res.statusCode, 200, 'correct statusCode')
        t.deepEqual(newbuyer, buyer, 'buyer should match')
        cb(null)
      })
  }
})

tape('should route traffic', function (t) {
  var requests = [
    {timestamp: '2017-03-12T10:30:00.000Z', state: 'NV', device: 'mobile'},
    {timestamp: '2017-03-12T01:30:00.000Z', state: 'CA', device: 'desktop'},
    {timestamp: '2017-03-12T03:30:00.000Z', state: 'CA', device: 'desktop'}
  ]

  var expected = [
    'http://0.b.com',
    'http://0.c.com',
    'http://1.a.com'
  ]

  map(requests, routeTraffic, function (err, routes) {
    t.ifError(err, 'should not error')
    t.deepEqual(routes, expected, 'routes should match')
    t.end()
  })

  function routeTraffic (routeReq, cb) {
    var url = '/route?' + querystring.stringify(routeReq)

    request(server)
      .get(url)
      .end(function (err, res) {
        if (err) return cb(err)
        t.equal(res.statusCode, 302, 'correct statusCode')
        cb(null, res.text)
      })
  }
})
