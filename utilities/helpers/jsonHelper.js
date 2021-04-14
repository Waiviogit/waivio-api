exports.parseJson = (json) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    return {};
  }
};
