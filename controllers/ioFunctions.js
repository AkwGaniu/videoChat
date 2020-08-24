const Model = require('../model/schema')

// CHAT FUNCTIONS
module.exports.sendNewUser = async function  (user) {
  try {
    let meetingPayload = {
      chats: [],
      participants:  []
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
        if(err) throw err

        await Model.messages.findOne({ meeting_id: user.meeting._id }, (err, data)=> {
          if (err) throw err
          meetingPayload.chats = data.messages
        })

        Model.participants.find({meeting_id: data.meeting_id}, async (err, data)=> {
          if (err) throw err
          for (user of data) {
            let recipient = await Model.users.findOne({_id: user.participant}, {password: false})
            meetingPayload.participants.push(recipient)
          }
          this.emit('appendUser', meetingPayload)
        })                                       
      })
    } else {
      let data = {
        participants: user.recipient._id,
        meeting_id: user.meeting._id
      }

      await Model.messages.findOne({ meeting_id: user.meeting._id }, (err, data)=> {
        if (err) throw err
        meetingPayload.chats = data.messages
      })
      
      Model.participants.find({meeting_id: data.meeting_id}, async (err, data)=> {
        if (err) throw err
        for (user of data) {
          let recipient = await Model.users.findOne({_id: user.participant}, {password: false})
          meetingPayload.participants.push(recipient)
        }
        this.emit('appendUser', meetingPayload)
      })
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
}

module.exports.broadcastMsg = async function (msg) {
  let newMessage = {
    sender: msg.sender,
    message: msg.message,
  }
  try {
    const meetingExist = await Model.messages.findOne({ meeting_id: msg.meeting_id })
    if (!meetingExist) {
      let messages = []
      messages.push(newMessage)
      let newChat = new Model.messages({
        meeting_id: msg.meeting_id,
        messages: messages,
      })
      newChat.save((err, data) => {
        if(err) throw err
        this.broadcast.emit('message', data.messages)
      })
    } else {
      meetingExist.messages.push(newMessage)
      await Model.messages
      .findOneAndUpdate(
        {meeting_id: meetingExist.meeting_id},
        {messages: meetingExist.messages},
        {new: true}, async (err, data) => {
          if (err) next(err)
          this.broadcast.emit('message', data.messages)
      }).catch((error) => {
        next(error)
      })
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
}


// VIDEO FUNCTIONS
module.exports.sendOffer = function (offer) {
  this.broadcast.emit('backOffer', offer)
}

module.exports.sendAnser = function (data) {
  this.broadcast.emit('backAnswer', offer)
}

