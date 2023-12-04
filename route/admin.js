
var express = require('express');
var router = express.Router();
var controller = require('../controller/admin');
const token = require('../middelware/authToken');


router.post('/inscription', controller.InscriptionAdmin);
router.post('/connexion', controller.connexionAdmin);
router.put('/user-promotion', token, controller.userPromotion);


module.exports = router;