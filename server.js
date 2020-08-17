const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require ('socket.io')(http)
const port = process.env.PORT || 3000

app.use(express.static(__dirname + "/public"))
let clients = 0

io.on('connection', function (socket) {
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

  socket.on('offer', sendOffer)
  socket.on('answer', sendAnser)
  socket.on('disconnect', Disconnect)
})


function Disconnect() {
  if (clients > 0) {
    clients--
    this.broadcast.emit('removeVideo')
  }
}

function sendOffer(offer) {
  this.broadcast.emit('backOffer', offer)
}

function sendAnser(data) {
  this.broadcast.emit('backAnswer', offer)
}

http.listen(port, () => console.log(`Server active on port ${port}`))
