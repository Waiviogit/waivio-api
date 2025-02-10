const { UserDraft, User } = require('database').models;
const _ = require('lodash');

const postDraftsToCollection = async () => {
  try {
    let length = 0;
    let lastId = null;
    do {
      const users = await User.find(
        { ...lastId && { _id: { $gt: lastId } } },
        { user_metadata: 1 },

      ).sort({ _id: 1 }) // Sorting
        .limit(100).lean();

      lastId = users[(users?.length ?? 0) - 1]?._id;

      for await (const user of users) {
        const drafts = user?.user_metadata?.drafts ?? [];

        if (!drafts.length) continue;
        for (const draft of drafts) {
          await UserDraft.create(_.omit(draft, ['_id']));
        }
      }

      length = users?.length;
    } while (length);
    console.log('postDraftsToCollection finished');
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = postDraftsToCollection;
