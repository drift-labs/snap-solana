import { Keypair } from "@solana/web3.js";
import { Buffer } from "buffer";

// Derivation path and curve used for Solana:
const derivationPath = ["m", "44'", "501'", "0'", "0'"];
const curve = "ed25519";

/**
 * Derives a solana keypair of target address index (default 0) withh BIP32
 */
export async function deriveSolanaKeypair() {
  const SLIP10Node = await snap.request({
    method: "snap_getBip32Entropy",
    params: {
      path: derivationPath,
      curve,
    },
  });

  let keypair: Keypair;
  let caughtErr;

  if (SLIP10Node.privateKey) {
    try {
      const privateKeyBuffer = Buffer.from(
        SLIP10Node.privateKey.replace(/^0x/u, ""),
        "hex"
      );
      const publicKeyBuffer = Uint8Array.prototype.slice.call(
        Buffer.from(SLIP10Node.publicKey.replace(/^0x/u, ""), "hex"),
        1
      );
      const fullKeyBytes = new Uint8Array(
        Buffer.concat([privateKeyBuffer, publicKeyBuffer])
      );

      keypair = Keypair.fromSecretKey(fullKeyBytes);

      return `publicKey: ${keypair.publicKey.toString()}, slip10node: ${JSON.stringify(
        SLIP10Node,
        null,
        "  "
      )}`;
    } catch (err) {
      caughtErr = err;

      // Todo maybe remove this?
      return `caughtError: ${caughtErr}`;
    }
  }
}
