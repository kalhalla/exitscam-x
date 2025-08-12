// src/rateLimit.ts
import { cfg } from './config.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const redisUrl = process.env.REDIS_URL ?? cfg.redisUrl;

// A constructable type so TS accepts `new Ctor(...)`
type AnyCtor = new (...args: any[]) => any;

let _redis: any;

function getRedis(): any {
  if (_redis) return _redis;

  // Load ioredis at runtime and normalize export shape (ESM/CJS)
  const mod: any = require('ioredis');
  const Ctor: AnyCtor = (mod?.default ?? mod?.Redis ?? mod) as AnyCtor;

  _redis = new Ctor(redisUrl);
  return _redis;
}

export async function rateLimitGuard(userId: string, cooldownMs: number) {
  const redis = getRedis();
  const key = `rl:${userId}`;
  const ok = await redis.set(key, '1', 'PX', cooldownMs, 'NX');
  return { ok: ok === 'OK' };
}

export async function trackDailyStake(userId: string, amt: bigint, cap: bigint) {
  const redis = getRedis();
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
