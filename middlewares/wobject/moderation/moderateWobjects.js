const _ = require('lodash');
const { schema } = require('middlewares/wobject/moderation/schema');
const { App } = require('models');
const wobjectHelper = require('utilities/helpers/wObjectHelper');
const { REQUIREDFIELDS_SEARCH } = require('utilities/constants');

const MODERATION_KEY_FLAG = 'upvotedByModerator';
const MODERATION_DOWNVOTE_KEY_FLAG = 'downvotedByModerator';
const ADMIN_KEY_FLAG = 'upvotedByAdmin';
const ADMIN_DOWNVOTE_KEY_FLAG = 'downvotedByAdmin';

exports.moderate = async (req, res, next) => {
  /*
    First need to find app of current request, then correct scheme of
    location wobjects data in response, and then moderate it if need

    data locate on "res.result" => {status, json}
    app locate on "res.headers.app"
    */
  const { app, error: getAppErr } = await getApp(req);

  if (getAppErr || !app) {
    next();
    return;
  }
  const currentSchema = schema.find((s) => s.path === req.route.path && s.method === req.method);

  if (!currentSchema) {
    next();
    return;
  }
  if (_.includes(['/wobjectSearch', '/generalSearch', '/user/:userName/following_objects'], currentSchema.path)) {
    if (currentSchema.wobjects_path) {
      res.result.json[currentSchema.wobjects_path] = await newValidation(
        res.result.json[currentSchema.wobjects_path], app.admins || [], req.headers.locale,
      );
    } else res.result.json = await newValidation(res.result.json, app.admins || [], req.headers.locale);
    next();
    return;
  }

  switch (currentSchema.case) {
    case 1:
      // root result is single wobject
      res.result.json = await wobjectHelper.processWobjects({
        wobjects: [res.result.json],
        admins: app.admins,
        hiveData: true,
        returnArray: false,
        locale: req.headers.locale,
      });
      break;
    case 2:
      // root result is array of wobjects
      res.result.json = validateWobjects(
        res.result.json,
        app.moderators,
        app.admins,
        currentSchema.author_permlink_path,
        currentSchema.fields_path,
      );
      break;
    case 3:
      // root result is Object with array obj wobjects
      res.result.json[currentSchema.wobjects_path] = validateWobjects(
        res.result.json[currentSchema.wobjects_path],
        app.moderators,
        app.admins,
      );
      break;
    case 4:
      // root result is array of objects (ex. posts), where each has prop array of wobjects
      res.result.json = validateWobjectsEmbeddedArray(
        res.result.json,
        app.moderators,
        app.admins,
        currentSchema.wobjects_path,
      );
      break;
    case 5:
      // root result is array of fields (gallery, list, fields)
      res.result.json = validateFields(
        { author_permlink: req.author_permlink, fields: res.result.json },
        app.moderators, app.admins,
      );
      break;
  }
  next();
};

/**
 * Get app name from request headers and find app with specified name in database
 * @param {Object} req instance of current request
 * @returns {Object} app, error
 */
const getApp = async (req) => {
  const appName = _.get(req, 'headers.app');

  if (!appName) {
    return {};
  }
  return App.getOne({ name: appName });
};

const newValidation = async (wobjects, admins, locale) => wobjectHelper.processWobjects({
  wobjects, admins, hiveData: false, returnArray: true, locale,
});
/*
Validation (checkFollowers) means that to every field in each
    returned wobject which include UpVote or DownVote will be added some key,
    which indicate some specified behavior of this field/wobject.
 */
/**
 * Moderate wobjects by specified moderators
 * @param {Array} wobjects
 * @param {Array} moderators
 * @param {Array} admins
 * @param {string} apPath, custom location of author_permlink, default is "author_permlink"
 * @param {string} fields_path, custom location of fields, default is "fields"
 * @returns {Array} New array of wobjects.
 */

const validateWobjects = (wobjects = [], moderators, admins, apPath = 'author_permlink', fields_path = 'fields') => _.chain(wobjects).map((wobject) => {
  if (_.get(wobject, 'active_votes.length')) {
    // in some cases "wobjects" also might be as "fields" but with some fields item inside
    // in that case, we need to moderate source wobjects(fields) too as usual fields
    // indicate this cases by including non empty "active_votes" array
    const checkVoteRes = checkVotes(wobject.active_votes, moderators, wobject[`${apPath}`], admins);
    if (_.get(checkVoteRes, 'upvotedByAdmin')) {
      wobject[`${ADMIN_KEY_FLAG}`] = true;
    } if (_.get(checkVoteRes, 'upvotedByModerator')) {
      wobject[`${MODERATION_KEY_FLAG}`] = true;
    } else if (_.get(checkVoteRes, 'downvotedByModerator')) {
      wobject[`${MODERATION_DOWNVOTE_KEY_FLAG}`] = true;
    } else if (_.get(checkVoteRes, 'downvotedByAdmin')) {
      wobject[`${ADMIN_DOWNVOTE_KEY_FLAG}`] = true;
    }
    _.forEach(wobject.active_votes,
      (vote) => (vote._id
        ? vote.createdAt = vote._id.getTimestamp().valueOf()
        : vote.createdAt = new Date().valueOf()
      ));
  }
  wobject[fields_path] = validateFields(wobject, moderators, admins, apPath, fields_path);
  wobject = addModerators({ wobject, moderators, admins });
  return wobject;
}).filter(Boolean).value();

