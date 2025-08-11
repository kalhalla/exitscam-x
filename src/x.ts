import { IncomingTweet } from './types.js';
import { executeCommand } from './commands.js';
import { recordPromo } from './promo.js';
import { cfg } from './config.js';

const CMD = /^\/(join|higher|lower|scam|pump|dump)\b(.*)$/i;

export async function handleIncomingTweet(t: IncomingTweet) {
  const text = t.text.trim();

  if (text.includes(`#ExitScam`) || t.mentions.includes(cfg.botHandle)) {
    await recordPromo(t);
  }
  const isAddressed = t.mentions.map(h => h.toLowerCase()).includes(cfg.botHandle.toLowerCase());
  if (!isAddressed) return;

  const m = text.match(CMD);
  if (!m) return;

  const [, verb, rest] = m;
  const args = rest.trim().split(/\s+/).filter(Boolean);

  await executeCommand({ verb: verb.toLowerCase(), args, tweet: t });
}