const userUtil = require('../steemApi').userUtil;
const {User} = require('../../models');

const combinedUserData = async (username) => {

    const {user, error} = await User.getOne(username);  //get user data from database
    if(error){
        return{error}
    }
    const {userData, err} = await userUtil.getAccount(username);  //get user data from STEEM blockchain
    if (err) {
        return {error: err};
    }
    Object.assign(userData, user);         //combine data from database and STEEM
    return {userData};
};

module.exports = {combinedUserData};