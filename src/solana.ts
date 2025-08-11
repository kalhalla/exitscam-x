import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, transfer } from '@solana/spl-token';
import { cfg } from './config.js';

const conn = new Connection(cfg.solana.rpc, 'confirmed');
const treasury = Keypair.fromSecretKey(new Uint8Array(JSON.parse(cfg.solana.treasurySecret)));
const mint = new PublicKey(cfg.solana.mint);

export async function payoutToUser(wallet: string, amountBaseUnits: bigint) {
  const dest = new PublicKey(wallet);
  const srcATA = await getOrCreateAssociatedTokenAccount(conn, treasury, mint, treasury.publicKey);
  const dstATA = await getOrCreateAssociatedTokenAccount(conn, treasury, mint, dest);
  if (amountBaseUnits > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Amount too large');
  // @ts-ignore
  await transfer(conn, treasury, srcATA.address, dstATA.address, treasury.publicKey, Number(amountBaseUnits));
}