const postsUtil = require('../steemApi').postsUtil;
const {Wobj} = require('../../models');

const combinedWObjectData = async (data) => {
    try {
        const {wObjectData} = await Wobj.getByTag(data);           //get from db info about wobject
        const {posts} = await postsUtil.getPostsByTrending(data);  //get posts from blockchain

        Object.assign(wObjectData, {posts: posts});
        return {wObjectData};
    }catch (error) {
        return {error};
    }
};

module.exports = {combinedWObjectData};