import { TwitterApi } from 'twitter-api-v2';
import { cfg } from './config.js';
import { handleIncomingTweet } from './x.js';
import type { IncomingTweet } from './types.js';

let sinceId: string | undefined;

export async function startPoller() {
  const client = new TwitterApi({
    appKey: cfg.x.key,
    appSecret: cfg.x.secret,
    accessToken: cfg.x.accessToken,
    accessSecret: cfg.x.accessSecret,
  });
  const ro = client.readOnly;
  const me = await ro.v2.me();
  const myId = me.data.id;

  async function tick() {
    try {
      const res = await ro.v2.userMentionTimeline(myId, {
        since_id: sinceId,
        expansions: ['entities.mentions.username', 'author_id'],
        'tweet.fields': ['entities', 'author_id', 'in_reply_to_user_id'],
        max_results: 100,
      });

      const tweets = res.data || [];
      if (tweets.length > 0) {
        sinceId = tweets[0].id; // newest first
        for (const tw of tweets.reverse()) {
          const text = tw.text || '';
          const mentions = (tw.entities?.mentions || []).map((m: any) => m.username);
          const incoming: IncomingTweet = {
            id: tw.id,
            text,
            authorHandle: 'unknown',
            authorId: tw.author_id!,
            inReplyToStatusId: undefined,
            mentions,
            isRetweet: text.startsWith('RT '),
            isQuote: false,
          };
          await handleIncomingTweet(incoming);
        }
      }
    } catch (e) {
      console.error('poller_error', e);
    } finally {
      setTimeout(tick, cfg.features.pollingIntervalMs);
    }
  }

  tick();
}