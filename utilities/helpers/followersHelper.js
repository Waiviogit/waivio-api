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
                    select: 'name profile_image'
                }
            })
            .lean();
        rankHelper.calculateForUsers(wObject.followers, wObject.weight);
        return {result: {followers: wObject.followers}}
    } catch (error) {
        return {error}
    }


};

module.exports = {getFollowers};



