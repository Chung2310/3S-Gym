import fs from 'fs';
import os from 'os';
import path from 'path';
import express from 'express';
import request from 'supertest';
import { registerFrontend } from '../services/frontendService.js';
describe('registerFrontend', () => {
  it('chỉ dùng backend bootstrap làm entry point development trên cổng 3008', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    const exampleEnvironment = fs.readFileSync(path.resolve('.env.example'), 'utf8');

    expect(packageJson.scripts.dev).toBe('tsx watch backend/dev.ts');
    expect(packageJson.scripts['dev:backend']).toBe('tsx watch backend/dev.ts');
    expect(packageJson.scripts['dev:frontend']).toBeUndefined();
    expect(exampleEnvironment).toContain('PORT=3008');
    expect(exampleEnvironment).toContain('CORS_ORIGINS=http://localhost:3008');
    expect(exampleEnvironment).not.toContain('localhost:5173');
  });
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

  it('development phục vụ index.html tại root qua Vite middleware thật', async () => {
    const app = express();
    const vite = await registerFrontend(app, path.resolve('frontend'), { mode: 'development' });

    try {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.text).toContain('<div id="root"></div>');
      expect(response.text).toContain('/src/main.tsx');
    } finally {
      if (typeof vite !== 'boolean') await vite.close();
    }
  });
});
