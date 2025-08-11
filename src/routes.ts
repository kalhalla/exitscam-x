import { Router } from 'express';
import type { Request, Response } from 'express';
import { handleIncomingTweet } from './x.js';
import { dailyPayout, weeklyJackpot } from './leaderboard.js';

export const router = Router();

// simple health check: GET /api/health
router.get('/health', (_req: Request, res: Response) => {
  res.send({ ok: true });
});

// simulate an incoming tweet (our internal hook): POST /api/hooks/x
router.post('/hooks/x', async (req: Request, res: Response) => {
  try {
    await handleIncomingTweet(req.body);
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: 'hook_failed' });
  }
});

// manual cron triggers (useful while testing)
router.post('/cron/daily-payout', async (_req: Request, res: Response) => {
  await dailyPayout();
  res.status(204).send();
});

router.post('/cron/weekly-jackpot', async (_req: Request, res: Response) => {
  await weeklyJackpot();
  res.status(204).send();
});
