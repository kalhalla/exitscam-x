import { PrismaClient } from '@prisma/client';
import { ensureUser, credit, debit, tx, rng, addToScamPool } from './utils.js';
import type { IncomingTweet } from './types.js';

const db = new PrismaClient();

export async function joinGame(tweet: IncomingTweet) {
  const user = await ensureUser(tweet);
  const bal = await db.balance.findFirst({ where: { userId: user.id } });
  if (!bal) {
    await db.balance.create({ data: { userId: user.id, amount: BigInt(100_000000) } });
  }
  return user;
}

export async function playHigherLower(tweet: IncomingTweet, choice: 'higher' | 'lower', amount: bigint) {
  const user = await ensureUser(tweet);
  if (amount <= 0n) return { ok: false, message: `Amount must be > 0` };
  await debit(user.id, amount);

  const target = rng(1, 500);
  const winning = (choice === 'higher' ? target > 250 : target <= 250);

  if (winning) {
    const prize = amount;
    await credit(user.id, prize);
    await tx(user.id, 'higher', amount, 'win', { target });
    return { ok: true, message: `🎲 ${choice.toUpperCase()} → ${target}. You WIN ${fmt(prize)} ESC!` };
  } else {
    await addToScamPool(amount);
    await tx(user.id, 'higher', amount, 'lose', { target });
    return { ok: false, message: `🎲 ${choice.toUpperCase()} → ${target}. You LOSE. Added ${fmt(amount)} to the Scam Pool.` };
  }
}

export async function attemptScam(tweet: IncomingTweet, targetHandle: string | undefined, amount: bigint) {
  const actor = await ensureUser(tweet);
  if (!targetHandle) return { ok: false, message: `Usage: /scam @user amount` };
  const target = await db.user.findUnique({ where: { handle: targetHandle } });
  if (!target) return { ok: false, message: `Target @${targetHandle} not found.` };
  if (amount <= 0n) return { ok: false, message: `Amount must be > 0.` };

  await debit(actor.id, amount);

  const roll = rng(1, 100);
  const success = roll <= 45;

  if (success) {
    await credit(actor.id, amount * 2n);
    await tx(actor.id, 'scam', amount, 'win', { target: target.handle, roll });
    return { ok: true, message: `🕴️ You SCAMMED @${target.handle} for ${fmt(amount)} ESC. Profit +${fmt(amount)}!` };
  } else {
    const fine = amount;
    await addToScamPool(fine);
    await tx(actor.id, 'scam', amount, 'lose', { target: target.handle, roll });
    return { ok: false, message: `🚓 BUSTED! You paid a fine of ${fmt(fine)} ESC to the Scam Pool.` };
  }
}

export async function placePrediction(tweet: IncomingTweet, side: 'pump' | 'dump', amount: bigint) {
  const user = await ensureUser(tweet);
  if (amount <= 0n) return { ok: false, message: `Amount must be > 0.` };
  await debit(user.id, amount);
  const window = nextHourWindow();
  await db.gameTxn.create({ data: { type: side, amount, actorId: user.id, result: 'pending', meta: { window } } });
  return { ok: true, message: `📈 Prediction queued for ${window.start}–${window.end}. Side: ${side.toUpperCase()} Stake: ${fmt(amount)} ESC.` };
}

function fmt(n: bigint) { return Number(n) / 1_000000; }
function nextHourWindow() {
  const now = new Date();
  const start = new Date(now);
  start.setMinutes(0, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return { start, end };
}