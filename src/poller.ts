import pino from 'pino';
import { TwitterApi } from 'twitter-api-v2';
import { cfg } from './config.js';
import { handleIncomingTweet } from './x.js';

function makeClient() {
  return new TwitterApi({
    appKey: cfg.x.key,            // << was appKey
    appSecret: cfg.x.secret,      // << was appSecret
    accessToken: cfg.x.accessToken,
    accessSecret: cfg.x.accessSecret,
  });
}

// read interval from env to avoid config type mismatch
const intervalMs =
  Number(process.env.POLLING_INTERVAL_MS ?? '300000') || 300000;

let sinceId: string | undefined;

export async function startPoller(log: pino.Logger = pino()): Promise<void> {
  if (!cfg.features.pollingEnabled) {
    log.info('poller: disabled via flag');
    return;
  }

  const client = makeClient();
  const me = await client.v2.me();
  const botUserId = me.data.id;

  log.info(
    { botUserId, handle: me.data.username, intervalMs },
    'poller: starting'
  );

  const runOnce = async () => {
    try {
      const res = await client.v2.userMentionTimeline(botUserId, {
        since_id: sinceId,
        max_results: 100,
        expansions: ['author_id'],
        'user.fields': ['username'],
        'tweet.fields': ['created_at', 'entities'],
      });

      const tweets: any[] = (res as any).data ?? [];
      if (tweets.length === 0) return;

      const users: any[] = (res as any).includes?.users ?? [];

      tweets.sort((a, b) => (a.id > b.id ? 1 : -1));

      for (const t of tweets) {
        sinceId = t.id;

        const authorId: string = t.author_id ?? '';
        const authorHandle: string =
          users.find((u: any) => u.id === authorId)?.username ?? `u_${authorId}`;

        await handleIncomingTweet({
          id: t.id,
          text: t.text ?? '',
          authorHandle,
          authorId,
          mentions: [cfg.botHandle], // << was cfg.publicBotHandle
        });
      }
    } catch (err) {
      log.error({ err }, 'poller: runOnce failed');
    }
  };

  await runOnce();
  setInterval(runOnce, intervalMs);
}
