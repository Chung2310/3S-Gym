function createShutdown({ server, disconnect, flush, exit, logger, timeoutMs = 10000 }) {
  let shutdownPromise;
  return function shutdown(signal, exitCode = 0) {
    if (shutdownPromise) return shutdownPromise;
    shutdownPromise = new Promise((resolve) => {
      let finished = false;
      const finish = async () => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        try { await disconnect(); await flush(); logger.info({ signal }, 'Đã dừng dịch vụ an toàn'); }
        catch (error) { logger.fatal({ err: error, signal }, 'Lỗi khi dừng dịch vụ'); exitCode = 1; }
        exit(exitCode);
        resolve();
      };
      const timer = setTimeout(() => { logger.fatal({ signal }, 'Quá thời gian dừng dịch vụ'); finish(); }, timeoutMs);
      if (server?.close) server.close(finish); else finish();
    });
    return shutdownPromise;
  };
}

module.exports = { createShutdown };
