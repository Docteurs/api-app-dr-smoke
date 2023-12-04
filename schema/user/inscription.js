const Joi = require('joi');

const userSchemaInscription = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(3).max(50).required(),
    nom: Joi.string().min(3).max(50).required(),
    prenom: Joi.string().min(3).max(50).required(),
    address: Joi.string().min(3).required()
})

const valideUser = (req, res, next) => {
    const { error } = userSchemaInscription.validate(req.body);
    if (error) { return res.status(400).send({ message: error.details[0].message }); }
    else { next(); }
}
module.exports = valideUser;