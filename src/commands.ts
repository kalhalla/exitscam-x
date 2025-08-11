import { parseAmount, replyPublic } from './utils.js';
import { joinGame, playHigherLower, attemptScam, placePrediction } from './game.js';
import type { IncomingTweet } from './types.js';
import { rateLimitGuard, trackDailyStake } from './rateLimit.js';
import { cfg } from './config.js';

type Ctx = { verb: string; args: string[]; tweet: IncomingTweet };

export async function executeCommand({ verb, args, tweet }: Ctx) {
  const rl = await rateLimitGuard(tweet.authorId, cfg.features.abuse.perUserCooldownMs);
  if (!rl.ok) return;

  switch (verb) {
    case 'join': {
      const u = await joinGame(tweet);
      await replyPublic(tweet, `🎭 Welcome @${tweet.authorHandle}! Starter balance credited. Your ref: ${u.refCode}`);
      return;
    }
    case 'higher':
    case 'lower': {
      const amt = parseAmount(args[0] || '0');
      if (amt > cfg.features.abuse.maxStakePerCmd) { await replyPublic(tweet, `⛔ Max per-play stake is ${Number(cfg.features.abuse.maxStakePerCmd)/1_000000} ESC.`); return; }
      const capOk = await trackDailyStake(tweet.authorId, amt, cfg.features.abuse.dailyStakeCap);
      if (!capOk) { await replyPublic(tweet, `⛔ You hit your daily stake cap.`); return; }
      const result = await playHigherLower(tweet, verb as 'higher' | 'lower', amt);
      await replyPublic(tweet, result.message);
      return;
    }
    case 'scam': {
      const handle = args[0]?.replace('@', '');
      const amt = parseAmount(args[1] || '0');
      if (amt > cfg.features.abuse.maxStakePerCmd) { await replyPublic(tweet, `⛔ Max per-play stake exceeded.`); return; }
      const capOk = await trackDailyStake(tweet.authorId, amt, cfg.features.abuse.dailyStakeCap);
      if (!capOk) { await replyPublic(tweet, `⛔ You hit your daily stake cap.`); return; }
      const result = await attemptScam(tweet, handle, amt);
      await replyPublic(tweet, result.message);
      return;
    }
    case 'pump':
    case 'dump': {
      const amt = parseAmount(args[0] || '0');
      if (amt > cfg.features.abuse.maxStakePerCmd) { await replyPublic(tweet, `⛔ Max per-play stake exceeded.`); return; }
      const capOk = await trackDailyStake(tweet.authorId, amt, cfg.features.abuse.dailyStakeCap);
      if (!capOk) { await replyPublic(tweet, `⛔ You hit your daily stake cap.`); return; }
      const result = await placePrediction(tweet, verb as 'pump' | 'dump', amt);
      await replyPublic(tweet, result.message);
      return;
    }
  }
}