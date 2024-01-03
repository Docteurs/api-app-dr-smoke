const mysqlConnection = require('../middelware/mysqlConnection');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.InscriptionUsers = (req, res, next) => {
    console.log(req.body)
    const { email, password, nom, prenom, address } = req.body;
    const user = {
        uuid: mysqlConnection.escape(uuidv4()),
        email: mysqlConnection.escape(email),
        password: mysqlConnection.escape(password),
        nom: mysqlConnection.escape(nom),
        prenom: mysqlConnection.escape(prenom),
        address: mysqlConnection.escape(address)
    }

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(user.password, salt, (err, hash) => {
            const passHash = mysqlConnection.escape(hash)
            $sql = `INSERT INTO utilisateur(uuid, email, password, nom, prenom, adresse) VALUES (${user.uuid}, ${user.email}, ${passHash}, ${user.nom}, ${user.prenom}, ${user.address})`;
            
            if (err) {
                console.log(err)
                return res.status(401).json({message: 'Une erreur est survenue'})
            }
            mysqlConnection.query($sql, (error, result, fields) => {
                if (error) {
                    console.log(`Une erreur est survenue: ${error}` )
                    return res.status(501).json({message: `Une erreur est survenue: ${error}`});
                }       
                return res.status(201).json({message: 'Utilisateur ajouter avec success!'})
            })
        })
    })
}

exports.connexionUsers = (req, res, next) => {
    console.log(req.body)
    const {email, password} = req.body;
    const users = {
        email: mysqlConnection.escape(email),
        password: mysqlConnection.escape(password)
    }   
    $sql = `SELECT * FROM utilisateur WHERE email = ${users.email}`;
    mysqlConnection.query($sql, (error, result, fields) =>  {
        if (error) {
            return res.status(501).json({message: `Une erreur est survenue: ${error}`});
        }
        if (result == 0) {
            return res.status(501).json({message: `Aucun utilisateur avec ${users.email}`});
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