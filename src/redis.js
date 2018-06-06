var redis = process.env.NODE_ENV === 'test'
  ? require('fakeredis')
  : require('redis')

module.exports = redis.createClient
