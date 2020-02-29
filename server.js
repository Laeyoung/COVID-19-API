const express = require('express')
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const port = 80

const jhuEdu = require('./api/jhu-edu')
app.use('/jhu-edu', jhuEdu)

app.get('/', (req, res) => res.send('API Service for tracking the COVID-19!'))

app.listen(port, () => console.log(`API Server listening on port ${port}!`))
