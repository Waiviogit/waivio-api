const Wobj = require('../../../models/wObjectModel');

exports.checkIfWobjectExists = async ({ authorPermlink }) => {
  const { result, error } = await Wobj.findOne(
    { author_permlink: authorPermlink },
    { author_permlink: 1 },
  );
  if (error) return { error };

  if (result) return { exist: true };

  return { exist: false };
};
