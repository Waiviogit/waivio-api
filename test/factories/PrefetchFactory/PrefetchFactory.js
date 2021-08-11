const { faker, _, Prefetch } = require('test/testHelper');
const { CATEGORY_ITEMS } = require('constants/sitesConstants');
const { MAIN_OBJECT_TYPES } = require('constants/wobjectsData');

const Create = async ({
  name, tag, type, category, image,
} = {}) => {
  const data = {
    name: name || faker.random.string(10),
    tag: tag || faker.random.string(10),
    type: type || _.sample(MAIN_OBJECT_TYPES),
    category: category || _.sample(CATEGORY_ITEMS),
    image,
  };

  return (await Prefetch.create(data)).result;
};

module.exports = { Create };
