const { GET_DEFAULT_COLORS } = require('constants/sitesConstants');
const { faker } = require('test/testHelper');

exports.configurationMock = ({
  desktop, mobile, object,
} = {}) => ({
  configurationFields: ['desktopLogo', 'mobileLogo', 'aboutObject', 'desktopMap', 'mobileMap', 'colors'],
  desktopLogo: desktop || faker.image.imageUrl(),
  mobileLogo: mobile || faker.image.imageUrl(),
  aboutObject: object || faker.random.string(),
  desktopMap: {
    topPoint: [faker.address.longitude(), faker.address.latitude()],
    bottomPoint: [faker.address.longitude(), faker.address.latitude()],
    center: [faker.address.longitude(), faker.address.latitude()],
    zoom: faker.random.number(),
  },
  mobileMap: {
    topPoint: [faker.address.longitude(), faker.address.latitude()],
    bottomPoint: [faker.address.longitude(), faker.address.latitude()],
    center: [faker.address.longitude(), faker.address.latitude()],
    zoom: faker.random.number(),
  },
  colors: GET_DEFAULT_COLORS(),
});
