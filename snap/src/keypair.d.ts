import { Keypair } from '@solana/web3.js';
/**
 * Derives a solana keypair of target address index (default 0)
 *
 * @param index - address index to
 */
export declare function deriveSolanaKeypair(
	index?: number
): Promise<Uint8Array | Keypair>;
