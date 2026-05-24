require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')

const app = express()

connectDB()

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())

app.use('/auth', require('./routes/auth'))
app.use('/api/schedule', require('./routes/schedule'))
app.use('/api/templates', require('./routes/templates'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
