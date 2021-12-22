const { Wobj, Post } = require('models');
const {
  objectExperts, wobjectInfo, getManyObjects,
  getPostsByWobject, getGallery, getWobjField, sortFollowers, getRelated,
  getWobjsNearby, countWobjsByArea, getChildren, objectsOnMap, campaignOps,
} = require('utilities/operations').wobject;
const { wobjects: { searchWobjects } } = require('utilities/operations').search;
const validators = require('controllers/validators');

const index = async (req, res, next) => {
  const value = validators.validate({
    user_limit: req.body.userLimit,
    locale: req.body.locale,
    author_permlinks: req.body.author_permlinks,
    object_types: req.body.object_types,
    exclude_object_types: req.body.exclude_object_types,
    required_fields: req.body.required_fields,
    limit: req.body.limit,
    skip: req.body.skip,
    sample: req.body.sample,
    map: req.body.map,
  }, validators.wobject.indexSchema, next);

  if (!value) return;

  const { wObjectsData, hasMore, error } = await getManyObjects.getMany(value);

  if (error) return next(error);

  res.result = { status: 200, json: { wobjects: wObjectsData, hasMore } };
  next();
};

// flag - Temporary solution
const show = async (req, res, next) => {
  const value = validators.validate({
    author_permlink: req.params.authorPermlink,
    locale: req.headers.locale,
    listCounters: req.query.listCounters,
    user: req.query.user,
    appName: req.headers.app,
  }, validators.wobject.showSchema, next);

  if (!value) return;

  const { wobjectData, error } = await wobjectInfo.getOne(value);

  if (error) return next(error);

  res.result = { status: 200, json: wobjectData };
  next();
};

const posts = async (req, res, next) => {
  const value = validators.validate({
    author_permlink: req.params.authorPermlink,
    limit: req.body.limit,
    skip: req.body.skip,
    user_languages: req.body.user_languages,
    forApp: req.headers.app,
    lastId: req.body.lastId,
    userName: req.headers.follower,
    newsPermlink: req.body.newsPermlink,
  }, validators.wobject.postsScheme, next);

  if (!value) return;

  const { posts: wobjectPosts, error } = await getPostsByWobject({ ...value, app: req.appData });

  if (error) return next(error);

  res.result = { status: 200, json: wobjectPosts };
  next();
};

const feed = async (req, res, next) => {
  const value = validators.validate({
    filter: req.body.filter,
    limit: req.body.limit,
    skip: req.body.skip,
  }, validators.wobject.feedScheme, next);

  if (!value) return;

  const { posts: AllPosts, error } = await Post.getAllPosts(value);

  if (error) {
    return next(error);
  }
  res.result = { status: 200, json: AllPosts };
  next();
};

const followers = async (req, res, next) => {
  const value = validators.validate({
    author_permlink: req.params.authorPermlink,
    ...req.body,
  }, validators.wobject.followersScheme, next);

  if (!value) return;

  const { result } = await sortFollowers(value);

  res.result = { status: 200, json: result };
  next();
};

const search = async (req, res, next) => {
  const value = validators.validate({
    string: req.body.search_string,
    ...req.body,
  }, validators.wobject.searchScheme, next);

  if (!value) return;

  const { wobjects, hasMore, error } = await searchWobjects(value);

  if (error) return next(error);

  res.result = { status: 200, json: { wobjects, hasMore } };
  next();
};

const gallery = async (req, res, next) => {
  const value = validators.validate({
    authorPermlink: req.params.authorPermlink,
    locale: req.headers.locale,
    app: req.headers.app,
  }, validators.wobject.galleryScheme, next);

  if (!value) return;

  const { result, error } = await getGallery(value);

  if (error) return next(error);

  res.result = { status: 200, json: result };
  req.author_permlink = req.params.authorPermlink;
  next();
};

