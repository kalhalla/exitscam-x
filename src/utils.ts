import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

export function rng(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function ensureUser(tweet: { authorId: string; authorHandle: string }) {
  return db.user.upsert({
    where: { xUserId: tweet.authorId },
    update: { handle: tweet.authorHandle },
    create: { xUserId: tweet.authorId, handle: tweet.authorHandle, refCode: genRef() }
  });
}

export async function credit(userId: string, amount: bigint) {
  const bal = await db.balance.findFirst({ where: { userId } });
  if (!bal) {
    await db.balance.create({ data: { userId, amount } });
  } else {
    await db.balance.update({ where: { id: bal.id }, data: { amount: bal.amount + amount } });
  }
}

export async function debit(userId: string, amount: bigint) {
  const bal = await db.balance.findFirst({ where: { userId } });
  if (!bal || bal.amount < amount) throw new Error('Insufficient balance');
  await db.balance.update({ where: { id: bal.id }, data: { amount: bal.amount - amount } });
}

export async function tx(actorId: string, type: string, amount: bigint, result: string, meta: any) {
  await db.gameTxn.create({ data: { actorId, type, amount, result, meta } });
}

export async function addToScamPool(amt: bigint) {
  const t = await db.treasury.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await db.treasury.update({ where: { id: 1 }, data: { scamPool: t.scamPool + amt } });
}

export async function getTreasury() {
  const t = await db.treasury.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  return t;
}

export async function setTreasury(newAmt: bigint) {
  await db.treasury.update({ where: { id: 1 }, data: { scamPool: newAmt } });
}

function genRef() { return Math.random().toString(36).slice(2, 10); }

export function parseAmount(s: string): bigint {
  if (!s) return 0n;
  const m = s.match(/^(\d+)(?:\.(\d{1,6}))?$/);
  if (!m) return 0n;
  const whole = BigInt(m[1]);
  const frac = BigInt((m[2] || '').padEnd(6, '0'));
  return whole * 1_000000n + frac;
}

export async function replyPublic(_tweet: any, message: string) {
  console.log('BOT REPLY →', message);
}