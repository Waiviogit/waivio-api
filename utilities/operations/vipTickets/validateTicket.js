const { validateTicketRequest } = require('utilities/requests/hiveOnBoardRequests');
const { vipTicketsModel } = require('models');

module.exports = async ({ ticket }) => {
  const { valid, error } = await validateTicketRequest(ticket);
  if (error) return { error };
  if (valid) return { result: { valid } };

  const { result, error: dbError } = await vipTicketsModel
    .updateTicket({ ticket, data: { valid } });
  if (dbError) return { error: dbError };

  return { result: { valid } };
};
