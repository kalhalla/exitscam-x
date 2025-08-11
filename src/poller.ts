import pino from 'pino';
import { TwitterApi } from 'twitter-api-v2';
import { cfg } from './config.js';
import { handleIncomingTweet } from './x.js';

// Build a user-context client from env/cfg
function makeClient() {
  return new TwitterApi({
    appKey: cfg.x.appKey,
    appSecret: cfg.x.appSecret,
    accessToken: cfg.x.accessToken,
    accessSecret: cfg.x.accessSecret
  });
}

// Keep last processed tweet id in memory (simple + fine for single replica)
let sinceId: string | undefined;

export async function startPoller(log: pino.Logger = pino()): Promise<void> {
  if (!cfg.features.pollingEnabled) {
    log.info('poller: disabled via flag');
    return;
  }

  const client = makeClient();
  const me = await client.v2.me(); // { data: { id, username, ... } }
  const botUserId = me.data.id;

  log.info({ botUserId, handle: me.data.username, intervalMs: cfg.pollingIntervalMs }, 'poller: starting');

  const runOnce = async () => {
    try {
      // Fetch latest mentions since the last processed id
      const res = await client.v2.userMentionTimeline(botUserId, {
        since_id: sinceId,
        max_results: 100,
        expansions: ['author_id'],
        'user.fields': ['username'],
        'tweet.fields': ['created_at', 'entities']
      });

      // twitter-api-v2 returns a paginator; the array is on .data
      const tweets: any[] = (res as any).data ?? [];
      if (tweets.length === 0) return;

      // Oldest → newest so processing order is stable
      tweets.sort((a, b) => (a.id > b.id ? 1 : -1));

      const users: any[] = (res as any).includes?.users ?? [];

      for (const t of tweets) {
        sinceId = t.id;

        const authorId: string = t.author_id ?? '';
        const authorHandle: string =
          users.find((u: any) => u.id === authorId)?.username ?? `u_${authorId}`;

        // Normalize into our internal hook payload shape
        await handleIncomingTweet({
          id: t.id,
          text: t.text ?? '',
          authorHandle,
          authorId,
          mentions: [cfg.publicBotHandle]
        });
      }
    } catch (err) {
      log.error({ err }, 'poller: runOnce failed');
    }
  };

  // Kick off immediately, then on interval
  await runOnce();
  setInterval(runOnce, cfg.pollingIntervalMs);
}

  }

  tick();
}
