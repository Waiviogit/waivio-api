const { vipTicketsModel } = require('models');

module.exports = async ({ ticket, note }) => {
  const { result, error } = await vipTicketsModel.addNote({ ticket, note });
  if (error) return { error };
  return { result };
};
