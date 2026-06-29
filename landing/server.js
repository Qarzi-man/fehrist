const express = require('express')
const path    = require('path')

const app = express()

app.use((req, res, next) => {
  if (req.hostname === 'daftarcha.tj') {
    return res.redirect(301, 'https://www.daftarcha.tj' + req.url)
  }
  next()
})

app.use(express.static(__dirname))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Landing running on port ${PORT}`))
