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
const Model = require('./model/schema')


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
const chat = io.of('/chat')
const video = io.of('/video')
let clients = 0

chat.on('connection', function (socket) {
    // CHATTING FUNCTIONALITIES
    socket.on('newUser', sendNewUser)

    socket.on('chat', ioFuctions.broadcastMsg)
  
    socket.on('typing', (user) => {
      socket.broadcast.emit('userTyping', `${user} is typing...`)
    })
  
    socket.on('finish', (user) => {
      socket.broadcast.emit('userStoppedTyping', user)
    })
  
    socket.on('leaveMeeting', ioFuctions.leaveMeeting)
  
    socket.on('endMeeting', ioFuctions.endMeeting)



    // VIDEO
    socket.on('newClient', function () {
      if (clients < 2) {
        if (clients == 1) {
          console.log('yoooo here')
          io.of('chat').emit('createPeer')
        }
      } else {
        this.emit('sessionActive')
      }
      console.log(clients)
      clients += 1
    })
  
    socket.on('offer', ioFuctions.sendOffer)
    socket.on('answer', ioFuctions.sendAnser)
    socket.on('disconnect', Disconnect)
})

video.on('connection', function (socket) {
  socket.on('newClient', function () {
    if (clients < 2) {
      if (clients == 1) {
        io.of('video').emit('createPeer')
      }
    } else {
      this.emit('sessionActive')
    }
    console.log(clients)
    clients += 1
  })

  socket.on('offer', (offer) => {
    console.log('here')
    socket.emit('backOffer', offer)
  })
  socket.on('answer', ioFuctions.sendAnser)
  socket.on('disconnect', Disconnect)
})

function Disconnect () {
  console.log('disconnected')
  // if (clients > 0) {
  //   clients--
  //   this.broadcast.emit('removeVideo')
  // }
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




// FUNCTIONS
const sendNewUser = async function  (user) {
  try {
    let meetingPayload = {
      chats: [],
      participants:  [],
    }
    const recipentExist = await Model.participants.findOne({
      participant: user.recipient._id,
      meeting_id: user.meeting._id
    })
    if (!recipentExist) {
      let newParticipant = new Model.participants({
        meeting_id: user.meeting._id,
        participant: user.recipient._id,
      })
      newParticipant.save( async (err, data) => {
        if(err) next(err)

        await Model.messages.findOne({ meeting_id: user.meeting._id }, (err, data)=> {
          if (err) next(err)
          if (data !== null) {
            meetingPayload.chats = data.messages
          } else {
            meetingPayload.chats = []
          }
        })
        let recipient = await Model.users.findOne({_id: user.recipient._id}, {password: false})
        this.broadcast.emit('userJoined', `${recipient.names} Joined`)
        Model.participants.find({meeting_id: data.meeting_id}, async (err, data)=> {
          if (err) throw err
          for (user of data) {
            let recipient = await Model.users.findOne({_id: user.participant}, {password: false})
            meetingPayload.participants.push(recipient)
          }
          io.of('chat').emit('appendUser', meetingPayload)
        })                                       
      })
    } else {
      let data = {
        participants: user.recipient._id,
        meeting_id: user.meeting._id,
      }
      await Model.messages.findOne({ meeting_id: user.meeting._id }, (err, data)=> {
        if (err) next(err) 
        if (data !== null) {
          meetingPayload.chats = data.messages
        } else {
          meetingPayload.chats = []
        }
      })
      
      Model.participants.find({meeting_id: data.meeting_id}, async (err, data)=> {
        if (err) throw err
        for (user of data) {
          let recipient = await Model.users.findOne({_id: user.participant}, {password: false})
          meetingPayload.participants.push(recipient)
        }
        io.of('chat').emit('appendUser', meetingPayload)
      })
    }
  } catch (error) {
    console.log(error)
  }
}