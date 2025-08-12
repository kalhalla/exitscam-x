// src/rateLimit.ts
import { cfg } from './config.js';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL ?? cfg.redisUrl;

function getRedis(): Redis {
  return new Redis(redisUrl);
}

export async function rateLimitGuard(userId: string, cooldownMs: number) {
  const redis = getRedis();
  const key = `rl:${userId}`;
  const ok = await redis.set(key, '1', 'PX', cooldownMs, 'NX');
  await redis.quit();
  return { ok: ok === 'OK' };
}

export async function trackDailyStake(userId: string, amt: bigint, cap: bigint) {
  const redis = getRedis();
  const key = `stake:${userId}:${dayKey()}`;
  const cur = BigInt((await redis.get(key)) || '0');
  if (cur + amt > cap) {
    await redis.quit();
    return false;
  }
  await redis.set(key, String(cur + amt), 'EX', 24 * 60 * 60);
  await redis.quit();
  return true;
}

function dayKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}
