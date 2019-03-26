const {client} = require('./steem');

const getAccount = async (name) => {
    try {
        const [account] = await client.database.getAccounts([name]);
        if (!account) {
            return {error: {status: 404, message: 'User not found!'}}
        }
        return {userData: account};
    } catch (error) {
        return {error}
    }
};

const getFollowingsList = async (name) => {
    try {
        const followings = await client.call('follow_api', 'get_following', [name, '', 'blog', 1000]);
        return {followings}
    } catch (error) {
        return {error}
    }
};

module.exports = {getAccount, getFollowingsList};