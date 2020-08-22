
const fs = require('fs')
const cloudinary = require('cloudinary')
const Model = require('../model/schema')
const bcrypt = require('bcryptjs')
// const shortId = require('shortid')

cloudinary.config({ 
  cloud_name: 'djxyqrkmi', 
  api_key: '936229992257755', 
  api_secret: 'f2EmndyU3QzODgVQ6_VP8LnFF3A' 
});

module.exports.register_user = async function(req, resp, next) {
  try {
    if (req.files) {
      const user_profile_image = req.files.file
      const names = req.body.names
      const email = req.body.email
      const user_type = req.body.user_type

       //HASH USER PASSWORD
      const salt = await bcrypt.genSalt(10)
      const password = await bcrypt.hash(req.body.password, salt)

      const allowed_files = [".jpeg", ".JPEG", ".jpg", ".JPG", ".PNG", ".png", ".ppm", ".pgm", ".webp", ".pbm", ".tiff"]
      let file_name = user_profile_image.name
      file_path = './upload/' + file_name

      let start = file_name.indexOf(".")
      let file_type = file_name.slice(start, file_name.length)

      if (allowed_files.includes(file_type)) {
        let userExist = await Model.users.findOne({email: email})
        if (userExist) {
          return resp.status(200).json({reply: `User already exist`})
        } else {
          user_profile_image.mv(file_path, async function(err) {
            if (err) throw(err)
            cloudinary.v2.uploader.upload(file_path, async function(error, result) {
              if (error) return next(error)

              let newUser = new Model.users({
                names: names,
                email: email,
                user_type: user_type,
                password: password,
                user_profile_image_path: result.secure_url,
              })
              savedUser = await newUser.save()
              fs.unlinkSync(file_path)
              resp.status(200).json({reply:"success"})
            })
          })
        } 
      } else {
        return resp.status(200).json({reply: "image not supported"})
      }
    } else {
      resp.status(200).json({reply: "Please provide a profile picture"})
    }
  } catch (error) {
    next(error)
  }
}

module.exports.login = async (req, resp, next) => {
  const email = req.body.email
  const password = req.body.password
  try {
    const user = await Model.users.findOne({email: email})
    if (!user) return resp.status(200).json({reply: "No account found for this email address"})
  
    // CONFIRM USER PASSWORD
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) return resp.status(200).json({reply: "Invalid passsword"})
    resp.status(200).json({
      reply: 'success',
      user: user
    })
  } catch (error) {
    next(error)
  }
}

module.exports.logout = async (req, resp, next) => {
  const email = req.body.email
  const password = req.body.password
  try {
    const user = await Model.users.findOne({email: email})
    if (!user) return resp.status(200).json({reply: "No account found for this email address"})
  
    // CONFIRM USER PASSWORD
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) return resp.status(200).json({reply: "Invalid passsword"})
    resp.status(200).json({
      reply: 'success',
      user: user
    })
  } catch (error) {
    next(error)
  }
}

module.exports.host_meeting = async (req, resp, next) => {
  resp.status(200).redirect('http://localhost:3000/host_meeting.html')
}

module.exports.join_meeting = async (req, resp, next) => {
  resp.status(200).redirect('http://localhost:3000/join_meeting.html')
}