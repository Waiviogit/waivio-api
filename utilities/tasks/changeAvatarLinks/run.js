const change = require('./changeLinks');

(async () => {
  const creds = {
    AWS_ENDPOINT: process.argv[2],
    AWS_ACCESS_KEY_ID: process.argv[3],
    AWS_SECRET_ACCESS_KEY: process.argv[4],
  };

  await change(creds);
  process.exit();
})();
