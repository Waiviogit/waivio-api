/* eslint-disable camelcase */
const moment = require('moment');
const _ = require('lodash');
const { ObjectProcessor, FIELDS_NAMES } = require('@waivio/objects-processor');
const {
  REQUIREDFILDS_WOBJ_LIST,
} = require('../../constants/wobjectsData');
const { postsUtil } = require('../hiveApi');
const blacklistModel = require('../../models/blacklistModel');
const UserExpertiseModel = require('../../models/UserExpertiseModel');
const {
  TTL_TIME,
  REDIS_KEYS,
} = require('../../constants/common');
const Wobj = require('../../models/wObjectModel');
const mutedModel = require('../../models/mutedUserModel');
const { getWaivioAdminsAndOwner } = require('./getWaivioAdminsAndOwnerHelper');
const jsonHelper = require('./jsonHelper');
const { REMOVE_OBJ_STATUSES } = require('../../constants/wobjectsData');

const {
  getCacheKey,
  getCachedData,
  setCachedData,
} = require('./cacheHelper');
const { isMobileDevice } = require('../../middlewares/context/contextHelper');

const MASTER_ACCOUNT = process.env.MASTER_ACCOUNT || 'waivio';

const findParentsByPermlink = async (permlinks) => {
  const { result: parents } = await Wobj.find(
    { author_permlink: { $in: permlinks } },
    { search: 0, departments: 0 },
  );

  return parents;
};

const getBlacklist = async (admins) => {
  const key = `${REDIS_KEYS.API_RES_CACHE}:getBlacklist:${getCacheKey({ getBlacklist: admins })}`;
  const cache = await getCachedData(key);
  if (cache) return jsonHelper.parseJson(cache, []);

  let followList = [];
  let resultBlacklist = [];
  if (_.isEmpty(admins)) return resultBlacklist;

  const { blackLists } = await blacklistModel
    .find({ user: { $in: admins } }, {
      followLists: 1,
      blackList: 1,
    });

  _.forEach(blackLists, (el) => {
    followList = _.union(followList, el.followLists);
    resultBlacklist = _.union(resultBlacklist, el.blackList);
  });
  const { result: muted } = await mutedModel.find({
    condition: { mutedBy: { $in: admins } },
    select: { userName: 1 },
  });

  resultBlacklist.push(..._.map(muted, (m) => m.userName));
  if (_.isEmpty(followList)) return resultBlacklist;

  const { blackLists: fromFollows } = await blacklistModel
    .find({ user: { $in: followList } }, { blackList: 1 });

  _.forEach(fromFollows, (el) => {
    resultBlacklist = _.union(resultBlacklist, el.blackList);
  });

  const result = _.difference(resultBlacklist, admins);

  await setCachedData({
    key, data: result, ttl: TTL_TIME.THIRTY_MINUTES,
  });

  return result;
};

const getObjectsByGroupId = async (ids) => {
  const { result: wobjects } = await Wobj.findObjects({
    filter: {
      fields: {
        $elemMatch: {
          name: FIELDS_NAMES.GROUP_ID,
          body: { $in: ids },
        },
      },
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
    },
  });

  return wobjects;
};

const processor = new ObjectProcessor({
  findParentsByPermlink,
  getWaivioAdminsAndOwner,
  getBlacklist,
  getObjectsByGroupId,
  masterAccount: MASTER_ACCOUNT,
});

// getLinkToPageLoad check mobile flag

const {
  processWobjects,
  getLinkToPageLoad,
  getParentInfo,
  addDataToFields,
  findFieldByBody,
  calculateApprovePercent,
} = processor;

// eslint-disable-next-line camelcase
const getUserSharesInWobj = async (name, author_permlink) => {
  const userObjectShare = await UserExpertiseModel.findOne({
    user_name: name,
    author_permlink,
  }, '-_id weight');

  return _.get(userObjectShare, 'weight') || 0;
};

const getWobjectFields = async (permlink) => {
  const { result } = await Wobj.findOne({ author_permlink: permlink });
  if (!result) {
    return {
      error: {
        status: 404,
        message: 'Wobject not found',
      },
    };
  }
  return { wobject: result };
};

/** We have some types of admins at wobject, in this method we find admin role type */

