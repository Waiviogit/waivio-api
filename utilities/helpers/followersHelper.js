const WObjectModel = require('../../database').models.WObject;

const getFollowers = async (data)=> {
    try {
        let {followers = []} = await WObjectModel.findOne({'author_permlink': data.author_permlink})
            .populate('followers', 'name profile_image')
            .lean();
        const begin =  data.start_follower && followers.find(item=>item.name===data.start_follower) ?
            followers.indexOf(followers.find((item)=>item.name===data.start_follower)) + 1 : 0;

        return {
            result:{
                followers: followers ? followers.slice(begin, begin + data.limit) : {},   //returned array of followers
                has_more: followers ? begin + data.limit <= followers.length : false         //flag of existing more followers
            }
        }
    }catch (error) {
        return {error}
    }
};

module.exports = { getFollowers };



