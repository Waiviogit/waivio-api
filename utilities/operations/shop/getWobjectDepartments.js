const wObjectHelper = require('utilities/helpers/wObjectHelper');
const jsonHelper = require('utilities/helpers/jsonHelper');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const { Wobj, Department } = require('models');
const _ = require('lodash');

const MIN_SUB_OBJECTS = 10;
const TOP_LINE_PERCENT = 0.3;
const BOTTOM_LINE_PERCENT = 0.05;

const getMongoFilterForShop = (field) => _.reduce(field, (acc, el, index) => {
  if (index === 'type') {
    acc.object_type = field[index];
    return acc;
  }
  if (index === 'departments') {
    acc.$and = _.map(field[index], (department) => ({ departments: department }));
    return acc;
  }
  if (index === 'tags') {
    acc.fields = { $elemMatch: { name: 'categoryItem', body: { $in: field[index] } } };
    return acc;
  }
  if (index === 'authorities') {
    acc.$or = _.flatten(_.map(field[index], (user) => [
      { 'authority.ownership': user },
      { 'authority.administrative': user },
    ]));
    return acc;
  }
  return acc;
}, {});

const getWobjectFilter = async ({ authorPermlink, app }) => {
  const { result } = await Wobj.findOne({ author_permlink: authorPermlink });
  if (!result) return { error: { status: 404, message: 'Not Found' } };
  const processedObject = await wObjectHelper.processWobjects({
    wobjects: [result],
    returnArray: false,
    app,
    fields: [FIELDS_NAMES.SHOP_FILTER],
  });

  if (!processedObject[FIELDS_NAMES.SHOP_FILTER]) return { error: { status: 404, message: 'Not Found' } };
  const field = jsonHelper.parseJson(processedObject[FIELDS_NAMES.SHOP_FILTER], null);
  if (_.isEmpty(field)) return { error: { status: 404, message: 'Not Found' } };

  return { filter: getMongoFilterForShop(field) };
};

const mainFilterDepartment = (departments) => {
  if (_.isEmpty(departments)) return [];
  const totalObjects = _.sumBy(departments, 'objectsCount');
  const middleCount = totalObjects / departments.length;

  return _.filter(departments, (department) => department.objectsCount > middleCount);
};

const secondaryFilterDepartment = ({ allDepartments, name, excluded }) => {
  const preFilter = _.filter(allDepartments,
    (department) => department.name !== name
    && !_.includes(excluded, department.name));

  const objectsTotal = _.sumBy(preFilter, 'objectsCount');
  const topCounter = objectsTotal * TOP_LINE_PERCENT;
  const bottomCounter = objectsTotal * BOTTOM_LINE_PERCENT;

  const filterCondition = (d) => d.objectsCount < topCounter
    && d.objectsCount > bottomCounter
    && d.objectsCount > MIN_SUB_OBJECTS;

  return _.filter(preFilter, filterCondition);
};

const subdirectoryMap = ({ filteredDepartments, allDepartments }) => _
  .map(filteredDepartments, (department) => {
    const subdirectories = _.filter(
      allDepartments,
      (d) => _.includes(d.related, department.name)
        && d.objectsCount < department.objectsCount
        && d.objectsCount > 10,
    );
    return {
      name: department.name,
      subdirectories: !_.isEmpty(subdirectories),
    };
  });

const getWobjectDepartments = async ({
  authorPermlink, app, name, excluded,
}) => {
  const { filter, error } = await getWobjectFilter({ app, authorPermlink });
  if (error) return { error };
  // or we can group in aggregation
  const { result } = await Wobj.findObjects({ filter, projection: { departments: 1 } });
  const departmentNames = _.uniq(_.flatten(_.map(result, 'departments')));

  const { result: allDepartments } = await Department.find({
    filter: {
      name: { $in: departmentNames },
    },
    projection: { search: 0 },
  });
  const filteredDepartments = name
    ? secondaryFilterDepartment({ allDepartments, name, excluded })
    : mainFilterDepartment(allDepartments);

  const mappedDepartments = subdirectoryMap({ filteredDepartments, allDepartments });

  return { result: mappedDepartments };
};

module.exports = getWobjectDepartments;