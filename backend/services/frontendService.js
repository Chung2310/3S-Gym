const express = require('express');
const fs = require('fs');
const path = require('path');

function registerFrontend(app, frontendPath, options = {}) {
  const mode = options.mode || process.env.NODE_ENV || 'development';
  if (mode !== 'production') {
    const createViteServer = options.createViteServer || require('vite').createServer;
    const viteReady = createViteServer({ root: frontendPath, appType: 'spa', server: { middlewareMode: true } });
    app.use(async (req, res, next) => {
      try { const vite = await viteReady; return vite.middlewares(req, res, next); }
      catch (error) { return next(error); }
    });
    return viteReady;
  }
  if (!fs.existsSync(path.join(frontendPath, 'index.html'))) return Promise.resolve(false);
  app.use(express.static(frontendPath));
  app.get('/{*splat}', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
  return Promise.resolve(true);
}

module.exports = { registerFrontend };
