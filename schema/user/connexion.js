const Joi = require('joi');

const userSchemaConnexion = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(3).max(50).required(),
});

const valideUser = (req, res, next) => {
    const { error } = userSchemaConnexion.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).send({ message: error.details.map(detail => detail.message) });
    } else {
        next();
    }
};

module.exports = valideUser;
