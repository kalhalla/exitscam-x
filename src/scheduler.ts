import { dailyPayout, weeklyJackpot } from './leaderboard.js';
import { settlePredictions } from './predictions.js';

export function startInternalScheduler(log: any) {
  setInterval(async () => {
    try { await dailyPayout(); log.info('daily_payout_ok'); } catch (e) { log.error({ e }, 'daily_payout_err'); }
  }, 60 * 60 * 1000);

  setInterval(async () => {
    try { await weeklyJackpot(); log.info('weekly_jackpot_ok'); } catch (e) { log.error({ e }, 'weekly_jackpot_err'); }
  }, 24 * 60 * 60 * 1000);

  setInterval(async () => {
    try { await settlePredictions(); log.info('predictions_settled'); } catch (e) { log.error({ e }, 'predictions_err'); }
  }, 60 * 60 * 1000);
}