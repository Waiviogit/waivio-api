const { global: { getGlobalSearch } } = require('../utilities/operations/search');
const validators = require('./validators');
const pipelineFunctions = require('../pipeline');
const RequestPipeline = require('../pipeline/requestPipeline');

const globalSearch = async (req, res, next) => {
  const value = validators.validate({
    searchString: req.body.string,
    ...req.body,
  }, validators.generalSearch.generalSearchSchema, next);

  if (!value) {
    return;
  }
  const result = await getGlobalSearch(value);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.moderateObjects)
    .use(pipelineFunctions.checkFollowers)
    .use(pipelineFunctions.checkFollowings)
    .use(pipelineFunctions.filterUniqGroupId)
    .execute(result, req);

  return res.status(200).json(processedData);
};

module.exports = { globalSearch };
