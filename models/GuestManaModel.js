const { GuestMana } = require('database').models;

const create = async ({ account, mana }) => {
  try {
    const result = await GuestMana.create({
      account,
      mana,
    });

    return {
      result: result.toObject(),
    };
  } catch (error) {
    return { error };
  }
};

const findOneByName = async (account) => {
  try {
    const result = await GuestMana.findOne({
      account,
    }).lean();

    return {
      result,
    };
  } catch (error) {
    return { error };
  }
};

const updateOneStatus = async ({ account, importAuthorization }) => {
  try {
    const result = await GuestMana.findOneAndUpdate({
      account,
    }, {
      importAuthorization,
    });
    return { result };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  create,
  findOneByName,
  updateOneStatus,
};
