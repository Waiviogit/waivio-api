const { vipTicketsModel } = require('../../../models');

module.exports = async ({ ticket, note }) => {
  const { result, error } = await vipTicketsModel.updateTicket({ ticket, data: { note } });
  if (error) return { error };

  return { result };
};
