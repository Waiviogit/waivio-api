const _ = require('lodash');
const axios = require('axios');
const FormData = require('form-data');
const { WObject } = require('database').models;

module.exports = async () => {
  const wobjects = await WObject.aggregate([
    { $match: { $or: [{ 'fields.name': 'avatar' }, { 'fields.name': 'background' }, { 'fields.name': 'galleryItem' }] } },
    { $unwind: '$fields' },
    { $match: { 'fields.body': { $regex: /^http:/ } } },
    { $project: { fields: 1, author_permlink: 1 } },
  ]);
  const fields = _.map(wobjects, (el) => ({
    ...el.fields,
    author_permlink: el.author_permlink,
  }));
  for (const field of fields) {
    const imageUrl = await uploadImage(field.body);
    await WObject.updateOne(
      { author_permlink: field.author_permlink, 'fields._id': field._id },
      { $set: { 'fields.$.body': imageUrl } },
    );
  }
};

const uploadImage = async (url) => {
  try {
    const bodyFormData = new FormData();
    bodyFormData.append('imageUrl', url);
    const result = await axios({
      method: 'post',
      url: 'https://waiviodev.com/api/image',
      data: bodyFormData,
      headers: {
        'content-type': `multipart/form-data; boundary=${bodyFormData._boundary}`,
      },
    });
    return _.get(result, 'data.image', url);
  } catch (error) {
    console.error(error.message);
    return url;
  }
};
