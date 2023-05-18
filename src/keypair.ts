import { Keypair } from "@solana/web3.js";
import { getBIP44AddressKeyDeriver } from "@metamask/key-tree";

// // Solana BIP-44 registered coin type (see https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
const coinType = 501;

/**
 * Derives a solana keypair of target address index (default 0)
 *
 * @param index - address index to
 */
export async function deriveSolanaKeypair(index?: number) {
  const bip44Node = await snap.request({
    method: "snap_getBip44Entropy",
    params: {
      coinType,
    },
  });

  // // Hmm this derives with a path depth of 5, I think solana wallets use a depth of 4? Could be wrong though...
  // // Doesn't look like that's an option we can change
  const deriveAddress = await getBIP44AddressKeyDeriver(bip44Node);

  const derived = await deriveAddress(index ?? 0);

  let keypair;

  if (derived.privateKey) {
    try {
      const buffer = Buffer.from(derived.privateKey.replace(/^0x/u, ""), "hex");
      const privateKeyBytes = new Uint8Array(buffer);
      keypair = Keypair.fromSecretKey(privateKeyBytes);
      keypair = privateKeyBytes;
    } catch (err) {
      console.log(err);
    }
  }

  return keypair;
}
