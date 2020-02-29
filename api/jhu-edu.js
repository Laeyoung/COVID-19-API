const express = require('express')
const router = express.Router()

const nestedProperty = require('nested-property')

const column = {
  PROVINCE_STATE: 'provincestate',
  COUNTRY_REGION: 'countryregion',
  LAST_UPDATE: 'lastupdate',
  CONFIRMED: 'confirmed',
  DEATHS: 'deaths',
  RECOVERED: 'recovered'
}

const request = require('request')
const csv = require('csvtojson')
const csvPath = {
  confirmed: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv',
  deaths: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv',
  recovered: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv'
}

// World cities dataset from https://simplemaps.com/data/world-cities
const countries = require('../dataset/countries.json')
const states = require('../dataset/states.json')
const cities = require('../dataset/cities.json')

const schedule = require('node-schedule')
schedule.scheduleJob('42 * * * *', updateCSVDataSet) // Call every hour at 42 minutes

const responseSet = {
  brief: '{}',
  latest: '{}',
  timeseries: '{}'
}
let lastUpdate

router.get('/brief', function (req, res) {
  res.status(200).json(responseSet.brief)
})

router.get('/latest', function (req, res) {
  res.status(200).send(responseSet.latest)
})

router.get('/timeseries', function (req, res) {
  res.status(200).send(responseSet.timeseries)
})

function updateCSVDataSet () {
  console.log('Updated at ' + new Date().toISOString())

  const dataSource = {
    confirmed: {},
    deaths: {},
    recovered: {}
  }
  lastUpdate = new Date().toISOString()
  const queryPromise = []

  Object.entries(csvPath).forEach(([category, path]) => {
    queryPromise.push(queryCsvAndSave(dataSource, path, category))
  })
  Promise.all(queryPromise)
    .then((_values) => {
      const brief = {
        [column.CONFIRMED]: 0,
        [column.DEATHS]: 0,
        [column.RECOVERED]: 0
      }
      const latest = {}
      const timeseries = {}

      for (const [category, value] of Object.entries(dataSource)) {
        for (const [name, item] of Object.entries(value)) {
          const keys = Object.keys(item)
          const latestCount = Number(item[keys[keys.length - 1]])

          // For brief
          brief[category] += latestCount

          // For latest
          createPropertyIfNeed(latest, name, item)
          latest[name][category] = latestCount

          // For timeseries
          createPropertyIfNeed(timeseries, name, item)
          for (const date of keys.slice(4)) {
            nestedProperty.set(timeseries[name], `timeseries.${date}.${category}`, Number(item[date]))
          }
        }
      }

      responseSet.brief = brief
      responseSet.latest = JSON.stringify(Object.values(latest))
      responseSet.timeseries = JSON.stringify(Object.values(timeseries))
      console.log(`Confirmed: ${brief.confirmed}, Deaths: ${brief.deaths}`)
    })
    .catch((error) => {
      console.log('Error on queryPromise: ' + error)
    })
}

function queryCsvAndSave (dataSource, path, category) {
  return csv()
    .fromStream(request.get(path))
    .subscribe((json) => {
      if (json['Province/State']) {
        const provincestate = json['Province/State']
        dataSource[category][provincestate] = json
      } else if (json['Country/Region']) {
        const countryregion = json['Country/Region']
        dataSource[category][countryregion] = json
      }

      return new Promise((resolve, reject) => {
        resolve()
      })
    })
}

function createPropertyIfNeed (target, name, item) {
  if (!nestedProperty.has(target, name)) {
    target[name] = {
      [column.PROVINCE_STATE]: item['Province/State'],
      [column.COUNTRY_REGION]: item['Country/Region'],
      [column.LAST_UPDATE]: lastUpdate,
      location: {
        lat: Number(item.Lat),
        lng: Number(item.Long)
      }
    }
  }
}

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

updateCSVDataSet()

module.exports = router
