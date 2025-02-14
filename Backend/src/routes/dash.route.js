const express = require('express');
const route = express.Router(); 
const auth = require('../../middleware/auth')
const dashcontroller = require('../controllers/dash.controller')

route.get('/alertLog', auth.verifyToken, dashcontroller.getAlertLog)

route.get('/portLog', auth.verifyToken, dashcontroller.getPortLog)
module.exports = route