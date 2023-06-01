import { Keypair } from '@solana/web3.js';
import { Buffer } from 'buffer';

// Derivation path and curve used for Solana, add one value to the end for account index
const derivationPathBase = ['m', "44'", "501'", "0'"];
const curve = 'ed25519';

/**
 * Derives a solana keypair from the user's Metamask seed phrase using the ed25519 curve and path [m/44'/501'/0'/0'] 
 * (Same thing used by phantom, etc.)
 * 
 * For security, this should PROBABLY be done on the fly each time a request is made to the snap where the user needs to sign something.
 * That way, we never store the private key anywhere bsides in a variable, it's just used to sign once, then garbage collected.
 * Should be better for security than deriving it once and storing it somewhere.
 *
 * @param index - account index to derive, defaults to 0
 */
export async function deriveSolanaKeypair(index?: number) {
	const SLIP10Node = await snap.request({
		method: 'snap_getBip32Entropy',
		params: {
			path: [...derivationPathBase, `${index ?? 0}'`],
			curve,
		},
	});

	let keypair: Keypair;

	if (SLIP10Node.privateKey) {
		const privateKeyBuffer = Buffer.from(
			SLIP10Node.privateKey.replace(/^0x/u, ''),
			'hex'
		);
		const publicKeyBuffer = Uint8Array.prototype.slice.call(
			Buffer.from(SLIP10Node.publicKey.replace(/^0x/u, ''), 'hex'),
			1
		);
		const fullKeyBytes = new Uint8Array(
			Buffer.concat([privateKeyBuffer, publicKeyBuffer])
		);

		keypair = Keypair.fromSecretKey(fullKeyBytes);

		return keypair;
	} else {
		return undefined;
	}
}
