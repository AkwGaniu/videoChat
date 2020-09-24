const Model = require('../model/schema')

const settings = require('./baseData')

// CHAT FUNCTIONS
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
  this.broadcast.emit('backAnswer', data)
}

module.exports.endMeeting = function(meeting) {
  try {
    Model.meetings.findOneAndUpdate(
      {_id: meeting.meeting},
      {status: settings.MEETING_STATUS.CLOSED},
      {new: true}, async (err, data)=> {
        if (err) throw(err)
        let participants = await Model.participants.find({meeting_id: meeting.meeting})
        for (let i=0; i<participants.length; i++) {
          await Model.participants.findOneAndDelete({_id: participants[i]._id})
        }
        this.broadcast.emit('meetingEnded')
    })    
  } catch (error) {
    console.log(error)
    next(error)
  }

}

module.exports.leaveMeeting = function (datas) {
  try {
    const msg = {
      message: '',
      meetingParticipants: []
    }
    Model.participants.findOneAndDelete({
      participant: datas.participant,
      meeting_id: datas.meeting
    }, async (err, data)=> {
      if (err) console.log(err)
      let recipient = await Model.users.findOne({_id: data.participant}, {password: false})
      msg.message = `${recipient.names} left`
      Model.participants.find({meeting_id: data.meeting_id}, async (err, data)=> {
        if (err) throw err
        for (user of data) {
          let recipient = await Model.users.findOne({_id: user.participant}, {password: false})
          msg.meetingParticipants.push(recipient)
        }
        this.broadcast.emit('participantLeft', msg)
      })
    })
  } catch (err) {
    console.log(err)
    next(err)
  }
}

