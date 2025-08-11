import { Router } from 'express';
import { handleIncomingTweet } from './x.js';
import { dailyPayout, weeklyJackpot } from './leaderboard.js';

export const router = Router();

router.get('/health', (_req, res) => res.send({ ok: true }));

router.post('/hooks/x', async (req, res) => {
  try {
    await handleIncomingTweet(req.body);
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: 'hook_failed' });
  }
});

router.post('/cron/daily-payout', async (_req, res) => {
  await dailyPayout();
  res.status(204).send();
});

router.post('/cron/weekly-jackpot', async (_req, res) => {
  await weeklyJackpot();
  res.status(204).send();
});