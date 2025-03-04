const { ObjectType } = require('../../../database').models;

module.exports = async ({ name, skip, limit }) => {
  try {
    const resp = await ObjectType.findOne(
      { name }, { top_experts: { $slice: [skip, limit] } },
    ).lean();

    return { users: resp.top_experts };
  } catch (error) {
    return { error };
  }
};
