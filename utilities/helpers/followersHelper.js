const WObjectModel = require('../../database').models.WObject;

const getFollowers = async (data)=> {
    try {
        let {followers = []} = await WObjectModel.findOne({'tag': data.tag})
            .populate('followers', 'name profile_image')
            .lean();
        const begin =  data.startFollower && followers.find(item=>item.name===data.startFollower) ?
            followers.indexOf(followers.find((item)=>item.name===data.startFollower)) + 1 : 0;

        return {
            result:{
                followers: followers ? followers.slice(begin, begin + data.limit) : {},   //returned array of followers
                hasMore: followers ? begin + data.limit <= followers.length : false         //flag of existing more followers
            }
        }
    }catch (error) {
        return {error}
    }
};

module.exports = { getFollowers };



