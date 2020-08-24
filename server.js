const express = require('express')
const upload_file = require('express-fileupload')
const app = express()
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const http = require('http').Server(app)
const io = require ('socket.io')(http)
const bodyParser = require('body-parser');


const routes  = require('./router/routes')
const ioFuctions  = require('./controllers/ioFunctions')

// app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(upload_file())

// app.use(express.json())



//CONFIGURE ENVIRONMENT VARIABLE HOLDER
dotenv.config()

//DATABASE CONNECTION
mongoose.connect(process.env.DB_CONNECT, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false}, (err) => {
  if(err) return console.log(`Error: ${err}`)
  console.log("We are connected")
})

app.use((req, resp, next) => {
  resp.header('Access-Control-Allow-Origin', '*')
  resp.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE')
  resp.header('Access-Control-Allow-headers', 'Content-type, Accept, x-access-token, x-key')

  if(req.method === 'OPTIONS') {
      resp.status(200).end()
  } else {
      next()
  }
})

app.use('/', routes)

app.use(express.static(__dirname + "/public"))
let clients = 0

io.on('connection', function (socket) {
  // VIDEO FUNCTIONALITIES
  socket.on('newClient', function () {
    if (clients < 2) {
      if (clients == 1) {
        this.emit('createPeer')
      }
    } else {
      this.emit('sessionActive')
    }
    clients++
  })

  socket.on('offer', ioFuctions.sendOffer)
  socket.on('answer', ioFuctions.sendAnser)
  socket.on('disconnect', Disconnect)


  // CHATTING FUNCTIONALITIES
  socket.on('newUser', ioFuctions.sendNewUser)

  socket.on('chat', ioFuctions.broadcastMsg)

  socket.on('typing', (user) => {
    socket.broadcast.emit('userTyping', `${user} is typing...`)
  })

  socket.on('finish', (user) => {
    socket.broadcast.emit('userStoppedTyping', user)
  })
})

function Disconnect () {
  if (clients > 0) {
    clients--
    this.broadcast.emit('removeVideo')
  }
}

//Custom Error Handler middleware
app.use((error, req, resp, next) => {
  resp.status(error.status || 500)

  resp.json({
      status: error.status,
      message: error.message,
      // stack: error.stack
  })
})

const port = process.env.PORT || 3000
http.listen(port, () => console.log(`Server active on port ${port}`))
