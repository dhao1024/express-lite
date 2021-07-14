import express from 'express-lite';
import request from 'supertest';

import { echo } from './layers/index.js';

describe('App', () => {
  describe('trailing slash is optional', () => {
    const app = express();
    app.get('/slash-is-optional', echo('ok'));
    it('give a slash', (done) => {
      request(app).get('/slash-is-optional/')
        .expect('ok')
        .end(done);
    });
    it('give no slash', (done) => {
      request(app).get('/slash-is-optional')
        .expect('ok')
        .end(done);
    });
  });
  describe('trailing slash is needed', () => {
    const app = express();
    app.get('/slash-is-needed/', echo('ok'));
    it('give a slash', (done) => {
      request(app).get('/slash-is-needed/')
        .expect('ok')
        .end(done);
    });
    it('give no slash', (done) => {
      request(app).get('/slash-is-needed')
        .expect(404)
        .end(done);
    });
  });
});
