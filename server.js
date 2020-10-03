const express = require('express')
const upload_file = require('express-fileupload')
const app = express()
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const http = require('http').Server(app)
const io = require ('socket.io')(http)
const bodyParser = require('body-parser');


const routes  = require('./router/routes')
const ioFunctions  = require('./controllers/ioFunctions')
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

  socket.on('chat', ioFunctions.broadcastMsg)

  socket.on('typing', (user) => {
    socket.broadcast.emit('userTyping', `${user} is typing...`)
  })

  socket.on('finish', (user) => {
    socket.broadcast.emit('userStoppedTyping', user)
  })

  socket.on('leaveMeeting', ioFunctions.leaveMeeting)

  socket.on('endMeeting', ioFunctions.endMeeting)

  // VIDEO
  socket.on('newClient', async function (recipient) {
    if (clients !== 0) {
      io.of('chat').emit('createPeer')
    } else {
      clients++
    }
    console.log(clients)
  })

  socket.on('offer', ioFunctions.sendOffer)
  socket.on('answer', ioFunctions.sendAnser)
  socket.on('disconnect', ioFunctions.leaveMeeting)
})


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
      // participant: user.recipient._id,
      // meeting_id: user.meeting._id,
      socketId: this.id

    })
    if (!recipentExist) {
      let newParticipant = new Model.participants({
        meeting_id: user.meeting._id,
        participant: user.recipient._id,
        socketId: this.id
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