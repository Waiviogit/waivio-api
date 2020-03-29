const { collectExpertsJob } = require('./collectAppExperts');
const { objTypeExpertsJob } = require('./updateObjTypeExperts');
const { userFollowingsJob } = require('./updateUserFollowingsJob');
const { topWobjJob } = require('./updateTopWobjJob');
const { updateHotTrendCache } = require('./updateMainFeedsCache');

objTypeExpertsJob.start();
collectExpertsJob.start();
userFollowingsJob.start();
topWobjJob.start();
updateHotTrendCache.start();
