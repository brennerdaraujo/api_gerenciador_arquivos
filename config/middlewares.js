// Middlewares
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');

module.exports = app => {
    app.use(bodyParser.json());
    app.use(cors({
        origin: '*'
    }));
    app.use(fileUpload());
}