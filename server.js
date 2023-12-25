require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const { logger, logEvents } = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')
const corsOptions = require('./config/corsOptions')
const connectDb = require('./config/dbConn')
const mongoose = require('mongoose')
const PORT = process.env.PORT || 3500

connectDb()
app.use(logger)
app.use(cookieParser())
app.use(cors(corsOptions))
app.use(express.json())

app.use('/', express.static(path.join(__dirname, 'public')))

app.use('/', require('./routes/root'))
app.use('/user', require('./routes/userRoutes'))

app.all('*', (req, res) => {
    res.status(404)
    if (req.accepts('html'))
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    else if (req.accepts('json'))
        res.json({ message: '404 Not Found' })
    else
        res.type('txt').send('404 Not Found')
})

app.use(errorHandler)

// mongoose.connect(process.env.DATABASE_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(() => app.listen(PORT, () => console.log(`Server Running on Port: http://localhost:${PORT}`)))
//     .catch((error) => console.log(`${error} did not connect`));

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => console.log(`Listening to port : ${PORT}`))
})

mongoose.connection.on('error', err => {
    console.log(err)
    logEvents(`${err.no}:${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrorLog.log')
})
