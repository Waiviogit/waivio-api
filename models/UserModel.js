const UserModel = require('../database').models.User;
const {wObjectHelper} = require('../utilities/helpers');

const getOne = async function (name) {
    try {
        return {user: await UserModel.findOne({name: name}).lean()};
    } catch (error) {
        return {error}
    }
};

const getAll = async function () {
    try {
        return {UserData: await UserModel.find()};
    } catch (error) {
        return {error}
    }
};

const create = async function (data) {
    const newUser = new UserModel(data);
    try {
        return {user: await newUser.save()};
    } catch (error) {
        return {error}
    }
};

const getObjectsFollow = async function (data) {
    try {
        const user = await UserModel.findOne({name: data.name})
            .populate({
                path: 'full_objects_follow',
                options: {
                    limit: data.limit,
                    skip: data.skip,
                    sort: {weight: -1},
                    select: '-_id '
                }
            })                              //fill array author_permlink-s full info about wobject
            .select('objects_follow -_id')
            .lean();
        if (!user || !user.full_objects_follow) {
            return {wobjects: []}
        }
        const requireFields = [
            {name: 'avatarImage'},
            {name: 'name'},
            {name: 'link'},
            {name: 'locationCity'}];
        user.full_objects_follow.forEach((wObject) => {
            wObjectHelper.formatRequireFields(wObject, data.locale, requireFields);
        });
        return {wobjects: user.full_objects_follow}
    } catch (error) {
        return {error}
    }
};

module.exports = {create, getAll, getOne, getObjectsFollow};