const routes = require('express').Router()

const controler = require('../controllers/functions')


routes.post('/register_user', controler.register_user)
routes.post('/user_login', controler.login)
routes.get('/host_meeting', controler.host_meeting)
routes.get('/join_meeting', controler.join_meeting)

module.exports = routes