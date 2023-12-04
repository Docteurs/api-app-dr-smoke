const mysql = require('mysql2');


var connnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '753159852456',
    database: 'drsmoke',
});

connnection.connect(function (err) {
    if (err) {
        console.log(`Error as been occured: ${err}`);
        throw err;
    } else {
        console.log('Connected');
    }
})

module.exports = connnection;