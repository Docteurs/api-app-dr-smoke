const express = require('express')
const app = express();
const routeUser = require('./route/user');
const routeAdmin = require('./route/admin');
const path = require("path");

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});
app.use("/image_produit", express.static(path.join(__dirname, "image_produit")));
app.use('/DrSmokeApi', routeUser);
app.use('/admin', routeAdmin);

module.exports = app;