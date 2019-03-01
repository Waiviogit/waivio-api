const {wobjRefsClient} = require('./redis');

const getWobjRefs = async function (author_permlink) {
    const res = await wobjRefsClient.hgetallAsync(author_permlink);
    return res;
};  //get wobjects references, if post_with_wobj - list of wobjects, else if append_obj - root object of append object

module.exports = {getWobjRefs}