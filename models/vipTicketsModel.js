const { VipTicket } = require('../database').models;

exports.find = async ({
  condition, sort = {}, skip, limit,
}) => {
  try {
    return {
      result: await VipTicket
        .find(condition)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
    };
  } catch (error) {
    return { error };
  }
};

exports.updateTicket = async ({ ticket, data }) => {
  try {
    return {
      result: await VipTicket.findOneAndUpdate(
        { ticket },
        data,
        { new: true },
      ).lean(),
    };
  } catch (error) {
    return { error };
  }
};

exports.aggregate = async (pipeline) => {
  try {
    return {
      result: await VipTicket.aggregate(pipeline),
    };
  } catch (error) {
    return { error };
  }
};
