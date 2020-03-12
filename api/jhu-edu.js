const express = require('express')
const router = express.Router()

const lookup = require('country-code-lookup')
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

const fixedCountryCodes = require('../dataset/country-codes.json')
const iso2CountryLoc = require('../dataset/iso2-country-loc.json')

const schedule = require('node-schedule')
schedule.scheduleJob('42 * * * *', updateCSVDataSet) // Call every hour at 42 minutes

const responseSet = {
  brief: '{}',
  latest: '{}',
  latestOnlyCountries: '{}',
  timeseries: '{}',
  timeseriesOnlyCountries: '{}'
}
let lastUpdate

router.get('/brief', function (req, res) {
  res.status(200).json(responseSet.brief)
})

router.get('/latest', function (req, res) {
  const { iso2, iso3, onlyCountries } = req.query

  let latest = onlyCountries ? responseSet.latestOnlyCountries : responseSet.latest

  if (iso2) latest = filterIso2code(latest, iso2)
  if (iso3) latest = filterIso3code(latest, iso3)

  res.status(200).send(JSON.stringify(latest))
})

router.get('/timeseries', function (req, res) {
  const { iso2, iso3, onlyCountries } = req.query

  let timeseries = onlyCountries ? responseSet.timeseriesOnlyCountries : responseSet.timeseries

  if (iso2) timeseries = filterIso2code(timeseries, iso2)
  if (iso3) timeseries = filterIso3code(timeseries, iso3)

  res.status(200).send(JSON.stringify(timeseries))
})

function filterIso2code (source, code) {
  return source.filter(item => {
    const countryCode = item.countrycode ? item.countrycode.iso2 : 'unknown'
    return countryCode === code
  })
}

function filterIso3code (source, code) {
  return source.filter(item => {
    const countryCode = item.countrycode ? item.countrycode.iso3 : 'unknown'
    return countryCode === code
  })
}

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
      responseSet.latest = Object.values(latest)
      responseSet.timeseries = Object.values(timeseries)

      // Uses deep copy
      // https://stackoverflow.com/a/122704/3614334
      const copyLatest = JSON.parse(JSON.stringify(latest))
      responseSet.latestOnlyCountries = getMergedByCountry(Object.values(copyLatest))
      const copyTimeseries = JSON.parse(JSON.stringify(timeseries))
      responseSet.timeseriesOnlyCountries = getMergedByCountry(Object.values(copyTimeseries))

      console.log(`Confirmed: ${brief.confirmed}, Deaths: ${brief.deaths}`)
    })
    .catch((error) => {
      console.log('Error on queryPromise: ' + error)
    })
}

function getMergedByCountry (list) {
  const mergedList = { }

  for (const item of list) {
    const countryName = item.countryregion

    if (mergedList[countryName]) {
      const country = mergedList[countryName]

      // for latest api
      mergeConfirmDeathRecover(country, item)

      // for timeseries api
      if (item.timeseries) {
        const timeseries = item.timeseries
        const mergedTimeseries = country.timeseries

        for (const key of Object.keys(timeseries)) {
          mergeConfirmDeathRecover(mergedTimeseries[key], timeseries[key])
        }
      }

      // Overwrite location
      if (item.countrycode) {
        const iso2 = item.countrycode.iso2
        country.location = iso2CountryLoc[iso2]
      }
    } else {
      delete item.provincestate
      mergedList[countryName] = item
    }
  }

  return Object.values(mergedList)
}

function mergeConfirmDeathRecover (target, item) {
  if (!(target && item)) return

  if (item.confirmed) merge(target, item, 'confirmed')
  if (item.deaths) merge(target, item, 'deaths')
  if (item.recovered) merge(target, item, 'recovered')
}

function merge (target, item, key) {
  const cur = target[key] ? target[key] : 0
  const add = item[key] ? item[key] : 0

  target[key] = cur + add
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

    // Append country codes
    const countryName = item['Country/Region']
    if (lookup.byCountry(countryName)) {
      appendCountryCode(lookup.byCountry(countryName))
    } else if (fixedCountryCodes[countryName]) {
      appendCountryCode(lookup.byCountry(fixedCountryCodes[countryName]))
    }
  }

  function appendCountryCode (countryCode) {
    target[name].countrycode = {
      iso2: countryCode.iso2,
      iso3: countryCode.iso3
    }
  }
}

updateCSVDataSet()

module.exports = router
