const { WObject, ObjectType } = require('../../../database').models;
const { OBJECT_TYPE_TOP_WOBJECTS_COUNT, LOW_PRIORITY_STATUS_FLAGS } = require('../../../constants/wobjectsData');

exports.updateObjectTypes = async (isLog = false) => {
  const cursor = ObjectType.find().cursor({ batchSize: 1000 });

  await cursor.eachAsync(async (doc) => {
    const wobjsArray = await WObject.aggregate([
      { $match: { object_type: doc.name } },
      {
        $addFields: {
          priority: {
            $cond: {
              if: { $in: ['$status.title', LOW_PRIORITY_STATUS_FLAGS] },
              then: 0,
              else: 1,
            },
          },
        },
      },
      { $sort: { priority: -1, weight: -1, _id: -1 } },
      { $limit: OBJECT_TYPE_TOP_WOBJECTS_COUNT },
    ]);
    const authorPermlinks = wobjsArray.map((p) => p.author_permlink);
    const res = await ObjectType.updateOne({ _id: doc._id }, { $set: { top_wobjects: authorPermlinks } });

    if (res.nModified && isLog) {
      console.log(`Object Type ${doc.name} updated! Add ${authorPermlinks.length} wobjects refs!`);
    }
  });
};
