# API mobile dr DrSmoke

## Installation des dépendance 

- Require mysqlServer 
```
CREATE DATABSES yourDB
USE yourDB
```

```
CREATE TABLE utilisateur (
        id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
        uuid VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        nom VARCHAR(150) NOT NULL,
        prenom VARCHAR(150) NOT NULL,
        adresse VARCHAR(255) NOT NULL
    );
```


```
$ git clone https://example.com
$ cd ../path/to/the/file
$ npm install
$ npm start
$ npm i -g nodemon
$ nodemon server
```
---
## Inscription 

- url:
```
http://localhost:3000/inscription
```
- données (JSON): 
```
{
    "email": string,
    "password": string,
    "nom": string,
    "prenom": string,
    "address": string
}
```

res (201): "Utilisateur ajouter avec success!"
res (401): "Une erreur est survenue: + error"

## Connection

url: 
```
http://localhost:3000/connection
```
- données (JSON): 
```
{
    "email": string,
    "password": string,
}
```

res (201): "Utilisateur ajouter avec success! + token"
res (401): "Une erreur est survenue: + error"