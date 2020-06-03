const _ = require('lodash');
const { User } = require('database').models;


module.exports = async () => {
  const guests = await User.find({ name: { $in: [/waivio_/, /bxy_/] } }).lean();
  for (const guest of guests) {
    let {
      postingMetadata,
      metadata,
    } = parseMetadata(guest.json_metadata, guest.posting_json_metadata);
    if (!metadata) {
      metadata = {
        profile: {},
      };
    } if (!postingMetadata) {
      postingMetadata = {
        profile: {},
      };
    }
    if (!_.get(metadata, 'profile.profile_image') && !_.get(postingMetadata, 'profile.profile_image')) {
      metadata.profile.profile_image = 'https://waivio.nyc3.digitaloceanspaces.com/1591120767_bc441d85-3992-486c-8254-a09341a23003';
      postingMetadata.profile.profile_image = 'https://waivio.nyc3.digitaloceanspaces.com/1591120767_bc441d85-3992-486c-8254-a09341a23003';
    } if (_.get(metadata, 'profile.profile_image') && !_.get(postingMetadata, 'profile.profile_image')) {
      postingMetadata.profile.profile_image = metadata.profile.profile_image;
    }
    await User.updateOne({ _id: guest._id }, {
      json_metadata: JSON.stringify(metadata),
      posting_json_metadata: JSON.stringify(postingMetadata),
    });
  }
};

const parseMetadata = (metadata, postingMetadata) => {
  try {
    return { metadata: JSON.parse(metadata), postingMetadata: JSON.parse(postingMetadata) };
  } catch (error) {
    return { metadata: '', postingMetadata: '' };
  }
};
