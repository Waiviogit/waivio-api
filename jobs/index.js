const { collectExpertsJob } = require('./collectAppExperts');
const { objTypeExpertsJob } = require('./updateObjTypeExperts');
const { userFollowingsJob } = require('./updateUserFollowingsJob');
const { topWobjJob } = require('./updateTopWobjJob');
const { updateHotTrendCache } = require('./updateMainFeedsCache');
const { importUsersJob, importErroredUsersJob } = require('./createNewUsers');
const { collectWobjExpertsJob } = require('./collectWobjTopUsers');
const { sendDailyWebsiteDebt } = require('./setDailyWebsiteDebt');
const { sendBalanceNotification } = require('./websiteBalanceNotifications');
const { updateSiteWobjects } = require('./updateSiteWobjects');
const { updateMaxWobjectWeight } = require('./updateMaxWobjectWeight');

objTypeExpertsJob.start();
collectExpertsJob.start();
userFollowingsJob.start();
topWobjJob.start();
updateHotTrendCache.start();
importUsersJob.start();
importErroredUsersJob.start();
collectWobjExpertsJob.start();
sendDailyWebsiteDebt.start();
sendBalanceNotification.start();
updateSiteWobjects.start();
updateMaxWobjectWeight.start();
