import { Router } from 'express';
import type { Request, Response } from 'express';
import { handleIncomingTweet } from './x.js';
import { dailyPayout, weeklyJackpot } from './leaderboard.js';

export const router = Router();

// GET /api/health
router.get('/health', (_req: Request, res: Response) => {
  res.send({ ok: true });
});

// POST /api/hooks/x  (internal test hook to simulate mentions)
router.post('/hooks/x', async (req: Request, res: Response) => {
  try {
    await handleIncomingTweet(req.body);
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: 'hook_failed' });
  }
});

// Manual cron triggers while testing
router.post('/cron/daily-payout', async (_req: Request, res: Response) => {
  await dailyPayout();
  res.status(204).send();
});

router.post('/cron/weekly-jackpot', async (_req: Request, res: Response) => {
  await weeklyJackpot();
  res.status(204).send();
});
