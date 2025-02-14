const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth')
const elastic = require('elasticsearch')
const bodyParser = require('body-parser').json();
const roleMiddleware = require("../../middleware/roleMiddleware");
//const dbConn =require("../../config/db.config.js")
const usersController = require('../controllers/users.controller.js');
var { LOGIN,CREATE_USER } = require('../validator/validator.js');
const IP = require('ip');

router.get('/getuserList',auth.verifyToken, usersController.getUserList);


router.get('/getuserList/:id',auth.verifyToken, usersController.getUserListByID);

router.post('/createUser',CREATE_USER, usersController.createUser); 

router.post('/addUser',auth.verifyToken,  usersController.addUser);

// create user
router.post("/createUser", CREATE_USER, usersController.createUser);

router.post('/saveUserData', usersController.saveUserData);



//router.post('/savenewuser', usersController.savenewuser )

router.post(
  "/addUser",
  auth.verifyToken,
  roleMiddleware.checkForbiddenRoles(["user"]),
  usersController.addUser
);
// login user
router.post('/login',LOGIN, usersController.loginUser);

// forgot password
router.post('/forgot', usersController.forgotPassword);

// Recover Password
router.post('/recoverPassword', usersController.recoverPassword);

// Change Password
router.post('/change-password', auth.verifyToken,usersController.changePassword);

// logout API
router.get('/logout',usersController.logOut);

// Log Alert API
router.post('/logAlert', auth.verifyToken, usersController.getAlllogs);

// Log Alert CVE
router.post('/logAlertCVE', auth.verifyToken, usersController.getlogCVE);

// chips
router.get('/chips', auth.verifyToken, usersController.getChips);
//known attack table
router.get('/knownAttacks', auth.verifyToken, usersController.getKnownAttackTable);

//unknown Attacks table
router.get('/unknownAttacks', auth.verifyToken, usersController.getUnknownAttackTable);

//Log Based Table table
router.get('/logBasedTable', auth.verifyToken, usersController.getLogBasedTable);

//Port Based Table table
router.get('/portBasedTable', auth.verifyToken, usersController.getPortBasedTable);

//Line Chart Dot
router.post('/lineChartDot', auth.verifyToken, usersController.getLineChartDot);


router.get('/yourip',auth.verifyToken, usersController.getyourIp )

// view users
router.get(
    "/viewUsers",
    auth.verifyToken,
    roleMiddleware.checkForbiddenRoles(["user"]),
    usersController.viewUsers
  );
  
  // view Pending users
  router.get(
    "/viewPendingUsers",
    auth.verifyToken,
    roleMiddleware.checkForbiddenRoles(["user"]),
    usersController.viewPendingUsers
  );
  
  // Edit user
  router.post(
    "/editUser",
    auth.verifyToken,
    roleMiddleware.checkForbiddenRoles(["user"]),
    usersController.editUser
  );
  
  // Delete user
  router.post(
    "/deleteUser",
    auth.verifyToken,
    roleMiddleware.checkForbiddenRoles(["user"]),
    usersController.deleteUser
  );
  
 
module.exports = router;
