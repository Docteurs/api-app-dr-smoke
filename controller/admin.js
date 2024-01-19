const mysqlConnection = require('../middelware/mysqlConnection');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.InscriptionAdmin = (req, res, next) => {
    const { email, password, nom, prenom, codePostal, adresse, ville } = req.body[0];
    const user = {
        uuid: mysqlConnection.escape(uuidv4()),
        email: mysqlConnection.escape(email),
        password: mysqlConnection.escape(password),
        nom: mysqlConnection.escape(nom),
        prenom: mysqlConnection.escape(prenom),
        code_postal: mysqlConnection.escape(codePostal),
        address: mysqlConnection.escape(adresse),
        ville: mysqlConnection.escape(ville), 
    }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return res.status(401).json({message: 'Une erreur est survenue'})
        }
        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) {
                return res.status(401).json({message: 'Une erreur est survenue'})
            }
            const passHash = mysqlConnection.escape(hash)
            const $sql = `INSERT INTO admin(uuid, email, password, nom, prenom, address, ville) VALUES (${user.uuid}, ${user.email}, ${passHash}, ${user.nom}, ${user.prenom}, ${user.address}, ${user.ville})`;

            mysqlConnection.query($sql, (error, result, fields) => {
                if (error) {
                    return res.status(501).json({message: `Une erreur est survenue: ${error}`});
                }
                const $Sql = `INSERT INTO magasin(uuid, adresse, ville, code_postal, uuid_admin, imgUrl) VALUES(${mysqlConnection.escape(uuidv4())}, ${user.address}, ${user.ville}, ${user.code_postal}, ${user.uuid}, 'http://localhost:3000/image_produit/img_no_boutique/BIOT.webp')`;
                
                mysqlConnection.query($Sql, (error, result, fields) => {
                    if (error) {
                        return res.status(401).json({message: 'Une erreur est survenue' + error})
                    }
                    return res.status(201).json({message: 'Magasin ajouter avec success!'})
                })
            })
        })
    })
}


exports.connexionAdmin = (req, res, next) => {
    const {email, password} = req.body[0];
    const users = {
        email: mysqlConnection.escape(email),
        password: mysqlConnection.escape(password)
    }   
    $sql = `SELECT * FROM admin WHERE email = ${users.email}`;
    mysqlConnection.query($sql, (error, result, fields) =>  {
        if (error) {
            return res.status(501).json({message: `Une erreur est survenue: ${error}`});
        }
        if (result == 0) {
            return res.status(501).json({message: "Aucun utilisateur trouvé"});
        }
        const hash = result.map(obj => { return obj.password })[0];
        const uuidUser = result.map(obj => { return obj.uuid })[0];
        bcrypt.compare(users.password, hash, (error, result) => {
            if (result) {
                return res.status(201).json({message: 'Vous êtes connecter', token: jwt.sign({ uuid: uuidUser }, "MY_SECRET_TOKEN", { expiresIn: "1H" })})
            } else {
                return res.status(401).json({message: 'Votre mot de passe est invalide'})
            }
        })
    })
}

