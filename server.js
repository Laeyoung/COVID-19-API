const express = require('express')
const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = 8080

const jhuEdu = require('./api/jhu-edu')
app.use('/jhu-edu', jhuEdu)

app.get('/', (req, res) => res.send('Hello!'))

app.listen(port,() => console.log(`Example app listening on port ${port}!`))