
exports.validateApiKey = (key) => {
  const { API_KEY } = process.env;
  if (key && key === API_KEY) return true;
  return false;
};