exports.userPromotion = (req, res, next) => {
    $sql = `SELECT a.uuid, a.email, a.nom, a.prenom, a.address, a.ville, v.name_ville FROM admin a, ville v WHERE a.uuid = ${mysqlConnection.escape(req.auth.userId)} AND a.ville = v.id;`;

    mysqlConnection.query($sql, (error, result, fields) => {
        if (error) {
            return res.status(501).json({message: `Une erreur est survenue: ${error}`});
        }

        jwt.verify(req.body.token_utilisateur, "MY_SECRET_TOKEN", (err, decode) => {
            if (err) { return res.status(401).json({ message: 'jwt not active', IsTrue: false }) }
            else {
                $Sql = `SELECT * FROM utilisateur WHERE uuid = ${mysqlConnection.escape(decode.uuid)}`;
                mysqlConnection.query($Sql, (error, resultUSers, fields) => {
                    if (error) {
                        return res.status(501).json({message: `Une erreur est survenue: ${error}`});
                    }
                    const prix = req.body.prix;
                    function aTroisChiffre(prix){
                        return prix >= 100 && prix <= 999;
                    }
                    function troisiemeChiffre(prix) {
                        if (prix >= 100 && prix <= 999) {
                            return Math.floor(prix / 100) % 10 * 15;
                        } else {
                            return false;
                        }
                    }
                    // $sqlPromo = `UPDATE utilisateur SET promo = 'nouvelle valeur' WHERE condition`
  
                    // const promoUtilisateur = resultUSers.map(obj => { return obj.promo });
                    // const uuid_shop_promo = resultUsers.map(obj => { return obj.uuid_shop_promo }); 
                    const villeShop = result.map(obj => { return obj.ville })[0];
                    $SelectPromo = `SELECT * FROM promo_utilisateur WHERE uuid_user = ${mysqlConnection.escape(decode.uuid)} AND uuid_admin = ${mysqlConnection.escape(req.auth.userId)}`;

                    mysqlConnection.query($SelectPromo, (errorPromo, resultPromo, fieldsPromo) => {
                        if (errorPromo) {
                            return res.status(501).json({message: `Une erreur est survenue de promo: ${error}`});
                        }
                        else {
                            if (resultPromo.length == 0) {
                                uuidPromo = mysqlConnection.escape(uuidv4());
                                $insertPromo = `INSERT INTO promo_utilisateur(uuid_promo, uuid_user, uuid_admin, prix, ville_shop) VALUES(${uuidPromo}, ${mysqlConnection.escape(decode.uuid)}, ${mysqlConnection.escape(req.auth.userId)}, ${req.body.prix}, ${villeShop})`;
                                mysqlConnection.query($insertPromo, (errorInsertPromo, resultInsertPromo, fieldsInsertPromo) => {
                                    if (error) {
                                        return res.status(501).json({message: `Une erreur est survenue: ${error}`});
                                    }
                                    return res.status(201).json({message: 'La promo a bien été ajouter'});
                                })
                            } else {
                                const ResultPrix = resultPromo.map(obj => obj.prix)[0];

                                const nouveauPrix = parseFloat(req.body.prix);
                                if (!isNaN(nouveauPrix)) {
                                    const resultTotal = ResultPrix + nouveauPrix;
                                    

                                    const $SqlUpdatePromo = `UPDATE promo_utilisateur SET prix = ? WHERE uuid_user = ? AND uuid_admin = ?`;
                                    const values = [resultTotal, decode.uuid, req.auth.userId];

                                    mysqlConnection.query($SqlUpdatePromo, values, (errorUpdate, resultUpdate, fieldsUpdate) => {
                                        if (errorUpdate) {
                                            res.status(201).json({ message: 'Une erreur est survenue' });
                                        } else {
                                            if (aTroisChiffre(resultTotal)) {
                                                const troisieme = troisiemeChiffre(resultTotal);
                                                res.status(201).json({ message: `Une promo de: ${troisieme} est disponible` });
                                            } else {
                                                res.status(201).json({ message: 'La promo a bien été enregistrée' });
                                            }
                                        }
                                    });
                                } else {
                                    res.status(400).json({ message: 'La valeur de prix est invalide' });
                                }
                            }
                        }
                    })
                })
            }
        });
    })
}

