const UserModel = require('../database').models.User;
const UserWobjects = require('../database').models.UserWobjects;
const userSteemUtil = require('../utilities/steemApi').userUtil;
const {wObjectHelper} = require('../utilities/helpers');
const {rankHelper} = require('../utilities/helpers');
const {REQUIREDFIELDS} = require('../utilities/constants');
const _ = require('lodash');

const getOne = async function (name) {
    try {
        const {userData, err} = await userSteemUtil.getAccount(name);       //get user data from STEEM blockchain
        if (err) {
            return {error}
        }
        const user = await UserModel.findOne({name: name}).lean();          //get user data from db
        if (!user) {
            return {userData}
        }
        // await rankHelper.calculateForUserWobjects(user.w_objects);       //add rank to wobjects in user

        if (user) {
            user.objects_following_count = user.objects_follow.length;
        }
        Object.assign(userData, user);                                      //combine data from db and blockchain
        return {userData}
    } catch (error) {
        return {error}
    }
};

const getAll = async function ({limit, skip}) {
    try {
        return {UserData: await UserModel.find().skip(skip).limit(limit).lean()};
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
        const fields = REQUIREDFIELDS.map(item => ({name:item}));
        user.full_objects_follow.forEach((wObject) => {
            wObjectHelper.formatRequireFields(wObject, data.locale, fields);
        });

        await rankHelper.calculateWobjectRank(user.full_objects_follow);    //calculate rank for wobject

        return {wobjects: user.full_objects_follow}
    } catch (error) {
        return {error}
    }
};

const getUserObjectsShares = async function (data) {
    try {
        const wobjects = await UserWobjects.aggregate([
            { $match: { user_name: data.name } },
            { $sort: { weight: -1 } },
            { $skip: data.skip },
            { $limit: data.limit },
            {
                $lookup: {
                    from: 'wobjects',
                    localField: 'author_permlink',
                    foreignField: 'author_permlink',
                    as: 'wobject',
                },
            },
            { $unwind: '$wobject' },
            {
                $addFields: {
                    'wobject.user_weight': '$weight',
                },
            },
            { $replaceRoot: { newRoot: '$wobject' } }
        ]).option({hint:{user_name: 1}});
        let required_fields = [...REQUIREDFIELDS];
        const fields = required_fields.map(item => ({name: item}));
        wobjects.forEach((wObject) => {
            wObjectHelper.formatRequireFields(wObject, data.locale, fields);
        });
        await rankHelper.calculateForUserWobjects(wobjects, true);
        return {objects_shares: {wobjects, wobjects_count: await UserWobjects.countDocuments({user_name:data.name})}};
    } catch (error) {
        return {error}
    }
};

module.exports = {getAll, getOne, getObjectsFollow, getUserObjectsShares};
