const { faker, _, Prefetch } = require('test/testHelper');
const { CATEGORY_ITEMS } = require('constants/sitesConstants');

const Create = async ({
  name, tag, type, category, image,
} = {}) => {
  const data = {
    name: name || faker.random.string(10),
    tag: tag || faker.random.string(10),
    type: type || _.sample(['restaurant', 'dish', 'drink']),
    category: category || _.sample([...CATEGORY_ITEMS]),
    image,
  };

  return (await Prefetch.create(data)).result;
};

module.exports = { Create };
