const _ = require('lodash');
const { WObject, Department } = require('database').models;

const findObject = async ({ related }) => {
  try {
    return WObject.findOne(
      {
        departments: { $all: related },
      },
      {
        _id: 1,
      },
    ).lean();
  } catch (error) {
    return [];
  }
};

const getDepartments = async () => {
  try {
    return Department.find({ }).lean();
  } catch (error) {
    return [];
  }
};

const pullRelated = async ({ name, relate }) => {
  try {
    return Department.updateOne({ name }, { $pull: { related: relate } }).lean();
  } catch (error) {
    return [];
  }
};

const departmentsRelatedFix = async () => {
  const departments = await getDepartments();
  for (const department of departments) {
    const { name, related = [] } = department;
    for (const relate of related) {
      const object = await findObject({
        related: [relate, name],
      });
      if (object) continue;
      await pullRelated({ name, relate });
    }
  }
};

module.exports = departmentsRelatedFix;
