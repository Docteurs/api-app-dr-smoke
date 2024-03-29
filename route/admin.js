
var express = require('express');
var router = express.Router();
var controller = require('../controller/admin');
const token = require('../middelware/authToken');
const multer = require('../middelware/multer');


router.post('/inscription', controller.InscriptionAdmin);
router.post('/connexion', controller.connexionAdmin);
router.get('/admin/:uuid', token, controller.getInfoMagasin)
router.put('/admin/update-boutique/:uuid', token, multer, controller.updateBoutique)
// router.put('/user-promotion', token, controller.userPromotion);
router.post('/gestion-stock/create', token, multer, controller.gestionStockCreate);
router.get('/get-one-produit/:uuid', token, controller.getOneProduit);
router.get('/get-all-produit/', token, controller.getAllProduit);
router.post('/update-one-produit/:uuid', token, multer, controller.updateOneProduit);
router.get('/commande-admin/', token, controller.commandeAdmin);

// router.post('/gestion-stock/update', token, multer, controller.gestionStockCreate);
// router.post('/gestion-stock/remove', token, multer, controller.gestionStockCreate);
module.exports = router;