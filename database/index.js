const config = require('../config');
const mongoose = require('mongoose');
const URI = `mongodb://${config.db.username}:${config.db.password}@${config.db.cloud_link}`;
mongoose.connect(URI)
    .then(() => console.log('connection successful!'))
    .catch((error) => console.log(error));

mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

mongoose.Promise = global.Promise;

module.exports = { Mongoose: mongoose,
    models: {
        WObject: require('./schemas/wObjectSchema'),
        User: require('./schemas/UserSchema'),
        Post: require('./schemas/PostSchema')
    }
};
