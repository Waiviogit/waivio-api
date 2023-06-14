exports.validateApiKey = (key) => {
  const { API_KEY } = process.env;
  return key && key === API_KEY;
};
