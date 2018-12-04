const userUtil = require('../steemApi').userUtil;
const {User} = require('../../models');

const combinedUserData = async (username) => {
    try {
        const {user} = await User.getOne(username);  //get user data from database
        const {userData} = await userUtil.getAccount(username);  //get user data from STEEM blockchain
        Object.assign(userData, user);         //combine data from database and STEEM
        return {userData};
    } catch (error) {
        return {error};
    }
};

module.exports = {combinedUserData};