const objectExpertise = async (req, res, next) => {
  const value = validators.validate({
    author_permlink: req.params.authorPermlink,
    ...req.body,
  }, validators.wobject.objectExpertiseScheme, next);

  if (!value) return;
  const { experts, userExpert, error } = await objectExperts.getWobjExperts(value);

  if (error) {
    return next(error);
  }
  res.result = { status: 200, json: { users: experts, user: userExpert } };
  next();
};

const getByField = async (req, res, next) => {
  const value = validators.validate({
    fieldName: req.query.fieldName,
    fieldBody: req.query.fieldBody,
  }, validators.wobject.getByFieldScheme, next);

  if (!value) return;
  const { wobjects, error } = await Wobj.getByField(value);

  if (error) return next(error);
  res.result = { status: 200, json: wobjects };
  next();
};

const getChildWobjects = async (req, res, next) => {
  const value = validators.validate(
    { ...req.params, ...req.query },
    validators.wobject.getChildWobjects, next,
  );

  if (!value) return;
  const { wobjects, error } = await getChildren(value);

  if (error) return next(error);
  res.result = { status: 200, json: wobjects };
  next();
};

const getWobjectField = async (req, res, next) => {
  const value = validators.validate(Object.assign(req.query, {
    locale: req.headers.locale,
    app: req.headers.app,
    authorPermlink: req.params.authorPermlink,
  }),
  validators.wobject.getWobjectField, next);
  if (!value) return;
  const { toDisplay, field, error } = await getWobjField(value);

  if (error) return next(error);
  res.result = { status: 200, json: { toDisplay, field } };
  next();
};

const getWobjectsNearby = async (req, res, next) => {
  const value = validators.validate({
    authorPermlink: req.params.authorPermlink,
    ...req.query,
  },
  validators.wobject.getWobjectsNearby, next);
  if (!value) return;
  const { wobjects, error } = await getWobjsNearby(value);

  if (error) return next(error);
  res.result = { status: 200, json: wobjects };
  next();
};

const countWobjectsByArea = async (req, res, next) => {
  const value = validators.validate({ ...req.query },
    validators.wobject.countWobjectsByArea, next);
  if (!value) return;
  const { wobjects: wobjectCounts, error } = await countWobjsByArea(value);
  if (error) return next(error);

  res.result = { status: 200, json: wobjectCounts };
  next();
};

const related = async (req, res, next) => {
  const value = validators.validate(
    { ...req.params, ...req.query },
    validators.wobject.getRelatedAlbum,
    next,
  );
  if (!value) return;

  const { json, error } = await getRelated(value);
  if (error) return next(error);
  res.result = { status: 200, json };
  next();
};

const getMapObjectExperts = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.wobject.mapExpertsScheme,
    next,
  );
  if (!value) return;

  const { users, hasMore, error } = await objectsOnMap.getExpertsFromArea(
    { ...value, app: req.appData },
  );

  if (error) return next(error);
  res.result = { status: 200, json: { users, hasMore } };
  next();
};

