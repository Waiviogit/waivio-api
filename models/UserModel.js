const UserModel = require('../database').models.User;
const userSteemUtil = require('../utilities/steemApi').userUtil;
const {wObjectHelper} = require('../utilities/helpers');
const {rankHelper} = require('../utilities/helpers');

const getOne = async function (name) {
    try {
        const {userData, err} = await userSteemUtil.getAccount(name);   //get user data from STEEM blockchain
        if (err) {
            return {error}
        }
        const user = await UserModel.findOne({name: name}).lean();      //get user data from db
        if (!user) {
            return {userData}
        }
        await rankHelper.calculateForUserWobjects(user.w_objects);     //add rank to wobjects in user

        if (user) {
            user.objects_following_count = user.objects_follow.length;
        }
        Object.assign(userData, user);                                  //combine data from db and blockchain
        return {userData}
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

const getObjectsFollow = async function (data) {        //list of wobjects which specified user is follow
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
            {name: 'avatar'},
            {name: 'name'},
            {name: 'link'},
            {name: 'address'}];
        user.full_objects_follow.forEach((wObject) => {
            wObjectHelper.formatRequireFields(wObject, data.locale, requireFields);
        });

        await rankHelper.calculateWobjectRank(user.full_objects_follow);    //calculate rank for wobject

        return {wobjects: user.full_objects_follow}
    } catch (error) {
        return {error}
    }
};

module.exports = {create, getAll, getOne, getObjectsFollow};