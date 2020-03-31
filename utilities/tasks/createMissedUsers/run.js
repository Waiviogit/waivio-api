const { addUsersToImport } = require('./findUsers');

/**
 * Task can be started with pm2 by command : pm2 start --name <nameOfTask> npm -- run <scriptName> [params] --
 * startAcc - account from which import begins
 * url - waivio urls (waiviodev.com or www.waivio.com)
 */
(async () => {
  await addUsersToImport(
    {
      startAcc: process.argv[3],
      url: process.argv[2],
    },
  );
})();