const getMapObjectLastPost = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.wobject.mapLastPostScheme,
    next,
  );
  if (!value) return;
  const wobjects = [{
    _id: '5f0b7d8b408024331b195ad9',
    is_posting_open: true,
    is_extending_open: true,
    weight: 68079353.89,
    count_posts: 21,
    parent: '',
    last_posts_count: 0,
    author_permlink: 'yhp-cactus-club-cafe-richmond',
    author: 'u89gw',
    creator: 'versentry',
    app: 'waivio/1.0.0',
    community: '',
    default_name: 'Cactus Club Cafe (Richmond)',
    object_type: 'restaurant',
    createdAt: '2020-07-12T21:15:55.942Z',
    updatedAt: '2021-12-22T08:01:23.190Z',
    __v: 0,
    ratings: ['Ambience', 'Food', 'Service', 'Value'],
    authority: { ownership: [], administrative: [] },
    activeCampaignsCount: 2,
    activeCampaigns: ['613cbbc541fdbe5cb924d53a', '613cbd7e41fdbe5cb924d53c'],
    search: ['(604) 244-9969', '6551 Number 3 Rd #1666,Richmond,BC,V6Y 2B6,Canada', '6551 Number 3 Rd #1666, Richmond, BC, V6Y 2B6, Canada', 'Cactus Club Cafe (Richmond)', 'Cactus Club Cafe Richmond', 'yhp-cactus-club-cafe-richmond', 'guestexperience@cactusclubcafe.com', 'cafe', 'patio', 'canadian', 'takeout', 'cocktails', 'dates', 'ocean-wise', 'westcoast', 'contemporary', 'global', 'dinner', 'creative', 'lounge', 'Every Guest Leaves Happy', 'Leader in creative fine dining & modern Canadian cuisine.', 'It’s patio season all year-long with our heated, enclosed patio, retractable roof and sliding glass walls.', 'Born on the West Coast and growing across Canada, Cactus Club Cafe offers the best in global cuisine using local, fresh ingredients served in a vibrant, contemporary setting.'],
    expertiseWAIV: 880080.5109999998,
    lastPost: '61a26ac19eb67c58f75d2f87',
    post: {
      _id: '61a26ac19eb67c58f75d2f87',
      author: 'sofiag',
      permlink: 'review-cactus-club-cafe-richmond-truffle-fries',
      __v: 0,
      abs_rshares: 1503180395242,
      active_votes: [{
        _id: '61a2817f4a3e5a93e768f1b5', voter: 'yintercept', weight: 171938, percent: 10000, rsharesWAIV: 1, rshares: 171938491863,
      }, {
        _id: '61a2817f4a3e5a93e768f1b6', voter: 'waivio.match', weight: 1331242, percent: 2008, rshares: 1331241903379, rsharesWAIV: 1,
      }],
      app: 'waivio/1.0.0',
      author_reputation: 2776287765619,
      author_weight: 125023540.66993438,
      beneficiaries: [{ account: 'van.dining', weight: 500, _id: '61a2817f4a3e5a93e768f1b4' }],
      blocked_for_apps: [],
      body: '[Cactus Club Cafe (Richmond)](https://www.waivio.com/object/yhp-cactus-club-cafe-richmond)\n[Truffle Fries](https://www.waivio.com/object/ymm-truffle-fries)\nMy favourite item to start and share, for obvious reasons 😍 \n\n\n<center>![image](https://waivio.nyc3.digitaloceanspaces.com/1638034078_583e853c-3aab-49c7-9c7f-381f0704e2a5)</center>\n\n<center>![image](https://waivio.nyc3.digitaloceanspaces.com/1638034081_29aa0274-2f24-4bb9-9adb-1b82734d0c63)</center>\n\n***\nThis review was sponsored in part by Vancouver Dining Gifts ([@van.dining](/@van.dining))',
      cashout_time: '2021-12-04T17:28:30',
      children: 0,
      created: '2021-11-27T17:28:30',
      createdAt: '2021-11-27T17:28:33.673Z',
      curator_payout_value: '2.224 HBD',
      depth: 0,
      guestInfo: null,
      json_metadata: '{"community":"waivio","app":"waivio/1.0.0","format":"markdown","timeOfPostCreation":1638034112750,"host":"van.dining.gifts","users":[],"links":["http://van.dining.gifts/object/yhp-cactus-club-cafe-richmond","http://van.dining.gifts/object/ymm-truffle-fries"],"image":["https://waivio.nyc3.digitaloceanspaces.com/1638034078_583e853c-3aab-49c7-9c7f-381f0704e2a5","https://waivio.nyc3.digitaloceanspaces.com/1638034081_29aa0274-2f24-4bb9-9adb-1b82734d0c63"],"wobj":{"wobjects":[{"object_type":"restaurant","objectName":"Cactus Club Cafe (Richmond)","author_permlink":"yhp-cactus-club-cafe-richmond","percent":50},{"object_type":"dish","objectName":"Truffle Fries","author_permlink":"ymm-truffle-fries","percent":50}]},"campaignId":"613cbd7e41fdbe5cb924d53c","tags":["waivio","fries","food","review","yum","dinewithpurpose","restaurant"]}',
      language: 'en-US',
      max_accepted_payout: '1000000.000 HBD',
      net_rshares: 1503180395242,
      net_rshares_WAIV: 522.765879314249,
      parent_author: '',
      parent_permlink: 'waivio',
      pending_payout_value: '0.000 HBD',
      percent_hbd: 10000,
      reblogged_by: [],
      reblogged_users: ['van.dining'],
      root_author: 'sofiag',
      root_title: 'Review: Cactus Club Cafe (Richmond), Truffle Fries',
      title: 'Review: Cactus Club Cafe (Richmond), Truffle Fries',
      total_payout_WAIV: 1.04121336,
      total_payout_value: '2.116 HBD',
      total_pending_payout_value: '0.000 HBD',
      updatedAt: '2021-12-18T02:46:54.129Z',
      url: '/waivio/@sofiag/review-cactus-club-cafe-richmond-truffle-fries',
      vote_rshares: 1503180395242,
      wobjects: [{
        _id: '61a26ac19eb67c58f75d2f86', object_type: 'restaurant', objectName: 'Cactus Club Cafe (Richmond)', author_permlink: 'yhp-cactus-club-cafe-richmond', percent: 50,
      }, {
        _id: '61a26ac19eb67c58f75d2f85', object_type: 'dish', objectName: 'Truffle Fries', author_permlink: 'ymm-truffle-fries', percent: 50,
      }, {
        _id: '61a26ac19eb67c58f75d2f84', author_permlink: 'waivio', object_type: 'hashtag', percent: 0,
      }, {
        _id: '61a26ac19eb67c58f75d2f83', author_permlink: 'fries', object_type: 'hashtag', percent: 0,
      }, {
        _id: '61a26ac19eb67c58f75d2f82', author_permlink: 'food', object_type: 'hashtag', percent: 0,
      }, {
        _id: '61a26ac19eb67c58f75d2f81', author_permlink: 'review', object_type: 'hashtag', percent: 0,
      }, {
        _id: '61a26ac19eb67c58f75d2f80', author_permlink: 'yum', object_type: 'hashtag', percent: 0,
      }, {
        _id: '61a26ac19eb67c58f75d2f7f', author_permlink: 'dinewithpurpose', object_type: 'hashtag', percent: 0,
      }, {
        _id: '61a26ac19eb67c58f75d2f7e', author_permlink: 'restaurant', object_type: 'hashtag', percent: 0,
      }],
      active: '2021-11-27T17:28:30',
      allow_curation_rewards: true,
      allow_replies: true,
      allow_votes: true,
      author_rewards: 0,
      body_length: 550,
      category: 'waivio',
      children_abs_rshares: 0,
      id: 108060451,
      last_payout: '1969-12-31T23:59:59',
      last_update: '2021-11-27T17:28:30',
      max_cashout_time: '1969-12-31T23:59:59',
      net_votes: 2,
      promoted: '0.000 HBD',
      reward_weight: 10000,
      root_permlink: 'review-cactus-club-cafe-richmond-truffle-fries',
      total_vote_weight: 1503180395242,
    },
    campaigns: { min_reward: 7.7344, max_reward: 7.7344 },
    name: 'Cactus Club Cafe (Richmond)',
    tagCategory: [{
      weight: 1,
      locale: 'en-US',
      _id: '5f0b7d95408024331b195ade',
      creator: 'asd09',
      author: 'x6oc5',
      permlink: 'vvo-yhp-cactus-club-cafe-richmond-tag-category',
      name: 'tagCategory',
      body: 'Good For',
      id: 'e13f4a50-c484-11ea-88cf-e59dacb20d42',
      active_votes: [],
      createdAt: 1594588565000,
      approvePercent: 100,
      items: [{
        weight: 941.625,
        locale: 'en-US',
        _id: '60a8330dfc94c60fc12e5714',
        creator: 'dining.gifts',
        author: 'w7ngc',
        permlink: 'dininggifts-jgec9fxb5nd',
        name: 'categoryItem',
        body: 'takeout',
        id: 'e13f4a50-c484-11ea-88cf-e59dacb20d42',
        tagCategory: 'Good For',
        active_votes: [{
          _id: '60a83312fc94c60fc12e5803', voter: 'dining.gifts', percent: 50, rshares_weight: 1505, weight: 940.625, timestamp: 1621635858000,
        }],
        createdAt: 1621635853000,
        approvePercent: 100,
      }, {
        weight: 1694.125,
        locale: 'en-US',
        _id: '60a83346fc94c60fc12e70cc',
        creator: 'dining.gifts',
        author: 'sor31',
        permlink: 'dininggifts-j8m0ff07r8d',
        name: 'categoryItem',
        body: 'dates',
        id: 'e13f4a50-c484-11ea-88cf-e59dacb20d42',
        tagCategory: 'Good For',
        active_votes: [{
          _id: '60a83349fc94c60fc12e70dd', voter: 'dining.gifts', percent: 50, rshares_weight: 1505, weight: 1693.125, timestamp: 1621635913000,
        }],
        createdAt: 1621635910000,
        approvePercent: 100,
      }],
    }, {
      weight: 1,
      locale: 'en-US',
      _id: '5f0b7d95408024331b195adf',
      creator: 'asd09',
      author: 'vmn31',
      permlink: 'mcv-yhp-cactus-club-cafe-richmond-tag-category',
      name: 'tagCategory',
      body: 'Features',
      id: 'e13efc30-c484-11ea-88cf-e59dacb20d42',
      active_votes: [],
      createdAt: 1594588565000,
      approvePercent: 100,
      items: [{
        weight: 1317.875,
        locale: 'en-US',
        _id: '60a8332bfc94c60fc12e630c',
        creator: 'dining.gifts',
        author: 'x6oc5',
        permlink: 'dininggifts-kujjij4bjt',
        name: 'categoryItem',
        body: 'cocktails',
        id: 'e13efc30-c484-11ea-88cf-e59dacb20d42',
        tagCategory: 'Features',
        active_votes: [{
          _id: '60a8332ffc94c60fc12e6742', voter: 'dining.gifts', percent: 50, rshares_weight: 1505, weight: 1316.875, timestamp: 1621635887000,
        }],
        createdAt: 1621635883000,
        approvePercent: 100,
      }, {
        weight: 2070.375,
        locale: 'en-US',
        _id: '60a83390fc94c60fc12e8a25',
        creator: 'dining.gifts',
        author: 'vmn31',
        permlink: 'dininggifts-bunx16scvub',
        name: 'categoryItem',
        body: 'ocean-wise',
        id: 'e13efc30-c484-11ea-88cf-e59dacb20d42',
        tagCategory: 'Features',
        active_votes: [{
          _id: '60a83394fc94c60fc12e8b37', voter: 'dining.gifts', percent: 50, rshares_weight: 1505, weight: 2069.375, timestamp: 1621635988000,
        }],
        createdAt: 1621635984000,
        approvePercent: 100,
      }, {
        weight: 1.5076000000000052,
        locale: 'en-US',
        _id: '611c0bf66667bc2439cb34e9',
        creator: 'dataoperator',
        author: 'u89gw',
        permlink: 'dataoperator-dofkfj2umle',
        name: 'categoryItem',
        body: 'patio',
        id: 'e13efc30-c484-11ea-88cf-e59dacb20d42',
        tagCategory: 'Features',
        active_votes: [{
          _id: '611c0bf76667bc2439cb34ec', voter: 'dataoperator', percent: 1, rshares_weight: 141, weight: 0.5076000000000052, timestamp: 1629228023000,
        }],
        createdAt: 1629228022000,
        approvePercent: 100,
      }, {
        weight: 1.5217000000000052,
        locale: 'en-US',
        _id: '611c0cae6667bc2439cb7051',
        creator: 'dataoperator',
        author: 'asd09',
        permlink: 'dataoperator-pzd1jygsdv',
        name: 'categoryItem',
        body: 'lounge',
        id: 'e13efc30-c484-11ea-88cf-e59dacb20d42',
        tagCategory: 'Features',
        active_votes: [{
          _id: '611c0cb16667bc2439cb7107', voter: 'dataoperator', percent: 1, rshares_weight: 141, weight: 0.5217000000000052, timestamp: 1629228209000,
        }],
        createdAt: 1629228206000,
        approvePercent: 100,
      }],
    }, {
      weight: 1,
      locale: 'en-US',
      _id: '5f0b7d97408024331b195ae0',
      creator: 'asd09',
      author: 'sor31',
      permlink: 'wqw-yhp-cactus-club-cafe-richmond-tag-category',
      name: 'tagCategory',
      body: 'Cuisine',
      id: 'e13d9ca0-c484-11ea-88cf-e59dacb20d42',
      active_votes: [],
      createdAt: 1594588567000,
      approvePercent: 100,
      items: [{
        weight: 565.375,
        locale: 'en-US',
        _id: '60a832a0fc94c60fc12e285f',
        creator: 'dining.gifts',
        author: 'u89gw',
        permlink: 'dininggifts-ugpwem279rr',
        name: 'categoryItem',
        body: 'canadian',
        id: 'e13d9ca0-c484-11ea-88cf-e59dacb20d42',
        tagCategory: 'Cuisine',
        active_votes: [{
          _id: '60a832a6fc94c60fc12e2b0d', voter: 'dining.gifts', percent: 50, rshares_weight: 1505, weight: 564.375, timestamp: 1621635750000,
        }],
        createdAt: 1621635744000,
        approvePercent: 100,
      }, {
        weight: 1, locale: 'en-US', _id: '611be5b5b3e158212517f984', creator: 'asd09', author: 'x6oc5', permlink: 'yxd-yhp-cactus-club-cafe-richmond-category-item', name: 'categoryItem', body: 'westcoast', id: 'e13d9ca0-c484-11ea-88cf-e59dacb20d42', tagCategory: 'Cuisine', active_votes: [], createdAt: 1629218229000, approvePercent: 100,
      }, {
        weight: 1, locale: 'en-US', _id: '611be5b5b3e158212517f986', creator: 'asd09', author: 'vmn31', permlink: 'hoc-yhp-cactus-club-cafe-richmond-category-item', name: 'categoryItem', body: 'global', id: 'e13d9ca0-c484-11ea-88cf-e59dacb20d42', tagCategory: 'Cuisine', active_votes: [], createdAt: 1629218229000, approvePercent: 100,
      }],
    }],
    rating: [{
      weight: 1, locale: 'en-US', _id: '5f0b7da3408024331b195ae7', creator: 'monterey', author: 'w95hj', permlink: 'yhp-cactus-club-cafe-richmond-rating-mfhgw', name: 'rating', body: 'Ambience', active_votes: [], rating_votes: [{ voter: 'versentry', rate: 8 }, { voter: 'pacific.gifts', rate: 10 }], average_rating_weight: 9, createdAt: 1594588579000, approvePercent: 100,
    }, {
      weight: 1, locale: 'en-US', _id: '5f0b7da4408024331b195ae9', creator: 'monterey', author: 'hk14d', permlink: 'yhp-cactus-club-cafe-richmond-rating-ql4vs', name: 'rating', body: 'Food', active_votes: [], rating_votes: [{ voter: 'versentry', rate: 8 }, { voter: 'pacific.gifts', rate: 10 }, { voter: 'dining.gifts', rate: 10 }], average_rating_weight: 9.333333333333334, createdAt: 1594588580000, approvePercent: 100,
    }, {
      weight: 1, locale: 'en-US', _id: '5f0b7da4408024331b195aea', creator: 'monterey', author: 'w7ngc', permlink: 'yhp-cactus-club-cafe-richmond-rating-brqo0', name: 'rating', body: 'Service', active_votes: [], rating_votes: [{ voter: 'versentry', rate: 10 }, { voter: 'dining.gifts', rate: 10 }], average_rating_weight: 10, createdAt: 1594588580000, approvePercent: 100,
    }, {
      weight: 1, locale: 'en-US', _id: '5f0b7da5408024331b195aeb', creator: 'monterey', author: 'q1w2c', permlink: 'yhp-cactus-club-cafe-richmond-rating-iu7zo', name: 'rating', body: 'Value', active_votes: [], rating_votes: [{ voter: 'versentry', rate: 6 }, { voter: 'dining.gifts', rate: 10 }], average_rating_weight: 8, createdAt: 1594588581000, approvePercent: 100,
    }],
    description: 'Born on the West Coast and growing across Canada, Cactus Club Cafe offers the best in global cuisine using local, fresh ingredients served in a vibrant, contemporary setting.',
    avatar: 'https://waivio.nyc3.digitaloceanspaces.com/1596780214_25338245-8303-41a4-a1a3-c649769c1571',
    map: '{"latitude":49.1667021,"longitude":-123.1376786}',
    address: '{"address":"6551 Number 3 Rd #1666","city":"Richmond","state":"BC","postalCode":"V6Y 2B6","country":"Canada"}',
    price: '$$$',
    title: 'Leader in creative fine dining & modern Canadian cuisine. ',
    listItem: [{
      weight: 1, locale: 'en-US', _id: '5f0bd1a9408024331b19a9c2', creator: 'versentry', author: 'yakovinvest', permlink: 'versentry-fi7bz7ncfu6', name: 'listItem', body: 'rwt-menu', type: 'menuList', alias: 'Menu', active_votes: [], createdAt: 1594610089000, approvePercent: 100,
    }, {
      weight: 1087168.7125,
      locale: 'en-US',
      _id: '6089b957b46eba58d4f4a307',
      creator: 'vancouverdining',
      author: 'jkl65',
      permlink: 'vancouverdining-alsxig4kzc5',
      name: 'listItem',
      body: 'exd-locations',
      type: 'menuList',
      alias: 'Locations',
      active_votes: [{
        _id: '6089b95ab46eba58d4f4a432', voter: 'vancouverdining', percent: 25, rshares_weight: 1666633, weight: 1087167.7125, timestamp: 1619638618000,
      }],
      createdAt: 1619638615000,
      approvePercent: 100,
    }],
    sortCustom: ['rwt-menu', 'exd-locations'],
    defaultShowLink: '/object/yhp-cactus-club-cafe-richmond/menu#rwt-menu',
    exposedFields: [],
    topTags: ['ocean-wise', 'dates'],
  }];
  const hasMore = false;
  // const { wobjects, hasMore, error } = await objectsOnMap.getLastPostOnObjectFromArea(
  //   { ...value, app: req.appData },
  // );

  // if (error) return next(error);
  res.result = { status: 200, json: { wobjects, hasMore } };
  next();
};

const getWobjectsByRequiredObject = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.wobject.byRequiredWobjectScheme,
    next,
  );
  if (!value) return;

  const { wobjects, hasMore, error } = await campaignOps.getObjectsByRequired(
    { ...value, app: req.appData },
  );

  if (error) return next(error);
  res.result = { status: 200, json: { wobjects, hasMore } };
  next();
};

module.exports = {
  index,
  show,
  posts,
  search,
  followers,
  gallery,
  feed,
  objectExpertise,
  getByField,
  getChildWobjects,
  getWobjectField,
  getWobjectsNearby,
  countWobjectsByArea,
  related,
  getMapObjectExperts,
  getMapObjectLastPost,
  getWobjectsByRequiredObject,
};
