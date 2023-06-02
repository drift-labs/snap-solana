import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { panel, text } from '@metamask/snaps-ui';
import { Keypair, SerializeConfig, Transaction } from '@solana/web3.js';

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

/**
 * Returns the public key for use in the UI that Metmask is connected to
 */
const getPublicKeyHandler = async () => {
	const keypair = await deriveSolanaKeypair();
	return keypair?.publicKey?.toString();
};

type TransactionParams = {
  /**
   * JSON.stringified buffer (serialized solana tx)
   */
  transaction: Record<string, number>;
  serializeConfig?: SerializeConfig;
}

type SignTransactionParams = {
  origin: string
} & TransactionParams

/**
 * Signs a single Solana transaction
 */
const signTransactionHandler = async (params: SignTransactionParams) => {
  try {
    // Somehow params.transaction gets changed into an keyed object instead of an array when being sent through the json rpc... weird.
    const byteArray = Object.keys(params.transaction).map(key => params.transaction[key]);
    const buf = Buffer.from(byteArray);
    const tx = Transaction.from(buf);

    // How can we make this message more user-friendly?
    const confirmed = await snap.request({
      method: 'snap_dialog',
      params: {
        type: 'confirmation',
        content: panel([
          text(`**${params.origin}** would like to sign a transaction:`),
          text(JSON.stringify(tx))
        ]),
      },
    });

    if (confirmed) {
      const keypair = await deriveSolanaKeypair() as Keypair;

      tx.sign(keypair);

      const signatures = tx.signatures;
      const signedTransaction = tx.serialize(params?.serializeConfig);

      // For debugging:
      // await snap.request({
      //   method: 'snap_dialog',
      //   params: {
      //     type: 'confirmation',
      //     content: panel([
      //       text(`Ok to return?`),
      //       text(JSON.stringify(tx)),
      //       text(JSON.stringify(tx.signatures))
      //     ]),
      //   },
      // });

      return {
        signatures: signatures.map(sig => ({
          publicKey: sig.publicKey.toString(),
          signature: sig.signature?.toJSON()
        })),
        transaction: signedTransaction.toJSON()
      };
    } else {
      throw new Error('User rejected transaction');
    }
  } catch (err) {
    // For debugging:
    // await snap.request({
    //   method: 'snap_dialog',
    //   params: {
    //     type: 'confirmation',
    //     content: panel([
    //       text(`${err}`),
    //       text(`${JSON.stringify(params)}`)
    //     ]),
    //   },
    // });
  }
};


type signAllTransactionsParams = {
  origin: string;
  transactions: TransactionParams[]
}

/**
 * Signs all Solana transactions in an array of serialized transactions
 */
const signAllTransactionsHandler = async (_params: signAllTransactionsParams) => {
  const _keypair = await deriveSolanaKeypair() as Keypair;

  // TODO finish this method

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

    case "signTransaction":
      return await signTransactionHandler({ 
        origin,
        // @ts-ignore
        transaction: request?.params?.transaction,
        // @ts-ignore
        serializeConfig: request?.params?.serializeConfig
      });

    case "signAllTransactions": 
      return await signAllTransactionsHandler({ 
        origin,
        // @ts-ignore
        transactions: request?.params?.transactions 
      });

		default:
			throw new Error('Method not found.');
	}
};
