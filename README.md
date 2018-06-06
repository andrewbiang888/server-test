# Code Challenge

This challenge is to route traffic according to buyer rules. You will set up an http server (*do not use* `express`, see [example-server](https://github.com/Interlincx/example-server) if you need an example) that can create and retrieve "buyers". The http server will also route traffic according to the preferences of the buyers.

### Setup
-  run ```npm i``` in order to install required packages.


### Tests
Challenge is evaluated based on tests. Be sure to understand how [`servertest`](https://github.com/rvagg/servertest) works.

- run `npm test` in order to get the tests output


### Challenge Conditions

Your code must follow our [rules and guidelines](https://gist.github.com/davidguttman/e9bcf695ee6e9812fbbc27eceb29372e), and in order to **pass** the challenge **all** tests should be passing like in example below:
```bash
> node test/index.js && standard

TAP version 13
# should add buyers
ok 1 correct statusCode
ok 2 correct statusCode
ok 3 correct statusCode
ok 4 should not error
# should not add invalid buyer
ok 5 should not error
ok 6 error statusCode
# should get buyers
ok 7 correct statusCode
ok 8 buyer should match
ok 9 correct statusCode
ok 10 buyer should match
ok 11 correct statusCode
ok 12 buyer should match
ok 13 should not error
# should route traffic
ok 14 correct statusCode
ok 15 correct statusCode
ok 16 correct statusCode
ok 17 should not error
ok 18 routes should match

1..18
# tests 18
# pass  18

# ok

```


Create a module `lib/server.js` that exports a function. This function, `createServer`, when invoked, should return an http server with the following endpoints:

* `POST /buyers`
* `GET /buyers/:id`
* `GET /route`

All persistence should use [redis](http://redis.io). 
Source code should be in `src` dir and use redis client factory from `src/redis.js`

See `test/index.js` for more details.

### `POST /buyers`

This endpoint accepts a JSON body representing a "buyer" like the following example:

```
{
  "id": "c",
  "offers": [
    {
      "criteria": {
        "device": ["desktop"],
        "hour": [0, 1, 2],
        "day": [0],
        "state": ["CA"]
      },
      "value": 50,
      "location": "http://0.c.com"
    }
  ]
}
```

The buyer has two top-level properties, `id` and `offers`. `offers` is an array of what the "buyer" is offering to buy. In the example, if a request object has the device "desktop", an hour that is one of "0", "1", or "2", a day of "0", and state "CA", that buyer will pay a value of 50 for it to go to location "http://0.c.com".

### `GET /buyers/:id`

This retrieves a "buyer" document by `:id`. Example `/buyers/c` for the above "buyer".

### `GET /route`

This will compare a request object to the offers of the "buyers" and route traffic to the highest valued matching location. Parameters for this endpoint:

* `timestamp`: ISO timestamp (e.g. `new Date().toISOString()`)
* `device`: `"desktop"` or `"mobile"`
* `state`: US State (e.g. "CA", "NY")

Example Request:

`GET /route?timestamp=2017-03-12T10%3A30%3A00.000Z&state=NV&device=mobile`

Example Response Headers:

`{ location: http://0.c.com }`
