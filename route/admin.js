
var express = require('express');
var router = express.Router();
var controller = require('../controller/admin');
const token = require('../middelware/authToken');
const multer = require('../middelware/multer');


router.post('/inscription', controller.InscriptionAdmin);
router.post('/connexion', controller.connexionAdmin);
router.get('/get-ville', controller.getAllVille)
router.put('/user-promotion', token, controller.userPromotion);
router.post('/gestion-stock/create', token, multer, controller.gestionStockCreate);

// router.post('/gestion-stock/update', token, multer, controller.gestionStockCreate);
// router.post('/gestion-stock/remove', token, multer, controller.gestionStockCreate);
module.exports = router;