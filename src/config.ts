import 'dotenv/config';

export const cfg = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 8080),
  baseUrl: process.env.BASE_URL!,
  botHandle: process.env.PUBLIC_BOT_HANDLE!,
  dbUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL!,
  x: {
    key: process.env.X_APP_KEY!,
    secret: process.env.X_APP_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_SECRET!,
    webhookSecret: process.env.X_WEBHOOK_SECRET!,
  },
  solana: {
    rpc: process.env.SOLANA_RPC!,
    mint: process.env.SPL_TOKEN_MINT!,
    treasurySecret: process.env.TREASURY_SECRET_KEY!,
  },
  security: {
    signingSecret: process.env.SIGNING_SECRET || 'dev-secret',
  },
  features: {
    pollingEnabled: (process.env.POLLING_ENABLED || 'false').toLowerCase() === 'true',
    pollingIntervalMs: Number(process.env.POLLING_INTERVAL_MS || 5000),
    internalScheduler: (process.env.INTERNAL_SCHEDULER || 'false').toLowerCase() === 'true',
    onchainPayoutsEnabled: (process.env.ONCHAIN_PAYOUTS || 'false').toLowerCase() === 'true',
    jackpotEnabled: (process.env.JACKPOT_ENABLED || 'true').toLowerCase() === 'true',
    abuse: {
      perUserCooldownMs: Number(process.env.COOLDOWN_MS || 3000),
      maxStakePerCmd: BigInt(process.env.MAX_STAKE_PER_CMD_BASEUNITS || '5000000'),
      dailyStakeCap: BigInt(process.env.DAILY_STAKE_CAP_BASEUNITS || '25000000'),
    },
    predictionPriceSource: (process.env.PREDICTION_PRICE_SOURCE || 'RNG') as 'RNG' | 'COINAPI' | 'MANUAL',
  }
};