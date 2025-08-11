import { PrismaClient } from '@prisma/client';
import type { IncomingTweet } from './types.js';

const db = new PrismaClient();

export async function recordPromo(t: IncomingTweet) {
  const user = await db.user.upsert({
    where: { xUserId: t.authorId },
    update: { handle: t.authorHandle },
    create: {
      xUserId: t.authorId,
      handle: t.authorHandle,
      refCode: genRef(),
    },
  });

  const actions: Array<{ type: string; weight: number }> = [];
  if (t.text.includes('#ExitScam')) actions.push({ type: 'hashtag', weight: 2 });
  if (t.isRetweet) actions.push({ type: 'retweet', weight: 3 });
  if (t.isQuote) actions.push({ type: 'quote', weight: 4 });
  if (t.mentions.length > 0) actions.push({ type: 'mention', weight: 1 });

  for (const a of actions) {
    await db.promoAction.create({ data: { userId: user.id, type: a.type, weight: a.weight, meta: { tweetId: t.id } } });
    await db.userStats.upsert({ where: { userId: user.id }, update: { promoPoints: { increment: a.weight } }, create: { userId: user.id, promoPoints: a.weight } });
  }
}

function genRef() { return Math.random().toString(36).slice(2, 10); }