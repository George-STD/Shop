module.exports = async function globalTeardown() {
  if (global.__MONGOINSTANCE) {
    await global.__MONGOINSTANCE.stop();
  }
};
