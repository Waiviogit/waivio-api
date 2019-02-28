const {Post} = require('../models');
const {postHelper} = require('../utilities/helpers');

const show = async function (req, res, next) {
    const {post, error} = await postHelper.getPost(req.params.author, req.params.permlink);
    if (error) {
        return next(error)
    }
    res.status(200).json(post);

};

module.exports = {show};