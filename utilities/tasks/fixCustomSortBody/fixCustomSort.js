const { WObject } = require('database').models;

module.exports = async () => {
  const wobjects = await WObject.find(
    { $and: [{ 'fields.name': 'sortCustom' }, { 'fields.body': { $regex: /^\[\[/ } }] },
  ).lean();
  for (const wobject of wobjects) {
    for (const field of wobject.fields) {
      if (field.name === 'sortCustom' && field.body.includes('[[')) {
        field.body = field.body.substring(1, field.body.length - 1);
        await WObject.updateOne(
          {
            author_permlink: wobject.author_permlink,
            'fields.author': field.author,
            'fields.permlink': field.permlink,
          },
          {
            'fields.$.body': field.body,
          },
        );
      }
    }
  }
  console.info('task completed');
};
