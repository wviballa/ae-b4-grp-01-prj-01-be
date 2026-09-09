import app from './app.js';
import { ENV } from './config/env.js';

const PORT = ENV.PORT;

const server = app.listen(PORT, () => {
  console.log(`🚀 Toy Store Backend API running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log(`⚙️  Environment: ${ENV.NODE_ENV}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
