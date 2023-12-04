
var express = require('express');
var router = express.Router();
var controller = require('../controller/user');
const userSchemaInscription = require('../schema/user/inscription');
const userSchemaConnexion = require('../schema/user/connexion');


router.post('/inscription', userSchemaInscription, controller.InscriptionUsers);
router.post('/connexion', userSchemaConnexion, controller.connexionUsers);


module.exports = router;