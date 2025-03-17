const _ = require('lodash');
const {
  Wobj, Post, ObjectType, CommentRef,
} = require('../../models');

const restore = async () => {
  const { postsCount } = await restorePostsRefs();
  const { objectTypesCount } = await restoreObjectTypesRefs();
  const { fieldsCount, wobjectsCount } = await restoreWobjectsRefs();

  return {
    fieldsCount, wobjectsCount, postsCount, objectTypesCount,
  };
};

const restoreWobjectsRefs = async () => {
  const { wobjects } = await Wobj.getWobjectsRefs(); // get refs(author_permlinks) of all wobjects
  let wobjectsCount = 0;
  let fieldsCount = 0;

  if (wobjects && wobjects.length) {
    wobjectsCount += wobjects.length;
    for (const wobject of wobjects) {
      await CommentRef.create({ comment_path: `${wobject.author}_${wobject.author_permlink}`, type: 'create_wobj', root_wobj: wobject.author_permlink });
      const { fields } = await Wobj.getFieldsRefs(wobject.author_permlink);

      if (fields && fields.length) {
        fieldsCount += fields.length;
        for (const field of fields) {
          await CommentRef.create({ comment_path: `${field.field_author}_${field.field_permlink}`, type: 'append_wobj', root_wobj: wobject.author_permlink });
        }
      }
    }
  }
  return { wobjectsCount, fieldsCount };
};

const restorePostsRefs = async () => {
  let posts = [];
  let counter = 0;
  let postsCount = 0;

  do {
    const res = await Post.getPostsRefs({ skip: 1000 * counter++, limit: 1000 });

    posts = _.get(res, 'posts', []);
    if (!_.isEmpty(posts)) {
      postsCount += posts.length;

      await Promise.all(posts.map(async (post) => {
        await CommentRef.create({ comment_path: `${post.author}_${post.permlink}`, type: 'post_with_wobj', wobjects: JSON.stringify(post.wobjects) });
      }));
    }
  } while (posts.length === 1000);

  return { postsCount };
};

const restoreObjectTypesRefs = async () => {
  const { objectTypes } = await ObjectType.getAll({ limit: 100, skip: 0 });
  let objectTypesCount = 0;

  if (objectTypes && objectTypes.length) {
    objectTypesCount += objectTypes.length;
    for (const objType of objectTypes) {
      await CommentRef.create({ comment_path: `${objType.author}_${objType.permlink}`, type: 'wobj_type', name: objType.name });
    }
  }
  return { objectTypesCount };
};

module.exports = { restore };
