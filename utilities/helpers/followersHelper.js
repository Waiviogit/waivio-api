const WObjectModel = require('../../database/schemas/wObjectSchema');
const rankHelper = require('./rankHelper');

const getFollowers = async (data) => {
    try {
        const wObject = await WObjectModel.findOne({author_permlink: data.author_permlink})
            .populate({
                path: 'followers',
                options: {
                    limit: data.limit,
                    sort: {name: 1},
                    skip: data.skip,
                    select: 'name profile_image w_objects'
                }
            })
            .lean();
        formatWobjectFollowers(wObject);
        return {followers: wObject.followers}
    } catch (error) {
        return {error}
    }
};

const formatWobjectFollowers = (wObject) => {
    wObject.followers = wObject.followers.map((follower) => {
        let wobj = follower.w_objects.find(wobj => wobj.author_permlink === wObject.author_permlink);
        return {name: follower.name, weight: wobj ? wobj.weight : 0}
    });
    rankHelper.calculateForUsers(wObject.followers, wObject.weight);
};

module.exports = {getFollowers};



