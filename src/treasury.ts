import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

export async function addToPool(amt: bigint) {
  const t = await db.treasury.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await db.treasury.update({ where: { id: 1 }, data: { scamPool: t.scamPool + amt } });
}