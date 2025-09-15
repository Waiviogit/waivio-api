const _ = require('lodash');
const { Wobj, UserExpertiseModel } = require('../../../models');
const rewardHelper = require('../../helpers/rewardHelper');
const likePostHelper = require('../../helpers/likePostHelper');
const { ERROR_OBJ } = require('../../../constants/common');

const calcFieldWeight = ({ overallExpertise, rsharesWeight, percent }) => Number(
  (overallExpertise + (rsharesWeight * 0.5))
  * (percent / 10000).toFixed(8),
) || 0;

const formatFieldName = (str) => {
  // Remove all characters that are not a-z, 0-9 (alphanumeric)
  let cleaned = str.replace(/[^a-z0-9]/gi, '');
  // Ensure first character is a lowercase letter
  if (!/^[a-z]/.test(cleaned)) {
    cleaned = `a${cleaned}`; // prepend 'a' if first char is not a lowercase letter
  }
  // Make sure all letters are lowercase
  cleaned = cleaned.toLowerCase();
  return cleaned;
};

const calcUpdateVote = async ({
  author, permlink, voter, authorPermlink, weight,
}) => {
  const { weight: objectWeight } = await UserExpertiseModel.checkForObjectShares({
    name: voter,
    author_permlink: authorPermlink,
  });
  const overallExpertise = await rewardHelper.getWeightForFieldUpdate(objectWeight);

  const { hive, waiv } = await likePostHelper({
    voter,
    author,
    permlink,
    weight,
  });
  const rsharesWeight = Math.round(Number(hive.rShares) * 1e-6);
  const waivToRsharesWeight = await rewardHelper.getWeightForFieldUpdate(waiv.engineVotePrice);
  const percent = (weight % 2 === 0) ? weight : -weight;

  return {
    voter,
    percent,
    rshares_weight: rsharesWeight,
    weight: calcFieldWeight({ overallExpertise, rsharesWeight, percent }),
    weightWAIV: calcFieldWeight({
      overallExpertise, rsharesWeight: waivToRsharesWeight, percent,
    }),
  };
};

const voteOnUpdate = async ({
  author, permlink, authorPermlink, voter, weight,
}) => {
  const { field } = await Wobj.getField(author, permlink, authorPermlink);
  if (!field) return { error: ERROR_OBJ.NOT_FOUND };
  let currentVote = null;
  const updateData = {};
  const arrayFilters = [];

  const filteredVotes = _.filter(field.active_votes, (v) => v.voter !== voter);
  if (weight > 0) {
    currentVote = await calcUpdateVote({
      author, permlink, authorPermlink, voter, weight,
    });
  }

  const newVotes = [
    ...filteredVotes,
    currentVote,
  ]
    .filter((el) => !!el)
    .map((v) => ({
      voter: v.voter,
      percent: v.percent,
      rshares_weight: v.rshares_weight,
      weight: v.weight,
      weightWAIV: v.weightWAIV || 0,
      _id: v._id,
    }));

  const fieldWeight = newVotes.reduce((acc, el) => acc + (el.weight || 0), 0);
  const waivWeight = newVotes.reduce((acc, el) => acc + (el.weightWAIV || 0), 0);
  const nameForArrayFilter = formatFieldName(permlink);

  updateData[`fields.$[${nameForArrayFilter}].weight`] = fieldWeight === 0 ? 1 : fieldWeight;
  updateData[`fields.$[${nameForArrayFilter}].weightWAIV`] = fieldWeight === 0 ? 1 : waivWeight;
  updateData[`fields.$[${nameForArrayFilter}].active_votes`] = newVotes;
  arrayFilters.push({ [`${nameForArrayFilter}.permlink`]: permlink });

  const { result, error: updateError } = await Wobj.updateOneWithArrayFilters({
    authorPermlink,
    updateData,
    arrayFilters,
  });

  if (updateError) {
    return { error: updateError };
  }

  return { result };
};

module.exports = {
  voteOnUpdate,
};
