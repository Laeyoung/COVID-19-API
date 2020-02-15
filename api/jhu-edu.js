const express = require('express')
const router = express.Router()

const GoogleSpreadsheet = require('google-spreadsheet')
const async = require('async')

// spreadsheet key is the long id in the sheets URL
const doc = new GoogleSpreadsheet('1wQVypefm946ch4XDp37uZ-wartW4V7ILdg-qYiDXUHM')
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

const schedule = require('node-schedule')
schedule.scheduleJob('42 * * * *', updateDataSet) // Call every hour at 42 minutes

const responseSet = {
  latest: '{}',
  brief: '{}'
}

const request=require('request')
const csv=require('csvtojson')

const csvPath = {
  confirmed: "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv",
  deaths: "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv",
  recovered: "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv"
}

const dataSource = {
  confirmed: {},
  deaths: {},
  recovered: {}
}

Object.entries(csvPath).forEach(([category, path]) => {
  console.log(category + ': ' + path)

  let index = 0

  csv()
    .fromStream(request.get(path))
    .subscribe((json) => {
      dataSource[category][index++] = json
      //console.log(json)

      return new Promise((resolve, reject) => {
        resolve()
      })
    }, function onError (_err) {

    }, function onComplete () {
      console.log(Object.keys(dataSource[category]).length)
      //console.log(recovered)
    })
})



router.get('/latest', function (req, res) {
  res.status(200).send(responseSet.latest)
})

router.get('/brief', function (req, res) {
  res.status(200).json(responseSet.brief)
})

function replacer (key, value) {
  switch (key) {
    case 'id':
    case '_xml':
    case '_links':
      return undefined
    default:
      return value
  }
}

function addLocation (item) {
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

function updateDataSet () {
  console.log('Updated at ' + new Date().toISOString())

  let sheet

  async.series(
    [
      function setAuth (step) {
        doc.useServiceAccountAuth(creds, step)
      },
      function getInfoAndWorksheets (step) {
        doc.getInfo(function (err, info) {
          if (err) return res.status(400).send(err)

          console.log('Loaded doc: '+info.title+' by '+info.author.email)
          sheet = info.worksheets[0]
          console.log('sheet 1: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount)
          step()
        })
      },
      function workingWithRows (step) {
        // google provides some query options
        sheet.getRows({
          offset: 1,
          limit: 1000,
          orderby: 'col2'
        }, function (_err, rows) {
          console.log('Read ' + rows.length + ' rows')

          responseSet.latest = JSON.stringify(
            rows.map(row => addLocation(row)),
            replacer
          )

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

          responseSet.brief = total
          step()
        })
      }
    ], function (err) {
      if (err) console.log('Error: ' + err)
    })
}
updateDataSet()

module.exports = router
