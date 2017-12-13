'use strict';

const Hapi = require('hapi');
const h2o2 = require('h2o2');
const sleep = require('sleep-promise');

const proxyEndpoint = process.env.ENDPOINT;

if (!proxyEndpoint) {
  throw new Error('Must supply an ENDPOINT');
}

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

      const path = request.params.path;
      const uri = `${proxyEndpoint}/${path}`;

      if (random <= 3) {
        request.server.log(['debug'], { path, uri, type: 'return-error' });
        return h.response('There has been an error').code(503);
      }

      if (random > 7) {
        request.server.log(['debug'], { path, uri, type: 'delay-response' });
        await sleep(60000);
      } else {
        request.server.log(['debug'], { path, uri, type: 'pass-through' });
      }

      return h.proxy({ uri, passThrough: true });
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
