const mysqlConnection = require('../middelware/mysqlConnection');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

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
            return res.status(401).json({ message: 'Une erreur est survenue' })
        }
        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) {
                return res.status(401).json({ message: 'Une erreur est survenue' })
            }
            const passHash = mysqlConnection.escape(hash)
            const $sql = `INSERT INTO admin(uuid, email, password, nom, prenom, address, ville) VALUES (${user.uuid}, ${user.email}, ${passHash}, ${user.nom}, ${user.prenom}, ${user.address}, ${user.ville})`;

            mysqlConnection.query($sql, (error, result, fields) => {
                if (error) {
                    return res.status(501).json({ message: `Une erreur est survenue: ${error}` });
                }
                const $Sql = `INSERT INTO magasin(uuid, adresse, ville, code_postal, uuid_admin, imgUrl) VALUES(${mysqlConnection.escape(uuidv4())}, ${user.address}, ${user.ville}, ${user.code_postal}, ${user.uuid}, 'https://get-evolutif.xyz/DrSmokeApi/image_produit/img_no_boutique/BIOT.webp')`;

                mysqlConnection.query($Sql, (error, result, fields) => {
                    if (error) {
                        return res.status(401).json({ message: 'Une erreur est survenue' + error })
                    }
                    return res.status(201).json({ message: 'Magasin ajouter avec success!' })
                })
            })
        })
    })
}


exports.connexionAdmin = (req, res, next) => {
    const { email, password } = req.body[0];
    const users = {
        email: mysqlConnection.escape(email),
        password: mysqlConnection.escape(password)
    }
    $sql = `SELECT * FROM admin WHERE email = ${users.email}`;
    mysqlConnection.query($sql, (error, result, fields) => {
        if (error) {
            return res.status(501).json({ message: `Une erreur est survenue: ${error}` });
        }
        if (result == 0) {
            return res.status(501).json({ message: "Aucun utilisateur trouvé" });
        }
        const hash = result.map(obj => { return obj.password })[0];
        const uuidUser = result.map(obj => { return obj.uuid })[0];
        bcrypt.compare(users.password, hash, (error, result) => {
            if (result) {
                return res.status(201).json({ message: 'Vous êtes connecter', token: jwt.sign({ uuid: uuidUser }, "MY_SECRET_TOKEN", { expiresIn: "1H" }) })
            } else {
                return res.status(401).json({ message: 'Votre mot de passe est invalide' })
            }
        })
    })
}

