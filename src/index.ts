import express from 'express';
import pino from 'pino';
import { cfg } from './config.js';
import { router } from './routes.js';
import { startPoller } from './poller.js';
import { startInternalScheduler } from './scheduler.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

// serve the public one-pager at /
app.use(express.static('public'));

// api routes
app.use('/api', router);

const log = pino({ level: cfg.env === 'development' ? 'debug' : 'info' });
app.listen(cfg.port, () => log.info(`Server on :${cfg.port}`));

if (cfg.features.pollingEnabled) {
  startPoller().catch(err => log.error({ err }, 'poller_failed'));
}
if (cfg.features.internalScheduler) {
  startInternalScheduler(log);
}