const { userUtil } = require('utilities/hiveApi');
const { User } = require('database').models;
const { Subscriptions } = require('models');
const _ = require('lodash');

const writeToCollection = async ({ array, doc }) => {
  if (array.length) {
    _.map(array, async (el) => {
      const { subscription } = await Subscriptions
        .findOne({ condition: { follower: doc.name, following: el } });
      if (!subscription) {
        const { result, error: dbError } = await Subscriptions
          .followUser({ follower: doc.name, following: el });
        result && console.log(`success, ${doc.name} follows ${el}`);
        dbError && console.error('create follow records dbError');
      }
    });
  }
};

exports.add = async () => {
  const cursor = await User.find({ stage_version: 1 }, { name: 1 });

  for (const doc of cursor) {
    let error, followings, startAccount = '';
    if (!_.get(doc, 'auth.provider', null)) {
      do {
        ({ followings, error } = await userUtil.getFollowingsList(
          { name: doc.name, startAccount, limit: 1000 },
        ));
        if (_.get(error, 'error.message', '') === 'Request Timeout') {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        if (error) break;
        startAccount = followings.length ? followings[followings.length - 1].following : '';
        await writeToCollection({
          array: _.map(followings, (el) => el.following),
          doc,
        });
      } while (!error && followings.length === 1000);
    } else {
      await writeToCollection({
        array: doc.users_follow,
        doc,
      });
    }
    await User.updateOne({ _id: doc._id }, { $set: { stage_version: 0 } });
  }
};