exports.gestionStockCreate = (req, res, next) => {
    console.log('ok')
    // console.log(req.file)
    console.log(req.body)
    const { nameProduct, descriptifProduct, categorieProduct, resultQuantiteProductGramme, prix1gProduit, prix3gProduit, prix5gProduit, prix10gProduit, prix20gProduit } = req.body;
    const produit = {
        uuid: mysqlConnection.escape(uuidv4()),
        nameProduct : mysqlConnection.escape(nameProduct),
        descriptifProduct: mysqlConnection.escape(descriptifProduct),
        categorieProduct: mysqlConnection.escape(categorieProduct),
        resultQuantiteProductGramme: mysqlConnection.escape(resultQuantiteProductGramme),
        prix1gProduit: mysqlConnection.escape(prix1gProduit),
        prix3gProduit: mysqlConnection.escape(prix3gProduit),
        prix5gProduit: mysqlConnection.escape(prix5gProduit),
        prix10gProduit: mysqlConnection.escape(prix10gProduit),
        prix20gProduit: mysqlConnection.escape(prix20gProduit),
        ImageUrl: mysqlConnection.escape(`${req.protocol}://${req.get('host')}/image_produit/${req.auth.userId}/${req.file.filename}`)
    }

    const uuidAdmin = mysqlConnection.escape(req.auth.userId)
    $Sql = `SELECT * FROM magasin WHERE uuid_admin = ${uuidAdmin}`;

    mysqlConnection.query($Sql, (err, result, fields) => {
            if (err) {
                return res.status(501).json({ message: "Une erreur est survenue" })
            }
            if (result == 0) {
                return res.status(401).json({message: `Utilisateur inconnue`});
            }
            else {
            if (produit.prix1gProduit == null || produit.prix1gProduit == undefined || produit.prix1gProduit <= 0) {
                return res.status(401).json({ message: "Veuillez renseigner un prix valide pour 1g" });
            }

            // Valider le prix pour 3g si la quantité de 3g est sélectionnée
            if (produit.prix3gProduit == 1  && (produit.prix_prix3gProduit == null || produit.prix_prix3gProduit == undefined || produit.prix_prix3gProduit <= 0)) {
                return res.status(401).json({ message: "Veuillez renseigner un prix valide pour 3g" });
            }

            // Valider le prix pour 5g si la quantité de 5g est sélectionnée
            if (produit.prix5gProduit == 1  && (produit.prix5gProduit == null || produit.prix5gProduit == undefined || produit.prix5gProduit <= 0)) {
                return res.status(401).json({ message: "Veuillez renseigner un prix valide pour 3g" });
            }

            // // Valider le prix pour 10g si la quantité de 10g est sélectionnée
            if (produit.prix10gProduit == 1 && (produit.prix10gProduit == null || produit.prix10gProduit == undefined || produit.prix10gProduit <= 0)) {
                return res.status(401).json({ message: "Veuillez renseigner un prix valide pour 10g" });
            }

            // Valider le prix pour 20g si la quantité de 20g est sélectionnée
            if (produit.prix20gProduit == 1 && (produit.prix20gProduit == null || produit.prix20gProduit == undefined || produit.prix20gProduit <= 0)) {
                return res.status(401).json({ message: "Veuillez renseigner un prix valide pour 20g" });
            }
                $SqlInsertProduct = `INSERT INTO produit(uuid, categorie_produit, nom_produit, descriptif, quantite, 1g, 3g, 5g, 10g, 20g, 1g_prix, 3g_prix, 5g_prix, 10g_prix, 20g_prix, img_produit, uuid_magasin)
                VALUES(${produit.uuid}, ${produit.categorieProduct}, ${produit.nameProduct}, ${produit.descriptifProduct}, ${produit.resultQuantiteProductGramme}, ${true}, 
                    ${true}, ${true}, ${true}, ${true}, ${produit.prix1gProduit}, ${produit.prix3gProduit}, ${produit.prix5gProduit}, ${produit.prix10gProduit}, ${produit.prix20gProduit}, ${produit.ImageUrl}, ${uuidAdmin});`;
                mysqlConnection.query($SqlInsertProduct, (errorInsertProduct, resultInsertProduct, fieldsInsertProduct) => {
                if (errorInsertProduct) {
                    console.log(errorInsertProduct)
                    return res.status(501).json({message: "Une erreur est survenue veuillez reeseayez plus tard"})
                }
                else {
                    console.log("Votre produit a bien été ajouter")
                    return res.status(201).json({ message: "Votre produit a bien été ajouter" })
                }
            })
        }
    })

}

exports.getInfoMagasin = (req, res, next) => { 
    const uuid_admin = mysqlConnection.escape(req.auth.userId);
    $sql = `SELECT a.email, a.nom, a.prenom, m.adresse, m.code_postal, m.imgUrl, m.ville FROM admin a, magasin m WHERE a.uuid = ${uuid_admin} AND m.uuid_admin = ${uuid_admin};`;
    mysqlConnection.query($sql, (err, result, fields) => {
        if (err) {
            return res.status(501).json({ message: `Une erreur est survenue: ${err}` });
        }
        
        return res.status(201).json(result); // Envoie la réponse au format JSON valide
    });
};

exports.getAllProduit =(req, res, next) => {
    const uuid_admin = mysqlConnection.escape(req.auth.userId);
    $Sql = `SELECT * FROM produit WHERE uuid_magasin = ${uuid_admin};`;
    mysqlConnection.query($Sql, (err, result, fields) => {
        if (err) {
            return res.status(401).json({message: `Une erreur est survenue: ${err}`});
        }
        console.log(result)
        return res.status(201).json(result)
    })
}

exports.getOneProduit = (req, res, next) => {
    console.log(req.auth.userId)
    console.log(req.params)
    uuidAdmin = mysqlConnection.escape(req.auth.userId);
    uuidProduit = mysqlConnection.escape(req.params.uuid);
    $Sql = `SELECT * FROM produit WHERE uuid = ${uuidProduit} AND uuid_magasin = ${uuidAdmin}`;
    mysqlConnection.query($Sql, (err, result, fields) => {
        if (err) {
            return res.status(501).json({ message: "Une erreur est survene" })
        }
        if (result == 0) {
            return res.status(201).json({ message: 'Utilisateur inconnue' })
        }
        else {
            return res.status(201).json(result)
        }
    })
}

exports.updateOneProduit = (req, res, next) => {
    console.log(req.auth.userId)
    console.log(req.params.uuid)
}