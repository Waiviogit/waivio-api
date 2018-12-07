const WObjectModel = require('../../database').models.WObject;

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
        return {result: {followers: wObject.followers}}
    } catch (error) {
        return {error}
    }


};

module.exports = {getFollowers};



