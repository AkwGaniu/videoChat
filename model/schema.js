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


module.exports.users = mongoose.model('users', userModel)