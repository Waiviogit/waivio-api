const validators = require('./validators');
const { authorise } = require('../utilities/authorization/authoriseUser');
const {
  commentDraft,
  mainDraft,
  wobjectDraft,
} = require('../utilities/operations/user');

exports.createOrUpdatePageDraft = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.draft.createOrUpdatePageDraftSchema,
    next,
  );
  if (!value) return;

  const { error: authError } = await authorise(value.user);
  if (authError) return next(authError);

  const { draft, error } = await wobjectDraft.createOrUpdateDraft(value);
  if (error) return next(error);

  res.result = { status: 200, json: draft };
  next();
};

exports.getOnePageDraft = async (req, res, next) => {
  const value = validators.validate(
    req.query,
    validators.draft.getOnePageDraftSchema,
    next,
  );
  if (!value) return;

  const { draft, error } = await wobjectDraft.getDraft(value.user, value.authorPermlink);
  if (error) return next(error);

  res.result = { status: 200, json: draft };
  next();
};

exports.createOrUpdateCommentDraft = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.draft.createOrUpdateCommentDraftSchema,
    next,
  );
  if (!value) return;

  const { error: authError } = await authorise(value.user);
  if (authError) return next(authError);

  const { result, error } = await commentDraft.createOrUpdateDraft(value);
  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};

exports.getOneCommentDraft = async (req, res, next) => {
  const value = validators.validate(
    req.query,
    validators.draft.getOneCommentDraftSchema,
    next,
  );
  if (!value) return;

  const { result, error } = await commentDraft.getDraft(value);
  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};

exports.createOrUpdatePostDraft = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.draft.updateDraftSchema,
    next,
  );
  if (!value) return;

  const { error: authError } = await authorise(value.author);
  if (authError) return next(authError);

  const { result, error } = await mainDraft.createOrUpdateDraft(value);
  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};

exports.getOnePostDraft = async (req, res, next) => {
  const value = validators.validate(
    req.query,
    validators.draft.getOnePostDraftSchema,
    next,
  );
  if (!value) return;

  const { result, error } = await mainDraft.getDraft(value);
  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};

exports.getPostDrafts = async (req, res, next) => {
  const value = validators.validate(
    req.query,
    validators.draft.getPostDraftsSchema,
    next,
  );
  if (!value) return;

  const { result, hasMore, error } = await mainDraft.getDrafts(value);
  if (error) return next(error);

  res.result = { status: 200, json: { result, hasMore } };
  next();
};

exports.deleteOnePostDraft = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.draft.getOnePostDraftSchema,
    next,
  );
  if (!value) return;

  const { error: authError } = await authorise(value.author);
  if (authError) return next(authError);

  const { result, error } = await mainDraft.deleteDraft(value);
  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};
