const {User} = require('../models');
const userHelper = require('../utilities/helpers').userHelper;

const index = async function (req, res, next) {
    const {UserData, error} = await User.getAll();
    if (error) {
        res.json({error});
        return next(error);
    }
    res.status(200).json(UserData);
};

const show = async function (req, res, next) {

    const {userData, error} = await userHelper.combinedUserData(req.params.userName);
    if(error){
        return next(error);
    }
    res.status(200).json(userData);
};

const create = async function (req, res, next) {
    const {user, error} = await User.create({
        name: req.body.name,
        profile_image: req.body.profile_image,
        w_objects: req.body.w_objects,
        read_locales: req.body.read_locales
    });
    if (error) {
        res.send({error});
        return next(error);
    }
    res.status(200).json(user._doc);
};

module.exports = {index, create, show};