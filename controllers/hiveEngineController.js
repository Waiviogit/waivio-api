const authoriseUser = require('utilities/authorization/authoriseUser');
const { engineDepositWithdrawModel } = require('models');
const validators = require('controllers/validators');

exports.createDepositWithdraw = async (req, res, next) => {
  const value = validators.validate(req.body, validators.hiveEngine.depositWithdrawSchema, next);
  if (!value) return;
  const { error: authError } = await authoriseUser.authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await engineDepositWithdrawModel.create(value);
  if (error) return next(error);

  res.result = { status: 200, json: { result } };
  next();
};
