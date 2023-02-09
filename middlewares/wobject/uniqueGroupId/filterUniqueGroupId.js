const _ = require('lodash');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const { schema } = require('./schema');

const unwindByGroupId = (arr, f) => arr.reduce(
  (r, o) => {
    if (!o[f]) o[f] = [`${Date.now() + Math.random()}`];
    return r.concat(o[f].map((v) => ({ ...o, [f]: v })));
  },
  [],
);

const filterUniqGroupId = async (req, res, next) => {
  const currentSchema = schema.find((s) => s.path === _.get(req, 'route.path') && s.method === req.method);

  if (!currentSchema) {
    next();
    return;
  }
  switch (currentSchema.case) {
    case 1:
      res.result.json[currentSchema.wobjects_path] = _.chain(
        unwindByGroupId(res.result.json[currentSchema.wobjects_path], FIELDS_NAMES.GROUP_ID),
      ).uniqBy(
        FIELDS_NAMES.GROUP_ID,
      ).uniqBy('author_permlink').value();
      break;
    default:
      break;
  }
  next();
};

module.exports = {
  filterUniqGroupId,
};
