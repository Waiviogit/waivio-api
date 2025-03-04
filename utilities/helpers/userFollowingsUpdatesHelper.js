const { User, WObject } = require('../../database').models;
const _ = require('lodash');

exports.refreshUsersCounts = async () => {
  // update users which has no any posts by last 24 hours
  await User.updateMany(
    { last_posts_count: 0 },
    {
      $push: {
        last_posts_counts_by_hours: {
          $each: [0],
          $position: 0,
          $slice: 24,
        },
      },
    },
  );
  // update wobjects which has posts by last 24 hours
  const cursor = User.find({ last_posts_count: { $ne: 0 } }).cursor({ batchSize: 1000 });
  let successCount = 0;

  await cursor.eachAsync(async (doc) => {
    const user = doc.toObject();

    const lastHourPosts = findLastHourCount(user.last_posts_counts_by_hours, user.last_posts_count);

    user.last_posts_count = decreasedSummaryCount(
      user.last_posts_counts_by_hours, user.last_posts_count,
    );
    user.last_posts_counts_by_hours = pushLastCountToArray(
      user.last_posts_counts_by_hours, lastHourPosts,
    );
    const res = await User.updateOne(
      { _id: user._id },
      {
        $set: {
          last_posts_count: user.last_posts_count,
          last_posts_counts_by_hours: user.last_posts_counts_by_hours,
        },
      },
    );

    if (res.nModified) successCount++;
  });
  console.log(`Users posts count updates: ${successCount}`);
};

exports.refreshWobjectsCounts = async () => {
  // update wobjects which has no any posts by last 24 hours
  await WObject.updateMany(
    { last_posts_count: 0 },
    {
      $push: {
        last_posts_counts_by_hours: {
          $each: [0],
          $position: 0,
          $slice: 24,
        },
      },
    },
  );
  // update wobjects which has posts by last 24 hours
  const cursor = WObject.find({ last_posts_count: { $ne: 0 } }).cursor({ batchSize: 1000 });
  let successCount = 0;

  await cursor.eachAsync(async (doc) => {
    const wobject = doc.toObject();
    const lastHourPosts = findLastHourCount(
      wobject.last_posts_counts_by_hours, wobject.last_posts_count,
    );

    wobject.last_posts_count = decreasedSummaryCount(
      wobject.last_posts_counts_by_hours, wobject.last_posts_count,
    );
    wobject.last_posts_counts_by_hours = pushLastCountToArray(
      wobject.last_posts_counts_by_hours, lastHourPosts,
    );
    const res = await WObject.updateOne(
      { _id: wobject._id },
      {
        $set: {
          last_posts_count: wobject.last_posts_count,
          last_posts_counts_by_hours: wobject.last_posts_counts_by_hours,
        },
      },
    );

    if (res.nModified) successCount++;
  });
  console.log(`Wobjects posts count updates: ${successCount}`);
};

/**
 * Push last count value to begin of array and delete last item if length greater than 24
 * @param arrCounts {[Number]}
 * @param lastHourCount {Number}
 * @returns {[Number]}
 */
const pushLastCountToArray = (arrCounts, lastHourCount) => {
  const newArr = [...arrCounts];

  newArr.unshift(lastHourCount);
  return newArr.slice(0, 24);
};

/**
 * Find new value for summary count of posts by decreasing on value of last item in value
 * @param arrCounts {[Number]} Array of counts posts by last 24 hours;
 * @param summaryCount {Number} Count of post by last 24+ hours.
 * Always greater of equal than sum in array of counts
 * @returns {Number} New value for summary_count
 */
const decreasedSummaryCount = (arrCounts, summaryCount) => (
  arrCounts.length < 24 ? summaryCount : summaryCount - _.last(arrCounts));

/**
 * Get count of post by last hour.
 * @param arrCounts {[Number]} Array of counts posts by last 24 hours;
 * @param summaryCount {Number} Count of post by last 24+ hours.
 * Always greater of equal than sum in array of counts
 * @returns {Number} Count of post by last hour
 */
const findLastHourCount = (arrCounts, summaryCount) => summaryCount - _.sum(arrCounts);
