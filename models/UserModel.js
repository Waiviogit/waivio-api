const UserModel = require('../database').models.User;
const userSteemUtil = require('../utilities/steemApi').userUtil;
const {wObjectHelper} = require('../utilities/helpers');
const {rankHelper} = require('../utilities/helpers');
const wObjectModel = require('../database/schemas/wObjectSchema');

const getOne = async function (name) {
    try {
        const {userData, err} = await userSteemUtil.getAccount(name);   //get user data from STEEM blockchain
        if (err) {
            return {error}
        }
        const user = await UserModel.findOne({name: name}).lean();      //get user data from db

        await rankHelper.calculate(user.w_objects);
        // await Promise.all(user.w_objects.map(async (wobject) => {       //add rank in wobject to users
        //     const wobj = await wObjectModel.findOne({'author_permlink': wobject.author_permlink}).lean();
        //     let rank = rankHelper.calculate(wobject.weight, wobj.weight);
        //     if(rank<1){
        //         rank = 1;
        //     }
        //     wobject.rank = rank > 99 ? 99 : rank;
        // }));

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