'use strict';

const Hapi = require('hapi');
const h2o2 = require('h2o2');
const sleep = require('sleep-promise');

const proxyHost = process.env.ENDPOINT;

const main = async () => {
  const server = Hapi.server({
    port: 8080,
    debug: { log: ['error'], request: ['error'] }
  });

  await server.register(h2o2);

  server.route({
    method: 'get',
    path: '/{path*}',
    handler: async (request, h) => {
      const random = Math.random() * ( 10 - 1 ) + 1;
      if (random <= 3) {
        return h.response('There has been an error').code(503);
      }

      if (random > 7) {
        await sleep(60000);
      }

      return h.proxy({ host: proxyHost, port: 80, protocol: 'http', passThrough: true });
    }
  });

  await server.start(); 
  return server;
};


main()
.then((server) => console.log(`Server listening on ${server.info.uri}`))
.catch((err) => {
    console.error(err);
    process.exit(1);
});
