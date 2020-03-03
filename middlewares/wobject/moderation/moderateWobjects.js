const _ = require('lodash');
const { schema } = require('middlewares/wobject/moderation/schema');
const { App } = require('models');

const MODERATION_KEY_FLAG = 'upvotedByModerator';

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

  switch (currentSchema.case) {
    case 1:
      // root result is single wobject
      res.result.json = validateWobject(
        res.result.json,
        app.moderators,
        currentSchema.custom_fields_paths,
      );
      break;
    case 2:
      // root result is array of wobjects
      res.result.json = validateWobjects(
        res.result.json,
        app.moderators,
        currentSchema.author_permlink_path,
        currentSchema.fields_path,
      );
      break;
    case 3:
      // root result is Object with array obj wobjects
      res.result.json[currentSchema.wobjects_path] = validateWobjects(
        res.result.json[currentSchema.wobjects_path],
        app.moderators,
      );
      break;
    case 4:
      // root result is array of objects (ex. posts), where each has prop array of wobjects
      res.result.json = validateWobjectsEmbeddedArray(
        res.result.json,
        app.moderators,
        currentSchema.wobjects_path,
      );
      break;
    case 5:
      // root result is array of fields (gallery, list, fields)
      res.result.json = validateFields(
        { author_permlink: req.author_permlink, fields: res.result.json }, app.moderators,
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

/*
Validation (moderation) means that to every field in each
    returned wobject which include UpVote or DownVote will be added some key,
    which indicate some specified behavior of this field/wobject.
 */
/**
 * Moderate wobjects by specified moderators
 * @param {Array} wobjects
 * @param {Array} moderators
 * @param {string} apPath, custom location of author_permlink, default is "author_permlink"
 * @param {string} fields_path, custom location of fields, default is "fields"
 * @returns {Array} New array of wobjects.
 */
const validateWobjects = (wobjects = [], moderators, apPath = 'author_permlink', fields_path = 'fields') => {
  const moderatedWobjects = _.chain(wobjects).map((wobject) => {
    if (_.get(wobject, 'active_votes.length')) {
      // in some cases "wobjects" also might be as "fields" but with some fields item inside
      // in that case, we need to moderate source wobjects(fields) too as usual fields
      // indicate this cases by including non empty "active_votes" array
      const checkVoteRes = checkVotes(wobject.active_votes, moderators, wobject[`${apPath}`]);
      if (_.get(checkVoteRes, 'upvotedByModerator')) {
        wobject[`${MODERATION_KEY_FLAG}`] = true;
      } else if (_.get(checkVoteRes, 'downvotedByModerator')) {
        return;
      }
    }
    wobject[fields_path] = validateFields(wobject, moderators, apPath, fields_path);
    return wobject;
  }).filter(Boolean).value();
  return moderatedWobjects;
};

const validateWobject = (wobject, moderators, customFieldsPaths) => {
  wobject.fields = validateFields(wobject, moderators);
  customFieldsPaths.forEach((customFieldsPath) => {
    wobject[customFieldsPath] = validateFields(wobject, moderators, 'author_permlink', customFieldsPath);
  });
  return wobject;
};

const validateWobjectsEmbeddedArray = (rootArray, moderators, wobjectsPath = 'wobjects') => rootArray.map((rootDoc) => {
  if (rootDoc[wobjectsPath]) {
    rootDoc[wobjectsPath] = validateWobjects(rootDoc[wobjectsPath], moderators);
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
 * @param {string} apPath, custom location of author_permlink, default is "author_permlink"
 * @param {string} fieldsPath, custom location of fields, default is "fields"
 * @returns {Array} New array of moderated fields
 */
const validateFields = (wobject, moderators, apPath = 'author_permlink', fieldsPath = 'fields') => _.get(wobject, `${fieldsPath}`, []).map((field) => {
  const validateRes = checkVotes(field.active_votes, moderators, wobject[`${apPath}`]);
  if (_.get(validateRes, 'upvotedByModerator')) {
    field[`${MODERATION_KEY_FLAG}`] = true;
  } else if (_.get(validateRes, 'downvotedByModerator')) {
    return;
  }
  return field;
}).filter(Boolean);

/**
 * Method get list votes and moderators and return state of current item,
 * state can be upvotedByModerator:true, downvotedByModerator:true or undefined
 * @param votes {[Object]} list of field(or some another item) votes
 * @param moderators {[Object]} list of moderators with responsible wobjects
 * @param authorPermlink {String} author_permlink of wobject
 * @returns {{downvotedByModerator: boolean}|{upvotedByModerator: boolean}}
 */
const checkVotes = (votes, moderators, authorPermlink) => {
  for (const vote of votes) {
    const moderator = moderators.find(
      (m) => m.name === vote.voter && m.author_permlinks.includes(authorPermlink),
    );

    if (moderator) {
      switch (true) {
        case vote.weight < 0:
          // remove field from fields array
          return { downvotedByModerator: true };
        case vote.weight > 0:
          // handle adding some key to field, indicate including moderate vote
          return { upvotedByModerator: true };
      }
    }
  }
};
