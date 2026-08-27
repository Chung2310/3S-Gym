import express from 'express';
import request from 'supertest';
import { expect, it } from 'vitest';
import { configureSecurity } from '../middlewares/security.js';
import { createRateLimiter } from '../middlewares/rateLimit.js';

it('sets security headers and accepts configured CORS origins', async () => {
  const app = express();
  configureSecurity(app, { corsOrigins: ['https://app.3sgym.vn'], trustProxy: false, jsonBodyLimit: '1kb' });
  app.get('/ok', (_req, res) => res.json({ ok: true }));

  const response = await request(app).get('/ok').set('Origin', 'https://app.3sgym.vn');
  expect(response.status).toBe(200);
  expect(response.headers['access-control-allow-origin']).toBe('https://app.3sgym.vn');
  expect(response.headers['x-content-type-options']).toBe('nosniff');
});

it('rejects origins outside the allowlist', async () => {
  const app = express();
  configureSecurity(app, { corsOrigins: ['https://app.3sgym.vn'], trustProxy: false, jsonBodyLimit: '1kb' });
  app.get('/ok', (_req, res) => res.json({ ok: true }));
  expect((await request(app).get('/ok').set('Origin', 'https://evil.example')).status).toBe(403);
});

it('limits requests in an isolated bucket', async () => {
  const app = express();
  app.use(createRateLimiter({ limit: 2, windowMs: 60_000 }));
  app.get('/ok', (_req, res) => res.json({ ok: true }));

  expect((await request(app).get('/ok')).status).toBe(200);
  expect((await request(app).get('/ok')).status).toBe(200);
  expect((await request(app).get('/ok')).status).toBe(429);
});

it('rejects JSON bodies above the configured limit', async () => {
  const app = express();
  configureSecurity(app, { corsOrigins: [], trustProxy: false, jsonBodyLimit: '16b' });
  app.post('/echo', (req, res) => res.json(req.body));
  expect((await request(app).post('/echo').send({ value: 'payload larger than sixteen bytes' })).status).toBe(413);
});
