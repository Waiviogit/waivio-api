const {User} = require('../models');
const {userHelper} = require('../utilities/helpers');

const index = async function (req, res, next) {
    const {UserData, error} = await User.getAll();
    if (error) {
        res.json({error});
        return next(error);
    }
    res.status(200).json(UserData);
};

const show = async function (req, res, next) {

    // const {userData, error} = await userHelper.combinedUserData(req.params.userName);
    const {user, error} = await User.getOne(req.params.userName);
    if (error) {
        return next(error);
    }
    res.status(200).json(user);
};

const create = async function (req, res, next) {
    const {user, error} = await User.create({
        name: req.body.name,
        profile_image: req.body.profile_image,
        w_objects: req.body.w_objects,
        read_locales: req.body.read_locales,
        objects_follow: req.body.objects_follow
    });
    if (error) {
        return next(error);
    }
    res.status(200).json(user._doc);
};

const objects_follow = async function (req, res, next) {
    const data = {
        name: req.params.userName,
        locale: req.body.locale ? req.body.locale : 'en-US',
        limit: req.body.limit ? req.body.limit : 50,
        skip: req.body.skip ? req.body.skip : 0
    };
    const {wobjects, error} = await User.getObjectsFollow(data);
    if (error) {
        return next(error);
    }
    res.status(200).json(wobjects);
};

module.exports = {index, create, show, objects_follow};