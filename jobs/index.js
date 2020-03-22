const { collectExpertsJob } = require('./collectAppExperts');
const { objTypeExpertsJob } = require('./updateObjTypeExperts');
const { userFollowingsJob } = require('./updateUserFollowingsJob');
const { topWobjJob } = require('./updateTopWobjJob');

objTypeExpertsJob.start();
collectExpertsJob.start();
userFollowingsJob.start();
topWobjJob.start();
