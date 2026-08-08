const { request } = require('node:http');

module.exports = () => new Promise(resolve => {
  const stopRequest = request(
    {
      host: '127.0.0.1',
      port: 4173,
      path: '/__playwright/stop',
      method: 'POST',
      timeout: 2_000,
    },
    response => {
      response.resume();
      response.on('end', resolve);
    }
  );

  stopRequest.on('error', resolve);
  stopRequest.on('timeout', () => {
    stopRequest.destroy();
    resolve();
  });
  stopRequest.end();
});
