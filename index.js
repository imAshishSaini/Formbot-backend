const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const userRouter = require('./routes/user')
const workspaceRouter = require('./routes/workspace')
const folderRouter = require('./routes/folder')
const formRouter = require('./routes/form')

dotenv.config()
const app = express()
const cors = require('cors')

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/api/user', userRouter)
app.use('/api/workspace', workspaceRouter)
app.use('/api/folder', folderRouter)
app.use('/api/form', formRouter)

mongoose.connect(process.env.MONGOOSE_URI_STRING, {})
  .then(() => console.log('Connected to database'))
  .catch((err) => console.log('Error connecting to database', err));


app.listen(process.env.PORT || 3000, () => console.log('Server started on port', process.env.PORT || 3000))