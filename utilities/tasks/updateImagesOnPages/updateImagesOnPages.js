const _ = require('lodash');
const { WObject } = require('database').models;
const image = require('utilities/images/image');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const { base64ByUrl } = require('utilities/helpers/imagesHelper');
const { BUSY_ORG_LINK, IMAGE_NAME } = require('constants/regExp');
const { PROXY_HIVE_IMAGES, NOT_FOUND_IMAGE_URL } = require('constants/common');

exports.updateImagesOnPages = async () => {
  const wobjects = await WObject.find({ object_type: 'page' }).lean();
  for (const wobject of wobjects) {
    await updatePageContent(wobject);
  }
};

const updatePageContent = async (wobject) => {
  const pageContents = _.filter(
    wobject.fields,
    (field) => field.name === FIELDS_NAMES.PAGE_CONTENT,
  );
  for (const pageContent of pageContents) {
    await updateImageLinks(pageContent);
  }
};

const updateImageLinks = async (pageContent) => {
  const text = _.get(pageContent, 'body', '');
  const link = text.match(BUSY_ORG_LINK);
  if (_.isNil(link)) return;
  const base64 = await base64ByUrl(`${PROXY_HIVE_IMAGES}${link}`);
  if (_.isNil(base64)) {
    const updatedWobj = await WObject.findOneAndUpdate(
      { 'fields.permlink': pageContent.permlink },
      { 'fields.$.body': text.replace(link, NOT_FOUND_IMAGE_URL) },
      { new: true },
    ).lean();
    return updatePageContent(updatedWobj);
  }
  const { imageUrl, error } = await image.uploadInS3(base64, link[0].match(IMAGE_NAME));
  if (error) return console.log(`Error download ${link[0].match(IMAGE_NAME)} to S3`);

  const updatedWobj = await WObject.findOneAndUpdate(
    { 'fields.permlink': pageContent.permlink },
    { 'fields.$.body': text.replace(link, imageUrl) },
    { new: true },
  ).lean();
  return updatePageContent(updatedWobj);
};
