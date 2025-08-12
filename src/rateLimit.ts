// @ts-nocheck
import { createRequire } from 'node:module';
import { cfg } from './config.js';

const require = createRequire(import.meta.url);
const Redis = require('ioredis'); // CJS import = constructor at runtime

const redisUrl = process.env.REDIS_URL ?? cfg.redisUrl;
const redis = new Redis(redisUrl);

export async function rateLimitGuard(userId: string, cooldownMs: number) {
  const key = `rl:${userId}`;
  const ok = await redis.set(key, '1', 'PX', cooldownMs, 'NX');
  return { ok: ok === 'OK' };
}

export async function trackDailyStake(userId: string, amt: bigint, cap: bigint) {
  const key = `stake:${userId}:${dayKey()}`;
  const cur = BigInt((await redis.get(key)) || '0');
  if (cur + amt > cap) return false;
  await redis.set(key, String(cur + amt), 'EX', 24 * 60 * 60);
  return true;
}

function dayKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}