exports.userPromotion = (req, res, next) => {
    $sql = `SELECT a.uuid, a.email, a.nom, a.prenom, a.address, a.ville, v.name_ville FROM admin a, ville v WHERE a.uuid = ${mysqlConnection.escape(req.auth.userId)} AND a.ville = v.id;`;

    mysqlConnection.query($sql, (error, result, fields) => {
        if (error) {
            return res.status(501).json({ message: `Une erreur est survenue: ${error}` });
        }

        jwt.verify(req.body.token_utilisateur, "MY_SECRET_TOKEN", (err, decode) => {
            if (err) { return res.status(401).json({ message: 'jwt not active', IsTrue: false }) }
            else {
                $Sql = `SELECT * FROM utilisateur WHERE uuid = ${mysqlConnection.escape(decode.uuid)}`;
                mysqlConnection.query($Sql, (error, resultUSers, fields) => {
                    if (error) {
                        return res.status(501).json({ message: `Une erreur est survenue: ${error}` });
                    }
                    const prix = req.body.prix;
                    function aTroisChiffre(prix) {
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
                            return res.status(501).json({ message: `Une erreur est survenue de promo: ${error}` });
                        }
                        else {
                            if (resultPromo.length == 0) {
                                uuidPromo = mysqlConnection.escape(uuidv4());
                                $insertPromo = `INSERT INTO promo_utilisateur(uuid_promo, uuid_user, uuid_admin, prix, ville_shop) VALUES(${uuidPromo}, ${mysqlConnection.escape(decode.uuid)}, ${mysqlConnection.escape(req.auth.userId)}, ${req.body.prix}, ${villeShop})`;
                                mysqlConnection.query($insertPromo, (errorInsertPromo, resultInsertPromo, fieldsInsertPromo) => {
                                    if (error) {
                                        return res.status(501).json({ message: `Une erreur est survenue: ${error}` });
                                    }
                                    return res.status(201).json({ message: 'La promo a bien été ajouter' });
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
    const { nameProduct, descriptifProduct, categorieProduct, resultQuantiteProductGramme, prix1gProduit, prix3gProduit, prix5gProduit, prix10gProduit, prix20gProduit } = req.body;
    const produit = {
        uuid: mysqlConnection.escape(uuidv4()),
        nameProduct: mysqlConnection.escape(nameProduct),
        descriptifProduct: mysqlConnection.escape(descriptifProduct),
        categorieProduct: mysqlConnection.escape(categorieProduct),
        resultQuantiteProductGramme: mysqlConnection.escape(resultQuantiteProductGramme),
        prix1gProduit: mysqlConnection.escape(prix1gProduit),
        prix3gProduit: mysqlConnection.escape(prix3gProduit),
        prix5gProduit: mysqlConnection.escape(prix5gProduit),
        prix10gProduit: mysqlConnection.escape(prix10gProduit),
        prix20gProduit: mysqlConnection.escape(prix20gProduit),
        ImageUrl: mysqlConnection.escape(`https://${req.get('host')}/DrSmokeApi/image_produit/${req.auth.userId}/${req.file.filename}`)
    }

    const uuidAdmin = mysqlConnection.escape(req.auth.userId)
    $Sql = `SELECT * FROM magasin WHERE uuid_admin = ${uuidAdmin}`;

    mysqlConnection.query($Sql, (err, result, fields) => {
        if (err) {
            return res.status(501).json({ message: "Une erreur est survenue" })
        }
        if (result == 0) {
            return res.status(401).json({ message: `Utilisateur inconnue` });
        }
        else {
            if (produit.prix1gProduit == null || produit.prix1gProduit == undefined || produit.prix1gProduit <= 0) {
                return res.status(401).json({ message: "Veuillez renseigner un prix valide pour 1g" });
            }

            // Valider le prix pour 3g si la quantité de 3g est sélectionnée
            if (produit.prix3gProduit == 1 && (produit.prix_prix3gProduit == null || produit.prix_prix3gProduit == undefined || produit.prix_prix3gProduit <= 0)) {
                return res.status(401).json({ message: "Veuillez renseigner un prix valide pour 3g" });
            }

            // Valider le prix pour 5g si la quantité de 5g est sélectionnée
            if (produit.prix5gProduit == 1 && (produit.prix5gProduit == null || produit.prix5gProduit == undefined || produit.prix5gProduit <= 0)) {
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
            $SqlInsertProduct = `INSERT INTO produit(uuid, categorie_produit, nom_produit, descriptif, quantite, 1g, 3g, 5g, 10g, 20g, ung_prix, troisg_prix, cingg_prix, dixg_prix, vingtg_prix, img_produit, uuid_magasin)
                VALUES(${produit.uuid}, ${produit.categorieProduct}, ${produit.nameProduct}, ${produit.descriptifProduct}, ${produit.resultQuantiteProductGramme}, ${true}, 
                    ${true}, ${true}, ${true}, ${true}, ${produit.prix1gProduit}, ${produit.prix3gProduit}, ${produit.prix5gProduit}, ${produit.prix10gProduit}, ${produit.prix20gProduit}, ${produit.ImageUrl}, ${uuidAdmin});`;
            mysqlConnection.query($SqlInsertProduct, (errorInsertProduct, resultInsertProduct, fieldsInsertProduct) => {
                if (errorInsertProduct) {
                    return res.status(501).json({ message: "Une erreur est survenue veuillez reeseayez plus tard" })
                }
                else {
                    return res.status(201).json({ message: "Votre produit a bien été ajouter" })
                }
            })
        }
    })

}

exports.getInfoMagasin = (req, res, next) => {
    const uuid_admin = mysqlConnection.escape(req.auth.userId);
    $sql = `SELECT a.email, a.nom, a.prenom, m.adresse, m.code_postal, m.imgUrl, m.ville, m.horaireLundi, m.horaireMardi, m.horaireMercredi, m.horaireJeudi, m.horaireVendredi, m.horaireSamedi, m.horaireDimanche FROM admin a, magasin m WHERE a.uuid = ${uuid_admin} AND m.uuid_admin = ${uuid_admin};`;
    mysqlConnection.query($sql, (err, result, fields) => {
        if (err) {
            return res.status(501).json({ message: `Une erreur est survenue: ${err}` });
        }
        console.log(result)
        return res.status(201).json(result); // Envoie la réponse au format JSON valide
    });
};

exports.getAllProduit = (req, res, next) => {
    const uuid_admin = mysqlConnection.escape(req.auth.userId);
    $Sql = `SELECT * FROM produit WHERE uuid_magasin = ${uuid_admin};`;
    mysqlConnection.query($Sql, (err, result, fields) => {
        if (err) {
            return res.status(401).json({ message: `Une erreur est survenue: ${err}` });
        }
        return res.status(201).json(result)
    })
}

exports.getOneProduit = (req, res, next) => {
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
    
    if (req.file == null || req.file == "" || req.file == undefined) {

        const { categorie_produit, nom_produit, descriptif, quantite, unGprix, troisGprix, cingGprix, dixGprix, vingtGprix, isVisible } = req.body[0];
        const produit = {
            categorie_produit: mysqlConnection.escape(categorie_produit),
            nom_produit: mysqlConnection.escape(nom_produit),
            descriptif: mysqlConnection.escape(descriptif),
            quantite: mysqlConnection.escape(quantite),
            unGprix: mysqlConnection.escape(unGprix),
            troisGprix: mysqlConnection.escape(troisGprix),
            cingGprix: mysqlConnection.escape(cingGprix),
            dixGprix: mysqlConnection.escape(dixGprix),
            vingtGprix: mysqlConnection.escape(vingtGprix),
            isVisible: mysqlConnection.escape(isVisible)
        };
        
        const uuid_magasin = mysqlConnection.escape(req.auth.userId);
        $Sql = `SELECT * FROM produit WHERE uuid = ${mysqlConnection.escape(req.params.uuid)} AND uuid_magasin = ${uuid_magasin}`;
        mysqlConnection.query($Sql, (err, result, fields) => {
            if (err) {
                return res.status(501).json({ message: "Une erreur est survenue veuillez reesayez plus tard" });
            }
            if (result.length == 0) {
                return res.status(501).json({ message: "Produit ou utilisateur inconnue" });
            }

            const resultCategorie_produit = result.map(obj => { return obj.categorie_produit })[0];
            const resultNom_produit = result.map(obj => { return obj.nom_produit })[0];
            const resultDescriptifProduit = result.map(obj => { return obj.descriptif })[0];
            const resultQuantiteProduit = result.map(obj => { return obj.quantite })[0];
            const resultPrix1g = result.map(obj => { return obj.ung_prix });
            const resultPrix3g = result.map(obj => { return obj.troisg_prix });
            const resultPrix5g = result.map(obj => { return obj.cingg_prix });
            const resultPrix10g = result.map(obj => { return obj.dixg_prix });
            const resultPrix20g = result.map(obj => { return obj.vingtg_prix });

            if (produit.categorie_produit == "" || produit.categorie_produit == null || produit.categorie_produit == undefined || produit.categorie_produit == "''" || produit.categorie_produit == 'NULL') {
                produit.categorie_produit = resultCategorie_produit;
            }
            if (produit.nom_produit == "" || produit.nom_produit == null || produit.nom_produit == undefined || produit.nom_produit == "''" || produit.nom_produit == 'NULL') {
                produit.nom_produit = resultNom_produit;
            }
            if (produit.descriptif == "" || produit.descriptif == null || produit.descriptif == undefined || produit.descriptif == "''" || produit.descriptif == 'NULL') {
                produit.descriptif = resultDescriptifProduit;
            }
            if (produit.quantite == "" || produit.quantite == null || produit.quantite == undefined) {
                produit.quantite = resultQuantiteProduit[0];
            }
            if (produit.unGprix === undefined || produit.unGprix === null || req.body[0].unGprix == 0) {
                produit.unGprix = resultPrix1g[0];
            }
            if (produit.troisGprix === undefined || produit.troisGprix === null || req.body[0].troisGprix == 0) {
                produit.troisGprix = resultPrix3g[0];
            }
            if (produit.cingGprix === undefined || produit.cingGprix === null || req.body[0].cingGprix == 0) {
                produit.cingGprix = resultPrix5g[0];
            }
            if (produit.dixGprix === undefined || produit.dixGprix === null || req.body[0].dixGprix == 0) {
                produit.dixGprix = resultPrix10g[0];
            }
            if (produit.vingtGprix === undefined || produit.vingtGprix === null || req.body[0].vingtGprix == 0) {
                produit.vingtGprix = resultPrix20g[0];
            }

            const sqlUpdate = `UPDATE produit 
                    SET categorie_produit = '${produit.categorie_produit}', 
                        nom_produit = '${produit.nom_produit}', 
                        descriptif = '${produit.descriptif}', 
                        quantite = ${produit.quantite}, 
                        ung_prix = ${produit.unGprix}, 
                        troisg_prix = ${produit.troisGprix}, 
                        cingg_prix = ${produit.cingGprix}, 
                        dixg_prix = ${produit.dixGprix}, 
                        vingtg_prix = ${produit.vingtGprix},
                        isVisible = ${produit.isVisible}
                    WHERE uuid = ${mysqlConnection.escape(req.params.uuid)} 
                        AND uuid_magasin = ${uuid_magasin};`;
            mysqlConnection.query(sqlUpdate, (errUpdate, resultUpdate, fieldsUpdate) => {
                if (errUpdate) {
                    return res.status(501).json({ message: "Une erreur est survenue" });
                } else {
                    return res.status(201).json({ message: "Votre produit a bien été modifié" });
                }
            });

        })
    } else {
        const produit = {
            categorie_produit: req.body.categorieProduct,
            nom_produit: req.body.nameProduct,
            descriptif: req.body.descriptifProduct,
            quantite: req.body.resultQuantiteProductGramme,
            unGprix: req.body.prix1gProduit,
            troisGprix: req.body.prix3gProduit,
            cingGprix: req.body.prix5gProduit,
            dixGprix: req.body.prix10gProduit,
            vingtGprix: req.body.prix20gProduit,
            ImageUrl: `https://${req.get('host')}/DrSmokeApi/image_produit/${req.auth.userId}/${req.file.filename}`
        };
        const uuid_magasin = mysqlConnection.escape(req.auth.userId);
        $Sql = `SELECT * FROM produit WHERE uuid = ${mysqlConnection.escape(req.params.uuid)} AND uuid_magasin = ${uuid_magasin}`;
        mysqlConnection.query($Sql, (err, result, fields) => {
            if (err) {
                return res.status(501).json({ message: "Une erreur est survenue veuillez reesayez plus tard" });
            }
            if (result.length == 0) {
                return res.status(501).json({ message: "Produit ou utilisateur inconnue" });
            }




            const resultCategorie_produit = result.map(obj => { return obj.categorie_produit })[0];
            const resultNom_produit = result.map(obj => { return obj.nom_produit })[0];
            const resultDescriptifProduit = result.map(obj => { return obj.descriptif })[0];
            const resultQuantiteProduit = result.map(obj => { return obj.quantite })[0];
            const resultPrix1g = result.map(obj => { return obj.ung_prix });
            const resultPrix3g = result.map(obj => { return obj.troisg_prix });
            const resultPrix5g = result.map(obj => { return obj.cingg_prix });
            const resultPrix10g = result.map(obj => { return obj.dixg_prix });
            const resultPrix20g = result.map(obj => { return obj.vingtg_prix });
            const resultImageProduit = result.map(obj => obj.img_produit);
            
            const url = resultImageProduit[0].split(req.auth.userId)[1];
            // fs.unlink(`image_produit/${req.auth.userId}/${url}`, (err) => {
            //     if (err) {
            //         console.log("Aucune image")
            //     } else {
            //         console.log("Deleted");
            //     }
            // });
            
            if (req.body.categorieProduct == "" || req.body.categorieProduct == null || req.body.categorieProduct == undefined || req.body.categorieProduct == "''" || req.body.categorieProduct == 'NULL') {
                produit.categorie_produit = resultCategorie_produit;
            }
            if (req.body.nameProduct == "" || req.body.nameProduct == null || req.body.nameProduct == undefined || req.body.nameProduct == "''" || req.body.nameProduct == 'NULL') {
                req.body.nameProduct = resultNom_produit;
            }
            if (req.body.descriptifProduct == "" || req.body.descriptifProduct == null || req.body.descriptifProduct == undefined || req.body.descriptifProduct == "''" || req.body.descriptifProduct == 'NULL') {
                req.body.descriptifProduct = resultDescriptifProduit;
            }
            if (req.body.resultQuantiteProductGramme == "" || req.body.resultQuantiteProductGramme == null || req.body.resultQuantiteProductGramme == undefined) {
                req.body.resultQuantiteProductGramme = resultQuantiteProduit[0];
            }
            if (req.body.prix1gProduit === undefined || req.body.prix1gProduit === null || req.body.prix1gProduit == 0) {
                req.body.prix1gProduit = resultPrix1g[0];
            }
            if (req.body.prix3gProduit === undefined || req.body.prix3gProduit === null || req.body.prix3gProduit == 0) {
                req.body.prix3gProduit = resultPrix3g[0];
            }
            if (req.body.prix5gProduit === undefined || req.body.prix5gProduit === null || req.body.prix5gProduit == 0) {
                req.body.prix5gProduit = resultPrix5g[0];
            }
            if (req.body.prix10gProduit === undefined || req.body.prix10gProduit === null || req.body.prix10gProduit == 0) {
                req.body.prix10gProduit = resultPrix10g[0];
            }
            if (req.body.prix20gProduit === undefined || req.body.prix20gProduit === null || req.body.prix20gProduit == 0) {
                req.body.prix20gProduit = resultPrix20g[0];
            }
            const sqlUpdate = `UPDATE produit 
                    SET categorie_produit = '${req.body.categorieProduct}', 
                        nom_produit = '${req.body.nameProduct}', 
                        descriptif = '${req.body.descriptifProduct}', 
                        quantite = ${req.body.resultQuantiteProductGramme}, 
                        ung_prix = ${req.body.prix1gProduit}, 
                        troisg_prix = ${req.body.prix3gProduit}, 
                        cingg_prix = ${req.body.prix5gProduit}, 
                        dixg_prix = ${req.body.prix10gProduit}, 
                        vingtg_prix = ${req.body.prix20gProduit},
                        isVisible = ${req.body.IsVisible},
                        img_produit = '${produit.ImageUrl}'
                    WHERE uuid = ${mysqlConnection.escape(req.params.uuid)} 
                        AND uuid_magasin = ${uuid_magasin};`;

            mysqlConnection.query(sqlUpdate, (errUpdate, resultUpdate, fieldsUpdate) => {
                if (errUpdate) {
                    return res.status(501).json({ message: "Une erreur est survenue" + errUpdate });
                } else {
                    return res.status(201).json({ message: "Votre produit a bien été modifié" });
                }
            });

        })
    }
}

exports.updateBoutique = (req, res, next) => {
    
    const { Email, Addresse, Nom, Prenom, LundiOuvert, MardiOuvert, MercrediOuvert, JeudiOuvert, VendrediOuvert, SamediOuvert, DimancheOuvert, HoraireLundi, HoraireMardi, HoraireMercredi, HoraireJeudi, HoraireVendredi, HoraireSamedi, HoraireDimanche } = req.body;
    const magasin = {
        Email: mysqlConnection.escape(Email),
        Addresse: mysqlConnection.escape(Addresse),
        Nom: mysqlConnection.escape(Nom),
        Prenom: mysqlConnection.escape(Prenom),
        LundiOuvert: mysqlConnection.escape(LundiOuvert),
        MardiOuvert: mysqlConnection.escape(MardiOuvert),
        MercrediOuvert: mysqlConnection.escape(MercrediOuvert),
        JeudiOuvert: mysqlConnection.escape(JeudiOuvert),
        VendrediOuvert: mysqlConnection.escape(VendrediOuvert),
        SamediOuvert: mysqlConnection.escape(SamediOuvert),
        DimancheOuvert: mysqlConnection.escape(DimancheOuvert),
        HoraireLundi: mysqlConnection.escape(HoraireLundi),
        HoraireMardi: mysqlConnection.escape(HoraireMardi),
        HoraireMercredi: mysqlConnection.escape(HoraireMercredi),
        HoraireJeudi: mysqlConnection.escape(HoraireJeudi),
        HoraireVendredi: mysqlConnection.escape(HoraireVendredi),
        HoraireSamedi: mysqlConnection.escape(HoraireSamedi),
        HoraireDimanche: mysqlConnection.escape(HoraireDimanche),
        ImageUrl: `https://${req.get('host')}/DrSmokeApi/image_produit/${req.auth.userId}/${req.file.filename}`
    }
    console.log(magasin.nom)
    const uuidMagasin = mysqlConnection.escape(req.auth.userId);
    $Sql = `SELECT * FROM magasin WHERE uuid_admin = ${uuidMagasin};`;
    mysqlConnection.query($Sql, (err, result, fields) => {
        if (err) {
            return res.status(501).json({ message: "Une erreur est survenue" + err });
        }
        if (result.length == 0) {
            return res.status(501).json({ message: "Utilisateur inconnue" });
        }
        else {
            const oldImg = result.map(obj => { return obj.imgUrl })[0];
            // console.log(oldImg.split('http://localhost:3000/')[1]);
            // fs.unlink(oldImg.split('https://get-evolutif.xyz/DrSmokeApi/image_produit')[1], (err) => {
            //     if (err) {
            //         console.log("Aucune image")
            //     } else {
            //         console.log("Deleted");
            //     }
            // });
            if (req.body.LundiOuvert == 'True') { magasin.LundiOuvert = true; } else { magasin.LundiOuvert = false; }
            if (req.body.MardiOuvert == 'True') { magasin.MardiOuvert = true; } else { magasin.MardiOuvert = false; }
            if (req.body.MercrediOuvert == 'True') { magasin.MercrediOuvert = true; } else { magasin.MercrediOuvert = false; }
            if (req.body.JeudiOuvert == 'True') { magasin.JeudiOuvert = true; } else { magasin.JeudiOuvert = false; }
            if (req.body.VendrediOuvert == 'True') { magasin.VendrediOuvert = true; } else { magasin.VendrediOuvert = false; }
            if (req.body.SamediOuvert == 'True') { magasin.SamediOuvert = true; } else { magasin.SamediOuvert = false; }
            if (req.body.DimancheOuvert == 'True') { magasin.DimancheOuvert = true; } else { magasin.DimancheOuvert = false; }
            
           
            $SqlUpdate = `UPDATE magasin SET adresse = ${magasin.Addresse}, imgUrl = ${mysqlConnection.escape(magasin.ImageUrl)}, boolLundiOuvert = TRUE, boolMardiOuvert = TRUE,
            boolMercrediOuvert = TRUE, boolJeudiOuvert = TRUE, boolVendrediOuvert = TRUE, boolSamediOuvert = TRUE,
            boolDimancheOuvert = TRUE, horaireLundi = ${magasin.HoraireLundi}, horaireMardi = ${magasin.HoraireMardi}, horaireMercredi = ${magasin.HoraireMercredi},
            horaireJeudi = ${magasin.HoraireJeudi}, horaireVendredi = ${magasin.HoraireVendredi}, horaireSamedi = ${magasin.HoraireSamedi}, horaireDimanche = ${magasin.HoraireDimanche} WHERE uuid_admin = ${uuidMagasin};`;
            //return res.status(201).json(magasin);
            mysqlConnection.query($SqlUpdate, (errUpdate, resultUpdate, fieldsUpdate) => {
                if (errUpdate) {
                    return res.status(501).json({ message: "Une erreur est survenue" + errUpdate });
                }
                return res.status(201).json({message: "Vos information on bien été modifié!" + magasin.nom})
            })
        }
    })
}

exports.commandeAdmin = (req, res, next) => {
    const uuidMagasin = mysqlConnection.escape(req.auth.userId)
    $Sql = `SELECT ca.uuidCommande, ca.uuidClient, ca.uuidMagasin, ca.uuidProduit, ca.quantite, ca.prixProduit, ca.prixTotalDesProduit, u.email AS emailClient, u.nom nomClient, u.prenom prenomClient, u.adresse addresseClient, p.categorie_produit, p.nom_produit, p.descriptif, p.img_produit  FROM commandeadmin ca, utilisateur u, produit p WHERE ca.uuidMagasin = ${uuidMagasin} AND ca.uuidClient = u.uuid AND p.uuid = ca.uuidProduit;`;
    console.log($Sql)
    mysqlConnection.query($Sql, (err, result, fields) => {
        if (err) {
            return res.status(501).json({ message: "Une erreur est survenue" + errUpdate });
        }
        console.log(result)
        return res.status(201).json(result)
    })
}