import { PrismaClient } from '@prisma/client';
import { credit, getTreasury, setTreasury } from './utils.js';

const db = new PrismaClient();

export async function dailyPayout() {
  const users = await db.userStats.findMany({ where: { promoPoints: { gt: 0 } } });
  for (const s of users) {
    const amt = BigInt(s.promoPoints) * 1_000000n;
    await credit(s.userId, amt);
    await db.userStats.update({ where: { userId: s.userId }, data: { promoPoints: 0 } });
  }
}

export async function weeklyJackpot() {
  const tr = await getTreasury();
  const jackpot = tr.scamPool / 2n;
  if (jackpot <= 0n) return;

  const top = await db.userStats.findMany({ orderBy: { promoPoints: 'desc' }, take: 3 });
  const shares = [0.5, 0.3, 0.2];
  for (let i = 0; i < top.length; i++) {
    const amt = BigInt(Math.floor(Number(jackpot) * shares[i]));
    await credit(top[i].userId, amt);
  }
  await setTreasury(tr.scamPool - jackpot);
}