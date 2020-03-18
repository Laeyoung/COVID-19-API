const express = require('express')
const router = express.Router()

const fetch = require('node-fetch')
const fs = require('fs')
const url = 'https://raw.githubusercontent.com/LiveCoronaDetector/livecod/master/data/koreaRegionalData.js'
const tempFilePath = './dataset/temp-kcdc.js'
const tempModulePath = '../dataset/temp-kcdc.js'
const exportModule = 'module.exports = koreaRegionalData;'

const schedule = require('node-schedule')
schedule.scheduleJob('12 * * * *', updateDataSet) // Call every hour at 12 minutes

let koreaRegionalData = {}

router.get('/brief', function (req, res) {
  res.status(200).json(koreaRegionalData)
})

async function updateDataSet () {
  console.log('Korea KCDC Updated at ' + new Date().toISOString())

  try {
    const response = await fetch(url)
    const body = await response.text()

    fs.writeFile(tempFilePath, body + exportModule, function (err) {
      if (err) {
        console.error(err)
      } else {
        try {
          koreaRegionalData = require(tempModulePath)
          console.log('Korea KCDC data was saved!')
        } catch (e) {
          console.error(e)
          koreaRegionalData = {}
        }
      }
    })
  } catch (e) {
    console.error(e)
    koreaRegionalData = {}
  }
}

updateDataSet()

module.exports = router
