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

let sheet

router.get('/latest', function (req, res) {
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
          res.status(200).send(JSON.stringify(rows, replacer))
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

module.exports = router