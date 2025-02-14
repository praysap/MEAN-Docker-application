const express = require('express');
const route = express.Router(); 
const auth = require('../../middleware/auth')
const elasticUsersController = require('../controllers/elastic.controller.js');
const router = require('./users.route.js');

// Get line chart data
route.post(
    '/eventsData',
    auth.verifyToken,
    elasticUsersController.eventsData
  );
  

module.exports = route