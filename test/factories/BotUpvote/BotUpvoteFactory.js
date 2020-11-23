const { faker, BotUpvote, moment } = require('test/testHelper');
const { BOT_UPVOTE_STATUSES } = require('constants/campaignsData');

const Create = async (data = {}) => {
  const botUpvoteData = {
    executed: data.executed || false,
    botName: data.bot_name,
    author: data.author || `${faker.name.firstName()}${faker.random.number()}`,
    sponsor: data.sponsor || `${faker.name.firstName()}${faker.random.number()}`,
    permlink: data.permlink || faker.random.string(10),
    status: data.status || BOT_UPVOTE_STATUSES.PENDING,
    reward: data.reward || 5.23,
    amountToVote: data.amountToVote || 5.23,
    expiredAt: data.expiredAt || moment.utc().add(1, 'days').format(),
    startedAt: data.startedAt || moment.utc().subtract(31, 'minutes').format(),
    createdAt: data.createdAt || moment.utc().format(),
    reservationPermlink: data.reservationPermlink || faker.random.string(10),
    requiredObject: data.requiredObject || faker.random.string(10),
    totalVotesWeight: data.totalVotesWeight || 0,
    currentVote: data.currentVote || 0,
    votePercent: data.votePercent || 0,
  };

  const botUpvote = new BotUpvote(botUpvoteData);

  await botUpvote.save();
  return botUpvote;
};

module.exports = { Create };
