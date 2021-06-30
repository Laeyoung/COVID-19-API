const express = require('express')
const cors = require('cors');
const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const port = 80

const jhuEdu = require('./api/jhu-edu')
const kcdc = require('./api/korea-kcdc')

app.use('/jhu-edu', jhuEdu)
app.use('/kcdc', kcdc)

app.get('/', (req, res) => res.send('API Service for tracking the COVID-19!'))

app.listen(port, () => console.log(`API Server listening on port ${port}!`))
