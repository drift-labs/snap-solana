import { Keypair } from "@solana/web3.js";
import { getBIP44AddressKeyDeriver } from "@metamask/key-tree";
import { Buffer } from "buffer";

// // Solana BIP-44 registered coin type (see https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
const coinType = 501;

/**
 * Derives a solana keypair of target address index (default 0)
 *
 * @param index - address index to derive at -- would be nice to get this from metamask based on selected wallet but for MVP probably just leave at 0
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
  let caughtErr;
  let privateKeyBuffer;
  let publicKeyBuffer;
  let fullKeyBytes;

  if (derived.privateKey) {
    try {
      console.log(Buffer);
      privateKeyBuffer = Buffer.from(
        derived.privateKey.replace(/^0x/u, ""),
        "hex"
      );
      publicKeyBuffer = Buffer.from(
        derived.compressedPublicKey.replace(/^0x/u, ""),
        "hex"
      );
      fullKeyBytes = new Uint8Array(
        Buffer.concat([privateKeyBuffer, publicKeyBuffer])
      );

      // I think private key buffer is correct here, but the public key is longer and I don't know why? The fullKeyBytes ends up being a length if 97
      // So concatted the public key is incorrect for the private key
      // Not sure why?
      // Also what is derived.extendedKey? Should i use that as a bufffer?

      keypair = Keypair.fromSecretKey(fullKeyBytes);
    } catch (err) {
      caughtErr = err;
    }
  }

  return `
    caughtError: ${caughtErr}

    derived.extendedKey: ${derived.extendedKey}
    derived.publicKey: ${derived.publicKey}
    derived.compressedPublicKey: ${derived.compressedPublicKey}
    derived.privateKey: ${derived.privateKey}
    
    privateKeyBuffer: ${new Uint8Array(privateKeyBuffer as Buffer)}

    publicKeyBuffer: ${new Uint8Array(publicKeyBuffer as Buffer)}

    fullKeyBytes: ${fullKeyBytes}

    keypair: ${keypair?.publicKey?.toString()}
  `;
}
