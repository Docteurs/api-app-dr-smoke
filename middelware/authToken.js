const jsonWebToken = require('jsonwebtoken');


module.exports = (req, res, next) => {
    if (!req.headers.authorization) { return res.status(401).json({message: 'No token active', IsTrue: false})}
        const token = req.headers.authorization.split(' ')[1];
        jsonWebToken.verify(token, "MY_SECRET_TOKEN", (err, decode) => {
            if (err) { return res.status(401).json({ message: 'jwt not active', IsTrue: false }) }
            else {
                const userId = decode.uuid;
                req.auth = { userId };
                next();
            }
        });
};