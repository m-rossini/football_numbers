import express, { Express } from 'express';
import os from 'os';

export const app: Express = express();
const port = 3000;
const startTime = Date.now();

app.get('/health', (_req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    status: 'ok',
    uptime
  });
});

app.get('/info', (_req, res) => {
  res.json({
    user: os.userInfo().username,
    hostname: os.hostname()
  });
});

if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
  });
}
