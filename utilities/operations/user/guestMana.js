const { GuestManaModel } = require('../../../models');

// if become global set to redis
const maxMana = 1000;

const regenerationRatePerSecond = 42 / (60 * 60); // 1 mana per hour

const getManaRecord = async (account) => {
  if (!account.includes('_')) return;

  const { result } = await GuestManaModel.findOneByName(account);
  if (result) return result;
  const { result: createdDoc } = await GuestManaModel.create({ account, mana: maxMana });
  return createdDoc;
};

// Function to calculate mana regeneration
const calculateManaRegeneration = (lastUpdateTimestamp) => {
  const now = Date.now();
  const elapsedSeconds = (now - lastUpdateTimestamp) / 1000;

  const regeneratedMana = elapsedSeconds * regenerationRatePerSecond;
  return Math.floor(regeneratedMana);
};

const getCurrentMana = async (account) => {
  if (!account.includes('_')) return 0;

  const record = await getManaRecord(account);
  const { lastManaUpdate, mana } = record;

  const regeneratedMana = calculateManaRegeneration(lastManaUpdate);

  return Math.min(maxMana, mana + regeneratedMana);
};

const getCurrentManaPercent = async ({ account }) => {
  const mana = await getCurrentMana(account);

  return { result: mana / 10 };
};

module.exports = {
  getCurrentMana,
  getManaRecord,
  getCurrentManaPercent,
};