const validateWobject = (wobject, moderators, customFieldsPaths, admins) => {
  wobject.fields = validateFields(wobject, moderators, admins, 'author_permlink', 'fields');
  customFieldsPaths.forEach((customFieldsPath) => {
    wobject[customFieldsPath] = validateFields(wobject, moderators, admins, 'author_permlink', customFieldsPath);
  });
  wobject = addModerators({ wobject, moderators, admins });
  return wobject;
};

const addModerators = ({ wobject, moderators, admins }) => {
  wobject.moderators = _.compact(
    _.map(moderators, (moderator) => {
      if (_.includes(moderator.author_permlinks, wobject.author_permlink)) return moderator.name;
    }),
  );
  wobject.admins = admins;
  if (wobject.parent) {
    wobject.parent.admins = admins;
    wobject.parent.moderators = _.compact(
      _.map(moderators, (moderator) => {
        if (_.includes(moderator.author_permlinks, wobject.parent.author_permlink)) return moderator.name;
      }),
    );
  }
  return wobject;
};

const validateWobjectsEmbeddedArray = (rootArray, moderators, admins, wobjectsPath = 'wobjects') => rootArray.map((rootDoc) => {
  if (rootDoc[wobjectsPath]) {
    rootDoc[wobjectsPath] = validateWobjects(rootDoc[wobjectsPath], moderators, admins);
  }
  return rootDoc;
});

/**
 * Moderate wobject by specified moderators
 * Check every field in wobject to exist UpVote or DownVote from moderators,
 * if UpVote exists => field marks some special key("upvotedByModerator")
 * which indicate high priority of this field,
 * else if DownVote exists => field remove from wobject fields
 * @param {Object}  wobject
 * @param {Array}   moderators
 * @param {Array}   admins
 * @param {string} apPath, custom location of author_permlink, default is "author_permlink"
 * @param {string} fieldsPath, custom location of fields, default is "fields"
 * @returns {Array} New array of moderated fields
 */
const validateFields = (wobject, moderators, admins, apPath = 'author_permlink', fieldsPath = 'fields') => _.get(wobject, `${fieldsPath}`, []).map((field) => {
  const validateRes = checkVotes(field.active_votes, moderators, wobject[`${apPath}`], admins);
  if (_.get(validateRes, 'upvotedByAdmin')) {
    field[`${ADMIN_KEY_FLAG}`] = true;
  } if (_.get(validateRes, 'upvotedByModerator')) {
    field[`${MODERATION_KEY_FLAG}`] = true;
  } else if (_.get(validateRes, 'downvotedByModerator')) {
    field[`${MODERATION_DOWNVOTE_KEY_FLAG}`] = true;
  } else if (_.get(validateRes, 'downvotedByAdmin')) {
    field[`${ADMIN_DOWNVOTE_KEY_FLAG}`] = true;
  }
  _.forEach(field.active_votes,
    (vote) => (vote._id
      ? vote.createdAt = vote._id.getTimestamp().valueOf()
      : vote.createdAt = new Date().valueOf()
    ));
  field.createdAt = field._id ? field._id.getTimestamp().valueOf() : new Date().valueOf();
  return field;
}).filter(Boolean);

/**
 * Method get list votes and moderators and return state of current item,
 * state can be upvotedByModerator:true, downvotedByModerator:true or undefined
 * @param votes {[Object]} list of field(or some another item) votes
 * @param moderators {[Object]} list of moderators with responsible wobjects
 * @param admins {[String]} list of admins for current app
 * @param authorPermlink {String} author_permlink of wobject
 * @returns {{downvotedByModerator: boolean}|{upvotedByModerator: boolean}
 * |{downvotedByAdmin: boolean}|{upvotedByAdmin: boolean}}
 */
const checkVotes = (votes, moderators, authorPermlink, admins) => {
  const voters = _.map(votes, 'voter');
  for (const vote of votes) {
    const moderator = moderators.find(
      (m) => m.name === vote.voter && m.author_permlinks.includes(authorPermlink),
    );
    const adminVote = _.includes(admins, vote.voter);

    if (moderator || adminVote) {
      switch (true) {
        case vote.weight < 0:
          if (adminVote) return { downvotedByAdmin: true };
          // remove field from fields array
          if (!_.intersection(voters, admins).length) {
            return { downvotedByModerator: true };
          }
          break;
        case vote.weight > 0:
          if (adminVote) return { upvotedByAdmin: true };
          // handle adding some key to field, indicate including moderate vote
          if (!_.intersection(voters, admins).length) {
            return { upvotedByModerator: true };
          }
      }
    }
  }
};
