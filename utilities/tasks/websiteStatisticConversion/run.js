const addConversion = require('./addConversion');

(async () => {
  await addConversion();
  console.log('FINISHED');
  process.exit();
})();
