const { faker } = require('test/testHelper');

exports.serviceBots = (quantity) => {
  const bots = [];
  for (let num = 0; num < quantity; num++) {
    bots.push({
      name: faker.name.firstName(),
      postingKey: faker.random.string(20),
      roles: ['serviceBot'],
    });
  }
  return bots;
};

exports.topUsers = (quantity) => {
  const users = [];
  for (let num = 0; num < quantity; num++) {
    users.push({
      name: faker.name.firstName(),
      weight: faker.random.number(),
    });
  }
  return users;
};
