const { createShutdown } = require('../services/lifecycleService');

it('graceful shutdown chỉ chạy một lần', async () => {
  const server = { close: vi.fn((callback) => callback()) };
  const disconnect = vi.fn().mockResolvedValue();
  const flush = vi.fn().mockResolvedValue(true);
  const exit = vi.fn();
  const shutdown = createShutdown({ server, disconnect, flush, exit, logger: { info: vi.fn(), fatal: vi.fn() }, timeoutMs: 100 });
  await Promise.all([shutdown('SIGTERM', 0), shutdown('SIGTERM', 0)]);
  expect(server.close).toHaveBeenCalledOnce();
  expect(disconnect).toHaveBeenCalledOnce();
  expect(flush).toHaveBeenCalledOnce();
  expect(exit).toHaveBeenCalledWith(0);
});
