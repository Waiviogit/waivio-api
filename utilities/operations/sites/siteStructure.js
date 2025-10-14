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
    hasChildren,
    author_permlink: object?.author_permlink,
    children: [],
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

const buildChildrenRecursively = async ({
  children,
  host,
  app,
  visited = new Set(),
}) => {
  // prepare batch to fetch all needed objects for this level
  const permlinksToFetch = children
    .filter((c) => c.hasChildren && c.author_permlink && !visited.has(c.author_permlink))
    .map((c) => c.author_permlink);

  let processedMap = new Map();
  if (permlinksToFetch.length) {
    const { result: objects = [] } = await Wobj.findObjects({
      filter: { author_permlink: { $in: permlinksToFetch } },
    });
    const processed = await processWobjects({
      wobjects: objects,
      fields: REQUIREDFILDS_WOBJ_LIST,
      app,
    });
    processedMap = new Map(processed.map((o) => [o.author_permlink, o]));
  }

  for (const child of children) {
    if (child.hasChildren && child.author_permlink) {
      if (visited.has(child.author_permlink)) {
        console.warn(`Cycle detected for ${child.author_permlink}, skipping`);
        child.hasChildren = false;
        continue;
      }

      visited.add(child.author_permlink);

      const processedObject = processedMap.get(child.author_permlink);

      if (processedObject) {
        child.children = await getListChildren({
          object: processedObject,
          host,
          app,
          parentNode: child,
        });

        await buildChildrenRecursively({
          children: child.children,
          host,
          app,
          visited: new Set(visited),
        });

        if (!child.children || !child.children.length) {
          child.hasChildren = false;
          child.children = [];
        }
      } else {
        child.hasChildren = false;
        child.children = [];
      }
    }
  }
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

  // Recursively build all levels with cycle detection
  await buildChildrenRecursively({
    children,
    host,
    app,
    visited: new Set([object.author_permlink]), // Start with root to prevent cycles back to root
  });

  return parentNode;
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

module.exports = {
  getSiteStructure,
};
