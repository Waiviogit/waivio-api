exports.parseJson = (json, returnOnError = {}) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    return returnOnError;
  }
};
