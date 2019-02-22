const config = require('../../config');
const {Client} = require('dsteem');
const client = new Client(config.nodeUrl);
const lll = Client.testnet()

module.exports =
    {
        client: client,
        userUtil: require('./userUtil'),
        postsUtil: require('./postsUtil')
    };