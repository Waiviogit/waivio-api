const {Client} = require('dsteem');
const config = require('../../config');
const client = new Client(config.nodeUrl);

const getAccount = async (name) => {
    try {
        const [account] = await client.database.getAccounts([name]);
        return {userData: account};
    } catch (error) {
        return {error}
    }
};


module.exports = {getAccount};