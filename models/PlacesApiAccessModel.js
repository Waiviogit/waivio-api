const { PlacesApiAccess } = require('database').models;
const { getCurrentDateString } = require('utilities/helpers/dateHelper');

const updateOne = async ({ filter, update, options }) => {
  try {
    const result = await PlacesApiAccess.updateOne(filter, update, options);

    return { result };
  } catch (error) {
    return { error };
  }
};

const incrAccessCount = async (userName, type) => {
  const date = getCurrentDateString();

  await updateOne({
    filter: {
      userName,
      date,
      type,
    },
    update: {
      $inc: { count: 1 },
    },
    options: {
      upsert: true,
    },
  });
};

module.exports = {
  incrAccessCount,
};
