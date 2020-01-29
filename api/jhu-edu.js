const express = require('express')
const router = express.Router()

router.get('/latest', function (req, res) {
  res.status(200).json({msg: 'latest result'})
})

module.exports = router