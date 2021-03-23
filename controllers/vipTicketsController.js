const authoriseUser = require('utilities/authorization/authoriseUser');
const { getTickets, addNote } = require('utilities/operations').vipTickets;
const validators = require('controllers/validators');

exports.getVipTickets = async (req, res, next) => {
  const value = validators.validate(req.query, validators.vipTickets.getTicketsSchema, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await getTickets(value);
  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};

exports.addTicketNote = async (req, res, next) => {
  const value = validators.validate(req.body, validators.vipTickets.addNoteSchema, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await addNote(value);
  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};
