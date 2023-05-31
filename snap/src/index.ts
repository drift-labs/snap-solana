import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { panel, text } from '@metamask/snaps-ui';

import { deriveSolanaKeypair } from './keypair';

const helloWorldHandler = (origin: string) => {
	return snap.request({
		method: 'snap_dialog',
		params: {
			type: 'confirmation',
			content: panel([
				text(`Hello, **${origin}**!`),
				text('This custom confirmation is just for display purposes.'),
				text(
					'But you can edit the snap source code to make it do something, if you want to!'
				),
			]),
		},
	});
};

const showPublicKeyHandler = async () => {
	// Do we want this keypair index to be based on which metamask wallet index is selected?
	// Not sure if/how to do that but might be ideal... probably not worth it for initial MVP though
	const keypair = await deriveSolanaKeypair();

	return snap.request({
		method: 'snap_dialog',
		params: {
			type: 'alert',
			content: panel([
				text(`Your Solana public key: `),
				text(`${keypair?.publicKey.toString()}`),
			]),
		},
	});
};

const getPublicKeyHandler = async () => {
	const keypair = await deriveSolanaKeypair();
	return keypair?.publicKey?.toString();
};

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
	origin,
	request,
}) => {
	switch (request.method) {
		case 'hello':
			return helloWorldHandler(origin);
		case 'showPublicKey':
			return await showPublicKeyHandler();
		case 'getPublicKey':
			return await getPublicKeyHandler();
		default:
			throw new Error('Method not found.');
	}
};