const arrayFieldsSpecialSort = (a, b) => {
  if (!!a.adminVote && !!b.adminVote) return b._id - a._id;
  if (!!a.adminVote || !!b.adminVote) return !!b.adminVote - !!a.adminVote;
  return b.weight - a.weight;
};

/** Get info of wobject parent with specific winning fields */

const fillObjectByExposedFields = async (obj, exposedFields) => {
  const { result } = await postsUtil.getPostState(
    {
      author: obj.author,
      permlink: obj.author_permlink,
      category: 'waivio-object',
    },
  );
  if (!result) {
    obj.fields = [];
  }
  obj.fields.forEach((field, index) => {
    /** if field not exist in object type for this object - remove it */
    if (!_.includes(exposedFields, field.name)) {
      delete obj.fields[index];
      return;
    }
    let post = _.get(result, `content['${field.author}/${field.permlink}']`);
    if (!post?.author) post = createMockPost(field);

    Object.assign(
      field,
      _.pick(post, ['children', 'total_pending_payout_value',
        'total_payout_value', 'pending_payout_value', 'curator_payout_value', 'cashout_time']),
    );
    field.fullBody = post.body;
  });
  return obj;
};

const createMockPost = (field) => ({
  children: 0,
  total_pending_payout_value: '0.000 HBD',
  total_payout_value: '0.000 HBD',
  pending_payout_value: '0.000 HBD',
  curator_payout_value: '0.000 HBD',
  cashout_time: moment.utc()
    .add(7, 'days')
    .toDate(),
  body: `@${field.creator} added ${field.name} (${field.locale})`,
});

const getCurrentNames = async (names) => {
  const { result: wobjects } = await Wobj.find({ author_permlink: { $in: names } }, {
    author_permlink: 1,
    fields: 1,
  });
  const result = await Promise.all(wobjects.map(async (wobject) => {
    const { name } = await processWobjects({
      wobjects: [wobject],
      fields: [FIELDS_NAMES.NAME],
      returnArray: false,
      mobile: isMobileDevice(),
    });
    return {
      author_permlink: wobject.author_permlink,
      name,
    };
  }));
  return { result };
};

const moderatePosts = async ({
  posts,
  app,
  locale,
}) => {
  await Promise.all(posts.map(async (post) => {
    if (post.wobjects) {
      post.wobjects = await processWobjects({
        wobjects: post.wobjects,
        app,
        hiveData: false,
        returnArray: true,
        locale,
        fields: REQUIREDFILDS_WOBJ_LIST,
        mobile: isMobileDevice(),
      });
    }
  }));
};

const getPinFilter = (processedObj, pinnedLinksCurrentUser) => {
  const filteredPinBody = (processedObj?.pin ?? [])
    .filter((el) => !(processedObj?.remove ?? []).includes(el.body))
    .map((el) => el.body);

  const processedCurrentUser = filteredPinBody.filter((el) => pinnedLinksCurrentUser.includes(el));

  const othersPin = (processedObj?.pin ?? [])
    .filter((el) => filteredPinBody.includes(el.body) && !pinnedLinksCurrentUser.includes(el.body))
    .sort(arrayFieldsSpecialSort)
    .slice(0, 5)
    .map((el) => el.body);

  const resultLinks = [...processedCurrentUser, ...othersPin];

  return resultLinks.map((link) => {
    const [author, permlink] = link.split('/');
    return {
      author,
      permlink,
    };
  });
};
const getCurrentUserPins = ({ object, userName }) => _
  .chain(object.fields)
  .filter(
    (f) => ((!!(f.active_votes ?? []).find((v) => v.voter === userName && v.percent > 0)
        && f.name === FIELDS_NAMES.PIN)
      || (f.creator === userName && !f?.active_votes?.length && f.name === FIELDS_NAMES.PIN)
    ),
  )
  .map((el) => el.body)
  .value();

module.exports = {
  getUserSharesInWobj,
  getLinkToPageLoad,
  getWobjectFields,
  getCurrentNames,
  processWobjects,
  getParentInfo,
  fillObjectByExposedFields,
  calculateApprovePercent,
  addDataToFields,
  moderatePosts,
  arrayFieldsSpecialSort,
  getBlacklist,
  findFieldByBody,
  getPinFilter,
  getCurrentUserPins,
};
