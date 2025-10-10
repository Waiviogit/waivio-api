const _ = require('lodash');
const { Wobj } = require('../../../models');
const { processWobjects } = require('../../helpers/wObjectHelper');
const {
  REQUIREDFILDS_WOBJ_LIST,
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
  const hasChildren = parentNode ? !!object?.listItem?.length : !!object.menuItem?.length;

  const id = parentNode
    ? `${parentNode.id}:${object.author_permlink}`
    : `root:${object.author_permlink}`;

  return {
    id,
    name: object.menuName || object.name,
    link: parentNode ? `https://${host}/object/${object.author_permlink}` : `https://${host}`,
    kind: object.object_type,
    hasChildren,
    author_permlink: object?.author_permlink,
    // children: [],
    // meta: {}
  };
};

const makeLinkSiteMenu = ({ object, parentNode }) => ({
  id: `${parentNode.id}:${object.title}`,
  name: object.title,
  link: object.linkToWeb,
  kind: 'linkToWeb',
  hasChildren: false,
});

const getListChildren = async ({
  object, host, app, parentNode,
}) => {
  const objectLinks = object.listItem.map((el) => el.body);
  const { result: objects = [] } = await Wobj.findObjects({
    filter: {
      author_permlink: { $in: objectLinks },
    },
  });

  const objectsProcessed = await processWobjects({
    wobjects: objects,
    fields: REQUIREDFILDS_WOBJ_LIST,
    app,
  });

  return objectsProcessed.map((el) => makeObjectSiteMenu({ object: el, host, parentNode }));
};

const makeFoldedStructure = async ({ object, host, app }) => {
  // root
  const parentNode = makeObjectSiteMenu({ object, host });
  // {"title":string,"style":string,"linkToWeb":string}
  // | {"style": string,"linkToObject":string,"objectType":string}
  const mappedItems = object.menuItem
    .map((el) => parseJson(el.body, null))
    .filter((el) => !!el);

  const objectLinks = mappedItems
    .filter((el) => el.linkToObject)
    .map((el) => el.linkToObject);

  const { result: objects = [] } = await Wobj.findObjects({
    filter: {
      author_permlink: { $in: objectLinks },
    },
  });

  const objectsProcessed = await processWobjects({
    wobjects: objects,
    fields: REQUIREDFILDS_WOBJ_LIST,
    app,
  });

  const children = mappedItems.map((el) => {
    if (el.linkToWeb) {
      return makeLinkSiteMenu({
        parentNode,
        host,
        object: el,
      });
    }

    const processedObject = objectsProcessed.find((o) => o.author_permlink === el.linkToObject);
    if (!processedObject) return null;
    return makeObjectSiteMenu({
      object: { ...processedObject, menuName: el.title },
      parentNode,
      host,
    });
  }).filter((el) => !!el);

  parentNode.children = children;

  // here we finished first level; only for first level we use menuItem as children
  // next we need use listItem
  for (const child of children) {
    if (child.hasChildren) {
      const processedObject = objectsProcessed.find((o) => o.author_permlink === child.author_permlink);
      child.children = await getListChildren({
        object: processedObject,
        host,
        app,
        parentNode: child,
      });
    }
  }

  console.log();
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
    fields: REQUIREDFILDS_WOBJ_LIST,
    app,
  });

  // 2 pages no children
  if (!mainObjectProcessed?.menuItem?.length) {
    return [
      makeObjectSiteMenu({ object: mainObjectProcessed, host }),
      makeUserSiteMenu('Legal', '', host),
    ];
  }

  return makeFoldedStructure({
    object: mainObjectProcessed,
    host,
    app,
  });
};

(async () => {
  await getSiteStructure({
    app: {
      host: 'hivecooking.com',
      configuration: {
        shopSettings: {
          type: 'object',
          value: 'ecy-hive-cooking',
        },
      },
    },
  });
  console.log();
})();

module.exports = {
  getSiteStructure,
};
