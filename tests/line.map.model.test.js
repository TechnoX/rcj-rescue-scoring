"use strict"
const mongoose = require('mongoose')
mongoose.connect("mongodb://localhost/test")

const assert = require('assert')
const async = require('async')
const League = require('../models/league.model')
const Competition = require('../models/competition.model')
const Map = require('../models/map.model')
const LineMap = require('../models/line.map.model')
//const TileType = require('../leagues/line/tileType').tileType

describe('line.map.model', function () {
  before(function (done) {
    async.parallel([
        (callback) => {
          League.remove({}, (err) => {
            return callback(err)
          })
        },
        (callback) => {
          Competition.remove({}, (err) => {
            return callback(err)
          })
        },
        (callback) => {
          Map.remove({}, (err) => {
            return callback(err)
          })
        },
        (callback) => {
          LineMap.remove({}, (err) => {
            return callback(err)
          })
        }
      ],
      (err) => {
        return done(err)
      }
    )
  })

  var line
  it('create line league', function (done) {
    line = new League({name: "Line"})

    assert(!line.errors)

    line.save((err) => {
      return done(err)
    })
  })

  var competition
  it('create competition', function (done) {
    competition = new Competition({name: "TestComp", leagues: [line._id]})

    assert(!competition.errors)

    competition.save((err) => {
      return done(err)
    })
  })

  var map
  it('create line map', function (done) {
    map = new LineMap({
      name             : "TestMap",
      competition      : competition._id,
      league           : line._id,
      height           : 1,
      width            : 2,
      length           : 3,
      startTile        : {
        x: 0,
        y: 0,
        z: 0
      },
      numberOfDropTiles: 1
    })

    assert(!map.errors)

    map.save((err) => {
      return done(err)
    })
  })

  it('get map', function (done) {
    Map.get(map.id)
      .then((data) => {
        //console.log(data)
        assert(data)
        return done()
      })
      .catch((err) => {
        return done(err)
      })
  })

  it('update map', function (done) {
    Map.update(map.id, {name: "TestMap2"})
      .then((data) => {
        //console.log(data)
        assert(data)
        assert.equal(data.name, "TestMap2")
        return done()
      })
      .catch((err) => {
        return done(err)
      })
  })
})