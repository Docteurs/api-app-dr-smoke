const multer = require('multer');
const fs = require('fs');

const MIME_TYPES = {
    "image/jpg": "jpg",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
}

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        if (!fs.existsSync(`image_produit/${req.auth.userId}`)) {
            fs.mkdirSync(`image_produit/${req.auth.userId}`);
            //console.log(req.auth.userId);
        }
        
        callback(null, `image_produit/${req.auth.userId}`)
    },
    filename: (req, file, callback) => {
        const name = file.originalname.split(" ").join("_");
        const extension = MIME_TYPES[file.mimetype];
        callback(null, name + Date.now() + "." + name);
    }
});

module.exports = multer({ storage }).single("image_produit");