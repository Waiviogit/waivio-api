const { iaExpertsJob } = require('./collectAppExperts');
const { objTypeExpertsJob } = require('./updateObjTypeExperts');
const { userFollowingsJob } = require('./updateUserFollowingsJob');
const { topWobjJob } = require('./updateTopWobjJob');

objTypeExpertsJob.start();
iaExpertsJob.start();
userFollowingsJob.start();
topWobjJob.start();
