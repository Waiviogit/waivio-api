const UserModel = require('database').models.User;
const _ = require('lodash');

exports.getOne = async (name, keys) => {
  try {
    return { user: await UserModel.findOne({ name }).select(keys).lean() };
  } catch (error) {
    return { error };
  }
};

exports.findOneByCondition = async (condition) => {
  try {
    return { user: await UserModel.findOne(condition).lean() };
  } catch (error) {
    return { error };
  }
};

exports.getAll = async ({ limit, skip }) => {
  try {
    return { UserData: await UserModel.find().skip(skip).limit(limit).lean() };
  } catch (error) {
    return { error };
  }
};

exports.getObjectsFollow = async (data) => { // list of wobjects which specified user is follow
  try {
    const user = await UserModel.findOne({ name: data.name })
      .populate({
        path: 'full_objects_follow',
        options: {
          limit: data.limit,
          skip: data.skip,
          sort: { weight: -1 },
          select: '-_id ',
        },
      }) // fill array author_permlink-s full info about wobject
      .select('objects_follow')
      .lean();

    if (!user || !user.full_objects_follow) {
      return { wobjects: [] };
    }
    user.full_objects_follow.forEach((wObject) => {
      wObject.fields = _.filter(wObject.fields, (field) => _.includes(['name', 'avatar'], field.name));
    });

    return { wobjects: user.full_objects_follow };
  } catch (error) {
    return { error };
  }
};

exports.aggregate = async (pipeline) => {
  try {
    const result = await UserModel.aggregate(pipeline).exec();

    if (!result) {
      return { error: { status: 404, message: 'Not found!' } };
    }
    return { result };
  } catch (error) {
    return { error };
  }
};

exports.updateOne = async (condition, updateData = {}) => {
  try {
    const user = await UserModel
      .findOneAndUpdate(condition, updateData,
        { upsert: true, new: true, setDefaultsOnInsert: true })
      .select('+user_metadata +privateEmail');

    return { user };
  } catch (error) {
    return { error };
  }
};

exports.getFollowers = async ({ name, skip = 0, limit = 30 }) => {
  try {
    return {
      users: await UserModel
        .find({ users_follow: name }, { _id: 0, name: 1, wobjects_weight: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    };
  } catch (error) {
    return { error };
  }
};

exports.getFollowings = async ({ name, skip = 0, limit = 30 }) => {
  try {
    const result = await UserModel.findOne(
      { name }, { _id: 1, users_follow: { $slice: [skip, limit] } },
    ).lean();

    return { users: _.get(result, 'users_follow', []) };
  } catch (error) {
    return { error };
  }
};

exports.search = async ({
  string, skip, limit, notGuest,
}) => {
  try {
    const condition = { name: { $in: [new RegExp(`^waivio_${string}`), new RegExp(`^${string}`)] } };
    if (notGuest) condition.auth = { $exists: false };
    return {
      users: await UserModel
        .find(condition, {
          _id: 0, name: 1, wobjects_weight: 1, followers_count: 1,
        })
        .sort({ wobjects_weight: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    };
  } catch (error) {
    return { error };
  }
};

exports.find = async ({
  condition, skip, limit, sort, select,
}) => {
  try {
    return {
      usersData: await UserModel
        .find(condition)
        .select(select)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
    };
  } catch (error) {
    return { error };
  }
};

exports.getCustomCount = async (condition) => {
  try {
    return {
      count: await UserModel.find(condition).countDocuments(),
    };
  } catch (error) {
    return { error };
  }
};
