const mongoose = require('mongoose')

const userModel = new mongoose.Schema({
  names: {
      type: String,
      required: true
  },
  user_type: {
      type: String,
      required: true
  },
  email: {
    type: String,
    required: true
  },
  user_profile_image_path: {
    type: String
  },
  password: {
    type: String,
    required: true,
    lenght: 200,
  }
})

const meetingModel = new mongoose.Schema({
  meeting_id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true
  },
  status: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  }
})

const participantsModel = new mongoose.Schema({
  meeting_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "meetings",
    required: true
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true
  }
})

const messagesModel = new mongoose.Schema({
  meeting_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "meetings",
    required: true
  },
  messages: {
    type: Array,
  }
})

module.exports.users = mongoose.model('users', userModel)
module.exports.meetings = mongoose.model('meetings', meetingModel)
module.exports.participants = mongoose.model('participants', participantsModel)
module.exports.messages = mongoose.model('messages', messagesModel)