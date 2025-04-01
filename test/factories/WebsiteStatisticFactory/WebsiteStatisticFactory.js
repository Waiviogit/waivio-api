const { WebsiteStatistic, faker } = require('test/testHelper');

const Create = async ({
  host,
  visits,
  buyAction,
  buyActionUniq,
  conversion,
  createdAt,
  updatedAt,
} = {}) => {
  const statistic = new WebsiteStatistic({
    host: host || faker.random.string(),
    visits: visits || faker.random.number(),
    buyAction: buyAction || faker.random.number(),
    buyActionUniq: buyActionUniq || faker.random.number(),
    conversion: conversion || faker.random.number(),
    createdAt: createdAt || new Date(),
    updatedAt: updatedAt || new Date(),
  });
  await statistic.save();
  return statistic;
};

const createMany = async (count, params = {}) => {
  const stats = [];
  for (let i = 0; i < count; i++) {
    stats.push(await Create(params));
  }
  return stats;
};

module.exports = { Create, createMany };
