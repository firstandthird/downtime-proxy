'use strict';

const Hapi = require('hapi');
const h2o2 = require('h2o2');
const sleep = require('sleep-promise');

const proxyHost = process.env.ENDPOINT;
const proxyProtocol = process.env.PROTOCOL || 'http';

const main = async () => {
  const server = Hapi.server({
    port: 8080,
    debug: { log: ['*'], request: ['*'] }
  });

  await server.register(h2o2);

  server.route({
    method: 'get',
    path: '/{path*}',
    handler: async (request, h) => {
      const random = Math.random() * ( 10 - 1 ) + 1;
      if (random <= 3) {
        request.server.log(['debug'], { path: request.params.path, type: 'return-error' });
        return h.response('There has been an error').code(503);
      }

      if (random > 7) {
        request.server.log(['debug'], { path: request.params.path, type: 'delay-response' });
        await sleep(60000);
      } else {
        request.server.log(['debug'], { path: request.params.path, type: 'pass-through' });
      }

      return h.proxy({ host: proxyHost, port: 80, protocol: proxyProtocol, passThrough: true });
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
