const postsUtil = require('../steemApi').postsUtil;
const {Wobj} = require('../../models');
const _ = require('lodash');

const combinedWObjectData = async (data) => {
    try {
        const {wObjectData} = await Wobj.getOne(data);             //get from db info about wobject

        // const names = wObjectData.fields
        //     .filter(item => item.locale==='en-US' && item.name==='name');
        // data.tag = names.length ? _.maxBy(names, 'weight').body : 'life';
        // //tag for search posts in blockchain as most popularity field name in en-US locale
        //
        // const {posts} = await postsUtil.getPostsByTrending(data);  //get posts from blockchain
        //
        // Object.assign(wObjectData, {posts: posts});
        return {wObjectData};
    }catch (error) {
        return {error};
    }
};

module.exports = {combinedWObjectData};