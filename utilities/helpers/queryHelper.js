const _ = require('lodash');

exports.getNewsFilterCondition = ({
  condition = {}, wObject, newsPermlink, app,
}) => {
  const newsFilter = JSON.parse(_.get(
    _.find(wObject.fields, (f) => f.permlink === newsPermlink),
    'body',
    '{}',
  ));
  let firstCond;
  const secondCond = { 'wobjects.author_permlink': { $nin: _.get(newsFilter, 'ignoreList', []) } };

  if (
    !newsFilter.allowList
    && !newsFilter.ignoreList
    && !newsFilter.typeList
    && !newsFilter.authors
  ) {
    return { error: { message: 'Format not include all required fields' } };
  }

  if (!_.isEmpty(newsFilter.allowList)
    && _.some(newsFilter.allowList, (rule) => !_.isEmpty(rule))) {
    const orCondArr = [];

    newsFilter.allowList.forEach((allowRule) => {
      if (Array.isArray(allowRule) && allowRule.length) {
        orCondArr.push({
          'wobjects.author_permlink': { $all: allowRule },
        });
      }
    });
    firstCond = { $or: orCondArr };
  }

  if (!_.isEmpty(_.get(newsFilter, 'typeList'))) {
    const objectTypes = _.isEmpty(_.get(app, 'supported_object_types'))
      ? newsFilter.typeList
      : _.filter(newsFilter.typeList, (el) => _.includes(app.supported_object_types, el));

    const typeCondition = { $and: [{ 'wobjects.object_type': { $in: objectTypes } }] };
    if (app.inherited) typeCondition.$and.push({ 'wobjects.author_permlink': { $in: _.get(app, 'supported_objects') } });

    firstCond
      ? firstCond.$or.push(typeCondition)
      : firstCond = typeCondition;
  }

  if (
    _.some(newsFilter.allowList, (rule) => _.isEmpty(rule))
    && _.isEmpty(_.get(newsFilter, 'typeList'))
    && _.isEmpty(_.get(newsFilter, 'authors'))
  ) {
    firstCond = { 'wobjects.author_permlink': wObject.author_permlink };
  }
  if (!_.isEmpty(newsFilter.authors)) {
    // posts only includes and objects
    condition.author = { $in: newsFilter.authors };
  }

  condition.$and = _.compact([firstCond, secondCond]);

  return { condition };
};
