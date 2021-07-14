import express from 'express-lite';
import request from 'supertest';

import {
  echo, error, errorCatcher, signal, next, reflect,
} from './layers/index.js';

describe('Router', () => {
  describe('send response', () => {
    const app = express();
    app.get('/', echo('root'));
    app.get('/ok', echo('ok'));
    it('echo root', (done) => {
      request(app).get('/')
        .expect('root')
        .end(done);
    });
    it('echo ok', (done) => {
      request(app).get('/ok')
        .expect('ok')
        .end(done);
    });
    it('not found', (done) => {
      request(app).get('/no-page')
        .expect(404)
        .end(done);
    });
  });
  describe('parse request', () => {
    const app = express();
    app.get('/method', reflect('method'));
    app.get('/url', reflect('url'));
    it('method', (done) => {
      request(app).get('/method')
        .expect('GET')
        .end(done);
    });
    it('url', (done) => {
      request(app).get('/url')
        .expect('/url')
        .end(done);
    });
  });
  describe('handle middle function', () => {
    const app = express();
    app.get('/next-layer', next(), echo('ok'));
    app.get('/next-route', next());
    app.get('/next-route', echo('ok'));
    it('next-layer', (done) => {
      request(app).get('/next-layer')
        .expect('ok')
        .end(done);
    });
    it('next-route', (done) => {
      request(app).get('/next-route')
        .expect('ok')
        .end(done);
    });
  });
  describe('handle errors', () => {
    const app = express();
    app.get('/error1', error('error1'));
    app.get('/error2', error('error2'), errorCatcher());
    it('error is ignored', (done) => {
      request(app).get('/error1')
        .expect(500)
        .end(done);
    });
    it('error is catched', (done) => {
      request(app).get('/error2')
        .expect('error2')
        .end(done);
    });
  });
  describe('handle signal', () => {
    const app = express();
    app.get('/route', signal('route'), echo('unreachable'));
    app.get('/route', echo('after receive <route>'));
    app.get('/router', signal('router'), echo('unreachable'));
    app.get('/router', echo('after receive <router>'));
    it('signal <route>', (done) => {
      request(app).get('/route')
        .expect('after receive <route>')
        .end(done);
    });
    it('signal <router>', (done) => {
      request(app).get('/router')
        .expect(404)
        .end(done);
    });
  });
});
