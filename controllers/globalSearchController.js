const { global: { getGlobalSearch } } = require('utilities/operations/search');
const validators = require('controllers/validators');

const globalSearch = async (req, res, next) => {
  const value = validators.validate({
    searchString: req.body.string,
    ...req.body,
  }, validators.generalSearch.generalSearchSchema, next);

  if (!value) {
    return;
  }
  const result = await getGlobalSearch(value);

  res.result = { status: 200, json: result };
  next();
};

module.exports = { globalSearch };
