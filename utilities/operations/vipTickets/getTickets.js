const { vipTicketsModel } = require('models');
const _ = require('lodash');

module.exports = async ({
  userName, activeSkip, consumedSkip, activeLimit, consumedLimit,
}) => {
  const { result: activeTickets } = await vipTicketsModel
    .find({ condition: { userName, valid: true }, skip: activeSkip, limit: activeLimit + 1 });
  const { result: consumedTickets } = await vipTicketsModel
    .find({ condition: { userName, valid: false }, skip: consumedSkip, limit: consumedLimit + 1 });

  return {
    result: {
      activeTickets: _.take(activeTickets, activeLimit),
      consumedTickets: _.take(consumedTickets, consumedLimit),
      hasMoreActive: activeTickets.length > activeLimit,
      hasMoreConsumed: consumedTickets.length > consumedLimit,
    },
  };
};
