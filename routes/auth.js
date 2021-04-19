const express = require("express");
const authController = require('../controllers/auth');
const DBController = require('../controllers/dbActions');
const fileUploadcontroller = require('../controllers/fileUpload');
const router = express.Router();

//MIDDLEWARE  FUNCTIONS
//use all of the exported functions in the corresponding controllers  file
//authController = uses auth.js in  the controllers folder
//example: /register uses the register function in the auth.js file in the controllers folder
// (exports.register) 

//same for everyone
//POST = updating info in database
//GET = just getting info from db or just getting info in general

router.post('/register', authController.register);
router.post('/updateUserProfile',  authController.updateUserProfile);
router.post('/updateArtistProfile',  authController.updateArtistProfile);
router.post('/login',  authController.login);
router.get('/logout', authController.logout);


//artists
router.post('/upload', fileUploadcontroller.upload);

router.post('/delete', fileUploadcontroller.delete);

//user
router.get('/viewArtists', DBController.viewArtists);
router.get('/countryReport', authController.countryReport);
router.get('/ageReport', authController.ageReport);

module.exports = router;
