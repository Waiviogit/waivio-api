const { addUsersToImport } = require('./findUsers');

(async () => {
  await addUsersToImport(
    {
      startAcc: process.argv[4],
      name: process.argv[3],
      url: process.argv[2],
    },
  );
})();
