const _ = require('lodash');
const { Wobj } = require('../../../models');
const { processWobjects } = require('../../helpers/wObjectHelper');
const {
  REQUIREDFIELDS,
} = require('../../../constants/wobjectsData');
const { parseJson } = require('../../helpers/jsonHelper');

const USER_SITE_TABS = ['Shop', 'Recipes', 'Blog', 'Map'];
const LEGAL_PERMLINK = 'ljc-legal';

const makeUserSiteMenu = (elementName, userName, host) => {
  const links = {
    Blog: `https://${host}/blog/${userName}`,
    Shop: `https://${host}/user-shop/${userName}`,
    Legal: `https://${host}/object/${LEGAL_PERMLINK}`,
    Recipes: `https://${host}/recipe/${userName}`,
    Map: `https://${host}/map/${userName}`,
  };
  return {
    id: `root:${elementName}`,
    name: elementName,
    link: links[elementName],
    kind: 'menuItem',
    hasChildren: false,
    // children: [],
    // meta: {}
  };
};

const makeObjectSiteMenu = ({ object, parentNode, host }) => {
  const hasChildren = !!object.menuItem?.length;
  const id = parentNode
    ? `${parentNode.id}:${object.author_permlink}`
    : `root:${object.author_permlink}`;

  return {
    id,
    name: object.name,
    link: `https://${host}/object`,
    kind: 'menuItem',
    hasChildren,
    // children: [],
    // meta: {}
  };
};

const getSiteStructure = async ({ app }) => {
  const social = !!app?.configuration?.shopSettings?.type;
  // add waivio structure
  if (!social) return null;

  const { host } = app;

  if (app.configuration.shopSettings.type === 'user') {
    const availableTabs = _.difference(USER_SITE_TABS, (app?.configuration?.tabsFilter || []));
    const userName = app?.configuration?.shopSettings?.value;

    return _.reduce(
      availableTabs,
      (acc, el) => [
        ...acc,
        makeUserSiteMenu(el, userName, host),
      ],
      [],
    );
  }
  const { wObject: mainObject } = await Wobj.getOne(app?.configuration?.shopSettings?.value);
  if (!mainObject) return null;

  const mainObjectProcessed = await processWobjects({
    wobjects: [mainObject],
    returnArray: false,
    fields: REQUIREDFIELDS,
    app,
  });

  // 2 pages no children
  if (!mainObjectProcessed?.menuItem?.length) {
    return [
      makeObjectSiteMenu({ object: mainObjectProcessed, host }),
      makeUserSiteMenu('Legal', '', host),
    ];
  }

  // {"title":string,"style":string,"linkToWeb":string} | {"style": string,"linkToObject":string,"objectType":string}
  const mappedItems = mainObjectProcessed.menuItem
    .map((el) => parseJson(el.body, null))
    .filter((el) => !!el);
};

// (async () => {
//   await getSiteStructure({
//     app: {
//       host: 'hivecooking.com/',
//       configuration: {
//         shopSettings: {
//           type: 'object',
//           value: 'ecy-hive-cooking',
//         },
//       },
//     },
//   });
//   console.log();
// })();

module.exports = {
  getSiteStructure,
};
