import fs from 'fs';
import os from 'os';
import path from 'path';
import express from 'express';
import request from 'supertest';
import { registerFrontend } from '../services/frontendService.js';
describe('registerFrontend', () => {
  it('phục vụ index.html cho route SPA', async () => {
    const publicPath = fs.mkdtempSync(path.join(os.tmpdir(), '3s-public-'));
    fs.writeFileSync(path.join(publicPath, 'index.html'), '<html><body>3S Portal</body></html>');
    const app = express();
    await registerFrontend(app, publicPath, { mode: 'production' });

    const response = await request(app).get('/portal');
    expect(response.status).toBe(200);
    expect(response.text).toContain('3S Portal');
    fs.rmSync(publicPath, { recursive: true, force: true });
  });

  it('development chờ Vite middleware với root frontend chính xác', async () => {
    const app = express();
    const viteMiddleware = vi.fn((_req, res) => res.status(200).send('Vite HMR'));
    const createViteServer = vi.fn().mockResolvedValue({ middlewares: viteMiddleware });
    const ready = registerFrontend(app, path.resolve('frontend'), { mode: 'development', createViteServer });
    await ready;
    const response = await request(app).get('/portal');
    expect(createViteServer).toHaveBeenCalledWith(expect.objectContaining({ root: path.resolve('frontend'), appType: 'spa', server: { middlewareMode: true } }));
    expect(response.text).toBe('Vite HMR');
  });
});
