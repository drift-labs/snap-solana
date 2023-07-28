import { OnRpcRequestHandler } from "@metamask/snaps-types";
import { Text, divider, heading, panel, text } from "@metamask/snaps-ui";
import {
  Keypair,
  SerializeConfig,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { deriveSolanaKeypair } from "./keypair";

// Simple switch for debugging, will show errors in a snap dialog
const DEBUG = false;

const showDebugDialog = (err: any) => {
  snap.request({
    method: "snap_dialog",
    params: {
      type: "alert",
      content: panel([text(`${err}`)]),
    },
  });
};

/**
 * Shows the Solana public key in Metamask, mostly just for testing
 */
const showPublicKeyHandler = async () => {
  const keypair = await deriveSolanaKeypair();

  return snap.request({
    method: "snap_dialog",
    params: {
      type: "alert",
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
  try {
    const keypair = await deriveSolanaKeypair();
    return keypair?.publicKey?.toString();
  } catch (err) {
    if (DEBUG) {
      showDebugDialog(err);
    }
    throw err;
  }
};

/**
 * A Transaction param for signing
 */
type TransactionParams = {
  /**
   * JSON.stringified Buffer -- the mm json rpc handles this a little differently than a plain JSON.stringify, because the buffer becomes an object with keys and values instead of an actual array. From the UI side though, it should just be passed into the json rpc as a buffer.
   */
  transaction: Record<string, number>;

  /**
   * A Solana SerializeConfig to be used with the transaction when serializing the signed transaction.
   */
  serializeConfig?: SerializeConfig;

  /**
   * testing
   */
  isVersionedTransaction?: boolean;
};

/**
 * All parameters for for signTransactionHandler
 */
type SignTransactionParams = {
  origin: string;
} & TransactionParams;

/**
 * Signs a single Solana transaction
 */
const signTransactionHandler = async (params: SignTransactionParams) => {
  try {
    const byteArray = Object.keys(params.transaction).map(
      (key) => params.transaction[key]
    );
    const buf = Buffer.from(byteArray);

    if (params.isVersionedTransaction) {
      const tx = VersionedTransaction.deserialize(buf);

      const instructionDetailsText: Text[] = [];

      tx.message.compiledInstructions.forEach((instruction, index) => {
        const programIndex = instruction.programIdIndex;
        const accountKeys = tx.message.getAccountKeys();
        const programAccountKey = accountKeys.get(programIndex);
        const programId = programAccountKey?.toString() || "unknown";
        const data = instruction.data ? Buffer.from(instruction.data)?.toString('base64') : '';

        instructionDetailsText.push(text('\n'))
        instructionDetailsText.push(text(`**Instruction #${index + 1}**`))
        instructionDetailsText.push(text(`**Program:** ${programId}`))
        instructionDetailsText.push(text(`**Data:** [${data}]`))
      });

      // How can we make this message more user-friendly?
      const confirmed = await snap.request({
        method: "snap_dialog",
        params: {
          type: "confirmation",
          content: panel([
            heading(`${params.origin} wants you to approve a transaction:`),
            ...instructionDetailsText,
          ]),
        },
      });

      if (confirmed) {
        const keypair = (await deriveSolanaKeypair()) as Keypair;

        tx.sign([keypair]);

        const signedTransaction = Buffer.from(tx.serialize());

        return {
          transaction: signedTransaction.toJSON(),
        };
      } else {
        throw new Error("User rejected transaction");
      }
    } else {
      const tx = Transaction.from(buf);

      const instructionDetailsText: Text[] = [];
      tx.instructions.forEach((instruction, index) => {
        const programId = instruction.programId?.toString() || 'unknown';
        const data = instruction.data.toString('base64');

        instructionDetailsText.push(text('\n'));
        instructionDetailsText.push(text(`**Instruction #${index + 1}**`));
        instructionDetailsText.push(text(`**Program:** ${programId}`));
        instructionDetailsText.push(text(`**Data:** ${data}`));
      });

      // How can we make this message more user-friendly?
      const confirmed = await snap.request({
        method: "snap_dialog",
        params: {
          type: "confirmation",
          content: panel([
            heading(`${params.origin} wants you to approve a transaction:`),
            ...instructionDetailsText
          ]),
        },
      });

      if (confirmed) {
        const keypair = (await deriveSolanaKeypair()) as Keypair;

        tx.sign(keypair);

        const signatures = tx.signatures;
        const signedTransaction = tx.serialize(params?.serializeConfig);

        return {
          signatures: signatures.map((sig) => ({
            publicKey: sig.publicKey.toString(),
            signature: sig.signature?.toJSON(),
          })),
          transaction: signedTransaction.toJSON(),
        };
      } else {
        throw new Error("User rejected transaction");
      }
    }
  } catch (err) {
    if (DEBUG) {
      showDebugDialog(err);
    }
    throw err;
  }
};

/**
 * All parameters for signAllTransactionsHandler
 */
type signAllTransactionsParams = {
  origin: string;
  transactions: TransactionParams[];
};

/**
 * Signs all Solana transactions in params.transactions
 */
const signAllTransactionsHandler = async (
  params: signAllTransactionsParams
) => {
  try {
    const instructionDetailsText: Text[] = [];

    // Turn all JSON params into Transaction objects
    const transactions = params.transactions.map((paramTx, txIndex) => {
      const byteArray = Object.keys(paramTx.transaction).map(
        (key) => paramTx.transaction[key]
      );
      const buf = Buffer.from(byteArray);

      instructionDetailsText.push(divider());
      instructionDetailsText.push(text(`**Transaction ${txIndex + 1}**`));

      if (paramTx.isVersionedTransaction) {
        const tx =  VersionedTransaction.deserialize(buf);

        // Pretty print tx + instruction details
        tx.message.compiledInstructions.forEach((instruction, index) => {
          const programIndex = instruction.programIdIndex;
          const accountKeys = tx.message.getAccountKeys();
          const programAccountKey = accountKeys.get(programIndex);
          const programId = programAccountKey?.toString() || "unknown"
          const data = instruction.data ? Buffer.from(instruction.data)?.toString('base64') : '';

          instructionDetailsText.push(text('\n'));  
          instructionDetailsText.push(text(`**Instruction #${index + 1}**`))
          instructionDetailsText.push(text(`**Program:** ${programId}`))
          instructionDetailsText.push(text(`**Data:** ${data}`))
        })

        return tx;
      } else {
        const tx = Transaction.from(buf);

        // Pretty print tx + instruction details
        tx.instructions.forEach((instruction, index) => {
          const programId = instruction.programId?.toString() || 'unknown';
          const data = instruction.data?.toString('base64') || ''

          instructionDetailsText.push(text('\n'));  
          instructionDetailsText.push(text(`**Instruction #${index + 1}**`))
          instructionDetailsText.push(text(`**Program:** ${programId}`))
          instructionDetailsText.push(text(`**Data:** ${data}`))
        });

        return tx;
      }
    });

    const confirmed = await snap.request({
      method: "snap_dialog",
      params: {
        type: "confirmation",
        content: panel([
          heading(
            `${params.origin} wants you to approve ${transactions.length} transactions:`
          ),
          ...instructionDetailsText,
        ]),
      },
    });

    if (confirmed) {
      const keypair = (await deriveSolanaKeypair()) as Keypair;

      const signed = transactions.map((_tx, index) => {
        const isVersionedTransaction = params.transactions[index].isVersionedTransaction;

        if (isVersionedTransaction) {
          const tx = _tx as VersionedTransaction;
          tx.sign([keypair]);

          const signedTransaction = Buffer.from(tx.serialize());

          return {
            transaction: signedTransaction.toJSON(),
          }
        } else {
          const tx = _tx as Transaction;
          tx.sign(keypair);
          const signatures = tx.signatures;
          const serializeConfig = params.transactions[index].serializeConfig;
          const signedTransaction = tx.serialize(serializeConfig);

          return {
            signatures: signatures.map((sig) => ({
              publicKey: sig.publicKey.toString(),
              signature: sig.signature?.toJSON(),
            })),
            transaction: signedTransaction.toJSON(),
          };
        }
      });

      return signed
    } else {
      throw new Error("User rejected transaction");
    }
  } catch (err) {
    if (DEBUG) {
      showDebugDialog(err);
    }
    throw err;
  }
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
  const params = request?.params as Record<string, any>;

  switch (request.method) {
    case "showPublicKey":
      return await showPublicKeyHandler();

    case "getPublicKey":
      return await getPublicKeyHandler();

    case "signTransaction":
      return await signTransactionHandler({
        origin,
        transaction: params?.transaction,
        serializeConfig: params?.serializeConfig,
        isVersionedTransaction: params?.isVersionedTransaction,
      });

    case "signAllTransactions":
      return await signAllTransactionsHandler({
        origin,
        transactions: params?.transactions,
      });

    default:
      throw new Error("Method not found.");
  }
};
