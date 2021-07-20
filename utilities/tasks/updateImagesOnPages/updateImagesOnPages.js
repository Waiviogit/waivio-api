const _ = require('lodash');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const { WObject } = require('database').models;
const image = require('utilities/images/image');
const { base64ByUrl } = require('utilities/helpers/imagesHelper');

exports.updateImagesOnPages = async () => {
  const wobjects = await WObject.find({ object_type: 'page' }).lean();
  for (const wobject of wobjects) {
    await updatePageContent(wobject);
  }
};

const updatePageContent = async (wobject) => {
  const pageContents = _.filter(wobject.fields,
    (field) => field.name === FIELDS_NAMES.PAGE_CONTENT);
  for (const pageContent of pageContents) {
    await updateImageLinks(pageContent);
  }
};

const updateImageLinks = async (pageContent) => {
  const text = _.get(pageContent, 'body', '');
  const link = text.match(/https:\/\/ipfs.busy.org\/ipfs\/[\w]+/);
  if (_.isNull(link)) return;
  const base64 = await base64ByUrl(`https://images.hive.blog/0x0/${link}`);
  if (_.isNull(base64)) {
    const updatedWobj = await WObject.findOneAndUpdate(
      { 'fields.permlink': pageContent.permlink },
      { 'fields.$.body': text.replace(link, 'https://waivio.nyc3.digitaloceanspaces.com/ImageNotFound') },
      { new: true },
    ).lean();
    await updatePageContent(updatedWobj);
  }
  const { imageUrl, error } = await image.uploadInS3(base64, link[0].match(/[^/]+$/));
  if (error) console.log(`Error download ${link[0].match(/[^/]+$/)} to S3`);
  const updatedWobj = await WObject.findOneAndUpdate(
    { 'fields.permlink': pageContent.permlink },
    { 'fields.$.body': text.replace(link, imageUrl) },
    { new: true },
  ).lean();
  await updatePageContent(updatedWobj);
};
