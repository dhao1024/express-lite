import express from 'express-lite';
import request from 'supertest';

import { reflect } from './layers/index.js';

describe('Params', () => {
  describe('handle params', () => {
    const app = express();
    app.get('/1/:v', reflect('params.v'));
    app.get('/2/pre-:v', reflect('params.v'));
    app.get('/2/:v-suf', reflect('params.v'));
    app.get('/3/:v(\\d+)', reflect('params.v'));
    it('params', (done) => {
      request(app).get('/1/qwe')
        .expect('qwe')
        .end(done);
    });
    it('params with prefix', (done) => {
      request(app).get('/2/pre-qwe')
        .expect('qwe')
        .end(done);
    });
    it('params with suffix', (done) => {
      request(app).get('/2/qwe-suf')
        .expect('qwe')
        .end(done);
    });
    it('params with refexp: not match', (done) => {
      request(app).get('/3/qwe')
        .expect(404)
        .end(done);
    });
    it('params with refexp: match', (done) => {
      request(app).get('/3/123')
        .expect('123')
        .end(done);
    });
  });
  describe('merge params', () => {
    const app = express();
    const router = express.Router({ mergeParams: true });

    router.get('/', reflect('params.out'));
    router.get('/:out', reflect('params.out'));
    app.use('/:out', router);
    it('param of out nest', (done) => {
      request(app).get('/p1')
        .expect('p1')
        .end(done);
    });
    it('redundant param name', (done) => {
      request(app).get('/p1/p2')
        .expect('p2')
        .end(done);
    });
  });
  describe('not merge params', () => {
    const app = express();
    const router = express.Router();

    router.get('/', reflect('params.out'));
    app.use('/:out', router);
    app.get('/:out/:out', reflect('params.out'));
    it('param of out nest', (done) => {
      request(app).get('/p1')
        .expect('')
        .end(done);
    });
    it('redundant param name', (done) => {
      request(app).get('/p1/p2')
        .expect('p2')
        .end(done);
    });
  });
});
