import { PrismaClient } from '@prisma/client';
import { credit, addToScamPool } from './utils.js';
import { cfg } from './config.js';

const db = new PrismaClient();

export async function settlePredictions() {
  const now = new Date();
  const pendings = await db.gameTxn.findMany({ where: { result: 'pending' } });
  const due = pendings.filter(p => p.meta?.window?.end && new Date(p.meta.window.end) <= now);
  if (due.length === 0) return;

  for (const p of due) {
    const winSide = decideWinner();
    const isWinner = (p.type === winSide);
    if (isWinner) {
      await credit(p.actorId, p.amount * 2n);
      await db.gameTxn.update({ where: { id: p.id }, data: { result: 'win' } });
    } else {
      await addToScamPool(p.amount);
      await db.gameTxn.update({ where: { id: p.id }, data: { result: 'lose' } });
    }
  }
}

function decideWinner(): 'pump' | 'dump' {
  if (cfg.features.predictionPriceSource === 'RNG') {
    return Math.random() < 0.5 ? 'pump' : 'dump';
  }
  return 'pump';
}