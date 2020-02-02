const express = require('express')
const router = express.Router()

const GoogleSpreadsheet = require('google-spreadsheet')
const async = require('async')
 
// spreadsheet key is the long id in the sheets URL
const doc = new GoogleSpreadsheet('1yZv9w9zRKwrGTaR-YzmAqMefw4wMlaXocejdxZaTs6w')
const creds = require('../google-generated-creds.json')
const column = {
  PROVINCE_STATE: 'provincestate',
  COUNTRY_REGION: 'countryregion',
  LAST_UPDATE: 'lastupdate',
  CONFIRMED: 'confirmed',
  DEATHS: 'deaths',
  RECOVERED: 'recovered'
}

// World cities dataset from https://simplemaps.com/data/world-cities
const countries = require('../dataset/countries.json')
const states = require('../dataset/states.json')
const cities = require('../dataset/cities.json')

console.log(Object.keys(countries).length)
console.log(Object.keys(states).length)
console.log(Object.keys(cities).length)

router.get('/latest', function (req, res) {
  let sheet

  async.series(
    [
      function setAuth(step) {
        doc.useServiceAccountAuth(creds, step)
      },
      function getInfoAndWorksheets(step) {
        doc.getInfo(function(err, info) {
          console.log('Loaded doc: '+info.title+' by '+info.author.email)
          sheet = info.worksheets[0]
          console.log('sheet 1: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount)
          step()
        })
      },
      function workingWithRows(step) {
        // google provides some query options
        sheet.getRows({
          offset: 1,
          limit: 1000,
          orderby: 'col2'
        }, function( err, rows ){
          console.log('Read '+rows.length+' rows')

          res.status(200).send(
            JSON.stringify(
              rows.map(row => addLocation(row)),
              replacer
            )
          )
          step()
        })
      },
    ], function(err){
        if( err ) {
          console.log('Error: '+err)
        }
    })
})

router.get('/brief', function (req, res) {
  let sheet

  async.series(
    [
      function setAuth(step) {
        doc.useServiceAccountAuth(creds, step)
      },
      function getInfoAndWorksheets(step) {
        doc.getInfo(function(err, info) {
          sheet = info.worksheets[0]
          step()
        })
      },
      function workingWithRows(step) {
        // google provides some query options
        sheet.getRows({
          offset: 1,
          limit: 1000,
          orderby: 'col2'
        }, function(err, rows) {
          const total = {
            [column.CONFIRMED]: 0,
            [column.DEATHS]: 0,
            [column.RECOVERED]: 0
          }

          for (const row of rows) {
            total[column.CONFIRMED] += Number(row[column.CONFIRMED])
            total[column.DEATHS] += Number(row[column.DEATHS])
            total[column.RECOVERED] += Number(row[column.RECOVERED])
          }

          res.status(200).json(total)
          step()
        })
      },
    ], function(err){
        if( err ) {
          console.log('Error: '+err)
        }
    })
})

function replacer(key, value) {
  switch (key) {
    case 'id':
    case '_xml':
    case '_links':
      return undefined
    default:
      return value
  }
}

function addLocation(item) {
  if (item.provincestate && states[item.provincestate]) {
    const state = states[item.provincestate]

    item.location = {
      lat: state.lat,
      lng: state.lng
    }
  } else if (item.countryregion && countries[item.countryregion]) { 
    const country = countries[item.countryregion]

    item.location = {
      lat: country.lat,
      lng: country.lng
    }
  } else if (item.provincestate && cities[item.provincestate]) { // Added for US case.
    const city = cities[item.provincestate]

    item.location = {
      lat: city.lat,
      lng: city.lng
    }
  }

  return item
}

module.exports = router