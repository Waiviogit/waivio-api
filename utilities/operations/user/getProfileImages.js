const { User } = require('models');
const jsonHelper = require('utilities/helpers/jsonHelper');

const getProfileImages = async ({ names }) => {
  const { usersData = [] } = await User.find({
    condition: { name: { $in: names } },
    select: { name: 1, posting_json_metadata: 1, profile_image: 1 },
  });

  return usersData.map((el) => {
    if (el.profile_image) {
      return { name: el.name, image: el.profile_image };
    }
    const json = jsonHelper.parseJson(el.posting_json_metadata);

    const image = json?.profile?.profile_image ?? '';

    return { name: el.name, image };
  });
};

module.exports = getProfileImages;
