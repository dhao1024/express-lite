import express from 'express-lite';
import request from 'supertest';

import {
  echo, error, errorCatcher, signal, reflect, next,
} from './layers/index.js';

describe('Router Nested', () => {
  describe('handle url', () => {
    const app = express();
    const router = express.Router();

    router.get('/in-router', reflect('url'));
    app.use('/top', router);

    app.get('/top/out-router', reflect('url'));
    it('trim url', (done) => {
      request(app).get('/top/in-router')
        .expect('/in-router')
        .end(done);
    });
    it('restore utl', (done) => {
      request(app).get('/top/out-router')
        .expect('/top/out-router')
        .end(done);
    });
  });
  describe('exit from inner nest', () => {
    const app = express();
    const router = express.Router();

    router.get('/error', error('error-in-router'));
    router.get('/router', signal('router'));
    router.get('/next', next());
    app.use('/top', router);

    app.use('/', echo('top'));
    app.use('/', errorCatcher());
    it('handle error', (done) => {
      request(app).get('/top/error')
        .expect('error-in-router')
        .end(done);
    });
    it('handle <router>', (done) => {
      request(app).get('/top/router')
        .expect('top')
        .end(done);
    });
    it('handle next', (done) => {
      request(app).get('/top/next')
        .expect('top')
        .end(done);
    });
  });
});
