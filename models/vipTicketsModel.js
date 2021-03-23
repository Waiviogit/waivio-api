const { VipTicket } = require('database').models;

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

exports.addNote = async ({ ticket, note }) => {
  try {
    return {
      result: await VipTicket.findOneAndUpdate(
        { ticket },
        { note },
        { new: true },
      ).lean(),
    };
  } catch (error) {
    return { error };
  }
};
