const validators = require('./validators');
const { createOrUpdateDraft } = require('../utilities/operations/draft/createOrUpdateDraft');
const { authorise } = require('../utilities/authorization/authoriseUser');
const { getDraft } = require('../utilities/operations/draft/getOne');

exports.createOrUpdate = async (req, res, next) => {
  const value = validators.validate({
    author: req.body.author,
    permlink: req.body.permlink,
    body: req.body.body,
  }, validators.draft.createOrUpdateSchema, next);
  if (!value) return;

  const { error: authError } = await authorise(value.author);
  if (authError) return next(authError);

  const { draft, error } = await createOrUpdateDraft(value);
  if (error) return next(error);

  res.result = { status: 200, json: draft };
  next();
};

exports.getOne = async (req, res, next) => {
  const value = validators.validate({
    author: req.query.author,
    permlink: req.query.permlink,
  }, validators.draft.getOneSchema, next);
  if (!value) return;

  const { error: authError } = await authorise(value.author);
  if (authError) return next(authError);

  const { draft, error } = await getDraft(value.author, value.permlink);
  if (error) return next(error);

  res.result = { status: 200, json: draft };
  next();
};
