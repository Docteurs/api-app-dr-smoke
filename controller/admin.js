const mysqlConnection = require('../middelware/mysqlConnection');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.InscriptionAdmin = (req, res, next) => {
    const { email, password, nom, prenom, address, ville } = req.body;
    const user = {
        uuid: mysqlConnection.escape(uuidv4()),
        email: mysqlConnection.escape(email),
        password: mysqlConnection.escape(password),
        nom: mysqlConnection.escape(nom),
        prenom: mysqlConnection.escape(prenom),
        address: mysqlConnection.escape(address),
        ville: mysqlConnection.escape(ville)
    }

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(user.password, salt, (err, hash) => {
            const passHash = mysqlConnection.escape(hash)
            $sql = `INSERT INTO admin(uuid, email, password, nom, prenom, address, ville) VALUES (${user.uuid}, ${user.email}, ${passHash}, ${user.nom}, ${user.prenom}, ${user.address}, ${user.ville})`;
            
            if (err) {
                return res.status(401).json({message: 'Une erreur est survenue'})
            }
            mysqlConnection.query($sql, (error, result, fields) => {
                if (error) {
                    return res.status(501).json({message: `Une erreur est survenue: ${error}`});
                }
                return res.status(201).json({message: 'Utilisateur ajouter avec success!'})
            })
        })
    })
}

exports.connexionAdmin = (req, res, next) => {
    const {email, password} = req.body;
    const users = {
        email: mysqlConnection.escape(email),
        password: mysqlConnection.escape(password)
    }   
    $sql = `SELECT * FROM admin WHERE email = ${users.email}`;
    mysqlConnection.query($sql, (error, result, fields) =>  {
        if (error) {
            return res.status(501).json({message: `Une erreur est survenue: ${error}`});
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
                    // console.log(troisiemeChiffre(prix))
                    // console.log(resultUSers);
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
                                    console.log(resultTotal);

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