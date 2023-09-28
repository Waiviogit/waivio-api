const { UserDraft, User } = require('database').models;
const _ = require('lodash');

const postDraftsToCollection = async () => {
  try {
    const users = User.find({ 'user_metadata.drafts': { $ne: [] } }, { user_metadata: 1 });
    for await (const user of users) {
      const drafts = user?.user_metadata?.drafts ?? [];

      if (!drafts.length) continue;
      for (const draft of drafts) {
        await UserDraft.create(_.omit(draft, ['_id']));
      }
    }
    console.log('postDraftsToCollection finished');
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = postDraftsToCollection;
