const _ = require('lodash');
const { validateTicketRequest } = require('../../requests/hiveOnBoardRequests');
const { VIP_TICKET_PRICE } = require('../../../constants/common');
const { vipTicketsModel } = require('../../../models');

module.exports = async ({
  userName, activeSkip, consumedSkip, activeLimit, consumedLimit,
}) => {
  const activeTickets = await getActiveTickets({ userName, activeSkip, activeLimit });

  const { result: consumedTickets } = await vipTicketsModel
    .find({ condition: { userName, valid: false }, skip: consumedSkip, limit: consumedLimit + 1 });

  return {
    result: {
      price: VIP_TICKET_PRICE,
      activeTickets: _.take(activeTickets, activeLimit),
      consumedTickets: _.take(consumedTickets, consumedLimit),
      hasMoreActive: activeTickets.length > activeLimit,
      hasMoreConsumed: consumedTickets.length > consumedLimit,
    },
  };
};

const getActiveTickets = async ({ userName, activeSkip, activeLimit }) => {
  const { result: activeTickets } = await vipTicketsModel
    .find({ condition: { userName, valid: true }, skip: activeSkip, limit: activeLimit + 1 });
  const validTickets = await _.reduce(activeTickets, async (acc, el) => {
    const accum = await acc;
    const { valid, error } = await validateTicket(el.ticket);
    if (valid) accum.push(el);
    return accum;
  }, []);
  if (activeTickets.length === validTickets.length) return activeTickets;

  return getActiveTickets({ userName, activeSkip, activeLimit });
};

const validateTicket = async (ticket) => {
  const { valid, error } = await validateTicketRequest(ticket);
  if (error) return { error };
  if (valid) return { valid };

  const { result, error: dbError } = await vipTicketsModel
    .updateTicket({ ticket, data: { valid } });
  if (dbError) return { error: dbError };

  return { valid };
};
