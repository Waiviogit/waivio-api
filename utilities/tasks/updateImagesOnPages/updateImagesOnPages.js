const _ = require('lodash');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const { WObject } = require('database').models;
const image = require('utilities/images/image');
const { base64ByUrl } = require('utilities/helpers/imagesHelper');

exports.updateImagesOnPages = async () => {
  const wobjects = await WObject.find({ object_type: 'page' }).lean();
  for (const wobject of wobjects) {
    const pageContents = _.filter(wobject.fields,
      (field) => field.name === FIELDS_NAMES.PAGE_CONTENT);

    for (const pageContent of pageContents) {
      await updateImageLinks(pageContent);
    }
  }
};

const updateImageLinks = async (pageContent) => {
  const link = pageContent.body.match(/https:\/\/ipfs.busy.org\/ipfs\/[\w]+/);
  if (_.isNull(link)) return;
  const base64 = await base64ByUrl(`https://images.hive.blog/0x0/${link}`);
  if (_.isNull(base64)) return;
  const { imageUrl, error } = await image.uploadInS3(base64, link.match(/([^/]+$)/));
  if (error) console.log(`Error download ${link.match(/([^/]+$)/)} to S3`);
  await WObject.updateOne({ 'fields.permlink': pageContent.permlink }, [{ $addFields: { 'fields.body': imageUrl } }]);
  await updateImageLinks(pageContent);
};
